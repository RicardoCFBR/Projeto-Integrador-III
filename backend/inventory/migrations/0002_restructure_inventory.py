# Generated manually for the inventory base restructure.

import django.db.models.deletion
from django.db import migrations, models


def normalize_comanda_status(apps, schema_editor):
    Comanda = apps.get_model("inventory", "Comanda")
    Comanda.objects.filter(status__in=["fechada", "cancelada"]).update(
        status="encerrada"
    )


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CategoriaProduto",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("nome", models.CharField(max_length=80, unique=True)),
                ("slug", models.SlugField(max_length=80, unique=True)),
                ("ativo", models.BooleanField(default=True)),
                ("ordem", models.PositiveSmallIntegerField(default=0)),
            ],
            options={
                "verbose_name": "Categoria de produto",
                "verbose_name_plural": "Categorias de produto",
                "ordering": ["ordem", "nome"],
            },
        ),
        migrations.CreateModel(
            name="Insumo",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("nome", models.CharField(max_length=120, unique=True)),
                (
                    "unidade_medida",
                    models.CharField(
                        choices=[
                            ("un", "Unidade"),
                            ("g", "Grama"),
                            ("kg", "Quilograma"),
                            ("ml", "Mililitro"),
                            ("l", "Litro"),
                            ("porcao", "Porcao"),
                        ],
                        default="un",
                        max_length=10,
                    ),
                ),
                (
                    "estoque_atual",
                    models.DecimalField(decimal_places=3, default=0, max_digits=10),
                ),
                (
                    "estoque_minimo",
                    models.DecimalField(decimal_places=3, default=0, max_digits=10),
                ),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["nome"],
            },
        ),
        migrations.RenameModel(
            old_name="Pedido",
            new_name="ItemComanda",
        ),
        migrations.RenameField(
            model_name="comanda",
            old_name="cliente",
            new_name="nome_cliente",
        ),
        migrations.RenameField(
            model_name="comanda",
            old_name="fechada_em",
            new_name="encerrada_em",
        ),
        migrations.RenameField(
            model_name="produto",
            old_name="preco",
            new_name="preco_venda",
        ),
        migrations.AddField(
            model_name="produto",
            name="descricao",
            field=models.CharField(blank=True, default="", max_length=180),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="produto",
            name="categoria",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="produtos",
                to="inventory.categoriaproduto",
            ),
        ),
        migrations.AddField(
            model_name="produto",
            name="tipo_estoque",
            field=models.CharField(
                choices=[
                    ("unit", "Unitario"),
                    ("recipe", "Receita"),
                    ("untracked", "Nao controlado"),
                ],
                default="unit",
                max_length=12,
            ),
        ),
        migrations.RemoveField(
            model_name="produto",
            name="estoque",
        ),
        migrations.RemoveField(
            model_name="produto",
            name="sku",
        ),
        migrations.AlterField(
            model_name="comanda",
            name="status",
            field=models.CharField(
                choices=[("aberta", "Aberta"), ("encerrada", "Encerrada")],
                default="aberta",
                max_length=10,
            ),
        ),
        migrations.RunPython(normalize_comanda_status, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="itemcomanda",
            name="comanda",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="itens",
                to="inventory.comanda",
            ),
        ),
        migrations.AlterField(
            model_name="itemcomanda",
            name="produto",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="itens_comanda",
                to="inventory.produto",
            ),
        ),
        migrations.AlterModelOptions(
            name="itemcomanda",
            options={
                "ordering": ["-criado_em"],
                "verbose_name": "Item de comanda",
                "verbose_name_plural": "Itens de comanda",
            },
        ),
        migrations.CreateModel(
            name="ComposicaoProduto",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "quantidade_consumida",
                    models.DecimalField(decimal_places=3, max_digits=10),
                ),
                (
                    "insumo",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="composicoes",
                        to="inventory.insumo",
                    ),
                ),
                (
                    "produto",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="composicoes",
                        to="inventory.produto",
                    ),
                ),
            ],
            options={
                "verbose_name": "Composicao de produto",
                "verbose_name_plural": "Composicoes de produto",
                "ordering": ["produto__nome", "insumo__nome"],
            },
        ),
        migrations.AddConstraint(
            model_name="composicaoproduto",
            constraint=models.UniqueConstraint(
                fields=("produto", "insumo"), name="unique_produto_insumo"
            ),
        ),
    ]
