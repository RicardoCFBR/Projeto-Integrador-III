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
};

export type CashMovementType = "opening" | "withdrawal" | "supply" | "closing";

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

export type CashOverview = {
    session: CashSession;
    movements: CashMovement[];
    summary: {
        openingFund: string;
        openingFundNumber: number;
        balance: string;
        balanceNumber: number;
        movementsCount: number;
        salesCount: number;
    };
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
    resumo: {
        fundo_inicial: string;
        saldo_em_caixa: string;
        movimentacoes_count: number;
        vendas_count: number;
    };
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

function mapCashOverview(overview: ApiCashOverview): CashOverview {
    const openingFundNumber = parseCurrency(overview.resumo.fundo_inicial);
    const balanceNumber = parseCurrency(overview.resumo.saldo_em_caixa);

    return {
        session: mapCashSession(overview.sessao_atual),
        movements: overview.movimentacoes.map(mapCashMovement),
        summary: {
            openingFund: formatCurrency(openingFundNumber),
            openingFundNumber,
            balance: formatCurrency(balanceNumber),
            balanceNumber,
            movementsCount: overview.resumo.movimentacoes_count,
            salesCount: overview.resumo.vendas_count,
        },
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

export async function closeCashSession() {
    const response = await request<ApiCashOverview>("/caixa/fechar/", {
        method: "POST",
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
