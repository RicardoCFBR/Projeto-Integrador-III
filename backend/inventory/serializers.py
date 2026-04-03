from rest_framework import serializers

from .models import Comanda, Pedido, Produto


class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = "__all__"


class ComandaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comanda
        fields = "__all__"


class PedidoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source="produto.nome", read_only=True)
    total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        source="valor_total",
        read_only=True,
    )

    class Meta:
        model = Pedido
        fields = [
            "id",
            "comanda",
            "produto",
            "produto_nome",
            "quantidade",
            "preco_unitario",
            "total",
            "criado_em",
        ]
