from rest_framework import serializers

from .models import (
    CategoriaProduto,
    Comanda,
    ComposicaoProduto,
    Insumo,
    ItemComanda,
    Produto,
)


class CategoriaProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaProduto
        fields = "__all__"


class ProdutoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source="categoria.nome", read_only=True)
    categoria_slug = serializers.CharField(source="categoria.slug", read_only=True)

    class Meta:
        model = Produto
        fields = [
            "id",
            "nome",
            "descricao",
            "preco_venda",
            "categoria",
            "categoria_nome",
            "categoria_slug",
            "tipo_estoque",
            "ativo",
            "criado_em",
        ]


class InsumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insumo
        fields = "__all__"


class ComposicaoProdutoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source="produto.nome", read_only=True)
    insumo_nome = serializers.CharField(source="insumo.nome", read_only=True)

    class Meta:
        model = ComposicaoProduto
        fields = [
            "id",
            "produto",
            "produto_nome",
            "insumo",
            "insumo_nome",
            "quantidade_consumida",
        ]


class ItemComandaSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source="produto.nome", read_only=True)
    total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        source="valor_total",
        read_only=True,
    )

    class Meta:
        model = ItemComanda
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


class ItemComandaCreateSerializer(serializers.Serializer):
    produto_id = serializers.IntegerField()
    quantidade = serializers.IntegerField(min_value=1, default=1)

    def validate_produto_id(self, value):
        if not Produto.objects.filter(id=value, ativo=True).exists():
            raise serializers.ValidationError("Produto nao encontrado ou inativo.")
        return value


class ComandaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comanda
        fields = "__all__"


class ComandaAberturaSerializer(serializers.Serializer):
    nome_cliente = serializers.CharField(max_length=120)

    def validate_nome_cliente(self, value):
        cleaned_value = value.strip()
        if not cleaned_value:
            raise serializers.ValidationError("Informe o nome do cliente.")
        return cleaned_value


class ComandaMuralSerializer(serializers.ModelSerializer):
    total_parcial = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    itens_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comanda
        fields = [
            "id",
            "codigo",
            "nome_cliente",
            "status",
            "aberta_em",
            "encerrada_em",
            "total_parcial",
            "itens_count",
        ]


class ComandaDetailSerializer(serializers.ModelSerializer):
    itens = ItemComandaSerializer(many=True, read_only=True)
    total_parcial = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    itens_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comanda
        fields = [
            "id",
            "codigo",
            "nome_cliente",
            "status",
            "aberta_em",
            "encerrada_em",
            "total_parcial",
            "itens_count",
            "itens",
        ]
