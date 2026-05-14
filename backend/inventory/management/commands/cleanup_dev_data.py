from collections import defaultdict
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F, Q

from inventory.models import Comanda, MovimentacaoEstoque, Produto, SessaoCaixa, VendaCaixa


PRODUCT_MARKERS = ("smoke", "teste", "validacao", "codigo venda")
TAB_MARKERS = ("smoke", "fluxo", "validacao")
DEFAULT_OPERATORS = ("Ricardo Silva", "Operador do Caixa")


def build_icontains_q(field_name: str, markers: tuple[str, ...]) -> Q:
    query = Q()
    for marker in markers:
        query |= Q(**{f"{field_name}__icontains": marker})
    return query


class Command(BaseCommand):
    help = "Remove dados de desenvolvimento/smoke do BarControl e restaura estoque das vendas removidas."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Mostra o que seria removido sem alterar o banco.",
        )
        parser.add_argument(
            "--prune-empty-sessions",
            action="store_true",
            help="Tambem remove sessoes de caixa sem vendas do operador padrao.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        prune_empty_sessions = options["prune_empty_sessions"]

        product_query = build_icontains_q("nome", PRODUCT_MARKERS)
        tab_query = build_icontains_q("nome_cliente", TAB_MARKERS)

        target_products = Produto.objects.filter(product_query)
        target_tabs = Comanda.objects.filter(tab_query)
        target_sales = (
            VendaCaixa.objects.select_related("comanda")
            .prefetch_related("itens__produto")
            .filter(Q(comanda__in=target_tabs) | Q(itens__produto__in=target_products))
            .distinct()
        )

        stock_recovery: dict[int, Decimal] = defaultdict(lambda: Decimal("0.000"))
        sale_codes = list(target_sales.values_list("codigo", flat=True))
        target_product_ids = list(target_products.values_list("id", flat=True))
        target_tab_ids = list(target_tabs.values_list("id", flat=True))
        target_sale_ids = list(target_sales.values_list("id", flat=True))

        for sale in target_sales:
            for item in sale.itens.all():
                if item.produto.controla_estoque:
                    stock_recovery[item.produto_id] += Decimal(item.quantidade)

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run: nenhuma alteracao foi aplicada."))
            self.stdout.write(f"Produtos alvo: {target_products.count()}")
            self.stdout.write(f"Comandas alvo: {target_tabs.count()}")
            self.stdout.write(f"Vendas alvo: {target_sales.count()}")
            self.stdout.write(f"Sessoes vazias candidatas: {self._empty_sessions_queryset().count() if prune_empty_sessions else 0}")
            return

        with transaction.atomic():
            for product_id, quantity in stock_recovery.items():
                Produto.objects.filter(pk=product_id).update(
                    estoque_atual=F("estoque_atual") + quantity
                )

            if sale_codes:
                for sale_code in sale_codes:
                    MovimentacaoEstoque.objects.filter(observacao__icontains=sale_code).delete()

            VendaCaixa.objects.filter(id__in=target_sale_ids).delete()
            Comanda.objects.filter(id__in=target_tab_ids).delete()
            Produto.objects.filter(id__in=target_product_ids).delete()

            removed_sessions = 0
            removed_movements = 0
            if prune_empty_sessions:
                empty_sessions = list(self._empty_sessions_queryset())
                removed_movements = sum(session.movimentacoes.count() for session in empty_sessions)
                removed_sessions = len(empty_sessions)
                if empty_sessions:
                    SessaoCaixa.objects.filter(id__in=[session.id for session in empty_sessions]).delete()

        self.stdout.write(
            self.style.SUCCESS(
                "Limpeza concluida: "
                f"{len(target_product_ids)} produto(s), "
                f"{len(target_tab_ids)} comanda(s), "
                f"{len(target_sale_ids)} venda(s), "
                f"{removed_sessions} sessao(oes) vazia(s) e "
                f"{removed_movements} movimentacao(oes) de caixa removidas."
            )
        )

    def _empty_sessions_queryset(self):
        return SessaoCaixa.objects.filter(
            operador_nome__in=DEFAULT_OPERATORS,
            vendas__isnull=True,
        ).distinct()
