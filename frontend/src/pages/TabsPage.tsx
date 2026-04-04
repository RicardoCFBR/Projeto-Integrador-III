import { Link } from "react-router-dom";

type TabCard = {
    id: number;
    clientName: string;
    elapsedTime: string;
    totalLabel: string;
    totalValue: string;
    note?: string;
    state: "active" | "attention" | "closed";
};

const tabCards: TabCard[] = [
    {
        id: 1,
        clientName: "Ricardo",
        elapsedTime: "Ha 45 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 145,90",
        note: "Mesa com 3 pessoas",
        state: "active",
    },
    {
        id: 2,
        clientName: "Joao do Balcao",
        elapsedTime: "Ha 12 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 42,00",
        state: "active",
    },
    {
        id: 3,
        clientName: "Ana Clara",
        elapsedTime: "Ha 1h 20 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 312,50",
        note: "Sem pedidos ha 30m",
        state: "attention",
    },
    {
        id: 4,
        clientName: "Marcos",
        elapsedTime: "Encerrada as 19:45",
        totalLabel: "Final",
        totalValue: "R$ 89,00",
        state: "closed",
    },
    {
        id: 5,
        clientName: "Carlos Eduardo",
        elapsedTime: "Ha 5 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 0,00",
        state: "active",
    },
    {
        id: 6,
        clientName: "Beatriz Lopes",
        elapsedTime: "Ha 2h 15 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 842,00",
        note: "Cliente premium",
        state: "active",
    },
];

export function TabsPage() {
    const closedCount = tabCards.filter((tab) => tab.state === "closed").length;
    const activeCount = tabCards.length - closedCount;

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
                {tabCards.map((tab) => (
                    <Link
                        aria-label={`Abrir comanda de ${tab.clientName}`}
                        className="tab-card-link"
                        key={tab.id}
                        to={`/comandas/${tab.id}`}
                    >
                        <article className={`tab-card tab-card--${tab.state}`}>
                            <div className="tab-card__status" aria-hidden="true" />

                            <div className="tab-card__body">
                                <div className="tab-card__header">
                                    <h2>{tab.clientName}</h2>
                                    <p>{tab.elapsedTime}</p>
                                </div>

                                {tab.note ? (
                                    <p
                                        className={
                                            tab.state === "attention"
                                                ? "tab-card__note tab-card__note--attention"
                                                : "tab-card__note"
                                        }
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
