from decimal import Decimal

from rest_framework import serializers

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


class SessaoCaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessaoCaixa
        fields = [
            "id",
            "operador_nome",
            "status",
            "fundo_troco_inicial",
            "aberto_em",
            "fechado_em",
            "fechamento_dinheiro_informado",
            "fechamento_pix_informado",
            "fechamento_cartao_informado",
            "valor_esperado_dinheiro",
            "valor_esperado_pix",
            "valor_esperado_cartao",
            "diferenca_dinheiro",
            "diferenca_pix",
            "diferenca_cartao",
            "diferenca_total",
        ]


class MovimentacaoCaixaSerializer(serializers.ModelSerializer):
    tipo_label = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = MovimentacaoCaixa
        fields = [
            "id",
            "codigo",
            "tipo",
            "tipo_label",
            "descricao",
            "valor",
            "criado_em",
        ]


class SessaoCaixaAberturaSerializer(serializers.Serializer):
    fundo_troco_inicial = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )
    operador_nome = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def validate_operador_nome(self, value):
        cleaned_value = value.strip()
        return cleaned_value or "Ricardo Silva"


class MovimentacaoCaixaCreateSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(
        choices=[
            MovimentacaoCaixa.Tipo.SANGRIA,
            MovimentacaoCaixa.Tipo.SUPRIMENTO,
        ]
    )
    valor = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    descricao = serializers.CharField(max_length=160, required=False, allow_blank=True)


class SessaoCaixaFechamentoSerializer(serializers.Serializer):
    dinheiro_contado = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )
    pix_conferido = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )
    cartao_conferido = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
    )


class ItemVendaCaixaSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source="produto.nome", read_only=True)
    total = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        source="valor_total",
        read_only=True,
    )

    class Meta:
        model = ItemVendaCaixa
        fields = [
            "id",
            "produto",
            "produto_nome",
            "quantidade",
            "preco_unitario",
            "total",
        ]


class VendaCaixaSerializer(serializers.ModelSerializer):
    forma_pagamento_label = serializers.CharField(
        source="get_forma_pagamento_display",
        read_only=True,
    )
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    itens = ItemVendaCaixaSerializer(many=True, read_only=True)

    class Meta:
        model = VendaCaixa
        fields = [
            "id",
            "codigo",
            "forma_pagamento",
            "forma_pagamento_label",
            "status",
            "status_label",
            "valor_total",
            "valor_recebido",
            "troco",
            "observacao",
            "criada_em",
            "itens",
        ]


class ItemVendaCaixaCreateSerializer(serializers.Serializer):
    produto_id = serializers.IntegerField()
    quantidade = serializers.IntegerField(min_value=1)

    def validate_produto_id(self, value):
        if not Produto.objects.filter(id=value, ativo=True).exists():
            raise serializers.ValidationError("Produto nao encontrado ou inativo.")
        return value


class VendaCaixaCreateSerializer(serializers.Serializer):
    forma_pagamento = serializers.ChoiceField(choices=VendaCaixa.FormaPagamento.choices)
    valor_recebido = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.00"),
        required=False,
        allow_null=True,
    )
    observacao = serializers.CharField(max_length=180, required=False, allow_blank=True)
    itens = ItemVendaCaixaCreateSerializer(many=True)

    def validate_itens(self, value):
        if not value:
            raise serializers.ValidationError("Adicione pelo menos um item na venda.")
        return value

    def validate(self, attrs):
        forma_pagamento = attrs["forma_pagamento"]
        valor_recebido = attrs.get("valor_recebido")

        if forma_pagamento == VendaCaixa.FormaPagamento.DINHEIRO and valor_recebido is None:
            raise serializers.ValidationError(
                {"valor_recebido": ["Informe o valor recebido para pagamentos em dinheiro."]}
            )

        return attrs
