import { Link } from "react-router-dom";

import { useTabs } from "../contexts/TabsContext";

export function TabsPage() {
    const { tabs } = useTabs();
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
                    <h1>Gestao de Comandas</h1>
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
                {tabs.map((tab) => (
                    <Link
                        aria-label={`Abrir comanda de ${tab.customerName}`}
                        className="tab-card-link"
                        key={tab.id}
                        to={`/comandas/${tab.id}`}
                    >
                        <article className={`tab-card tab-card--${tab.status}`}>
                            <div className="tab-card__status" aria-hidden="true" />

                            <div className="tab-card__body">
                                <div className="tab-card__header">
                                    <h2>{tab.customerName}</h2>
                                    <p>{tab.elapsedTime}</p>
                                </div>

                                {tab.note ? (
                                    <p
                                        className="tab-card__note"
                                    >
                                        {tab.note}
                                    </p>
                                ) : (
                                    <div className="tab-card__spacer" />
                                )}

                                <div className="tab-card__footer">
                                    <span>{tab.totalLabel}</span>
                                    <strong>{tab.totalValue}</strong>
                                </div>
                            </div>
                        </article>
                    </Link>
                ))}
            </section>
        </div>
    );
}
