from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AuthLoginView,
    AuthLogoutView,
    AuthMeView,
    CashCloseView,
    CashSaleDetailView,
    CashSaleHistoryView,
    CashMovementCreateView,
    CashOpenView,
    CashOverviewView,
    CashSaleCreateView,
    CategoriaProdutoViewSet,
    ComandaViewSet,
    ComposicaoProdutoViewSet,
    DashboardSummaryView,
    FinanceChartsView,
    FinanceClosingMetricsView,
    FinanceOperationsView,
    FinanceSummaryView,
    InsumoViewSet,
    ItemComandaViewSet,
    MovimentacaoEstoqueViewSet,
    ProdutoViewSet,
    StockMovementCreateView,
)

router = DefaultRouter()
router.register("categorias-produto", CategoriaProdutoViewSet, basename="categorias-produto")
router.register("produtos", ProdutoViewSet, basename="produtos")
router.register("insumos", InsumoViewSet, basename="insumos")
router.register("estoque/movimentacoes", MovimentacaoEstoqueViewSet, basename="estoque-movimentacoes")
router.register("composicoes-produto", ComposicaoProdutoViewSet, basename="composicoes-produto")
router.register("comandas", ComandaViewSet, basename="comandas")
router.register("itens-comanda", ItemComandaViewSet, basename="itens-comanda")

urlpatterns = [
    path("auth/login/", AuthLoginView.as_view(), name="auth-login"),
    path("auth/me/", AuthMeView.as_view(), name="auth-me"),
    path("auth/logout/", AuthLogoutView.as_view(), name="auth-logout"),
    path("caixa/visao-geral/", CashOverviewView.as_view(), name="cash-overview"),
    path("caixa/abrir/", CashOpenView.as_view(), name="cash-open"),
    path("caixa/fechar/", CashCloseView.as_view(), name="cash-close"),
    path("caixa/movimentacoes/", CashMovementCreateView.as_view(), name="cash-movements"),
    path("estoque/movimentacoes/registrar/", StockMovementCreateView.as_view(), name="stock-movement-create"),
    path("caixa/vendas/", CashSaleCreateView.as_view(), name="cash-sales"),
    path("caixa/vendas/historico/", CashSaleHistoryView.as_view(), name="cash-sales-history"),
    path("caixa/vendas/<int:pk>/", CashSaleDetailView.as_view(), name="cash-sale-detail"),
    path("financeiro/graficos/", FinanceChartsView.as_view(), name="finance-charts"),
    path("financeiro/fechamentos/", FinanceClosingMetricsView.as_view(), name="finance-closings"),
    path("financeiro/operacoes/", FinanceOperationsView.as_view(), name="finance-operations"),
    path("financeiro/resumo/", FinanceSummaryView.as_view(), name="finance-summary"),
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("", include(router.urls)),
]
