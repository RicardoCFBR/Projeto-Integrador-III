import { Link } from "react-router-dom";

import { useTabs } from "../contexts/TabsContext";

function getTabStatusPresentation(tab: { status: "open" | "closed"; isPaid: boolean }) {
    if (tab.isPaid) {
        return {
            label: "Paga",
            className: "tab-card__status-badge tab-card__status-badge--paid",
            cardClassName: "tab-card--paid",
        };
    }

    if (tab.status === "closed") {
        return {
            label: "Encerrada",
            className: "tab-card__status-badge tab-card__status-badge--closed",
            cardClassName: "tab-card--closed",
        };
    }

    return {
        label: "Aberta",
        className: "tab-card__status-badge tab-card__status-badge--open",
        cardClassName: "tab-card--open",
    };
}

export function TabsPage() {
    const { error, loading, tabs } = useTabs();
    const closedCount = tabs.filter((tab) => tab.status === "closed").length;
    const activeCount = tabs.length - closedCount;

    const summaryCards = [
        { label: "Ativas", value: String(activeCount), accent: "primary" },
        { label: "Encerradas", value: String(closedCount), accent: "neutral" },
    ];

    return (
        <div className="page-stack">
            <section className="page-hero">
                <div>
                    <h1 style={{ color: "#4a76d6" }}>Gestão de Comandas</h1>
                    <p style={{ marginTop: 20 }}>Gerencie as comandas ativas e encerradas.</p>
                </div>

                <div className="page-hero__actions">
                    <section className="summary-panel" aria-label="Resumo de comandas">
                        <p className="summary-panel__title">Status das Comandas</p>

                        <div className="summary-strip">
                            {summaryCards.map((item) => (
                                <article className="summary-card" key={item.label}>
                                    <span>{item.label}</span>
                                    <strong
                                        className={
                                            item.accent === "primary"
                                                ? "summary-card__value summary-card__value--primary"
                                                : "summary-card__value"
                                        }
                                    >
                                        {item.value}
                                    </strong>
                                </article>
                            ))}
                        </div>
                    </section>

                    <Link className="primary-action" to="/comandas/nova">
                        + Nova Comanda
                    </Link>
                </div>
            </section>

            <section className="tabs-grid" aria-label="Lista de comandas">
                {loading ? <p>Carregando comandas...</p> : null}
                {!loading && error ? <p>Erro ao carregar comandas: {error}</p> : null}
                {!loading && !error && tabs.length === 0 ? (
                    <p>Nenhuma comanda aberta ou encerrada por enquanto.</p>
                ) : null}

                {tabs.map((tab) => (
                    (() => {
                        const statusPresentation = getTabStatusPresentation(tab);

                        return (
                            <Link
                                aria-label={`Abrir comanda de ${tab.customerName}`}
                                className="tab-card-link"
                                key={tab.id}
                                to={`/comandas/${tab.id}`}
                            >
                                <article className={`tab-card ${statusPresentation.cardClassName}`}>
                            <div className="tab-card__status" aria-hidden="true" />

                            <div className="tab-card__body">
                                <div className="tab-card__header">
                                    <h2>{tab.customerName}</h2>
                                    <p>{tab.elapsedTime}</p>
                                </div>

                                <p className={statusPresentation.className}>
                                    Status: {statusPresentation.label}
                                </p>

                                <p className="tab-card__note">
                                    {tab.itemsCount === 1
                                        ? "1 item lancado"
                                        : `${tab.itemsCount} itens lancados`}
                                </p>

                                <div className="tab-card__footer">
                                    <span>{tab.totalLabel}</span>
                                    <strong>{tab.totalValue}</strong>
                                </div>
                            </div>
                                </article>
                            </Link>
                        );
                    })()
                ))}
            </section>
        </div>
    );
}
