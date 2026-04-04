from django.db.models import Count, DecimalField, ExpressionWrapper, F, Prefetch, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    CategoriaProduto,
    Comanda,
    ComposicaoProduto,
    Insumo,
    ItemComanda,
    Produto,
)
from .serializers import (
    CategoriaProdutoSerializer,
    ComandaAberturaSerializer,
    ComandaDetailSerializer,
    ComandaMuralSerializer,
    ComandaSerializer,
    ComposicaoProdutoSerializer,
    InsumoSerializer,
    ItemComandaCreateSerializer,
    ItemComandaSerializer,
    ProdutoSerializer,
)


def build_total_expression():
    return ExpressionWrapper(
        F("itens__quantidade") * F("itens__preco_unitario"),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )


def annotated_comandas_queryset():
    total_expression = build_total_expression()
    return Comanda.objects.annotate(
        total_parcial=Coalesce(
            Sum(total_expression),
            0,
            output_field=DecimalField(max_digits=12, decimal_places=2),
        ),
        itens_count=Count("itens", distinct=True),
    )


def generate_comanda_codigo():
    last_code = (
        Comanda.objects.exclude(codigo="")
        .order_by("-id")
        .values_list("codigo", flat=True)
        .first()
    )

    if last_code and last_code.replace("CMD-", "").isdigit():
        next_number = int(last_code.replace("CMD-", "")) + 1
    else:
        next_number = 2401

    return f"CMD-{next_number}"


class CategoriaProdutoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaProduto.objects.all()
    serializer_class = CategoriaProdutoSerializer


class ProdutoViewSet(viewsets.ModelViewSet):
    serializer_class = ProdutoSerializer

    def get_queryset(self):
        queryset = Produto.objects.select_related("categoria").all()
        if self.action == "list":
            queryset = queryset.filter(ativo=True)
        return queryset


class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumo.objects.all()
    serializer_class = InsumoSerializer


class ComposicaoProdutoViewSet(viewsets.ModelViewSet):
    queryset = ComposicaoProduto.objects.select_related("produto", "insumo").all()
    serializer_class = ComposicaoProdutoSerializer


class ComandaViewSet(viewsets.ModelViewSet):
    serializer_class = ComandaSerializer

    def get_queryset(self):
        queryset = annotated_comandas_queryset()
        if self.action == "retrieve":
            return queryset.prefetch_related(
                Prefetch(
                    "itens",
                    queryset=ItemComanda.objects.select_related("produto").all(),
                )
            )
        return queryset

    def get_serializer_class(self):
        if self.action == "mural":
            return ComandaMuralSerializer
        if self.action == "retrieve":
            return ComandaDetailSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=["get"], url_path="mural")
    def mural(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ComandaMuralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="abrir")
    def abrir(self, request):
        serializer = ComandaAberturaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comanda = Comanda.objects.create(
            codigo=generate_comanda_codigo(),
            nome_cliente=serializer.validated_data["nome_cliente"],
            status=Comanda.Status.ABERTA,
        )

        response_serializer = ComandaDetailSerializer(
            annotated_comandas_queryset().prefetch_related(
                Prefetch(
                    "itens",
                    queryset=ItemComanda.objects.select_related("produto").all(),
                )
            ).get(pk=comanda.pk)
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="encerrar")
    def encerrar(self, request, pk=None):
        comanda = self.get_object()
        if comanda.status == Comanda.Status.ENCERRADA:
            return Response(
                {"detail": "A comanda ja esta encerrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comanda.status = Comanda.Status.ENCERRADA
        comanda.encerrada_em = timezone.now()
        comanda.save(update_fields=["status", "encerrada_em"])

        serializer = ComandaDetailSerializer(
            annotated_comandas_queryset().prefetch_related(
                Prefetch(
                    "itens",
                    queryset=ItemComanda.objects.select_related("produto").all(),
                )
            ).get(pk=comanda.pk)
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="reabrir")
    def reabrir(self, request, pk=None):
        comanda = self.get_object()
        if comanda.status == Comanda.Status.ABERTA:
            return Response(
                {"detail": "A comanda ja esta aberta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comanda.status = Comanda.Status.ABERTA
        comanda.encerrada_em = None
        comanda.save(update_fields=["status", "encerrada_em"])

        serializer = ComandaDetailSerializer(
            annotated_comandas_queryset().prefetch_related(
                Prefetch(
                    "itens",
                    queryset=ItemComanda.objects.select_related("produto").all(),
                )
            ).get(pk=comanda.pk)
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="itens")
    def adicionar_item(self, request, pk=None):
        comanda = self.get_object()
        if comanda.status != Comanda.Status.ABERTA:
            return Response(
                {"detail": "Nao e possivel adicionar itens em uma comanda encerrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ItemComandaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        produto = Produto.objects.get(pk=serializer.validated_data["produto_id"], ativo=True)
        item = ItemComanda.objects.create(
            comanda=comanda,
            produto=produto,
            quantidade=serializer.validated_data["quantidade"],
            preco_unitario=produto.preco_venda,
        )

        response_serializer = ItemComandaSerializer(item)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ItemComandaViewSet(viewsets.ModelViewSet):
    queryset = ItemComanda.objects.select_related("comanda", "produto").all()
    serializer_class = ItemComandaSerializer


class DashboardSummaryView(APIView):
    def get(self, request):
        total_expression = ExpressionWrapper(
            F("quantidade") * F("preco_unitario"),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )

        sales_by_day = (
            ItemComanda.objects.annotate(dia=TruncDate("criado_em"))
            .values("dia")
            .annotate(total=Sum(total_expression))
            .order_by("dia")
        )

        total_vendas = (
            ItemComanda.objects.aggregate(total=Sum(total_expression))["total"] or 0
        )

        return Response(
            {
                "totais": {
                    "categorias_produto": CategoriaProduto.objects.count(),
                    "produtos": Produto.objects.count(),
                    "insumos": Insumo.objects.count(),
                    "comandas_abertas": Comanda.objects.filter(
                        status=Comanda.Status.ABERTA
                    ).count(),
                    "itens_comanda": ItemComanda.objects.count(),
                    "vendas": total_vendas,
                },
                "vendas_por_dia": [
                    {
                        "dia": item["dia"].isoformat(),
                        "total": item["total"],
                    }
                    for item in sales_by_day
                    if item["dia"] is not None
                ],
            }
        )
