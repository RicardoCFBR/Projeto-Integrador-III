from django.db import models
from django.db.models import Q


class CategoriaProduto(models.Model):
    nome = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    ativo = models.BooleanField(default=True)
    ordem = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["ordem", "nome"]
        verbose_name = "Categoria de produto"
        verbose_name_plural = "Categorias de produto"

    def __str__(self) -> str:
        return self.nome


class Produto(models.Model):
    class TipoEstoque(models.TextChoices):
        UNITARIO = "unit", "Unitario"
        RECEITA = "recipe", "Receita"
        NAO_CONTROLADO = "untracked", "Nao controlado"

    nome = models.CharField(max_length=120)
    descricao = models.CharField(max_length=180, blank=True)
    preco_venda = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(
        CategoriaProduto,
        on_delete=models.PROTECT,
        related_name="produtos",
        blank=True,
        null=True,
    )
    tipo_estoque = models.CharField(
        max_length=12,
        choices=TipoEstoque.choices,
        default=TipoEstoque.UNITARIO,
    )
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self) -> str:
        return self.nome


class Insumo(models.Model):
    class UnidadeMedida(models.TextChoices):
        UNIDADE = "un", "Unidade"
        GRAMA = "g", "Grama"
        QUILOGRAMA = "kg", "Quilograma"
        MILILITRO = "ml", "Mililitro"
        LITRO = "l", "Litro"
        PORCAO = "porcao", "Porcao"

    nome = models.CharField(max_length=120, unique=True)
    unidade_medida = models.CharField(
        max_length=10,
        choices=UnidadeMedida.choices,
        default=UnidadeMedida.UNIDADE,
    )
    estoque_atual = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    estoque_minimo = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self) -> str:
        return self.nome


class ComposicaoProduto(models.Model):
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name="composicoes",
    )
    insumo = models.ForeignKey(
        Insumo,
        on_delete=models.PROTECT,
        related_name="composicoes",
    )
    quantidade_consumida = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        ordering = ["produto__nome", "insumo__nome"]
        constraints = [
            models.UniqueConstraint(
                fields=["produto", "insumo"],
                name="unique_produto_insumo",
            )
        ]
        verbose_name = "Composicao de produto"
        verbose_name_plural = "Composicoes de produto"

    def __str__(self) -> str:
        return f"{self.produto.nome} -> {self.insumo.nome}"


class Comanda(models.Model):
    class Status(models.TextChoices):
        ABERTA = "aberta", "Aberta"
        ENCERRADA = "encerrada", "Encerrada"

    codigo = models.CharField(max_length=20, unique=True)
    nome_cliente = models.CharField(max_length=120, blank=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ABERTA,
    )
    aberta_em = models.DateTimeField(auto_now_add=True)
    encerrada_em = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-aberta_em"]

    @property
    def valor_total(self):
        return sum(item.valor_total for item in self.itens.all())

    def __str__(self) -> str:
        return self.codigo


class ItemComanda(models.Model):
    comanda = models.ForeignKey(
        Comanda,
        on_delete=models.CASCADE,
        related_name="itens",
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.PROTECT,
        related_name="itens_comanda",
    )
    quantidade = models.PositiveIntegerField(default=1)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]
        verbose_name = "Item de comanda"
        verbose_name_plural = "Itens de comanda"

    @property
    def valor_total(self):
        return self.quantidade * self.preco_unitario

    def __str__(self) -> str:
        return f"{self.comanda.codigo} - {self.produto.nome}"


class SessaoCaixa(models.Model):
    class Status(models.TextChoices):
        ABERTO = "aberto", "Aberto"
        FECHADO = "fechado", "Fechado"

    operador_nome = models.CharField(max_length=120, default="Ricardo Silva")
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ABERTO,
    )
    fundo_troco_inicial = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    aberto_em = models.DateTimeField(auto_now_add=True)
    fechado_em = models.DateTimeField(blank=True, null=True)
    fechamento_dinheiro_informado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    fechamento_pix_informado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    fechamento_cartao_informado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    valor_esperado_dinheiro = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    valor_esperado_pix = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    valor_esperado_cartao = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    diferenca_dinheiro = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    diferenca_pix = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    diferenca_cartao = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    diferenca_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["-aberto_em"]
        constraints = [
            models.UniqueConstraint(
                fields=["status"],
                condition=Q(status="aberto"),
                name="unique_open_cash_session",
            )
        ]
        verbose_name = "Sessão de caixa"
        verbose_name_plural = "Sessões de caixa"

    def __str__(self) -> str:
        return f"Caixa {self.get_status_display()} - {self.aberto_em:%d/%m/%Y %H:%M}"


class MovimentacaoCaixa(models.Model):
    class Tipo(models.TextChoices):
        ABERTURA = "abertura", "Abertura"
        SANGRIA = "sangria", "Sangria"
        SUPRIMENTO = "suprimento", "Suprimento"
        FECHAMENTO = "fechamento", "Fechamento"

    sessao_caixa = models.ForeignKey(
        SessaoCaixa,
        on_delete=models.CASCADE,
        related_name="movimentacoes",
    )
    codigo = models.CharField(max_length=20)
    tipo = models.CharField(
        max_length=12,
        choices=Tipo.choices,
    )
    descricao = models.CharField(max_length=160, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["sessao_caixa", "codigo"],
                name="unique_cash_movement_code_per_session",
            )
        ]
        verbose_name = "Movimentação de caixa"
        verbose_name_plural = "Movimentações de caixa"

    def __str__(self) -> str:
        return f"{self.codigo} - {self.get_tipo_display()}"


class VendaCaixa(models.Model):
    class FormaPagamento(models.TextChoices):
        DINHEIRO = "dinheiro", "Dinheiro"
        PIX = "pix", "Pix"
        CARTAO = "cartao", "Cartao"

    class Status(models.TextChoices):
        FINALIZADA = "finalizada", "Finalizada"

    sessao_caixa = models.ForeignKey(
        SessaoCaixa,
        on_delete=models.PROTECT,
        related_name="vendas",
    )
    comanda = models.OneToOneField(
        Comanda,
        on_delete=models.PROTECT,
        related_name="venda_caixa",
        blank=True,
        null=True,
    )
    codigo = models.CharField(max_length=24, unique=True)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.FINALIZADA,
    )
    forma_pagamento = models.CharField(
        max_length=12,
        choices=FormaPagamento.choices,
    )
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    valor_recebido = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    troco = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    observacao = models.CharField(max_length=180, blank=True)
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criada_em", "-id"]
        verbose_name = "Venda no caixa"
        verbose_name_plural = "Vendas no caixa"

    def __str__(self) -> str:
        return self.codigo


class ItemVendaCaixa(models.Model):
    venda = models.ForeignKey(
        VendaCaixa,
        on_delete=models.CASCADE,
        related_name="itens",
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.PROTECT,
        related_name="itens_venda_caixa",
    )
    quantidade = models.PositiveIntegerField(default=1)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]
        verbose_name = "Item de venda no caixa"
        verbose_name_plural = "Itens de venda no caixa"

    @property
    def valor_total(self):
        return self.quantidade * self.preco_unitario

    def __str__(self) -> str:
        return f"{self.venda.codigo} - {self.produto.nome}"
