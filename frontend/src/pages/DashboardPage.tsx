import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
    alpha,
    Box,
    Button,
    Chip,
    CircularProgress,
    LinearProgress,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
    getDashboardSummary,
    getFinanceCharts,
    getFinanceSummary,
    listStockProducts,
    type DashboardSummary,
    type FinancePaymentDistributionPoint,
    type FinanceSummary,
    type StockProduct,
} from "../services/barControlApi";

const emptySummary: DashboardSummary = {
    totalCategories: 0,
    totalProducts: 0,
    totalStockItems: 0,
    openTabsCount: 0,
    launchedItemsCount: 0,
    totalSales: "R$ 0,00",
    totalSalesNumber: 0,
    salesByDay: [],
};

const emptyFinanceSummary: FinanceSummary = {
    totalSold: "R$ 0,00",
    totalSoldNumber: 0,
    totalCash: "R$ 0,00",
    totalCashNumber: 0,
    totalPix: "R$ 0,00",
    totalPixNumber: 0,
    totalDebit: "R$ 0,00",
    totalDebitNumber: 0,
    totalCredit: "R$ 0,00",
    totalCreditNumber: 0,
    totalWithdrawals: "R$ 0,00",
    totalWithdrawalsNumber: 0,
    totalSupplies: "R$ 0,00",
    totalSuppliesNumber: 0,
    averageTicket: "R$ 0,00",
    averageTicketNumber: 0,
    salesCount: 0,
    closedSessionsCount: 0,
    totalDifferences: "R$ 0,00",
    totalDifferencesNumber: 0,
};

const paymentChartColors: Record<FinancePaymentDistributionPoint["paymentMethod"], string> = {
    cash: "#2E7D32",
    pix: "#0288D1",
    debit: "#F9A825",
    credit: "#8E24AA",
};

function getStockRatio(product: StockProduct) {
    if (product.minimumStock <= 0) {
        return product.currentStock > 0 ? 100 : 0;
    }

    return Math.max(0, Math.min((product.currentStock / product.minimumStock) * 100, 100));
}

function getStockPriority(product: StockProduct, darkMode: boolean) {
    const ratio = getStockRatio(product);

    if (ratio <= 10) {
        return darkMode
            ? { label: "Crítico", color: "#ffb4a8", tone: "rgba(180, 35, 24, 0.22)" }
            : { label: "Crítico", color: "#b42318", tone: "#fdecea" };
    }

    if (ratio <= 25) {
        return darkMode
            ? { label: "Reposição Imediata", color: "#ffbf7c", tone: "rgba(245, 124, 0, 0.18)" }
            : { label: "Reposição Imediata", color: "#f57c00", tone: "#fff3e0" };
    }

    return darkMode
        ? { label: "Estável", color: "#bff7b8", tone: "rgba(116, 216, 124, 0.18)" }
        : { label: "Estável", color: "#2e7d32", tone: "#edf7ed" };
}

function getDashboardChipTone(badgeTone: "success" | "warning" | "info", darkMode: boolean) {
    if (badgeTone === "warning") {
        return darkMode
            ? { bgcolor: "rgba(245, 124, 0, 0.18)", color: "#ffbf7c" }
            : { bgcolor: "#fff3e0", color: "#f57c00" };
    }

    if (badgeTone === "info") {
        return darkMode
            ? { bgcolor: "rgba(110, 163, 255, 0.18)", color: "#dbe7ff" }
            : { bgcolor: "#eef4ff", color: "#0062a5" };
    }

    return darkMode
        ? { bgcolor: "rgba(116, 216, 124, 0.18)", color: "#bff7b8" }
        : { bgcolor: "#edf7ed", color: "#2e7d32" };
}

function DashboardMetricCard({
    icon,
    title,
    value,
    helper,
    badge,
    badgeTone = "success",
    darkMode,
}: {
    icon: ReactNode;
    title: string;
    value: string;
    helper: string;
    badge?: string;
    badgeTone?: "success" | "warning" | "info";
    darkMode: boolean;
}) {
    const badgeStyles = getDashboardChipTone(badgeTone, darkMode);

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: "20px",
                bgcolor: "background.paper",
                boxShadow: "0 16px 40px rgba(45, 52, 51, 0.05)",
            }}
        >
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: "14px",
                            bgcolor: "var(--surface-soft)",
                            color: "primary.main",
                        }}
                    >
                        {icon}
                    </Box>
                    {badge ? (
                        <Chip
                            label={badge}
                            size="small"
                            sx={{ borderRadius: "999px", fontWeight: 800, ...badgeStyles }}
                        />
                    ) : null}
                </Stack>
                <Box>
                    <Typography
                        sx={{
                            mb: 0.75,
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "text.secondary",
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            fontSize: "2rem",
                            fontWeight: 800,
                            lineHeight: 1.05,
                            color: "text.primary",
                        }}
                    >
                        {value}
                    </Typography>
                </Box>
                <Typography color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                    {helper}
                </Typography>
            </Stack>
        </Paper>
    );
}

export function DashboardPage() {
    const theme = useTheme();
    const darkMode = theme.palette.mode === "dark";
    const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>(emptySummary);
    const [financeSummary, setFinanceSummary] = useState<FinanceSummary>(emptyFinanceSummary);
    const [paymentDistribution, setPaymentDistribution] = useState<FinancePaymentDistributionPoint[]>([]);
    const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboardData() {
            try {
                setLoading(true);
                setError(null);

                const [summaryResponse, financeSummaryResponse, financeChartsResponse, stockResponse] =
                    await Promise.all([
                        getDashboardSummary(),
                        getFinanceSummary({ period: "hoje" }),
                        getFinanceCharts({ period: "ultimos_7_dias" }),
                        listStockProducts(),
                    ]);

                if (cancelled) return;

                setDashboardSummary(summaryResponse);
                setFinanceSummary(financeSummaryResponse);
                setPaymentDistribution(financeChartsResponse.paymentDistribution);
                setStockProducts(stockResponse);
            } catch (requestError) {
                if (cancelled) return;

                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Não foi possível carregar o painel de controle.",
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadDashboardData();

        return () => {
            cancelled = true;
        };
    }, []);

    const lowStockProducts = useMemo(
        () =>
            stockProducts
                .filter((product) => product.controlsStock && product.isActive)
                .sort((left, right) => getStockRatio(left) - getStockRatio(right))
                .slice(0, 5),
        [stockProducts],
    );
    const controlledStockProductsCount = useMemo(
        () => stockProducts.filter((product) => product.controlsStock).length,
        [stockProducts],
    );

    const donutTotal = useMemo(
        () => paymentDistribution.reduce((accumulator, item) => accumulator + item.total, 0),
        [paymentDistribution],
    );

    const currentDateLabel = new Date().toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });

    const chartData = dashboardSummary.salesByDay;

    return (
        <Stack spacing={3}>
            <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", lg: "center" }}
            >
                <Box>
                    <h1
                        style={{
                            margin: 0,
                            color: "#4a76d6",
                            fontSize: "clamp(2rem, 3vw, 3rem)",
                            lineHeight: 1,
                            letterSpacing: "-0.04em",
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            fontWeight: 800,
                        }}
                    >
                        Dashboard
                    </h1>
                    <Typography color="text.secondary" sx={{ mt: 2.5 }}>
                        Visão operacional do dia com vendas, comandas e alertas de estoque em tempo
                        real.
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                    <Chip
                        label={currentDateLabel}
                        sx={{
                            height: 42,
                            borderRadius: "14px",
                            bgcolor: darkMode ? "rgba(110, 163, 255, 0.12)" : "background.paper",
                            border: `1px solid ${theme.palette.divider}`,
                            color: darkMode ? "#dbe7ff" : "text.primary",
                            fontWeight: 700,
                        }}
                    />
                    <Button
                        component={Link}
                        to="/financeiro"
                        sx={{
                            minHeight: 42,
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #55dc28 0%, #1c6d25 100%)",
                            color: "#f7fff7",
                        }}
                        variant="contained"
                    >
                        Ver Financeiro
                    </Button>
                </Stack>
            </Stack>

            {error ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: "18px",
                        bgcolor: darkMode ? alpha("#a73b21", 0.12) : "#fff4f2",
                        color: "error.main",
                    }}
                >
                    <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Erro ao carregar o painel</Typography>
                    <Typography>{error}</Typography>
                </Paper>
            ) : null}

            {loading ? (
                <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
                    <CircularProgress size={32} />
                </Box>
            ) : null}

            {!loading ? (
                <>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(2, minmax(0, 1fr))",
                                xl: "repeat(4, minmax(0, 1fr))",
                            },
                            gap: 2,
                        }}
                    >
                        <DashboardMetricCard
                            icon={<PointOfSaleRoundedIcon />}
                            title="Venda acumulada"
                            value={financeSummary.totalSold}
                            helper={`${financeSummary.salesCount} vendas registradas hoje`}
                            badge="Hoje"
                            darkMode={darkMode}
                        />
                        <DashboardMetricCard
                            icon={<ReceiptLongRoundedIcon />}
                            title="Comandas abertas"
                            value={String(dashboardSummary.openTabsCount)}
                            helper={`${dashboardSummary.launchedItemsCount} itens lançados nas comandas`}
                            badge="Operação"
                            badgeTone="warning"
                            darkMode={darkMode}
                        />
                        <DashboardMetricCard
                            icon={<TrendingUpRoundedIcon />}
                            title="Ticket médio"
                            value={financeSummary.averageTicket}
                            helper="Média atual das vendas concluídas"
                            badge="Ao vivo"
                            badgeTone="info"
                            darkMode={darkMode}
                        />
                        <DashboardMetricCard
                            icon={<Inventory2RoundedIcon />}
                            title="Produtos controlados"
                            value={String(controlledStockProductsCount)}
                            helper={`${lowStockProducts.length} itens exigem atenção imediata`}
                            badge="Estoque"
                            darkMode={darkMode}
                        />
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                xl: "minmax(0, 1.45fr) minmax(320px, 0.75fr)",
                            },
                            gap: 2,
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: "22px",
                                bgcolor: "background.paper",
                                boxShadow: "0 16px 40px rgba(45, 52, 51, 0.05)",
                            }}
                        >
                            <Stack spacing={2}>
                                <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    justifyContent="space-between"
                                    spacing={1.5}
                                >
                                    <Box>
                                        <Typography
                                            sx={{
                                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                                fontSize: "1.3rem",
                                                fontWeight: 800,
                                                color: "text.primary",
                                            }}
                                        >
                                            Fluxo de Faturamento
                                        </Typography>
                                        <Typography color="text.secondary">
                                            Evolução das vendas lançadas por dia.
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="Últimos dias"
                                        sx={{
                                            alignSelf: "flex-start",
                                            bgcolor: darkMode
                                                ? "rgba(110, 163, 255, 0.16)"
                                                : "var(--surface-soft)",
                                            color: darkMode ? "#dbe7ff" : "text.secondary",
                                            fontWeight: 700,
                                        }}
                                    />
                                </Stack>

                                <Box sx={{ width: "100%", height: 340 }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient
                                                    id="dashboard-sales-area"
                                                    x1="0"
                                                    x2="0"
                                                    y1="0"
                                                    y2="1"
                                                >
                                                    <stop offset="5%" stopColor="#55dc28" stopOpacity={0.34} />
                                                    <stop offset="95%" stopColor="#55dc28" stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="dateLabel"
                                                axisLine={false}
                                                tickLine={false}
                                                stroke={theme.palette.text.secondary}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                stroke={theme.palette.text.secondary}
                                                tickFormatter={(value) => `R$ ${value}`}
                                            />
                                            <Tooltip
                                                formatter={(value) =>
                                                    new Intl.NumberFormat("pt-BR", {
                                                        style: "currency",
                                                        currency: "BRL",
                                                    }).format(Number(value))
                                                }
                                                contentStyle={{
                                                    borderRadius: 16,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    boxShadow: darkMode
                                                        ? "0 16px 30px rgba(0, 0, 0, 0.28)"
                                                        : "0 16px 30px rgba(15, 23, 42, 0.12)",
                                                    backgroundColor: theme.palette.background.paper,
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#55dc28"
                                                strokeWidth={3}
                                                fill="url(#dashboard-sales-area)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Stack>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: "22px",
                                bgcolor: "background.paper",
                                boxShadow: "0 16px 40px rgba(45, 52, 51, 0.05)",
                            }}
                        >
                            <Stack spacing={2}>
                                <Box>
                                    <Typography
                                        sx={{
                                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                                            fontSize: "1.3rem",
                                            fontWeight: 800,
                                            color: "text.primary",
                                        }}
                                    >
                                        Distribuição por Pagamento
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Participação de cada meio no faturamento do período.
                                    </Typography>
                                </Box>

                                <Box sx={{ width: "100%", height: 260 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={paymentDistribution}
                                                dataKey="total"
                                                innerRadius={70}
                                                outerRadius={96}
                                                paddingAngle={3}
                                                stroke="none"
                                            >
                                                {paymentDistribution.map((entry) => (
                                                    <Cell
                                                        key={entry.paymentMethod}
                                                        fill={paymentChartColors[entry.paymentMethod]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, _name, item) => {
                                                    const payload =
                                                        item?.payload as
                                                            | FinancePaymentDistributionPoint
                                                            | undefined;
                                                    return [
                                                        new Intl.NumberFormat("pt-BR", {
                                                            style: "currency",
                                                            currency: "BRL",
                                                        }).format(Number(value)),
                                                        payload?.paymentMethodLabel ?? "Pagamento",
                                                    ];
                                                }}
                                                contentStyle={{
                                                    borderRadius: 16,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    boxShadow: darkMode
                                                        ? "0 16px 30px rgba(0, 0, 0, 0.28)"
                                                        : "0 16px 30px rgba(15, 23, 42, 0.12)",
                                                    backgroundColor: theme.palette.background.paper,
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>

                                <Box sx={{ textAlign: "center", mt: -20 }}>
                                    <Typography
                                        sx={{
                                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                                            fontSize: "2rem",
                                            fontWeight: 800,
                                            lineHeight: 1,
                                            color: "text.primary",
                                        }}
                                    >
                                        {new Intl.NumberFormat("pt-BR").format(Math.round(donutTotal))}
                                    </Typography>
                                    <Typography
                                        sx={{
                                            mt: 0.5,
                                            fontSize: "0.72rem",
                                            letterSpacing: "0.14em",
                                            textTransform: "uppercase",
                                            color: "text.secondary",
                                            fontWeight: 800,
                                        }}
                                    >
                                        Volume financeiro
                                    </Typography>
                                </Box>

                                <Stack spacing={1.25}>
                                    {paymentDistribution.map((item) => (
                                        <Stack
                                            key={item.paymentMethod}
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box
                                                    sx={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: "999px",
                                                        bgcolor: paymentChartColors[item.paymentMethod],
                                                    }}
                                                />
                                                <Typography color="text.primary">
                                                    {item.paymentMethodLabel}
                                                </Typography>
                                            </Stack>
                                            <Typography sx={{ fontWeight: 800, color: "text.primary" }}>
                                                {item.percentage.toFixed(1)}%
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>
                        </Paper>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: "22px",
                            bgcolor: "background.paper",
                            boxShadow: "0 16px 40px rgba(45, 52, 51, 0.05)",
                        }}
                    >
                        <Stack spacing={2.5}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                justifyContent="space-between"
                                spacing={1.5}
                            >
                                <Box>
                                    <Typography
                                        sx={{
                                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                                            fontSize: "1.3rem",
                                            fontWeight: 800,
                                            color: "text.primary",
                                        }}
                                    >
                                        Alertas de Estoque Crítico
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Itens com menor cobertura de estoque no momento.
                                    </Typography>
                                </Box>

                                <Button component={Link} to="/estoque" variant="outlined">
                                    Gerenciar Estoque
                                </Button>
                            </Stack>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "minmax(180px, 1.5fr) minmax(120px, 1fr) minmax(180px, 1.2fr) minmax(150px, 1fr)",
                                    gap: 2,
                                    px: 1,
                                    color: "text.secondary",
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                }}
                            >
                                <span>Item</span>
                                <span>Categoria</span>
                                <span>Cobertura</span>
                                <span>Prioridade</span>
                            </Box>

                            <Stack spacing={1.5}>
                                {lowStockProducts.length === 0 ? (
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: "16px",
                                            bgcolor: "background.default",
                                            color: "text.secondary",
                                        }}
                                    >
                                        Nenhum alerta crítico no momento.
                                    </Paper>
                                ) : (
                                    lowStockProducts.map((product) => {
                                        const ratio = getStockRatio(product);
                                        const priority = getStockPriority(product, darkMode);

                                        return (
                                            <Paper
                                                elevation={0}
                                                key={product.id}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: "16px",
                                                    bgcolor: "background.default",
                                                    border: `1px solid ${theme.palette.divider}`,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "grid",
                                                        gridTemplateColumns: {
                                                            xs: "1fr",
                                                            lg: "minmax(180px, 1.5fr) minmax(120px, 1fr) minmax(180px, 1.2fr) minmax(150px, 1fr)",
                                                        },
                                                        gap: 2,
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography
                                                            sx={{ fontWeight: 800, color: "text.primary" }}
                                                        >
                                                            {product.name}
                                                        </Typography>
                                                        <Typography
                                                            color="text.secondary"
                                                            sx={{ fontSize: "0.8rem" }}
                                                        >
                                                            {product.currentStockLabel}
                                                        </Typography>
                                                    </Box>
                                                    <Typography color="text.primary">
                                                        {product.categoryName}
                                                    </Typography>
                                                    <Stack spacing={0.75}>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={ratio}
                                                            sx={{
                                                                height: 8,
                                                                borderRadius: "999px",
                                                                bgcolor: "var(--surface-soft)",
                                                                "& .MuiLinearProgress-bar": {
                                                                    borderRadius: "999px",
                                                                    bgcolor: priority.color,
                                                                },
                                                            }}
                                                        />
                                                        <Typography
                                                            color="text.secondary"
                                                            sx={{ fontSize: "0.78rem" }}
                                                        >
                                                            {Math.round(ratio)}% do mínimo | mínimo{" "}
                                                            {product.minimumStockLabel}
                                                        </Typography>
                                                    </Stack>
                                                    <Chip
                                                        icon={<WarningAmberRoundedIcon />}
                                                        label={priority.label}
                                                        sx={{
                                                            justifyContent: "flex-start",
                                                            bgcolor: priority.tone,
                                                            color: priority.color,
                                                            fontWeight: 800,
                                                            borderRadius: "999px",
                                                            "& .MuiChip-icon": {
                                                                color: priority.color,
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            </Paper>
                                        );
                                    })
                                )}
                            </Stack>
                        </Stack>
                    </Paper>
                </>
            ) : null}
        </Stack>
    );
}
