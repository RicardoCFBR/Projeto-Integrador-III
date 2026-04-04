from django.db import models


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
