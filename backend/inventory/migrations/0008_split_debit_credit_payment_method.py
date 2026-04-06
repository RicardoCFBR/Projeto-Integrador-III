from django.db import migrations, models


def forwards_convert_card_to_credit(apps, schema_editor):
    VendaCaixa = apps.get_model("inventory", "VendaCaixa")
    VendaCaixa.objects.filter(forma_pagamento="cartao").update(forma_pagamento="credito")


def backwards_convert_credit_to_card(apps, schema_editor):
    VendaCaixa = apps.get_model("inventory", "VendaCaixa")
    VendaCaixa.objects.filter(forma_pagamento="credito").update(forma_pagamento="cartao")


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0007_produto_controla_estoque_produto_estoque_atual_and_more"),
    ]

    operations = [
        migrations.RunPython(
            forwards_convert_card_to_credit,
            backwards_convert_credit_to_card,
        ),
        migrations.AlterField(
            model_name="vendacaixa",
            name="forma_pagamento",
            field=models.CharField(
                choices=[
                    ("dinheiro", "Dinheiro"),
                    ("pix", "Pix"),
                    ("debito", "Debito"),
                    ("credito", "Credito"),
                ],
                max_length=12,
            ),
        ),
    ]
