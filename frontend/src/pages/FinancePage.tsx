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
    getFinanceOperations,
    getFinanceSummary,
    type FinanceOperation,
    type FinanceSummary,
} from "../services/barControlApi";

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
    totalCard: "R$ 0,00",
    totalCardNumber: 0,
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

export function FinancePage() {
    const [period, setPeriod] = useState<FinancePeriod>("hoje");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [summary, setSummary] = useState<FinanceSummary>(emptySummary);
    const [operations, setOperations] = useState<FinanceOperation[]>([]);
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
                title: "Cartão",
                value: summary.totalCard,
                description: "Pagamentos processados em cartão.",
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

            const [summaryResponse, operationsResponse] = await Promise.all([
                getFinanceSummary(filterInput),
                getFinanceOperations(filterInput),
            ]);

            setSummary(summaryResponse);
            setOperations(operationsResponse);
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
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: "12px",
                    bgcolor: "rgba(255,255,255,0.82)",
                    backdropFilter: "blur(12px)",
                }}
            >
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <PaymentsRoundedIcon color="secondary" />
                        <Box>
                            <Typography variant="h4">Financeiro</Typography>
                            <Typography color="text.secondary">
                                Resumo gerencial com vendas, caixa e indicadores por período.
                            </Typography>
                        </Box>
                    </Stack>

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
            </Paper>

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
                                                    Nenhum registro encontrado para o período selecionado.
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
                </>
            ) : null}
        </Stack>
    );
}
