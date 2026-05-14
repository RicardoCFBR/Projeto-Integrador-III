import type { CashSale, TabDetail, TabSummary } from "../services/barControlApi";

type PrintableTab = Pick<
    TabSummary,
    "customerName" | "status" | "isPaid" | "saleCode" | "tabLabel" | "totalValue"
> & {
    items?: TabDetail["items"];
};

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function openPrintWindow(title: string, body: string) {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=420,height=720");
    if (!printWindow) {
        throw new Error("Não foi possível abrir a janela de impressão.");
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
            <head>
                <meta charset="utf-8" />
                <title>${escapeHtml(title)}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 24px;
                        font-family: "Plus Jakarta Sans", Arial, sans-serif;
                        background: #f4f6f5;
                        color: #243132;
                    }
                    .receipt {
                        max-width: 360px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 18px;
                        box-shadow: 0 16px 32px rgba(36, 49, 50, 0.12);
                        padding: 24px;
                    }
                    .muted {
                        color: #697776;
                    }
                    .section {
                        margin-top: 18px;
                        padding-top: 18px;
                        border-top: 1px dashed rgba(36, 49, 50, 0.18);
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        gap: 12px;
                        align-items: flex-start;
                        margin-bottom: 10px;
                    }
                    .row:last-child {
                        margin-bottom: 0;
                    }
                    .item-name {
                        font-weight: 700;
                    }
                    .item-meta,
                    .small {
                        font-size: 12px;
                    }
                    .total {
                        font-size: 28px;
                        font-weight: 800;
                        color: #1c6d25;
                    }
                    .pill {
                        display: inline-block;
                        padding: 4px 10px;
                        border-radius: 999px;
                        background: #eef3f1;
                        font-size: 12px;
                        font-weight: 700;
                    }
                    @media print {
                        body {
                            background: #ffffff;
                            padding: 0;
                        }
                        .receipt {
                            box-shadow: none;
                            border-radius: 0;
                            max-width: none;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                ${body}
                <script>
                    window.onload = () => {
                        window.print();
                        window.onafterprint = () => window.close();
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

export function printCashSaleReceipt(sale: CashSale) {
    const body = `
        <main class="receipt">
            <div>
                <div class="small muted">BarControl</div>
                <h1 style="margin: 6px 0 4px; font-size: 28px;">Recibo de Venda</h1>
                <div class="pill">${escapeHtml(sale.code)}</div>
            </div>

            <section class="section">
                <div class="row">
                    <div>
                        <div class="muted small">Forma de pagamento</div>
                        <div>${escapeHtml(sale.paymentMethodLabel)}</div>
                    </div>
                    <div style="text-align:right">
                        <div class="muted small">Horário</div>
                        <div>${escapeHtml(sale.timeLabel)}</div>
                    </div>
                </div>
                ${
                    sale.comandaCode
                        ? `<div class="row"><span class="muted">Comanda</span><strong>${escapeHtml(sale.comandaCode)}${sale.comandaCustomerName ? ` - ${escapeHtml(sale.comandaCustomerName)}` : ""}</strong></div>`
                        : ""
                }
            </section>

            <section class="section">
                ${sale.items
                    .map(
                        (item) => `
                        <div class="row">
                            <div>
                                <div class="item-name">${escapeHtml(`${item.quantity}x ${item.title}`)}</div>
                                <div class="item-meta muted">Unitário: ${escapeHtml(item.unitPrice)}</div>
                            </div>
                            <div style="font-weight:800; white-space:nowrap;">${escapeHtml(item.total)}</div>
                        </div>
                    `,
                    )
                    .join("")}
            </section>

            <section class="section">
                ${
                    sale.receivedAmount
                        ? `<div class="row"><span class="muted">Valor recebido</span><strong>${escapeHtml(sale.receivedAmount)}</strong></div>`
                        : ""
                }
                ${
                    sale.changeAmountNumber > 0
                        ? `<div class="row"><span class="muted">Troco</span><strong>${escapeHtml(sale.changeAmount)}</strong></div>`
                        : ""
                }
                ${
                    sale.observation
                        ? `<div class="row"><span class="muted">Observação</span><strong>${escapeHtml(sale.observation)}</strong></div>`
                        : ""
                }
                <div class="row" style="margin-top: 18px;">
                    <span class="muted">Total</span>
                    <span class="total">${escapeHtml(sale.total)}</span>
                </div>
            </section>
        </main>
    `;

    openPrintWindow(`Recibo ${sale.code}`, body);
}

export function printTabConference(tab: PrintableTab) {
    const items = tab.items ?? [];
    const body = `
        <main class="receipt">
            <div>
                <div class="small muted">BarControl</div>
                <h1 style="margin: 6px 0 4px; font-size: 28px;">Conferência de Comanda</h1>
                <div class="pill">${escapeHtml(tab.tabLabel)}</div>
            </div>

            <section class="section">
                <div class="row">
                    <div>
                        <div class="muted small">Cliente</div>
                        <div>${escapeHtml(tab.customerName)}</div>
                    </div>
                    <div style="text-align:right">
                        <div class="muted small">Status</div>
                        <div>${escapeHtml(tab.isPaid ? "Paga" : tab.status === "closed" ? "Encerrada" : "Aberta")}</div>
                    </div>
                </div>
            </section>

            <section class="section">
                ${
                    items.length === 0
                        ? `<div class="muted">Nenhum item lançado na comanda.</div>`
                        : items
                              .map(
                                  (item) => `
                                <div class="row">
                                    <div>
                                        <div class="item-name">${escapeHtml(`${item.quantity}x ${item.title}`)}</div>
                                        <div class="item-meta muted">${escapeHtml(item.timeLabel)}</div>
                                    </div>
                                    <div style="font-weight:800; white-space:nowrap;">${escapeHtml(item.value)}</div>
                                </div>
                            `,
                              )
                              .join("")
                }
            </section>

            <section class="section">
                <div class="row">
                    <span class="muted">Itens</span>
                    <strong>${items.length}</strong>
                </div>
                ${
                    tab.saleCode
                        ? `<div class="row"><span class="muted">Venda vinculada</span><strong>${escapeHtml(tab.saleCode)}</strong></div>`
                        : ""
                }
                <div class="row" style="margin-top: 18px;">
                    <span class="muted">Total</span>
                    <span class="total">${escapeHtml(tab.totalValue)}</span>
                </div>
            </section>
        </main>
    `;

    openPrintWindow(`Conferência ${tab.tabLabel}`, body);
}
