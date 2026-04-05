from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
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
    InsumoViewSet,
    ItemComandaViewSet,
    ProdutoViewSet,
)

router = DefaultRouter()
router.register("categorias-produto", CategoriaProdutoViewSet, basename="categorias-produto")
router.register("produtos", ProdutoViewSet, basename="produtos")
router.register("insumos", InsumoViewSet, basename="insumos")
router.register("composicoes-produto", ComposicaoProdutoViewSet, basename="composicoes-produto")
router.register("comandas", ComandaViewSet, basename="comandas")
router.register("itens-comanda", ItemComandaViewSet, basename="itens-comanda")

urlpatterns = [
    path("caixa/visao-geral/", CashOverviewView.as_view(), name="cash-overview"),
    path("caixa/abrir/", CashOpenView.as_view(), name="cash-open"),
    path("caixa/fechar/", CashCloseView.as_view(), name="cash-close"),
    path("caixa/movimentacoes/", CashMovementCreateView.as_view(), name="cash-movements"),
    path("caixa/vendas/", CashSaleCreateView.as_view(), name="cash-sales"),
    path("caixa/vendas/historico/", CashSaleHistoryView.as_view(), name="cash-sales-history"),
    path("caixa/vendas/<int:pk>/", CashSaleDetailView.as_view(), name="cash-sale-detail"),
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("", include(router.urls)),
]
