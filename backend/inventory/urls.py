from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CashCloseView,
    CashMovementCreateView,
    CashOpenView,
    CashOverviewView,
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
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("", include(router.urls)),
]
