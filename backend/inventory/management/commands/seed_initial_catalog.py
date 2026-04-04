from decimal import Decimal

from django.core.management.base import BaseCommand

from inventory.models import CategoriaProduto, Produto


CATEGORIES = [
    {"slug": "bebidas", "nome": "Bebidas", "ordem": 1},
    {"slug": "mercearia", "nome": "Mercearia", "ordem": 2},
    {"slug": "conveniencia", "nome": "Conveniencia", "ordem": 3},
]


PRODUCTS = [
    {
        "nome": "Cerveja Heineken 600ml",
        "descricao": "Garrafa de vidro gelada",
        "preco_venda": Decimal("18.90"),
        "categoria_slug": "bebidas",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Cerveja Skol Lata 350ml",
        "descricao": "Lata tradicional",
        "preco_venda": Decimal("6.50"),
        "categoria_slug": "bebidas",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Coca-Cola 600ml",
        "descricao": "Pet gelada",
        "preco_venda": Decimal("8.00"),
        "categoria_slug": "bebidas",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Agua Mineral 500ml",
        "descricao": "Com ou sem gas",
        "preco_venda": Decimal("3.50"),
        "categoria_slug": "bebidas",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Pao Frances (Unid)",
        "descricao": "Sempre fresquinho",
        "preco_venda": Decimal("1.00"),
        "categoria_slug": "mercearia",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Leite Integral 1L",
        "descricao": "Caixinha (UHT)",
        "preco_venda": Decimal("5.90"),
        "categoria_slug": "mercearia",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Cafe em Po 500g",
        "descricao": "Tradicional extra forte",
        "preco_venda": Decimal("18.50"),
        "categoria_slug": "mercearia",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Salgadinho Torcida 70g",
        "descricao": "Pimenta, Queijo ou Bacon",
        "preco_venda": Decimal("5.50"),
        "categoria_slug": "mercearia",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Chocolate Bis",
        "descricao": "Ao leite ou Branco",
        "preco_venda": Decimal("6.50"),
        "categoria_slug": "mercearia",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Isqueiro Bic",
        "descricao": "Tamanho grande",
        "preco_venda": Decimal("8.50"),
        "categoria_slug": "conveniencia",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
    {
        "nome": "Chiclete Trident",
        "descricao": "Sabores variados",
        "preco_venda": Decimal("2.50"),
        "categoria_slug": "conveniencia",
        "tipo_estoque": Produto.TipoEstoque.UNITARIO,
    },
]


class Command(BaseCommand):
    help = "Semeia categorias e produtos iniciais para o catalogo do BarControl."

    def handle(self, *args, **options):
        category_map: dict[str, CategoriaProduto] = {}

        for category_data in CATEGORIES:
            category, _ = CategoriaProduto.objects.update_or_create(
                slug=category_data["slug"],
                defaults={
                    "nome": category_data["nome"],
                    "ativo": True,
                    "ordem": category_data["ordem"],
                },
            )
            category_map[category.slug] = category

        # Desativa o produto temporario criado no smoke test anterior, sem violar PROTECT.
        Produto.objects.filter(nome="Cerveja Teste").update(ativo=False)

        for product_data in PRODUCTS:
            Produto.objects.update_or_create(
                nome=product_data["nome"],
                defaults={
                    "descricao": product_data["descricao"],
                    "preco_venda": product_data["preco_venda"],
                    "categoria": category_map[product_data["categoria_slug"]],
                    "tipo_estoque": product_data["tipo_estoque"],
                    "ativo": True,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Catalogo inicial semeado com {len(CATEGORIES)} categorias e {len(PRODUCTS)} produtos."
            )
        )
