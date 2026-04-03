from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ComandaViewSet, DashboardSummaryView, PedidoViewSet, ProdutoViewSet

router = DefaultRouter()
router.register("produtos", ProdutoViewSet, basename="produtos")
router.register("comandas", ComandaViewSet, basename="comandas")
router.register("pedidos", PedidoViewSet, basename="pedidos")

urlpatterns = [
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("", include(router.urls)),
]
