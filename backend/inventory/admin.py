from django.contrib import admin

from .models import Comanda, Pedido, Produto


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ("nome", "sku", "preco", "estoque", "ativo")
    search_fields = ("nome", "sku")
    list_filter = ("ativo",)


@admin.register(Comanda)
class ComandaAdmin(admin.ModelAdmin):
    list_display = ("codigo", "cliente", "status", "aberta_em", "fechada_em")
    search_fields = ("codigo", "cliente")
    list_filter = ("status",)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("comanda", "produto", "quantidade", "preco_unitario", "criado_em")
    search_fields = ("comanda__codigo", "produto__nome")
    list_filter = ("criado_em",)
