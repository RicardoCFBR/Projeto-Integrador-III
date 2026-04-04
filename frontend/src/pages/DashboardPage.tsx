import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type DashboardData = {
    totais: {
        produtos: number;
        comandas_abertas: number;
        pedidos: number;
        vendas: number | string;
    };
    vendas_por_dia: Array<{
        dia: string;
        total: number | string;
    }>;
};

const API_URL = "http://127.0.0.1:8000/api/dashboard/";

function formatCurrency(value: number | string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value || 0));
}

export function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadDashboard() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(API_URL, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Nao foi possivel carregar o dashboard.");
                }

                const payload = (await response.json()) as DashboardData;
                setData(payload);
            } catch (caughtError) {
                if (caughtError instanceof Error && caughtError.name === "AbortError") {
                    return;
                }

                setError(
                    "A API ainda nao respondeu. Inicie o Django em http://127.0.0.1:8000.",
                );
            } finally {
                setLoading(false);
            }
        }

        void loadDashboard();

        return () => controller.abort();
    }, []);

    const metrics = [
        {
            label: "Produtos cadastrados",
            value: data?.totais.produtos ?? 0,
        },
        {
            label: "Comandas abertas",
            value: data?.totais.comandas_abertas ?? 0,
        },
        {
            label: "Pedidos registrados",
            value: data?.totais.pedidos ?? 0,
        },
        {
            label: "Venda acumulada",
            value: formatCurrency(data?.totais.vendas ?? 0),
        },
    ];

    const chartData = (data?.vendas_por_dia ?? []).map((item) => ({
        dia: new Date(`${item.dia}T00:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
        }),
        total: Number(item.total),
    }));

    return (
        <div className="page-stack">
            <section className="dashboard-hero" aria-label="Resumo do dashboard">
                <div>
                    <h1>Dashboard</h1>
                    <p style={{ marginTop: 20 }}>
                        Veja os principais indicadores do sistema e o faturamento diario.
                    </p>
                </div>
            </section>

            <section className="metrics-grid" aria-label="Indicadores principais">
                {metrics.map((metric) => (
                    <article className="metric-card" key={metric.label}>
                        <p>{metric.label}</p>
                        <strong>{metric.value}</strong>
                    </article>
                ))}
            </section>

            <section className="chart-panel" aria-labelledby="chart-title">
                <div className="dashboard-hero">
                    <div>
                        <h2 id="chart-title">Faturamento diario</h2>
                        <p>Os dados sao carregados a partir de `GET /api/dashboard/`.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="status-card loading" role="status">
                        <strong>Carregando dados</strong>
                        <p>Consultando a API do backend para montar o grafico.</p>
                    </div>
                ) : null}

                {error ? (
                    <div className="status-card error" role="alert">
                        <strong>Backend indisponivel</strong>
                        <p>{error}</p>
                        <code>python manage.py runserver</code>
                    </div>
                ) : null}

                {!loading && !error ? (
                    <div className="chart-frame" role="img" aria-label="Grafico de barras com vendas por dia">
                        <ResponsiveContainer height="100%" width="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                                <XAxis dataKey="dia" stroke="#f6efe7" tickLine={false} />
                                <YAxis
                                    stroke="#f6efe7"
                                    tickFormatter={(value) => `R$ ${value}`}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#120806",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: "16px",
                                    }}
                                    formatter={(value) => formatCurrency(Number(value))}
                                />
                                <Bar
                                    dataKey="total"
                                    fill="#f2a45c"
                                    name="Venda"
                                    radius={[10, 10, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
