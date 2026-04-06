const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export type TabStatus = "open" | "closed";
export type CashSessionStatus = "open" | "closed";

export type TabSummary = {
    id: string;
    customerName: string;
    elapsedTime: string;
    totalLabel: string;
    totalValue: string;
    totalValueNumber: number;
    status: TabStatus;
    tabLabel: string;
    itemsCount: number;
    openedAt: string;
    closedAt: string | null;
    isPaid: boolean;
    saleCode: string | null;
    saleId: number | null;
};

export type TabItem = {
    id: number;
    productId: number;
    quantity: number;
    quantityLabel: string;
    title: string;
    timeLabel: string;
    value: string;
    valueNumber: number;
    createdAt: string;
};

export type TabDetail = TabSummary & {
    items: TabItem[];
};

export type Product = {
    id: number;
    name: string;
    description: string;
    price: string;
    priceNumber: number;
    categoryName: string;
    categorySlug: string;
    stockType: string;
};

export type CashSession = {
    id: number | null;
    status: CashSessionStatus;
    openingFund: string;
    openingFundNumber: number;
    openedAt: string | null;
    closedAt: string | null;
    openedBy: string;
    closingCashCounted: string | null;
    closingPixCounted: string | null;
    closingCardCounted: string | null;
    expectedCashAtClose: string | null;
    expectedPixAtClose: string | null;
    expectedCardAtClose: string | null;
    cashDifference: string | null;
    pixDifference: string | null;
    cardDifference: string | null;
    totalDifference: string | null;
};

export type CashMovementType = "opening" | "withdrawal" | "supply" | "closing";
export type CashSalePaymentMethod = "cash" | "pix" | "card";

export type CashMovement = {
    id: number;
    code: string;
    type: CashMovementType;
    typeLabel: string;
    description: string;
    value: string;
    valueNumber: number;
    createdAt: string;
    timeLabel: string;
};

export type CashSaleItem = {
    id: number;
    productId: number;
    title: string;
    quantity: number;
    unitPrice: string;
    total: string;
};

export type CashSale = {
    id: number;
    code: string;
    paymentMethod: CashSalePaymentMethod;
    paymentMethodLabel: string;
    status: string;
    statusLabel: string;
    total: string;
    totalNumber: number;
    receivedAmount: string | null;
    receivedAmountNumber: number | null;
    changeAmount: string;
    changeAmountNumber: number;
    createdAt: string;
    timeLabel: string;
    observation: string;
    items: CashSaleItem[];
};

export type CashOverview = {
    session: CashSession;
    movements: CashMovement[];
    sales: CashSale[];
    summary: {
        openingFund: string;
        openingFundNumber: number;
        balance: string;
        balanceNumber: number;
        movementsCount: number;
        salesCount: number;
        expectedCash: string;
        expectedCashNumber: number;
        expectedPix: string;
        expectedPixNumber: number;
        expectedCard: string;
        expectedCardNumber: number;
    };
};

export type FinanceSummary = {
    totalSold: string;
    totalSoldNumber: number;
    totalCash: string;
    totalCashNumber: number;
    totalPix: string;
    totalPixNumber: number;
    totalCard: string;
    totalCardNumber: number;
    totalWithdrawals: string;
    totalWithdrawalsNumber: number;
    totalSupplies: string;
    totalSuppliesNumber: number;
    averageTicket: string;
    averageTicketNumber: number;
    salesCount: number;
    closedSessionsCount: number;
    totalDifferences: string;
    totalDifferencesNumber: number;
};

export type FinanceOperationType = "sale" | "movement";

export type FinanceOperation = {
    id: string;
    type: FinanceOperationType;
    typeLabel: string;
    code: string;
    description: string;
    identification: string;
    value: string;
    valueNumber: number;
    createdAt: string;
    dateLabel: string;
    timeLabel: string;
};

export type FinanceClosingStatus = "conferido" | "sobra" | "falta";

export type FinanceClosingSession = {
    id: number;
    operatorName: string;
    openedAt: string;
    closedAt: string;
    openingFund: string;
    openingFundNumber: number;
    expectedTotal: string;
    expectedTotalNumber: number;
    checkedTotal: string;
    checkedTotalNumber: number;
    totalDifference: string;
    totalDifferenceNumber: number;
    cashDifference: string;
    cashDifferenceNumber: number;
    pixDifference: string;
    pixDifferenceNumber: number;
    cardDifference: string;
    cardDifferenceNumber: number;
    status: FinanceClosingStatus;
    statusLabel: string;
    openedTimeLabel: string;
    closedTimeLabel: string;
};

export type FinanceChartSalesPoint = {
    date: string;
    dateLabel: string;
    total: number;
    totalLabel: string;
    salesCount: number;
};

export type FinancePaymentDistributionPoint = {
    paymentMethod: "cash" | "pix" | "card";
    paymentMethodLabel: string;
    total: number;
    totalLabel: string;
    percentage: number;
};

type ApiTabStatus = "aberta" | "encerrada";

type ApiTabSummary = {
    id: number;
    codigo: string;
    nome_cliente: string;
    status: ApiTabStatus;
    aberta_em: string;
    encerrada_em: string | null;
    total_parcial: string;
    itens_count: number;
    paga: boolean;
    venda_codigo: string | null;
    venda_caixa_id: number | null;
};

type ApiTabDetail = ApiTabSummary & {
    itens: ApiTabItem[];
};

type ApiTabItem = {
    id: number;
    comanda: number;
    produto: number;
    produto_nome: string;
    quantidade: number;
    preco_unitario: string;
    total: string;
    criado_em: string;
};

type ApiProduct = {
    id: number;
    nome: string;
    descricao: string;
    preco_venda: string;
    categoria_nome: string | null;
    categoria_slug: string | null;
    tipo_estoque: string;
    ativo: boolean;
};

type ApiCashSessionStatus = "aberto" | "fechado";
type ApiCashMovementType = "abertura" | "sangria" | "suprimento" | "fechamento";

type ApiCashSession = {
    id: number;
    operador_nome: string;
    status: ApiCashSessionStatus;
    fundo_troco_inicial: string;
    aberto_em: string;
    fechado_em: string | null;
    fechamento_dinheiro_informado: string | null;
    fechamento_pix_informado: string | null;
    fechamento_cartao_informado: string | null;
    valor_esperado_dinheiro: string | null;
    valor_esperado_pix: string | null;
    valor_esperado_cartao: string | null;
    diferenca_dinheiro: string | null;
    diferenca_pix: string | null;
    diferenca_cartao: string | null;
    diferenca_total: string | null;
};

type ApiCashMovement = {
    id: number;
    codigo: string;
    tipo: ApiCashMovementType;
    tipo_label: string;
    descricao: string;
    valor: string;
    criado_em: string;
};

type ApiCashOverview = {
    sessao_atual: ApiCashSession | null;
    movimentacoes: ApiCashMovement[];
    vendas: ApiCashSale[];
    resumo: {
        fundo_inicial: string;
        saldo_em_caixa: string;
        movimentacoes_count: number;
        vendas_count: number;
        esperado_dinheiro: string;
        esperado_pix: string;
        esperado_cartao: string;
    };
};

type ApiCashSaleItem = {
    id: number;
    produto: number;
    produto_nome: string;
    quantidade: number;
    preco_unitario: string;
    total: string;
};

type ApiCashSale = {
    id: number;
    codigo: string;
    forma_pagamento: "dinheiro" | "pix" | "cartao";
    forma_pagamento_label: string;
    status: string;
    status_label: string;
    valor_total: string;
    valor_recebido: string | null;
    troco: string;
    observacao: string;
    criada_em: string;
    itens: ApiCashSaleItem[];
};

type ApiFinanceSummary = {
    resumo: {
        total_vendido: string;
        total_dinheiro: string;
        total_pix: string;
        total_cartao: string;
        total_sangrias: string;
        total_suprimentos: string;
        ticket_medio: string;
        vendas_count: number;
        fechamentos_count: number;
        total_diferencas: string;
    };
};

type ApiFinanceOperation = {
    tipo: "venda" | "movimentacao";
    codigo: string;
    descricao: string;
    identificacao: string;
    valor: string;
    criado_em: string;
};

type ApiFinanceOperations = {
    operacoes: ApiFinanceOperation[];
};

type ApiFinanceClosingSession = {
    id: number;
    operador_nome: string;
    aberto_em: string;
    fechado_em: string;
    fundo_troco_inicial: string;
    esperado_total: string;
    conferido_total: string;
    diferenca_total: string;
    diferenca_dinheiro: string;
    diferenca_pix: string;
    diferenca_cartao: string;
    status_fechamento: FinanceClosingStatus;
    status_fechamento_label: string;
};

type ApiFinanceClosingMetrics = {
    fechamentos: ApiFinanceClosingSession[];
};

type ApiFinanceChartSalesPoint = {
    dia: string;
    total: string;
    quantidade: number;
};

type ApiFinancePaymentDistributionPoint = {
    forma_pagamento: "dinheiro" | "pix" | "cartao";
    forma_pagamento_label: string;
    total: string;
    percentual: string;
};

type ApiFinanceCharts = {
    vendas_por_dia: ApiFinanceChartSalesPoint[];
    distribuicao_pagamentos: ApiFinancePaymentDistributionPoint[];
};

function buildUrl(path: string) {
    return `${API_BASE_URL}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(buildUrl(path), {
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
        ...init,
    });

    if (!response.ok) {
        let errorMessage = "Nao foi possivel concluir a requisicao.";

        try {
            const errorBody = await response.json();
            if (typeof errorBody.detail === "string") {
                errorMessage = errorBody.detail;
            } else if (typeof errorBody.nome_cliente?.[0] === "string") {
                errorMessage = errorBody.nome_cliente[0];
            } else if (typeof errorBody.produto_id?.[0] === "string") {
                errorMessage = errorBody.produto_id[0];
            } else if (typeof errorBody.fundo_troco_inicial?.[0] === "string") {
                errorMessage = errorBody.fundo_troco_inicial[0];
            } else if (typeof errorBody.valor?.[0] === "string") {
                errorMessage = errorBody.valor[0];
            } else if (typeof errorBody.dinheiro_contado?.[0] === "string") {
                errorMessage = errorBody.dinheiro_contado[0];
            } else if (typeof errorBody.pix_conferido?.[0] === "string") {
                errorMessage = errorBody.pix_conferido[0];
            } else if (typeof errorBody.cartao_conferido?.[0] === "string") {
                errorMessage = errorBody.cartao_conferido[0];
            } else if (typeof errorBody.valor_recebido?.[0] === "string") {
                errorMessage = errorBody.valor_recebido[0];
            }
        } catch {
            errorMessage = `Erro HTTP ${response.status}`;
        }

        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json() as Promise<T>;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function parseCurrency(value: string | number) {
    return typeof value === "number" ? value : Number.parseFloat(value);
}

function formatMinutesDistance(isoDate: string) {
    const start = new Date(isoDate);
    const diffMs = Date.now() - start.getTime();
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));

    if (totalMinutes < 60) {
        return `Ha ${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
        return `Ha ${hours}h`;
    }

    return `Ha ${hours}h ${minutes} min`;
}

function formatClosedAt(isoDate: string | null) {
    if (!isoDate) {
        return "Encerrada";
    }

    const date = new Date(isoDate);
    return `Encerrada as ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}

function mapStatus(status: ApiTabStatus): TabStatus {
    return status === "encerrada" ? "closed" : "open";
}

function mapTabSummary(tab: ApiTabSummary): TabSummary {
    const totalValueNumber = parseCurrency(tab.total_parcial);
    const status = mapStatus(tab.status);

    return {
        id: String(tab.id),
        customerName: tab.nome_cliente || "Sem nome",
        elapsedTime:
            status === "closed"
                ? formatClosedAt(tab.encerrada_em)
                : formatMinutesDistance(tab.aberta_em),
        totalLabel: status === "closed" ? "Final" : "Total parcial",
        totalValue: formatCurrency(totalValueNumber),
        totalValueNumber,
        status,
        tabLabel: tab.codigo.replace("CMD-", "Comanda #"),
        itemsCount: tab.itens_count,
        openedAt: tab.aberta_em,
        closedAt: tab.encerrada_em,
        isPaid: tab.paga,
        saleCode: tab.venda_codigo,
        saleId: tab.venda_caixa_id,
    };
}

function mapTabItem(item: ApiTabItem): TabItem {
    const valueNumber = parseCurrency(item.total);

    return {
        id: item.id,
        productId: item.produto,
        quantity: item.quantidade,
        quantityLabel: String(item.quantidade),
        title: item.produto_nome,
        timeLabel: formatMinutesDistance(item.criado_em),
        value: formatCurrency(valueNumber),
        valueNumber,
        createdAt: item.criado_em,
    };
}

function mapTabDetail(tab: ApiTabDetail): TabDetail {
    return {
        ...mapTabSummary(tab),
        items: tab.itens.map(mapTabItem),
    };
}

function mapCashSessionStatus(status: ApiCashSessionStatus): CashSessionStatus {
    return status === "aberto" ? "open" : "closed";
}

function mapCashMovementType(type: ApiCashMovementType): CashMovementType {
    switch (type) {
        case "abertura":
            return "opening";
        case "sangria":
            return "withdrawal";
        case "suprimento":
            return "supply";
        default:
            return "closing";
    }
}

function mapCashSession(session: ApiCashSession | null): CashSession {
    if (!session) {
        return {
            id: null,
            status: "closed",
            openingFund: formatCurrency(0),
            openingFundNumber: 0,
        openedAt: null,
        closedAt: null,
        openedBy: "Ricardo Silva",
        closingCashCounted: null,
        closingPixCounted: null,
        closingCardCounted: null,
        expectedCashAtClose: null,
        expectedPixAtClose: null,
        expectedCardAtClose: null,
        cashDifference: null,
        pixDifference: null,
        cardDifference: null,
        totalDifference: null,
    };
    }

    const openingFundNumber = parseCurrency(session.fundo_troco_inicial);

    return {
        id: session.id,
        status: mapCashSessionStatus(session.status),
        openingFund: formatCurrency(openingFundNumber),
        openingFundNumber,
        openedAt: session.aberto_em,
        closedAt: session.fechado_em,
        openedBy: session.operador_nome,
        closingCashCounted:
            session.fechamento_dinheiro_informado === null
                ? null
                : formatCurrency(parseCurrency(session.fechamento_dinheiro_informado)),
        closingPixCounted:
            session.fechamento_pix_informado === null
                ? null
                : formatCurrency(parseCurrency(session.fechamento_pix_informado)),
        closingCardCounted:
            session.fechamento_cartao_informado === null
                ? null
                : formatCurrency(parseCurrency(session.fechamento_cartao_informado)),
        expectedCashAtClose:
            session.valor_esperado_dinheiro === null
                ? null
                : formatCurrency(parseCurrency(session.valor_esperado_dinheiro)),
        expectedPixAtClose:
            session.valor_esperado_pix === null
                ? null
                : formatCurrency(parseCurrency(session.valor_esperado_pix)),
        expectedCardAtClose:
            session.valor_esperado_cartao === null
                ? null
                : formatCurrency(parseCurrency(session.valor_esperado_cartao)),
        cashDifference:
            session.diferenca_dinheiro === null
                ? null
                : formatCurrency(parseCurrency(session.diferenca_dinheiro)),
        pixDifference:
            session.diferenca_pix === null
                ? null
                : formatCurrency(parseCurrency(session.diferenca_pix)),
        cardDifference:
            session.diferenca_cartao === null
                ? null
                : formatCurrency(parseCurrency(session.diferenca_cartao)),
        totalDifference:
            session.diferenca_total === null
                ? null
                : formatCurrency(parseCurrency(session.diferenca_total)),
    };
}

function mapCashMovement(movement: ApiCashMovement): CashMovement {
    const valueNumber = parseCurrency(movement.valor);

    return {
        id: movement.id,
        code: movement.codigo,
        type: mapCashMovementType(movement.tipo),
        typeLabel: movement.tipo_label,
        description: movement.descricao,
        value: formatCurrency(valueNumber),
        valueNumber,
        createdAt: movement.criado_em,
        timeLabel: new Date(movement.criado_em).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    };
}

function mapCashSalePaymentMethod(method: ApiCashSale["forma_pagamento"]): CashSalePaymentMethod {
    switch (method) {
        case "dinheiro":
            return "cash";
        case "pix":
            return "pix";
        default:
            return "card";
    }
}

function mapCashSaleItem(item: ApiCashSaleItem): CashSaleItem {
    const unitPriceNumber = parseCurrency(item.preco_unitario);
    const totalNumber = parseCurrency(item.total);

    return {
        id: item.id,
        productId: item.produto,
        title: item.produto_nome,
        quantity: item.quantidade,
        unitPrice: formatCurrency(unitPriceNumber),
        total: formatCurrency(totalNumber),
    };
}

function mapCashSale(sale: ApiCashSale): CashSale {
    const totalNumber = parseCurrency(sale.valor_total);
    const receivedAmountNumber =
        sale.valor_recebido === null ? null : parseCurrency(sale.valor_recebido);
    const changeAmountNumber = parseCurrency(sale.troco);

    return {
        id: sale.id,
        code: sale.codigo,
        paymentMethod: mapCashSalePaymentMethod(sale.forma_pagamento),
        paymentMethodLabel: sale.forma_pagamento_label,
        status: sale.status,
        statusLabel: sale.status_label,
        total: formatCurrency(totalNumber),
        totalNumber,
        receivedAmount:
            receivedAmountNumber === null ? null : formatCurrency(receivedAmountNumber),
        receivedAmountNumber,
        changeAmount: formatCurrency(changeAmountNumber),
        changeAmountNumber,
        createdAt: sale.criada_em,
        timeLabel: new Date(sale.criada_em).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        }),
        observation: sale.observacao,
        items: sale.itens.map(mapCashSaleItem),
    };
}

function mapCashOverview(overview: ApiCashOverview): CashOverview {
    const openingFundNumber = parseCurrency(overview.resumo.fundo_inicial);
    const balanceNumber = parseCurrency(overview.resumo.saldo_em_caixa);
    const expectedCashNumber = parseCurrency(overview.resumo.esperado_dinheiro);
    const expectedPixNumber = parseCurrency(overview.resumo.esperado_pix);
    const expectedCardNumber = parseCurrency(overview.resumo.esperado_cartao);

    return {
        session: mapCashSession(overview.sessao_atual),
        movements: overview.movimentacoes.map(mapCashMovement),
        sales: overview.vendas.map(mapCashSale),
        summary: {
            openingFund: formatCurrency(openingFundNumber),
            openingFundNumber,
            balance: formatCurrency(balanceNumber),
            balanceNumber,
            movementsCount: overview.resumo.movimentacoes_count,
            salesCount: overview.resumo.vendas_count,
            expectedCash: formatCurrency(expectedCashNumber),
            expectedCashNumber,
            expectedPix: formatCurrency(expectedPixNumber),
            expectedPixNumber,
            expectedCard: formatCurrency(expectedCardNumber),
            expectedCardNumber,
        },
    };
}

function mapFinanceSummary(summary: ApiFinanceSummary): FinanceSummary {
    const totalSoldNumber = parseCurrency(summary.resumo.total_vendido);
    const totalCashNumber = parseCurrency(summary.resumo.total_dinheiro);
    const totalPixNumber = parseCurrency(summary.resumo.total_pix);
    const totalCardNumber = parseCurrency(summary.resumo.total_cartao);
    const totalWithdrawalsNumber = parseCurrency(summary.resumo.total_sangrias);
    const totalSuppliesNumber = parseCurrency(summary.resumo.total_suprimentos);
    const averageTicketNumber = parseCurrency(summary.resumo.ticket_medio);
    const totalDifferencesNumber = parseCurrency(summary.resumo.total_diferencas);

    return {
        totalSold: formatCurrency(totalSoldNumber),
        totalSoldNumber,
        totalCash: formatCurrency(totalCashNumber),
        totalCashNumber,
        totalPix: formatCurrency(totalPixNumber),
        totalPixNumber,
        totalCard: formatCurrency(totalCardNumber),
        totalCardNumber,
        totalWithdrawals: formatCurrency(totalWithdrawalsNumber),
        totalWithdrawalsNumber,
        totalSupplies: formatCurrency(totalSuppliesNumber),
        totalSuppliesNumber,
        averageTicket: formatCurrency(averageTicketNumber),
        averageTicketNumber,
        salesCount: summary.resumo.vendas_count,
        closedSessionsCount: summary.resumo.fechamentos_count,
        totalDifferences: formatCurrency(totalDifferencesNumber),
        totalDifferencesNumber,
    };
}

function mapFinanceOperation(operation: ApiFinanceOperation): FinanceOperation {
    const valueNumber = parseCurrency(operation.valor);
    const createdAt = new Date(operation.criado_em);

    return {
        id: `${operation.tipo}-${operation.codigo}`,
        type: operation.tipo === "venda" ? "sale" : "movement",
        typeLabel: operation.tipo === "venda" ? "Venda" : "Movimentação",
        code: operation.codigo,
        description: operation.descricao,
        identification: operation.identificacao,
        value: formatCurrency(valueNumber),
        valueNumber,
        createdAt: operation.criado_em,
        dateLabel: createdAt.toLocaleDateString("pt-BR"),
        timeLabel: createdAt.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    };
}

function mapFinanceClosingSession(session: ApiFinanceClosingSession): FinanceClosingSession {
    const openingFundNumber = parseCurrency(session.fundo_troco_inicial);
    const expectedTotalNumber = parseCurrency(session.esperado_total);
    const checkedTotalNumber = parseCurrency(session.conferido_total);
    const totalDifferenceNumber = parseCurrency(session.diferenca_total);
    const cashDifferenceNumber = parseCurrency(session.diferenca_dinheiro);
    const pixDifferenceNumber = parseCurrency(session.diferenca_pix);
    const cardDifferenceNumber = parseCurrency(session.diferenca_cartao);
    const openedAtDate = new Date(session.aberto_em);
    const closedAtDate = new Date(session.fechado_em);

    return {
        id: session.id,
        operatorName: session.operador_nome,
        openedAt: session.aberto_em,
        closedAt: session.fechado_em,
        openingFund: formatCurrency(openingFundNumber),
        openingFundNumber,
        expectedTotal: formatCurrency(expectedTotalNumber),
        expectedTotalNumber,
        checkedTotal: formatCurrency(checkedTotalNumber),
        checkedTotalNumber,
        totalDifference: formatCurrency(totalDifferenceNumber),
        totalDifferenceNumber,
        cashDifference: formatCurrency(cashDifferenceNumber),
        cashDifferenceNumber,
        pixDifference: formatCurrency(pixDifferenceNumber),
        pixDifferenceNumber,
        cardDifference: formatCurrency(cardDifferenceNumber),
        cardDifferenceNumber,
        status: session.status_fechamento,
        statusLabel: session.status_fechamento_label,
        openedTimeLabel: openedAtDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        }),
        closedTimeLabel: closedAtDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    };
}

function mapFinancePaymentMethod(
    method: ApiFinancePaymentDistributionPoint["forma_pagamento"],
): "cash" | "pix" | "card" {
    switch (method) {
        case "dinheiro":
            return "cash";
        case "pix":
            return "pix";
        default:
            return "card";
    }
}

function mapFinanceChartSalesPoint(point: ApiFinanceChartSalesPoint): FinanceChartSalesPoint {
    const total = parseCurrency(point.total);
    const date = new Date(`${point.dia}T00:00:00`);

    return {
        date: point.dia,
        dateLabel: date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
        }),
        total,
        totalLabel: formatCurrency(total),
        salesCount: point.quantidade,
    };
}

function mapFinancePaymentDistributionPoint(
    point: ApiFinancePaymentDistributionPoint,
): FinancePaymentDistributionPoint {
    const total = parseCurrency(point.total);
    const percentage = parseCurrency(point.percentual);

    return {
        paymentMethod: mapFinancePaymentMethod(point.forma_pagamento),
        paymentMethodLabel: point.forma_pagamento_label,
        total,
        totalLabel: formatCurrency(total),
        percentage,
    };
}

export async function listTabsMural() {
    const response = await request<ApiTabSummary[]>("/comandas/mural/");
    return response.map(mapTabSummary);
}

export async function getTabDetail(tabId: string) {
    const response = await request<ApiTabDetail>(`/comandas/${tabId}/`);
    return mapTabDetail(response);
}

export async function createTab(customerName: string) {
    const response = await request<ApiTabDetail>("/comandas/abrir/", {
        method: "POST",
        body: JSON.stringify({ nome_cliente: customerName }),
    });
    return mapTabDetail(response);
}

export async function updateTabStatus(tabId: string, status: TabStatus) {
    const path = status === "closed" ? "encerrar" : "reabrir";
    const response = await request<ApiTabDetail>(`/comandas/${tabId}/${path}/`, {
        method: "POST",
    });
    return mapTabDetail(response);
}

export async function payTab(input: {
    tabId: string;
    paymentMethod: CashSalePaymentMethod;
    receivedAmount?: number | null;
    observation?: string;
}) {
    const paymentMethod =
        input.paymentMethod === "cash"
            ? "dinheiro"
            : input.paymentMethod === "pix"
              ? "pix"
              : "cartao";

    const response = await request<ApiTabDetail>(`/comandas/${input.tabId}/pagar/`, {
        method: "POST",
        body: JSON.stringify({
            forma_pagamento: paymentMethod,
            valor_recebido:
                input.receivedAmount === undefined || input.receivedAmount === null
                    ? null
                    : input.receivedAmount.toFixed(2),
            observacao: input.observation ?? "",
        }),
    });

    return mapTabDetail(response);
}

export async function addItemToTab(tabId: string, productId: number, quantity = 1) {
    return request<ApiTabItem>(`/comandas/${tabId}/itens/`, {
        method: "POST",
        body: JSON.stringify({
            produto_id: productId,
            quantidade: quantity,
        }),
    });
}

export async function incrementTabItem(itemId: number) {
    return request<ApiTabItem>(`/itens-comanda/${itemId}/incrementar/`, {
        method: "POST",
    });
}

export async function decrementTabItem(itemId: number) {
    return request<ApiTabItem | null>(`/itens-comanda/${itemId}/decrementar/`, {
        method: "POST",
    });
}

export async function listProducts() {
    const response = await request<ApiProduct[]>("/produtos/");
    return response
        .filter((product) => product.ativo)
        .map((product) => ({
            id: product.id,
            name: product.nome,
            description: product.descricao,
            price: formatCurrency(parseCurrency(product.preco_venda)),
            priceNumber: parseCurrency(product.preco_venda),
            categoryName: product.categoria_nome ?? "Sem categoria",
            categorySlug: product.categoria_slug ?? "sem-categoria",
            stockType: product.tipo_estoque,
        }));
}

export async function getCashOverview() {
    const response = await request<ApiCashOverview>("/caixa/visao-geral/");
    return mapCashOverview(response);
}

export async function openCashSession(openingFund: number, operatorName?: string) {
    const response = await request<ApiCashOverview>("/caixa/abrir/", {
        method: "POST",
        body: JSON.stringify({
            fundo_troco_inicial: openingFund.toFixed(2),
            ...(operatorName ? { operador_nome: operatorName } : {}),
        }),
    });
    return mapCashOverview(response);
}

export async function closeCashSession(input: {
    cashCounted: number;
    pixCounted: number;
    cardCounted: number;
}) {
    const response = await request<ApiCashOverview>("/caixa/fechar/", {
        method: "POST",
        body: JSON.stringify({
            dinheiro_contado: input.cashCounted.toFixed(2),
            pix_conferido: input.pixCounted.toFixed(2),
            cartao_conferido: input.cardCounted.toFixed(2),
        }),
    });
    return mapCashOverview(response);
}

export async function createCashMovement(input: {
    type: "withdrawal" | "supply";
    value: number;
    description?: string;
}) {
    const type = input.type === "withdrawal" ? "sangria" : "suprimento";
    return request<ApiCashMovement>("/caixa/movimentacoes/", {
        method: "POST",
        body: JSON.stringify({
            tipo: type,
            valor: input.value.toFixed(2),
            descricao: input.description ?? "",
        }),
    }).then(mapCashMovement);
}

export async function createCashSale(input: {
    paymentMethod: CashSalePaymentMethod;
    receivedAmount?: number | null;
    observation?: string;
    items: Array<{
        productId: number;
        quantity: number;
    }>;
}) {
    const paymentMethod =
        input.paymentMethod === "cash"
            ? "dinheiro"
            : input.paymentMethod === "pix"
              ? "pix"
              : "cartao";

    const response = await request<ApiCashSale>("/caixa/vendas/", {
        method: "POST",
        body: JSON.stringify({
            forma_pagamento: paymentMethod,
            valor_recebido:
                input.receivedAmount === undefined || input.receivedAmount === null
                    ? null
                    : input.receivedAmount.toFixed(2),
            observacao: input.observation ?? "",
            itens: input.items.map((item) => ({
                produto_id: item.productId,
                quantidade: item.quantity,
            })),
        }),
    });

    return mapCashSale(response);
}

export async function listCashSalesHistory(input?: {
    period?: "hoje" | "ontem" | "ultimos_7_dias" | "personalizado";
    code?: string;
    paymentMethod?: CashSalePaymentMethod | "all";
    startDate?: string;
    endDate?: string;
}) {
    const params = new URLSearchParams();

    if (input?.period && input.period !== "personalizado") {
        params.set("periodo", input.period);
    }

    if (input?.code) {
        params.set("codigo", input.code);
    }

    if (input?.paymentMethod && input.paymentMethod !== "all") {
        const paymentMethod =
            input.paymentMethod === "cash"
                ? "dinheiro"
                : input.paymentMethod === "pix"
                  ? "pix"
                  : "cartao";
        params.set("forma_pagamento", paymentMethod);
    }

    if (input?.startDate) {
        params.set("data_inicial", input.startDate);
    }

    if (input?.endDate) {
        params.set("data_final", input.endDate);
    }

    const queryString = params.toString();
    const response = await request<ApiCashSale[]>(
        `/caixa/vendas/historico/${queryString ? `?${queryString}` : ""}`,
    );

    return response.map(mapCashSale);
}

export async function getCashSaleDetail(saleId: number) {
    const response = await request<ApiCashSale>(`/caixa/vendas/${saleId}/`);
    return mapCashSale(response);
}

export async function getFinanceSummary(input?: {
    period?: "hoje" | "ontem" | "ultimos_7_dias" | "personalizado";
    startDate?: string;
    endDate?: string;
}) {
    const params = new URLSearchParams();

    if (input?.period && input.period !== "personalizado") {
        params.set("periodo", input.period);
    }

    if (input?.startDate) {
        params.set("data_inicial", input.startDate);
    }

    if (input?.endDate) {
        params.set("data_final", input.endDate);
    }

    const queryString = params.toString();
    const response = await request<ApiFinanceSummary>(
        `/financeiro/resumo/${queryString ? `?${queryString}` : ""}`,
    );

    return mapFinanceSummary(response);
}

export async function getFinanceOperations(input?: {
    period?: "hoje" | "ontem" | "ultimos_7_dias" | "personalizado";
    startDate?: string;
    endDate?: string;
}) {
    const params = new URLSearchParams();

    if (input?.period && input.period !== "personalizado") {
        params.set("periodo", input.period);
    }

    if (input?.startDate) {
        params.set("data_inicial", input.startDate);
    }

    if (input?.endDate) {
        params.set("data_final", input.endDate);
    }

    const queryString = params.toString();
    const response = await request<ApiFinanceOperations>(
        `/financeiro/operacoes/${queryString ? `?${queryString}` : ""}`,
    );

    return response.operacoes.map(mapFinanceOperation);
}

export async function getFinanceClosingMetrics(input?: {
    period?: "hoje" | "ontem" | "ultimos_7_dias" | "personalizado";
    startDate?: string;
    endDate?: string;
}) {
    const params = new URLSearchParams();

    if (input?.period && input.period !== "personalizado") {
        params.set("periodo", input.period);
    }

    if (input?.startDate) {
        params.set("data_inicial", input.startDate);
    }

    if (input?.endDate) {
        params.set("data_final", input.endDate);
    }

    const queryString = params.toString();
    const response = await request<ApiFinanceClosingMetrics>(
        `/financeiro/fechamentos/${queryString ? `?${queryString}` : ""}`,
    );

    return response.fechamentos.map(mapFinanceClosingSession);
}

export async function getFinanceCharts(input?: {
    period?: "hoje" | "ontem" | "ultimos_7_dias" | "personalizado";
    startDate?: string;
    endDate?: string;
}) {
    const params = new URLSearchParams();

    if (input?.period && input.period !== "personalizado") {
        params.set("periodo", input.period);
    }

    if (input?.startDate) {
        params.set("data_inicial", input.startDate);
    }

    if (input?.endDate) {
        params.set("data_final", input.endDate);
    }

    const queryString = params.toString();
    const response = await request<ApiFinanceCharts>(
        `/financeiro/graficos/${queryString ? `?${queryString}` : ""}`,
    );

    return {
        salesByDay: response.vendas_por_dia.map(mapFinanceChartSalesPoint),
        paymentDistribution: response.distribuicao_pagamentos.map(
            mapFinancePaymentDistributionPoint,
        ),
    };
}
