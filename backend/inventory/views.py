from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Prefetch, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    CategoriaProduto,
    Comanda,
    ComposicaoProduto,
    Insumo,
    ItemComanda,
    ItemVendaCaixa,
    MovimentacaoEstoque,
    MovimentacaoCaixa,
    Produto,
    SessaoCaixa,
    VendaCaixa,
)
from .serializers import (
    CategoriaProdutoSerializer,
    ComandaAberturaSerializer,
    ComandaDetailSerializer,
    ComandaMuralSerializer,
    ComandaPagamentoSerializer,
    ComandaSerializer,
    ComposicaoProdutoSerializer,
    InsumoSerializer,
    ItemComandaCreateSerializer,
    ItemComandaSerializer,
    ItemVendaCaixaSerializer,
    MovimentacaoEstoqueCreateSerializer,
    MovimentacaoEstoqueSerializer,
    MovimentacaoCaixaCreateSerializer,
    MovimentacaoCaixaSerializer,
    ProdutoSerializer,
    SessaoCaixaAberturaSerializer,
    SessaoCaixaFechamentoSerializer,
    SessaoCaixaSerializer,
    VendaCaixaCreateSerializer,
    VendaCaixaSerializer,
)


def build_total_expression():
    return ExpressionWrapper(
        F("itens__quantidade") * F("itens__preco_unitario"),
        output_field=DecimalField(max_digits=12, decimal_places=2),
    )


def annotated_comandas_queryset():
    total_expression = build_total_expression()
    return Comanda.objects.select_related("venda_caixa").annotate(
        total_parcial=Coalesce(
            Sum(total_expression),
            0,
            output_field=DecimalField(max_digits=12, decimal_places=2),
        ),
        itens_count=Count("itens", distinct=True),
    )


def comanda_detail_queryset():
    return annotated_comandas_queryset().prefetch_related(
        Prefetch(
            "itens",
            queryset=ItemComanda.objects.select_related("produto").all(),
        ),
        "venda_caixa",
    )


def generate_comanda_codigo():
    last_code = (
        Comanda.objects.exclude(codigo="")
        .order_by("-id")
        .values_list("codigo", flat=True)
        .first()
    )

    if last_code and last_code.replace("CMD-", "").isdigit():
        next_number = int(last_code.replace("CMD-", "")) + 1
    else:
        next_number = 2401

    return f"CMD-{next_number}"


def get_open_cash_session():
    return (
        SessaoCaixa.objects.filter(status=SessaoCaixa.Status.ABERTO)
        .order_by("-aberto_em")
        .first()
    )


def generate_movimentacao_codigo(sessao_caixa):
    next_number = sessao_caixa.movimentacoes.count() + 1
    return f"MOV-{next_number:02d}"


def generate_venda_caixa_codigo(sessao_caixa):
    created_at = timezone.localtime(timezone.now())
    date_label = created_at.strftime("%d%m%y")
    prefix = f"CX-{date_label}-"
    last_code = (
        VendaCaixa.objects.filter(codigo__startswith=prefix)
        .order_by("-codigo")
        .values_list("codigo", flat=True)
        .first()
    )

    if last_code and last_code.startswith(prefix):
        try:
            next_number = int(last_code.replace(prefix, "")) + 1
        except ValueError:
            next_number = 1
    else:
        next_number = 1

    return f"CX-{date_label}-{next_number:03d}"


def calculate_cash_overview_summary(sessao):
    movimentacoes = list(sessao.movimentacoes.all())
    vendas = list(
        sessao.vendas.prefetch_related(
            Prefetch(
                "itens",
                queryset=ItemVendaCaixa.objects.select_related("produto").all(),
            )
        )
    )

    total_sangrias = sum(
        (item.valor for item in movimentacoes if item.tipo == MovimentacaoCaixa.Tipo.SANGRIA),
        Decimal("0.00"),
    )
    total_suprimentos = sum(
        (item.valor for item in movimentacoes if item.tipo == MovimentacaoCaixa.Tipo.SUPRIMENTO),
        Decimal("0.00"),
    )
    total_vendas_dinheiro = sum(
        (
            item.valor_total
            for item in vendas
            if item.forma_pagamento == VendaCaixa.FormaPagamento.DINHEIRO
        ),
        Decimal("0.00"),
    )
    total_vendas_pix = sum(
        (
            item.valor_total
            for item in vendas
            if item.forma_pagamento == VendaCaixa.FormaPagamento.PIX
        ),
        Decimal("0.00"),
    )
    total_vendas_debito = sum(
        (
            item.valor_total
            for item in vendas
            if item.forma_pagamento == VendaCaixa.FormaPagamento.DEBITO
        ),
        Decimal("0.00"),
    )
    total_vendas_credito = sum(
        (
            item.valor_total
            for item in vendas
            if item.forma_pagamento == VendaCaixa.FormaPagamento.CREDITO
        ),
        Decimal("0.00"),
    )
    total_vendas_cartao = total_vendas_debito + total_vendas_credito

    saldo_em_caixa = (
        sessao.fundo_troco_inicial
        + total_suprimentos
        - total_sangrias
        + total_vendas_dinheiro
    )

    return {
        "movimentacoes": movimentacoes,
        "vendas": vendas,
        "resumo": {
            "fundo_inicial": sessao.fundo_troco_inicial,
            "saldo_em_caixa": saldo_em_caixa,
            "movimentacoes_count": len(movimentacoes),
            "vendas_count": len(vendas),
            "esperado_dinheiro": saldo_em_caixa,
            "esperado_pix": total_vendas_pix,
            "esperado_cartao": total_vendas_cartao,
            "esperado_debito": total_vendas_debito,
            "esperado_credito": total_vendas_credito,
        },
    }


def cash_sale_detail_queryset():
    return VendaCaixa.objects.select_related("sessao_caixa", "comanda").prefetch_related(
        Prefetch(
            "itens",
            queryset=ItemVendaCaixa.objects.select_related("produto").all(),
        )
    )


def apply_date_filters(queryset, field_name, request):
    periodo = request.query_params.get("periodo")
    data_inicial = request.query_params.get("data_inicial")
    data_final = request.query_params.get("data_final")
    today = timezone.localdate()

    if periodo == "hoje":
        queryset = queryset.filter(**{f"{field_name}__date": today})
    elif periodo == "ontem":
        queryset = queryset.filter(**{f"{field_name}__date": today - timedelta(days=1)})
    elif periodo == "ultimos_7_dias":
        queryset = queryset.filter(**{f"{field_name}__date__gte": today - timedelta(days=6)})

    if data_inicial:
        queryset = queryset.filter(**{f"{field_name}__date__gte": data_inicial})

    if data_final:
        queryset = queryset.filter(**{f"{field_name}__date__lte": data_final})

    return queryset


def apply_stock_movement(produto, tipo, quantidade, observacao=""):
    produto.refresh_from_db(fields=["estoque_atual"])

    if tipo == MovimentacaoEstoque.Tipo.ENTRADA:
        novo_estoque = produto.estoque_atual + quantidade
    elif tipo == MovimentacaoEstoque.Tipo.AJUSTE:
        novo_estoque = quantidade
    else:
        novo_estoque = produto.estoque_atual - quantidade
        if novo_estoque < 0:
            raise ValueError(f"Estoque insuficiente para o produto {produto.nome}.")

    produto.estoque_atual = novo_estoque
    produto.save(update_fields=["estoque_atual"])

    return MovimentacaoEstoque.objects.create(
        produto=produto,
        tipo=tipo,
        quantidade=quantidade,
        observacao=observacao,
    )


class CategoriaProdutoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaProduto.objects.all()
    serializer_class = CategoriaProdutoSerializer


class ProdutoViewSet(viewsets.ModelViewSet):
    serializer_class = ProdutoSerializer

    def get_queryset(self):
        queryset = Produto.objects.select_related("categoria").all()
        include_inactive = self.request.query_params.get("include_inactive") == "true"
        if self.action == "list" and not include_inactive:
            queryset = queryset.filter(ativo=True)
        return queryset


class MovimentacaoEstoqueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MovimentacaoEstoque.objects.select_related("produto").all()
    serializer_class = MovimentacaoEstoqueSerializer


class InsumoViewSet(viewsets.ModelViewSet):
    queryset = Insumo.objects.all()
    serializer_class = InsumoSerializer


class ComposicaoProdutoViewSet(viewsets.ModelViewSet):
    queryset = ComposicaoProduto.objects.select_related("produto", "insumo").all()
    serializer_class = ComposicaoProdutoSerializer


class ComandaViewSet(viewsets.ModelViewSet):
    serializer_class = ComandaSerializer

    def get_queryset(self):
        queryset = annotated_comandas_queryset()
        if self.action == "retrieve":
            return comanda_detail_queryset()
        return queryset

    def get_serializer_class(self):
        if self.action == "mural":
            return ComandaMuralSerializer
        if self.action == "retrieve":
            return ComandaDetailSerializer
        return super().get_serializer_class()

    @action(detail=False, methods=["get"], url_path="mural")
    def mural(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ComandaMuralSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="abrir")
    def abrir(self, request):
        serializer = ComandaAberturaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comanda = Comanda.objects.create(
            codigo=generate_comanda_codigo(),
            nome_cliente=serializer.validated_data["nome_cliente"],
            status=Comanda.Status.ABERTA,
        )

        response_serializer = ComandaDetailSerializer(comanda_detail_queryset().get(pk=comanda.pk))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="encerrar")
    def encerrar(self, request, pk=None):
        comanda = self.get_object()
        if comanda.status == Comanda.Status.ENCERRADA:
            return Response(
                {"detail": "A comanda ja esta encerrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comanda.status = Comanda.Status.ENCERRADA
        comanda.encerrada_em = timezone.now()
        comanda.save(update_fields=["status", "encerrada_em"])

        serializer = ComandaDetailSerializer(comanda_detail_queryset().get(pk=comanda.pk))
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="reabrir")
    def reabrir(self, request, pk=None):
        comanda = self.get_object()
        if comanda.status == Comanda.Status.ABERTA:
            return Response(
                {"detail": "A comanda ja esta aberta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if hasattr(comanda, "venda_caixa"):
            return Response(
                {"detail": "A comanda ja foi paga e nao pode ser reaberta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comanda.status = Comanda.Status.ABERTA
        comanda.encerrada_em = None
        comanda.save(update_fields=["status", "encerrada_em"])

        serializer = ComandaDetailSerializer(comanda_detail_queryset().get(pk=comanda.pk))
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="itens")
    def adicionar_item(self, request, pk=None):
        comanda = self.get_object()
        if comanda.status != Comanda.Status.ABERTA:
            return Response(
                {"detail": "Nao e possivel adicionar itens em uma comanda encerrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ItemComandaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        produto = Produto.objects.get(pk=serializer.validated_data["produto_id"], ativo=True)
        item, created = ItemComanda.objects.get_or_create(
            comanda=comanda,
            produto=produto,
            defaults={
                "quantidade": serializer.validated_data["quantidade"],
                "preco_unitario": produto.preco_venda,
            },
        )

        if not created:
            item.quantidade += serializer.validated_data["quantidade"]
            item.preco_unitario = produto.preco_venda
            item.save(update_fields=["quantidade", "preco_unitario"])

        response_serializer = ItemComandaSerializer(item)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="pagar")
    def pagar(self, request, pk=None):
        comanda = self.get_object()
        sessao = get_open_cash_session()

        if sessao is None:
            return Response(
                {"detail": "Abra o caixa antes de registrar o pagamento da comanda."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if hasattr(comanda, "venda_caixa"):
            return Response(
                {"detail": "Esta comanda ja possui um pagamento registrado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        itens = list(comanda.itens.select_related("produto").all())
        if not itens:
            return Response(
                {"detail": "Adicione pelo menos um item antes de pagar a comanda."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ComandaPagamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        valor_total = sum((item.valor_total for item in itens), Decimal("0.00"))
        valor_recebido = serializer.validated_data.get("valor_recebido")
        troco = Decimal("0.00")

        if serializer.validated_data["forma_pagamento"] == VendaCaixa.FormaPagamento.DINHEIRO:
            if valor_recebido < valor_total:
                return Response(
                    {"detail": "O valor recebido nao pode ser menor que o total da comanda."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            troco = valor_recebido - valor_total
        else:
            valor_recebido = None

        try:
            with transaction.atomic():
                venda = VendaCaixa.objects.create(
                    sessao_caixa=sessao,
                    comanda=comanda,
                    codigo=generate_venda_caixa_codigo(sessao),
                    forma_pagamento=serializer.validated_data["forma_pagamento"],
                    valor_total=valor_total,
                    valor_recebido=valor_recebido,
                    troco=troco,
                    observacao=serializer.validated_data.get("observacao", ""),
                )
                ItemVendaCaixa.objects.bulk_create(
                    [
                        ItemVendaCaixa(
                            venda=venda,
                            produto=item.produto,
                            quantidade=item.quantidade,
                            preco_unitario=item.preco_unitario,
                        )
                        for item in itens
                    ]
                )
                for item in itens:
                    if item.produto.controla_estoque:
                        apply_stock_movement(
                            item.produto,
                            MovimentacaoEstoque.Tipo.VENDA,
                            Decimal(item.quantidade),
                            f"Baixa automatica da venda {venda.codigo}",
                        )
                comanda.status = Comanda.Status.ENCERRADA
                comanda.encerrada_em = timezone.now()
                comanda.save(update_fields=["status", "encerrada_em"])
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = ComandaDetailSerializer(comanda_detail_queryset().get(pk=comanda.pk))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ItemComandaViewSet(viewsets.ModelViewSet):
    queryset = ItemComanda.objects.select_related("comanda", "produto").all()
    serializer_class = ItemComandaSerializer

    @action(detail=True, methods=["post"], url_path="incrementar")
    def incrementar(self, request, pk=None):
        item = self.get_object()
        if item.comanda.status != Comanda.Status.ABERTA:
            return Response(
                {"detail": "Nao e possivel alterar itens de uma comanda encerrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantidade += 1
        item.save(update_fields=["quantidade"])
        return Response(ItemComandaSerializer(item).data)

    @action(detail=True, methods=["post"], url_path="decrementar")
    def decrementar(self, request, pk=None):
        item = self.get_object()
        if item.comanda.status != Comanda.Status.ABERTA:
            return Response(
                {"detail": "Nao e possivel alterar itens de uma comanda encerrada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if item.quantidade <= 1:
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        item.quantidade -= 1
        item.save(update_fields=["quantidade"])
        return Response(ItemComandaSerializer(item).data)


class DashboardSummaryView(APIView):
    def get(self, request):
        total_expression = ExpressionWrapper(
            F("quantidade") * F("preco_unitario"),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )

        sales_by_day = (
            ItemComanda.objects.annotate(dia=TruncDate("criado_em"))
            .values("dia")
            .annotate(total=Sum(total_expression))
            .order_by("dia")
        )

        total_vendas = (
            ItemComanda.objects.aggregate(total=Sum(total_expression))["total"] or 0
        )

        return Response(
            {
                "totais": {
                    "categorias_produto": CategoriaProduto.objects.count(),
                    "produtos": Produto.objects.count(),
                    "insumos": Insumo.objects.count(),
                    "comandas_abertas": Comanda.objects.filter(
                        status=Comanda.Status.ABERTA
                    ).count(),
                    "itens_comanda": ItemComanda.objects.count(),
                    "vendas": total_vendas,
                },
                "vendas_por_dia": [
                    {
                        "dia": item["dia"].isoformat(),
                        "total": item["total"],
                    }
                    for item in sales_by_day
                    if item["dia"] is not None
                ],
            }
        )


class FinanceSummaryView(APIView):
    def get(self, request):
        vendas = apply_date_filters(VendaCaixa.objects.all(), "criada_em", request)
        movimentacoes = apply_date_filters(
            MovimentacaoCaixa.objects.all(), "criado_em", request
        )
        sessoes_fechadas = apply_date_filters(
            SessaoCaixa.objects.filter(status=SessaoCaixa.Status.FECHADO),
            "fechado_em",
            request,
        )

        total_vendido = sum((venda.valor_total for venda in vendas), Decimal("0.00"))
        total_dinheiro = sum(
            (
                venda.valor_total
                for venda in vendas
                if venda.forma_pagamento == VendaCaixa.FormaPagamento.DINHEIRO
            ),
            Decimal("0.00"),
        )
        total_pix = sum(
            (
                venda.valor_total
                for venda in vendas
                if venda.forma_pagamento == VendaCaixa.FormaPagamento.PIX
            ),
            Decimal("0.00"),
        )
        total_debito = sum(
            (
                venda.valor_total
                for venda in vendas
                if venda.forma_pagamento == VendaCaixa.FormaPagamento.DEBITO
            ),
            Decimal("0.00"),
        )
        total_credito = sum(
            (
                venda.valor_total
                for venda in vendas
                if venda.forma_pagamento == VendaCaixa.FormaPagamento.CREDITO
            ),
            Decimal("0.00"),
        )
        total_sangrias = sum(
            (
                movimento.valor
                for movimento in movimentacoes
                if movimento.tipo == MovimentacaoCaixa.Tipo.SANGRIA
            ),
            Decimal("0.00"),
        )
        total_suprimentos = sum(
            (
                movimento.valor
                for movimento in movimentacoes
                if movimento.tipo == MovimentacaoCaixa.Tipo.SUPRIMENTO
            ),
            Decimal("0.00"),
        )
        total_diferencas = sum(
            (sessao.diferenca_total or Decimal("0.00") for sessao in sessoes_fechadas),
            Decimal("0.00"),
        )
        vendas_count = vendas.count()
        ticket_medio = (
            (total_vendido / vendas_count) if vendas_count > 0 else Decimal("0.00")
        )

        return Response(
            {
                "resumo": {
                    "total_vendido": total_vendido,
                    "total_dinheiro": total_dinheiro,
                    "total_pix": total_pix,
                    "total_debito": total_debito,
                    "total_credito": total_credito,
                    "total_cartao": total_debito + total_credito,
                    "total_sangrias": total_sangrias,
                    "total_suprimentos": total_suprimentos,
                    "ticket_medio": ticket_medio,
                    "vendas_count": vendas_count,
                    "fechamentos_count": sessoes_fechadas.count(),
                    "total_diferencas": total_diferencas,
                }
            }
        )


class FinanceOperationsView(APIView):
    def get(self, request):
        vendas = apply_date_filters(
            VendaCaixa.objects.select_related("comanda"),
            "criada_em",
            request,
        )
        movimentacoes = apply_date_filters(
            MovimentacaoCaixa.objects.select_related("sessao_caixa"),
            "criado_em",
            request,
        )

        operacoes = []

        for venda in vendas:
            if venda.comanda_id and venda.comanda is not None:
                descricao = f"Pagamento da comanda: {venda.comanda.nome_cliente}"
                identificacao = venda.get_forma_pagamento_display()
            else:
                descricao = "Venda no caixa"
                identificacao = venda.get_forma_pagamento_display()

            operacoes.append(
                {
                    "tipo": "venda",
                    "codigo": venda.codigo,
                    "descricao": descricao,
                    "identificacao": identificacao,
                    "valor": venda.valor_total,
                    "criado_em": venda.criada_em,
                }
            )

        for movimentacao in movimentacoes:
            operacoes.append(
                {
                    "tipo": "movimentacao",
                    "codigo": movimentacao.codigo,
                    "descricao": movimentacao.descricao,
                    "identificacao": movimentacao.get_tipo_display(),
                    "valor": movimentacao.valor,
                    "criado_em": movimentacao.criado_em,
                }
            )

        operacoes.sort(key=lambda item: item["criado_em"], reverse=True)

        return Response({"operacoes": operacoes})


class FinanceClosingMetricsView(APIView):
    def get(self, request):
        sessoes = apply_date_filters(
            SessaoCaixa.objects.filter(status=SessaoCaixa.Status.FECHADO).order_by("-fechado_em"),
            "fechado_em",
            request,
        )[:10]

        fechamentos = []
        for sessao in sessoes:
            diferenca_total = sessao.diferenca_total or Decimal("0.00")
            esperado_total = (
                (sessao.valor_esperado_dinheiro or Decimal("0.00"))
                + (sessao.valor_esperado_pix or Decimal("0.00"))
                + (sessao.valor_esperado_cartao or Decimal("0.00"))
            )
            conferido_total = (
                (sessao.fechamento_dinheiro_informado or Decimal("0.00"))
                + (sessao.fechamento_pix_informado or Decimal("0.00"))
                + (sessao.fechamento_debito_informado or Decimal("0.00"))
                + (sessao.fechamento_credito_informado or Decimal("0.00"))
            )

            if diferenca_total > 0:
                status_fechamento = "sobra"
                status_fechamento_label = "Sobra"
            elif diferenca_total < 0:
                status_fechamento = "falta"
                status_fechamento_label = "Falta"
            else:
                status_fechamento = "conferido"
                status_fechamento_label = "Conferido"

            fechamentos.append(
                {
                    "id": sessao.id,
                    "operador_nome": sessao.operador_nome,
                    "aberto_em": sessao.aberto_em,
                    "fechado_em": sessao.fechado_em,
                    "fundo_troco_inicial": sessao.fundo_troco_inicial,
                    "esperado_total": esperado_total,
                    "conferido_total": conferido_total,
                    "diferenca_total": diferenca_total,
                    "diferenca_dinheiro": sessao.diferenca_dinheiro or Decimal("0.00"),
                    "diferenca_pix": sessao.diferenca_pix or Decimal("0.00"),
                    "diferenca_cartao": sessao.diferenca_cartao or Decimal("0.00"),
                    "diferenca_debito": sessao.diferenca_debito or Decimal("0.00"),
                    "diferenca_credito": sessao.diferenca_credito or Decimal("0.00"),
                    "status_fechamento": status_fechamento,
                    "status_fechamento_label": status_fechamento_label,
                }
            )

        return Response({"fechamentos": fechamentos})


class FinanceChartsView(APIView):
    def get(self, request):
        vendas = apply_date_filters(VendaCaixa.objects.all(), "criada_em", request)

        vendas_por_dia = (
            vendas.annotate(dia=TruncDate("criada_em"))
            .values("dia")
            .annotate(
                total=Coalesce(
                    Sum("valor_total"),
                    0,
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                ),
                quantidade=Count("id"),
            )
            .order_by("dia")
        )

        total_geral = sum((venda.valor_total for venda in vendas), Decimal("0.00"))

        distribuicao_pagamentos = []
        for forma_pagamento, forma_label in [
            (VendaCaixa.FormaPagamento.DINHEIRO, "Dinheiro"),
            (VendaCaixa.FormaPagamento.PIX, "Pix"),
            (VendaCaixa.FormaPagamento.DEBITO, "Débito"),
            (VendaCaixa.FormaPagamento.CREDITO, "Crédito"),
        ]:
            total_forma = sum(
                (
                    venda.valor_total
                    for venda in vendas
                    if venda.forma_pagamento == forma_pagamento
                ),
                Decimal("0.00"),
            )
            percentual = (
                (total_forma / total_geral * Decimal("100.00"))
                if total_geral > 0
                else Decimal("0.00")
            )
            distribuicao_pagamentos.append(
                {
                    "forma_pagamento": forma_pagamento,
                    "forma_pagamento_label": forma_label,
                    "total": total_forma,
                    "percentual": percentual.quantize(Decimal("0.01")),
                }
            )

        return Response(
            {
                "vendas_por_dia": [
                    {
                        "dia": item["dia"].isoformat(),
                        "total": item["total"],
                        "quantidade": item["quantidade"],
                    }
                    for item in vendas_por_dia
                    if item["dia"] is not None
                ],
                "distribuicao_pagamentos": distribuicao_pagamentos,
            }
        )


class CashOverviewView(APIView):
    def get(self, request):
        sessao = get_open_cash_session()

        if sessao is None:
            return Response(
                {
                    "sessao_atual": None,
                    "movimentacoes": [],
                    "vendas": [],
                    "resumo": {
                        "fundo_inicial": "0.00",
                        "saldo_em_caixa": "0.00",
                        "movimentacoes_count": 0,
                        "vendas_count": 0,
                        "esperado_dinheiro": "0.00",
                        "esperado_pix": "0.00",
                        "esperado_cartao": "0.00",
                        "esperado_debito": "0.00",
                        "esperado_credito": "0.00",
                    },
                }
            )

        overview = calculate_cash_overview_summary(sessao)

        return Response(
            {
                "sessao_atual": SessaoCaixaSerializer(sessao).data,
                "movimentacoes": MovimentacaoCaixaSerializer(
                    overview["movimentacoes"], many=True
                ).data,
                "vendas": VendaCaixaSerializer(overview["vendas"], many=True).data,
                "resumo": overview["resumo"],
            }
        )


class CashOpenView(APIView):
    def post(self, request):
        if get_open_cash_session() is not None:
            return Response(
                {"detail": "Ja existe uma sessao de caixa aberta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SessaoCaixaAberturaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            sessao = SessaoCaixa.objects.create(
                operador_nome=serializer.validated_data.get("operador_nome", "Operador do Caixa"),
                fundo_troco_inicial=serializer.validated_data["fundo_troco_inicial"],
                status=SessaoCaixa.Status.ABERTO,
            )
            MovimentacaoCaixa.objects.create(
                sessao_caixa=sessao,
                codigo=generate_movimentacao_codigo(sessao),
                tipo=MovimentacaoCaixa.Tipo.ABERTURA,
                descricao="Abertura de caixa",
                valor=sessao.fundo_troco_inicial,
            )

        return Response(CashOverviewView().get(request).data, status=status.HTTP_201_CREATED)


class CashCloseView(APIView):
    def post(self, request):
        sessao = get_open_cash_session()
        if sessao is None:
            return Response(
                {"detail": "Nao existe uma sessao de caixa aberta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SessaoCaixaFechamentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        overview = calculate_cash_overview_summary(sessao)
        esperado_dinheiro = overview["resumo"]["esperado_dinheiro"]
        esperado_pix = overview["resumo"]["esperado_pix"]
        esperado_debito = overview["resumo"]["esperado_debito"]
        esperado_credito = overview["resumo"]["esperado_credito"]
        esperado_cartao = overview["resumo"]["esperado_cartao"]
        dinheiro_contado = serializer.validated_data["dinheiro_contado"]
        pix_conferido = serializer.validated_data["pix_conferido"]
        debito_conferido = serializer.validated_data["debito_conferido"]
        credito_conferido = serializer.validated_data["credito_conferido"]
        cartao_conferido = debito_conferido + credito_conferido
        diferenca_dinheiro = dinheiro_contado - esperado_dinheiro
        diferenca_pix = pix_conferido - esperado_pix
        diferenca_debito = debito_conferido - esperado_debito
        diferenca_credito = credito_conferido - esperado_credito
        diferenca_cartao = cartao_conferido - esperado_cartao
        diferenca_total = (
            diferenca_dinheiro
            + diferenca_pix
            + diferenca_debito
            + diferenca_credito
        )

        with transaction.atomic():
            MovimentacaoCaixa.objects.create(
                sessao_caixa=sessao,
                codigo=generate_movimentacao_codigo(sessao),
                tipo=MovimentacaoCaixa.Tipo.FECHAMENTO,
                descricao="Fechamento de caixa",
                valor=0,
            )
            sessao.status = SessaoCaixa.Status.FECHADO
            sessao.fechado_em = timezone.now()
            sessao.fechamento_dinheiro_informado = dinheiro_contado
            sessao.fechamento_pix_informado = pix_conferido
            sessao.fechamento_cartao_informado = cartao_conferido
            sessao.fechamento_debito_informado = debito_conferido
            sessao.fechamento_credito_informado = credito_conferido
            sessao.valor_esperado_dinheiro = esperado_dinheiro
            sessao.valor_esperado_pix = esperado_pix
            sessao.valor_esperado_cartao = esperado_cartao
            sessao.valor_esperado_debito = esperado_debito
            sessao.valor_esperado_credito = esperado_credito
            sessao.diferenca_dinheiro = diferenca_dinheiro
            sessao.diferenca_pix = diferenca_pix
            sessao.diferenca_cartao = diferenca_cartao
            sessao.diferenca_debito = diferenca_debito
            sessao.diferenca_credito = diferenca_credito
            sessao.diferenca_total = diferenca_total
            sessao.save(
                update_fields=[
                    "status",
                    "fechado_em",
                    "fechamento_dinheiro_informado",
                    "fechamento_pix_informado",
                    "fechamento_cartao_informado",
                    "fechamento_debito_informado",
                    "fechamento_credito_informado",
                    "valor_esperado_dinheiro",
                    "valor_esperado_pix",
                    "valor_esperado_cartao",
                    "valor_esperado_debito",
                    "valor_esperado_credito",
                    "diferenca_dinheiro",
                    "diferenca_pix",
                    "diferenca_cartao",
                    "diferenca_debito",
                    "diferenca_credito",
                    "diferenca_total",
                ]
            )

        return Response(
            {
                "sessao_atual": None,
                "movimentacoes": [],
                "vendas": [],
                "resumo": {
                    "fundo_inicial": "0.00",
                    "saldo_em_caixa": "0.00",
                    "movimentacoes_count": 0,
                    "vendas_count": 0,
                    "esperado_dinheiro": "0.00",
                    "esperado_pix": "0.00",
                    "esperado_cartao": "0.00",
                    "esperado_debito": "0.00",
                    "esperado_credito": "0.00",
                },
            }
        )


class CashMovementCreateView(APIView):
    def post(self, request):
        sessao = get_open_cash_session()
        if sessao is None:
            return Response(
                {"detail": "Abra o caixa antes de registrar movimentacoes."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MovimentacaoCaixaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        movimentacao = MovimentacaoCaixa.objects.create(
            sessao_caixa=sessao,
            codigo=generate_movimentacao_codigo(sessao),
            tipo=serializer.validated_data["tipo"],
            descricao=serializer.validated_data.get("descricao", ""),
            valor=serializer.validated_data["valor"],
        )

        return Response(
            MovimentacaoCaixaSerializer(movimentacao).data,
            status=status.HTTP_201_CREATED,
        )


class StockMovementCreateView(APIView):
    def post(self, request):
        serializer = MovimentacaoEstoqueCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        produto = Produto.objects.get(pk=serializer.validated_data["produto_id"])
        quantidade = serializer.validated_data["quantidade"]
        tipo = serializer.validated_data["tipo"]
        observacao = serializer.validated_data.get("observacao", "")

        try:
            movimentacao = apply_stock_movement(
                produto,
                tipo,
                quantidade,
                observacao,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            MovimentacaoEstoqueSerializer(movimentacao).data,
            status=status.HTTP_201_CREATED,
        )


class CashSaleCreateView(APIView):
    def post(self, request):
        sessao = get_open_cash_session()
        if sessao is None:
            return Response(
                {"detail": "Abra o caixa antes de registrar vendas."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VendaCaixaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        itens_payload = serializer.validated_data["itens"]
        product_ids = [item["produto_id"] for item in itens_payload]
        produtos = {
            produto.id: produto
            for produto in Produto.objects.filter(
                id__in=product_ids,
                ativo=True,
            )
        }

        if len(produtos) != len(set(product_ids)):
            return Response(
                {"detail": "Um ou mais produtos informados nao estao mais disponiveis para venda."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valor_total = sum(
            produtos[item["produto_id"]].preco_venda * item["quantidade"]
            for item in itens_payload
        )

        valor_recebido = serializer.validated_data.get("valor_recebido")
        troco = 0

        if serializer.validated_data["forma_pagamento"] == VendaCaixa.FormaPagamento.DINHEIRO:
            if valor_recebido < valor_total:
                return Response(
                    {"detail": "O valor recebido nao pode ser menor que o total da venda."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            troco = valor_recebido - valor_total
        else:
            valor_recebido = None

        try:
            with transaction.atomic():
                venda = VendaCaixa.objects.create(
                    sessao_caixa=sessao,
                    codigo=generate_venda_caixa_codigo(sessao),
                    forma_pagamento=serializer.validated_data["forma_pagamento"],
                    valor_total=valor_total,
                    valor_recebido=valor_recebido,
                    troco=troco,
                    observacao=serializer.validated_data.get("observacao", ""),
                )

                ItemVendaCaixa.objects.bulk_create(
                    [
                        ItemVendaCaixa(
                            venda=venda,
                            produto=produtos[item["produto_id"]],
                            quantidade=item["quantidade"],
                            preco_unitario=produtos[item["produto_id"]].preco_venda,
                        )
                        for item in itens_payload
                    ]
                )
                for item in itens_payload:
                    produto = produtos[item["produto_id"]]
                    if produto.controla_estoque:
                        apply_stock_movement(
                            produto,
                            MovimentacaoEstoque.Tipo.VENDA,
                            Decimal(item["quantidade"]),
                            f"Baixa automatica da venda {venda.codigo}",
                        )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        venda = VendaCaixa.objects.prefetch_related(
            Prefetch(
                "itens",
                queryset=ItemVendaCaixa.objects.select_related("produto").all(),
            )
        ).get(pk=venda.pk)

        return Response(VendaCaixaSerializer(venda).data, status=status.HTTP_201_CREATED)


class CashSaleHistoryView(APIView):
    def get(self, request):
        queryset = cash_sale_detail_queryset()
        codigo = request.query_params.get("codigo", "").strip()
        forma_pagamento = request.query_params.get("forma_pagamento", "").strip()
        queryset = apply_date_filters(queryset, "criada_em", request)

        if codigo:
            queryset = queryset.filter(codigo__icontains=codigo)

        if forma_pagamento in {
            VendaCaixa.FormaPagamento.DINHEIRO,
            VendaCaixa.FormaPagamento.PIX,
            VendaCaixa.FormaPagamento.DEBITO,
            VendaCaixa.FormaPagamento.CREDITO,
        }:
            queryset = queryset.filter(forma_pagamento=forma_pagamento)

        serializer = VendaCaixaSerializer(queryset, many=True)
        return Response(serializer.data)


class CashSaleDetailView(APIView):
    def get(self, request, pk):
        venda = cash_sale_detail_queryset().get(pk=pk)
        serializer = VendaCaixaSerializer(venda)
        return Response(serializer.data)
