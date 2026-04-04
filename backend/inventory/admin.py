from django.contrib import admin

from .models import (
    CategoriaProduto,
    Comanda,
    ComposicaoProduto,
    Insumo,
    ItemComanda,
    Produto,
)


@admin.register(CategoriaProduto)
class CategoriaProdutoAdmin(admin.ModelAdmin):
    list_display = ("nome", "slug", "ordem", "ativo")
    search_fields = ("nome", "slug")
    list_filter = ("ativo",)


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ("nome", "categoria", "preco_venda", "tipo_estoque", "ativo")
    search_fields = ("nome", "descricao")
    list_filter = ("ativo", "tipo_estoque", "categoria")


@admin.register(Insumo)
class InsumoAdmin(admin.ModelAdmin):
    list_display = ("nome", "unidade_medida", "estoque_atual", "estoque_minimo", "ativo")
    search_fields = ("nome",)
    list_filter = ("ativo", "unidade_medida")


@admin.register(ComposicaoProduto)
class ComposicaoProdutoAdmin(admin.ModelAdmin):
    list_display = ("produto", "insumo", "quantidade_consumida")
    search_fields = ("produto__nome", "insumo__nome")
    list_filter = ("produto",)


@admin.register(Comanda)
class ComandaAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nome_cliente", "status", "aberta_em", "encerrada_em")
    search_fields = ("codigo", "nome_cliente")
    list_filter = ("status",)


@admin.register(ItemComanda)
class ItemComandaAdmin(admin.ModelAdmin):
    list_display = ("comanda", "produto", "quantidade", "preco_unitario", "criado_em")
    search_fields = ("comanda__codigo", "produto__nome")
    list_filter = ("criado_em",)
