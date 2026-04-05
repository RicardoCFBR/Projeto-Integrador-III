from datetime import timedelta

from django.db import transaction
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
    ItemVendaCaixa,
    MovimentacaoCaixa,
    Produto,
    SessaoCaixa,
    VendaCaixa,
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
    ItemVendaCaixaSerializer,
    MovimentacaoCaixaCreateSerializer,
    MovimentacaoCaixaSerializer,
    ProdutoSerializer,
    SessaoCaixaAberturaSerializer,
    SessaoCaixaSerializer,
    VendaCaixaCreateSerializer,
    VendaCaixaSerializer,
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


def comanda_detail_queryset():
    return annotated_comandas_queryset().prefetch_related(
        Prefetch(
            "itens",
            queryset=ItemComanda.objects.select_related("produto").all(),
        )
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


def get_open_cash_session():
    return (
        SessaoCaixa.objects.filter(status=SessaoCaixa.Status.ABERTO)
        .order_by("-aberto_em")
        .first()
    )


def generate_movimentacao_codigo(sessao_caixa):
    next_number = sessao_caixa.movimentacoes.count() + 1
    return f"MOV-{next_number:02d}"


def generate_venda_caixa_codigo(sessao_caixa):
    created_at = timezone.localtime(timezone.now())
    date_label = created_at.strftime("%d%m%y")
    prefix = f"CX-{date_label}-"
    last_code = (
        VendaCaixa.objects.filter(codigo__startswith=prefix)
        .order_by("-codigo")
        .values_list("codigo", flat=True)
        .first()
    )

    if last_code and last_code.startswith(prefix):
        try:
            next_number = int(last_code.replace(prefix, "")) + 1
        except ValueError:
            next_number = 1
    else:
        next_number = 1

    return f"CX-{date_label}-{next_number:03d}"


def cash_sale_detail_queryset():
    return VendaCaixa.objects.select_related("sessao_caixa").prefetch_related(
        Prefetch(
            "itens",
            queryset=ItemVendaCaixa.objects.select_related("produto").all(),
        )
    )


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
            return comanda_detail_queryset()
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

        response_serializer = ComandaDetailSerializer(comanda_detail_queryset().get(pk=comanda.pk))
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

        serializer = ComandaDetailSerializer(comanda_detail_queryset().get(pk=comanda.pk))
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

        serializer = ComandaDetailSerializer(comanda_detail_queryset().get(pk=comanda.pk))
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
        item, created = ItemComanda.objects.get_or_create(
            comanda=comanda,
            produto=produto,
            defaults={
                "quantidade": serializer.validated_data["quantidade"],
                "preco_unitario": produto.preco_venda,
            },
        )

        if not created:
            item.quantidade += serializer.validated_data["quantidade"]
            item.preco_unitario = produto.preco_venda
            item.save(update_fields=["quantidade", "preco_unitario"])

        response_serializer = ItemComandaSerializer(item)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ItemComandaViewSet(viewsets.ModelViewSet):
    queryset = ItemComanda.objects.select_related("comanda", "produto").all()
    serializer_class = ItemComandaSerializer

    @action(detail=True, methods=["post"], url_path="incrementar")
    def incrementar(self, request, pk=None):
        item = self.get_object()
        if item.comanda.status != Comanda.Status.ABERTA:
            return Response(
                {"detail": "Nao e possivel alterar itens de uma comanda encerrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantidade += 1
        item.save(update_fields=["quantidade"])
        return Response(ItemComandaSerializer(item).data)

    @action(detail=True, methods=["post"], url_path="decrementar")
    def decrementar(self, request, pk=None):
        item = self.get_object()
        if item.comanda.status != Comanda.Status.ABERTA:
            return Response(
                {"detail": "Nao e possivel alterar itens de uma comanda encerrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if item.quantidade <= 1:
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        item.quantidade -= 1
        item.save(update_fields=["quantidade"])
        return Response(ItemComandaSerializer(item).data)


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


class CashOverviewView(APIView):
    def get(self, request):
        sessao = get_open_cash_session()

        if sessao is None:
            return Response(
                {
                    "sessao_atual": None,
                    "movimentacoes": [],
                    "vendas": [],
                    "resumo": {
                        "fundo_inicial": "0.00",
                        "saldo_em_caixa": "0.00",
                        "movimentacoes_count": 0,
                        "vendas_count": 0,
                    },
                }
            )

        movimentacoes = sessao.movimentacoes.all()
        vendas = sessao.vendas.prefetch_related(
            Prefetch(
                "itens",
                queryset=ItemVendaCaixa.objects.select_related("produto").all(),
            )
        )
        total_sangrias = sum(
            item.valor for item in movimentacoes if item.tipo == MovimentacaoCaixa.Tipo.SANGRIA
        )
        total_suprimentos = sum(
            item.valor
            for item in movimentacoes
            if item.tipo == MovimentacaoCaixa.Tipo.SUPRIMENTO
        )
        total_vendas_dinheiro = sum(
            item.valor_total
            for item in vendas
            if item.forma_pagamento == VendaCaixa.FormaPagamento.DINHEIRO
        )
        saldo_em_caixa = (
            sessao.fundo_troco_inicial
            + total_suprimentos
            - total_sangrias
            + total_vendas_dinheiro
        )

        return Response(
            {
                "sessao_atual": SessaoCaixaSerializer(sessao).data,
                "movimentacoes": MovimentacaoCaixaSerializer(movimentacoes, many=True).data,
                "vendas": VendaCaixaSerializer(vendas, many=True).data,
                "resumo": {
                    "fundo_inicial": sessao.fundo_troco_inicial,
                    "saldo_em_caixa": saldo_em_caixa,
                    "movimentacoes_count": movimentacoes.count(),
                    "vendas_count": vendas.count(),
                },
            }
        )


class CashOpenView(APIView):
    def post(self, request):
        if get_open_cash_session() is not None:
            return Response(
                {"detail": "Ja existe uma sessao de caixa aberta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SessaoCaixaAberturaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            sessao = SessaoCaixa.objects.create(
                operador_nome=serializer.validated_data.get("operador_nome", "Ricardo Silva"),
                fundo_troco_inicial=serializer.validated_data["fundo_troco_inicial"],
                status=SessaoCaixa.Status.ABERTO,
            )
            MovimentacaoCaixa.objects.create(
                sessao_caixa=sessao,
                codigo=generate_movimentacao_codigo(sessao),
                tipo=MovimentacaoCaixa.Tipo.ABERTURA,
                descricao="Abertura de caixa",
                valor=sessao.fundo_troco_inicial,
            )

        return Response(CashOverviewView().get(request).data, status=status.HTTP_201_CREATED)


class CashCloseView(APIView):
    def post(self, request):
        sessao = get_open_cash_session()
        if sessao is None:
            return Response(
                {"detail": "Nao existe uma sessao de caixa aberta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            MovimentacaoCaixa.objects.create(
                sessao_caixa=sessao,
                codigo=generate_movimentacao_codigo(sessao),
                tipo=MovimentacaoCaixa.Tipo.FECHAMENTO,
                descricao="Fechamento de caixa",
                valor=0,
            )
            sessao.status = SessaoCaixa.Status.FECHADO
            sessao.fechado_em = timezone.now()
            sessao.save(update_fields=["status", "fechado_em"])

        return Response(
            {
                "sessao_atual": None,
                "movimentacoes": [],
                "vendas": [],
                "resumo": {
                    "fundo_inicial": "0.00",
                    "saldo_em_caixa": "0.00",
                    "movimentacoes_count": 0,
                    "vendas_count": 0,
                },
            }
        )


class CashMovementCreateView(APIView):
    def post(self, request):
        sessao = get_open_cash_session()
        if sessao is None:
            return Response(
                {"detail": "Abra o caixa antes de registrar movimentacoes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MovimentacaoCaixaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        movimentacao = MovimentacaoCaixa.objects.create(
            sessao_caixa=sessao,
            codigo=generate_movimentacao_codigo(sessao),
            tipo=serializer.validated_data["tipo"],
            descricao=serializer.validated_data.get("descricao", ""),
            valor=serializer.validated_data["valor"],
        )

        return Response(
            MovimentacaoCaixaSerializer(movimentacao).data,
            status=status.HTTP_201_CREATED,
        )


class CashSaleCreateView(APIView):
    def post(self, request):
        sessao = get_open_cash_session()
        if sessao is None:
            return Response(
                {"detail": "Abra o caixa antes de registrar vendas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VendaCaixaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        itens_payload = serializer.validated_data["itens"]
        produtos = {
            produto.id: produto
            for produto in Produto.objects.filter(
                id__in=[item["produto_id"] for item in itens_payload],
                ativo=True,
            )
        }

        valor_total = sum(
            produtos[item["produto_id"]].preco_venda * item["quantidade"]
            for item in itens_payload
        )

        valor_recebido = serializer.validated_data.get("valor_recebido")
        troco = 0

        if serializer.validated_data["forma_pagamento"] == VendaCaixa.FormaPagamento.DINHEIRO:
            if valor_recebido < valor_total:
                return Response(
                    {"detail": "O valor recebido nao pode ser menor que o total da venda."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            troco = valor_recebido - valor_total
        else:
            valor_recebido = None

        with transaction.atomic():
            venda = VendaCaixa.objects.create(
                sessao_caixa=sessao,
                codigo=generate_venda_caixa_codigo(sessao),
                forma_pagamento=serializer.validated_data["forma_pagamento"],
                valor_total=valor_total,
                valor_recebido=valor_recebido,
                troco=troco,
                observacao=serializer.validated_data.get("observacao", ""),
            )

            ItemVendaCaixa.objects.bulk_create(
                [
                    ItemVendaCaixa(
                        venda=venda,
                        produto=produtos[item["produto_id"]],
                        quantidade=item["quantidade"],
                        preco_unitario=produtos[item["produto_id"]].preco_venda,
                    )
                    for item in itens_payload
                ]
            )

        venda = VendaCaixa.objects.prefetch_related(
            Prefetch(
                "itens",
                queryset=ItemVendaCaixa.objects.select_related("produto").all(),
            )
        ).get(pk=venda.pk)

        return Response(VendaCaixaSerializer(venda).data, status=status.HTTP_201_CREATED)


class CashSaleHistoryView(APIView):
    def get(self, request):
        queryset = cash_sale_detail_queryset()

        periodo = request.query_params.get("periodo")
        codigo = request.query_params.get("codigo", "").strip()
        forma_pagamento = request.query_params.get("forma_pagamento", "").strip()
        data_inicial = request.query_params.get("data_inicial")
        data_final = request.query_params.get("data_final")

        today = timezone.localdate()

        if periodo == "hoje":
            queryset = queryset.filter(criada_em__date=today)
        elif periodo == "ontem":
            queryset = queryset.filter(criada_em__date=today - timedelta(days=1))
        elif periodo == "ultimos_7_dias":
            queryset = queryset.filter(criada_em__date__gte=today - timedelta(days=6))

        if data_inicial:
            queryset = queryset.filter(criada_em__date__gte=data_inicial)

        if data_final:
            queryset = queryset.filter(criada_em__date__lte=data_final)

        if codigo:
            queryset = queryset.filter(codigo__icontains=codigo)

        if forma_pagamento in {
            VendaCaixa.FormaPagamento.DINHEIRO,
            VendaCaixa.FormaPagamento.PIX,
            VendaCaixa.FormaPagamento.CARTAO,
        }:
            queryset = queryset.filter(forma_pagamento=forma_pagamento)

        serializer = VendaCaixaSerializer(queryset, many=True)
        return Response(serializer.data)


class CashSaleDetailView(APIView):
    def get(self, request, pk):
        venda = cash_sale_detail_queryset().get(pk=pk)
        serializer = VendaCaixaSerializer(venda)
        return Response(serializer.data)
