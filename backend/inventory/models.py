from django.db import models


class Produto(models.Model):
    nome = models.CharField(max_length=120)
    sku = models.CharField(max_length=40, unique=True)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    estoque = models.PositiveIntegerField(default=0)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nome"]

    def __str__(self) -> str:
        return self.nome


class Comanda(models.Model):
    class Status(models.TextChoices):
        ABERTA = "aberta", "Aberta"
        FECHADA = "fechada", "Fechada"
        CANCELADA = "cancelada", "Cancelada"

    codigo = models.CharField(max_length=20, unique=True)
    cliente = models.CharField(max_length=120, blank=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ABERTA,
    )
    aberta_em = models.DateTimeField(auto_now_add=True)
    fechada_em = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-aberta_em"]

    def __str__(self) -> str:
        return self.codigo


class Pedido(models.Model):
    comanda = models.ForeignKey(
        Comanda,
        on_delete=models.CASCADE,
        related_name="pedidos",
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.PROTECT,
        related_name="pedidos",
    )
    quantidade = models.PositiveIntegerField(default=1)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]

    @property
    def valor_total(self):
        return self.quantidade * self.preco_unitario

    def __str__(self) -> str:
        return f"{self.comanda.codigo} - {self.produto.nome}"
