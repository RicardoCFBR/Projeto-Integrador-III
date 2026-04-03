from django.db.models import DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDate
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Comanda, Pedido, Produto
from .serializers import ComandaSerializer, PedidoSerializer, ProdutoSerializer


class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer


class ComandaViewSet(viewsets.ModelViewSet):
    queryset = Comanda.objects.all()
    serializer_class = ComandaSerializer


class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.select_related("comanda", "produto").all()
    serializer_class = PedidoSerializer


class DashboardSummaryView(APIView):
    def get(self, request):
        total_expression = ExpressionWrapper(
            F("quantidade") * F("preco_unitario"),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )

        sales_by_day = (
            Pedido.objects.annotate(dia=TruncDate("criado_em"))
            .values("dia")
            .annotate(total=Sum(total_expression))
            .order_by("dia")
        )

        total_vendas = Pedido.objects.aggregate(total=Sum(total_expression))["total"] or 0

        return Response(
            {
                "totais": {
                    "produtos": Produto.objects.count(),
                    "comandas_abertas": Comanda.objects.filter(
                        status=Comanda.Status.ABERTA
                    ).count(),
                    "pedidos": Pedido.objects.count(),
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
