from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
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
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("", include(router.urls)),
]
