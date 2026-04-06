from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0008_split_debit_credit_payment_method"),
    ]

    operations = [
        migrations.AddField(
            model_name="sessaocaixa",
            name="diferenca_credito",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="sessaocaixa",
            name="diferenca_debito",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="sessaocaixa",
            name="fechamento_credito_informado",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="sessaocaixa",
            name="fechamento_debito_informado",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="sessaocaixa",
            name="valor_esperado_credito",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="sessaocaixa",
            name="valor_esperado_debito",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
