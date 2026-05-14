import { useEffect, useMemo, useState } from "react";

import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import {
    getFinanceClosingMetrics,
    getFinanceCharts,
    getFinanceOperations,
    getFinanceSummary,
    type FinanceChartSalesPoint,
    type FinanceClosingSession,
    type FinanceOperation,
    type FinancePaymentDistributionPoint,
    type FinanceSummary,
} from "../services/barControlApi";
import {
    Bar,
    BarChart,
    Cell,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type FinancePeriod = "hoje" | "ontem" | "ultimos_7_dias" | "personalizado";
type FinanceOperationView = "all" | "sales" | "movements";

const periodOptions: Array<{ value: FinancePeriod; label: string }> = [
    { value: "hoje", label: "Hoje" },
    { value: "ontem", label: "Ontem" },
    { value: "ultimos_7_dias", label: "Últimos 7 dias" },
    { value: "personalizado", label: "Período personalizado" },
];

const operationViewOptions: Array<{ value: FinanceOperationView; label: string }> = [
    { value: "all", label: "Tudo" },
    { value: "sales", label: "Vendas" },
    { value: "movements", label: "Movimentações" },
];

const emptySummary: FinanceSummary = {
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

const closingStatusColorMap: Record<
    FinanceClosingSession["status"],
    "success" | "warning" | "error"
> = {
    conferido: "success",
    sobra: "warning",
    falta: "error",
};

const paymentChartColors: Record<FinancePaymentDistributionPoint["paymentMethod"], string> = {
    cash: "#2E7D32",
    pix: "#0288D1",
    debit: "#F9A825",
    credit: "#8E24AA",
};

function normalizeTooltipValue(
    value: string | number | ReadonlyArray<string | number> | undefined,
) {
    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "string") {
        return Number.parseFloat(value);
    }

    if (Array.isArray(value) && value.length > 0) {
        const firstValue = value[0];
        return typeof firstValue === "number"
            ? firstValue
            : Number.parseFloat(String(firstValue));
    }

    return 0;
}

export function FinancePage() {
    const [period, setPeriod] = useState<FinancePeriod>("hoje");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [summary, setSummary] = useState<FinanceSummary>(emptySummary);
    const [operations, setOperations] = useState<FinanceOperation[]>([]);
    const [closingSessions, setClosingSessions] = useState<FinanceClosingSession[]>([]);
    const [salesByDay, setSalesByDay] = useState<FinanceChartSalesPoint[]>([]);
    const [paymentDistribution, setPaymentDistribution] = useState<
        FinancePaymentDistributionPoint[]
    >([]);
    const [operationView, setOperationView] = useState<FinanceOperationView>("all");
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    const summaryCards = useMemo(
        () => [
            {
                title: "Receita Consolidada",
                value: summary.totalSold,
                description: "Vendas no caixa e comandas pagas no período selecionado.",
                icon: <AttachMoneyRoundedIcon color="secondary" />,
            },
            {
                title: "Dinheiro",
                value: summary.totalCash,
                description: "Valor recebido em dinheiro.",
                icon: <PointOfSaleRoundedIcon color="secondary" />,
            },
            {
                title: "Pix",
                value: summary.totalPix,
                description: "Pagamentos registrados em Pix.",
                icon: <PaymentsRoundedIcon color="secondary" />,
            },
            {
                title: "Débito",
                value: summary.totalDebit,
                description: "Pagamentos processados no débito.",
                icon: <PaymentsRoundedIcon color="secondary" />,
            },
            {
                title: "Crédito",
                value: summary.totalCredit,
                description: "Pagamentos processados no crédito.",
                icon: <PaymentsRoundedIcon color="secondary" />,
            },
            {
                title: "Sangrias",
                value: summary.totalWithdrawals,
                description: "Retiradas registradas no caixa.",
                icon: <RemoveCircleOutlineRoundedIcon color="secondary" />,
            },
            {
                title: "Suprimentos",
                value: summary.totalSupplies,
                description: "Entradas adicionais no caixa.",
                icon: <TrendingUpRoundedIcon color="secondary" />,
            },
            {
                title: "Ticket Médio",
                value: summary.averageTicket,
                description: "Média por venda concluída.",
                icon: <InsightsRoundedIcon color="secondary" />,
            },
            {
                title: "Fechamentos",
                value: String(summary.closedSessionsCount),
                description: `Diferença acumulada: ${summary.totalDifferences}`,
                icon: <CalendarMonthRoundedIcon color="secondary" />,
            },
        ],
        [summary],
    );

    const filteredOperations = useMemo(() => {
        if (operationView === "sales") {
            return operations.filter((operation) => operation.type === "sale");
        }

        if (operationView === "movements") {
            return operations.filter((operation) => operation.type === "movement");
        }

        return operations;
    }, [operationView, operations]);

    async function loadFinanceData() {
        try {
            setLoading(true);
            setPageError(null);

            const filterInput = {
                period,
                startDate: period === "personalizado" ? startDate : undefined,
                endDate: period === "personalizado" ? endDate : undefined,
            } as const;

            const [summaryResponse, operationsResponse, closingsResponse, chartsResponse] =
                await Promise.all([
                getFinanceSummary(filterInput),
                getFinanceOperations(filterInput),
                getFinanceClosingMetrics(filterInput),
                getFinanceCharts(filterInput),
            ]);

            setSummary(summaryResponse);
            setOperations(operationsResponse);
            setClosingSessions(closingsResponse);
            setSalesByDay(chartsResponse.salesByDay);
            setPaymentDistribution(chartsResponse.paymentDistribution);
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível carregar os dados financeiros.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadFinanceData();
    }, []);

    return (
        <Stack spacing={3}>
            <Box>
                <Stack spacing={2}>
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
                            Financeiro
                        </h1>
                        <Typography color="text.secondary" sx={{ mt: 2.5 }}>
                            Resumo gerencial com vendas, caixa e indicadores por período.
                        </Typography>
                    </Box>

                    <Stack
                        direction={{ xs: "column", lg: "row" }}
                        spacing={1.25}
                        alignItems={{ xs: "stretch", lg: "center" }}
                        justifyContent="space-between"
                    >
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {periodOptions.map((option) => (
                                <Chip
                                    key={option.value}
                                    color={period === option.value ? "primary" : "default"}
                                    label={option.label}
                                    onClick={() => setPeriod(option.value)}
                                    variant={period === option.value ? "filled" : "outlined"}
                                    sx={{ borderRadius: "999px", fontWeight: 800 }}
                                />
                            ))}
                        </Stack>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
                            {period === "personalizado" ? (
                                <>
                                    <TextField
                                        label="Data inicial"
                                        type="date"
                                        value={startDate}
                                        onChange={(event) => setStartDate(event.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                    />
                                    <TextField
                                        label="Data final"
                                        type="date"
                                        value={endDate}
                                        onChange={(event) => setEndDate(event.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                    />
                                </>
                            ) : null}

                            <Button onClick={() => void loadFinanceData()} variant="contained">
                                Aplicar filtros
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </Box>

            {pageError ? (
                <Typography color="error" sx={{ fontWeight: 700 }}>
                    {pageError}
                </Typography>
            ) : null}

            {loading ? (
                <Box sx={{ minHeight: "32vh", display: "grid", placeItems: "center" }}>
                    <CircularProgress size={30} />
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
                                lg: "repeat(4, minmax(0, 1fr))",
                            },
                            gap: 2,
                        }}
                    >
                        {summaryCards.map((card) => (
                            <Paper
                                elevation={0}
                                key={card.title}
                                sx={{
                                    p: 3,
                                    borderRadius: "12px",
                                    bgcolor: "background.paper",
                                    boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                                }}
                            >
                                <Stack spacing={1.5}>
                                    {card.icon}
                                    <Typography color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="h5">{card.value}</Typography>
                                    <Typography color="text.secondary">{card.description}</Typography>
                                </Stack>
                            </Paper>
                        ))}
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                xl: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: 2,
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, md: 3 },
                                borderRadius: "12px",
                                bgcolor: "background.paper",
                                boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                            }}
                        >
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant="h5">Vendas por Dia</Typography>
                                    <Typography color="text.secondary">
                                        Quantidade de vendas e valor total por dia no período.
                                    </Typography>
                                </Box>
                                <Box sx={{ width: "100%", height: 280 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={salesByDay}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="dateLabel" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    const normalizedValue = normalizeTooltipValue(value);
                                                    return [
                                                    name === "total"
                                                        ? new Intl.NumberFormat("pt-BR", {
                                                              style: "currency",
                                                              currency: "BRL",
                                                          }).format(normalizedValue)
                                                        : normalizedValue,
                                                    name === "total" ? "Faturamento" : "Vendas",
                                                ];
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="salesCount"
                                                name="Vendas"
                                                fill="#0288D1"
                                                radius={[6, 6, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Stack>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, md: 3 },
                                borderRadius: "12px",
                                bgcolor: "background.paper",
                                boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                            }}
                        >
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant="h5">Distribuição por Pagamento</Typography>
                                    <Typography color="text.secondary">
                                        Percentual de dinheiro, Pix, débito e crédito no faturamento.
                                    </Typography>
                                </Box>
                                <Box sx={{ width: "100%", height: 280 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={paymentDistribution}
                                                dataKey="total"
                                                nameKey="paymentMethodLabel"
                                                innerRadius={58}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                label={({ payload }) =>
                                                    payload
                                                        ? `${payload.paymentMethodLabel} ${payload.percentage.toFixed(1)}%`
                                                        : ""
                                                }
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
                                                    const normalizedValue = normalizeTooltipValue(value);
                                                    const payload =
                                                        item?.payload as
                                                            | FinancePaymentDistributionPoint
                                                            | undefined;
                                                    return [
                                                        new Intl.NumberFormat("pt-BR", {
                                                            style: "currency",
                                                            currency: "BRL",
                                                        }).format(normalizedValue),
                                                        payload
                                                            ? `${payload.paymentMethodLabel} (${payload.percentage.toFixed(1)}%)`
                                                            : "Forma de pagamento",
                                                    ];
                                                }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Stack>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2.5, md: 3 },
                                borderRadius: "12px",
                                bgcolor: "background.paper",
                                boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                            }}
                        >
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant="h5">Evolução do Faturamento</Typography>
                                    <Typography color="text.secondary">
                                        Tendência do valor vendido ao longo do período selecionado.
                                    </Typography>
                                </Box>
                                <Box sx={{ width: "100%", height: 280 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={salesByDay}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="dateLabel" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value) => [
                                                    new Intl.NumberFormat("pt-BR", {
                                                        style: "currency",
                                                        currency: "BRL",
                                                    }).format(normalizeTooltipValue(value)),
                                                    "Faturamento",
                                                ]}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="total"
                                                name="Faturamento"
                                                stroke="#2E7D32"
                                                strokeWidth={3}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, md: 3 },
                            borderRadius: "12px",
                            bgcolor: "background.paper",
                            boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                        }}
                    >
                        <Stack spacing={2}>
                            <Stack
                                direction={{ xs: "column", lg: "row" }}
                                spacing={1.25}
                                alignItems={{ xs: "stretch", lg: "center" }}
                                justifyContent="space-between"
                            >
                                <Box>
                                    <Typography variant="h5">Tabela Analítica do Período</Typography>
                                    <Typography color="text.secondary">
                                        {filteredOperations.length} registros encontrados para o filtro
                                        atual.
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {operationViewOptions.map((option) => (
                                        <Chip
                                            key={option.value}
                                            color={
                                                operationView === option.value ? "secondary" : "default"
                                            }
                                            label={option.label}
                                            onClick={() => setOperationView(option.value)}
                                            variant={
                                                operationView === option.value ? "filled" : "outlined"
                                            }
                                            sx={{ borderRadius: "999px", fontWeight: 800 }}
                                        />
                                    ))}
                                </Stack>
                            </Stack>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Código</TableCell>
                                            <TableCell>Descrição</TableCell>
                                            <TableCell>Identificação</TableCell>
                                            <TableCell>Data</TableCell>
                                            <TableCell>Horário</TableCell>
                                            <TableCell align="right">Valor</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredOperations.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    sx={{ py: 4, color: "text.secondary" }}
                                                >
                                                    Nenhum registro encontrado para o período
                                                    selecionado.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredOperations.map((operation) => (
                                                <TableRow hover key={operation.id}>
                                                    <TableCell>{operation.typeLabel}</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>
                                                        {operation.code}
                                                    </TableCell>
                                                    <TableCell>{operation.description}</TableCell>
                                                    <TableCell>{operation.identification}</TableCell>
                                                    <TableCell>{operation.dateLabel}</TableCell>
                                                    <TableCell>{operation.timeLabel}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                        {operation.value}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, md: 3 },
                            borderRadius: "12px",
                            bgcolor: "background.paper",
                            boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                        }}
                    >
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="h5">Últimos Fechamentos de Caixa</Typography>
                                <Typography color="text.secondary">
                                    Conferência das sessões fechadas, com sobra, falta ou fechamento
                                    conferido.
                                </Typography>
                            </Box>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Sessão</TableCell>
                                            <TableCell>Operador</TableCell>
                                            <TableCell>Abertura</TableCell>
                                            <TableCell>Fechamento</TableCell>
                                            <TableCell>Esperado</TableCell>
                                            <TableCell>Conferido</TableCell>
                                            <TableCell>Diferença</TableCell>
                                            <TableCell>Detalhes</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {closingSessions.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={9}
                                                    sx={{ py: 4, color: "text.secondary" }}
                                                >
                                                    Nenhum fechamento encontrado para o período
                                                    selecionado.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            closingSessions.map((session) => (
                                                <TableRow hover key={session.id}>
                                                    <TableCell sx={{ fontWeight: 700 }}>
                                                        Caixa #{session.id}
                                                    </TableCell>
                                                    <TableCell>{session.operatorName}</TableCell>
                                                    <TableCell>{session.openedTimeLabel}</TableCell>
                                                    <TableCell>{session.closedTimeLabel}</TableCell>
                                                    <TableCell>{session.expectedTotal}</TableCell>
                                                    <TableCell>{session.checkedTotal}</TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 700,
                                                            color:
                                                                session.totalDifferenceNumber < 0
                                                                    ? "error.main"
                                                                    : session.totalDifferenceNumber > 0
                                                                      ? "warning.main"
                                                                      : "success.main",
                                                        }}
                                                    >
                                                        {session.totalDifference}
                                                    </TableCell>
                                                    <TableCell>
                                                        Din: {session.cashDifference}
                                                        {" | "}Pix: {session.pixDifference}
                                                        {" | "}Déb: {session.debitDifference}
                                                        {" | "}Créd: {session.creditDifference}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={session.statusLabel}
                                                            color={closingStatusColorMap[session.status]}
                                                            size="small"
                                                            sx={{ fontWeight: 800 }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    </Paper>
                </>
            ) : null}
        </Stack>
    );
}
