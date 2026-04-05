import { useEffect, useMemo, useState } from "react";

import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import {
    getCashSaleDetail,
    listCashSalesHistory,
    type CashSale,
    type CashSalePaymentMethod,
} from "../services/barControlApi";

type HistoryPeriod = "hoje" | "ontem" | "ultimos_7_dias" | "personalizado";
type PaymentFilter = CashSalePaymentMethod | "all";

export function SalesHistoryPage() {
    const [sales, setSales] = useState<CashSale[]>([]);
    const [selectedSale, setSelectedSale] = useState<CashSale | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [period, setPeriod] = useState<HistoryPeriod>("hoje");
    const [codeFilter, setCodeFilter] = useState("");
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const totalSalesValue = useMemo(
        () => sales.reduce((accumulator, sale) => accumulator + sale.totalNumber, 0),
        [sales],
    );

    async function loadSales() {
        try {
            setLoading(true);
            setPageError(null);
            const response = await listCashSalesHistory({
                period,
                code: codeFilter.trim(),
                paymentMethod: paymentFilter,
                startDate: period === "personalizado" ? startDate : undefined,
                endDate: period === "personalizado" ? endDate : undefined,
            });
            setSales(response);
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível carregar o histórico de vendas.",
            );
        } finally {
            setLoading(false);
        }
    }

    async function openSaleDetail(saleId: number) {
        try {
            setDetailLoading(true);
            const response = await getCashSaleDetail(saleId);
            setSelectedSale(response);
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível carregar o detalhe da venda.",
            );
        } finally {
            setDetailLoading(false);
        }
    }

    useEffect(() => {
        void loadSales();
    }, []);

    return (
        <>
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
                            <ReceiptLongRoundedIcon color="secondary" />
                            <Box>
                                <Typography variant="h4">Histórico de Vendas</Typography>
                                <Typography color="text.secondary">
                                    Consulte vendas antigas e visualize os recibos emitidos.
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5}>
                            <TextField
                                select
                                label="Período"
                                value={period}
                                onChange={(event) => setPeriod(event.target.value as HistoryPeriod)}
                                sx={{ minWidth: 180 }}
                            >
                                <MenuItem value="hoje">Hoje</MenuItem>
                                <MenuItem value="ontem">Ontem</MenuItem>
                                <MenuItem value="ultimos_7_dias">Últimos 7 dias</MenuItem>
                                <MenuItem value="personalizado">Período personalizado</MenuItem>
                            </TextField>

                            <TextField
                                label="Código da venda"
                                value={codeFilter}
                                onChange={(event) => setCodeFilter(event.target.value)}
                                placeholder="CX-040426-001"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRoundedIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ minWidth: 220 }}
                            />

                            <TextField
                                select
                                label="Pagamento"
                                value={paymentFilter}
                                onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
                                sx={{ minWidth: 180 }}
                            >
                                <MenuItem value="all">Todos</MenuItem>
                                <MenuItem value="cash">Dinheiro</MenuItem>
                                <MenuItem value="pix">Pix</MenuItem>
                                <MenuItem value="card">Cartão</MenuItem>
                            </TextField>

                            {period === "personalizado" ? (
                                <>
                                    <TextField
                                        label="Data inicial"
                                        type="date"
                                        value={startDate}
                                        onChange={(event) => setStartDate(event.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="Data final"
                                        type="date"
                                        value={endDate}
                                        onChange={(event) => setEndDate(event.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </>
                            ) : null}

                            <Button onClick={() => void loadSales()} variant="contained">
                                Filtrar
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            lg: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: 2,
                    }}
                >
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px" }}>
                        <Typography color="text.secondary">Vendas Encontradas</Typography>
                        <Typography variant="h4">{sales.length}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px" }}>
                        <Typography color="text.secondary">Total do Período</Typography>
                        <Typography variant="h4">
                            {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                            }).format(totalSalesValue)}
                        </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px" }}>
                        <Typography color="text.secondary">Consulta</Typography>
                        <Typography variant="h6">Somente leitura</Typography>
                    </Paper>
                </Box>

                <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: "12px" }}>
                    {pageError ? (
                        <Typography color="error" sx={{ mb: 2, fontWeight: 700 }}>
                            {pageError}
                        </Typography>
                    ) : null}

                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Código</TableCell>
                                <TableCell>Horário</TableCell>
                                <TableCell>Pagamento</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6}>Carregando vendas...</TableCell>
                                </TableRow>
                            ) : sales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6}>Nenhuma venda encontrada para os filtros.</TableCell>
                                </TableRow>
                            ) : (
                                sales.map((sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{sale.code}</TableCell>
                                        <TableCell>{sale.timeLabel}</TableCell>
                                        <TableCell>{sale.paymentMethodLabel}</TableCell>
                                        <TableCell>{sale.statusLabel}</TableCell>
                                        <TableCell align="right">{sale.total}</TableCell>
                                        <TableCell align="right">
                                            <Button onClick={() => void openSaleDetail(sale.id)} size="small">
                                                Visualizar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Paper>
            </Stack>

            <Dialog
                fullWidth
                maxWidth="sm"
                onClose={() => setSelectedSale(null)}
                open={selectedSale !== null}
            >
                <DialogTitle>Detalhe da Venda</DialogTitle>
                <DialogContent>
                    {detailLoading || !selectedSale ? (
                        <Typography>Carregando detalhe...</Typography>
                    ) : (
                        <Stack spacing={2.5} sx={{ pt: 1 }}>
                            <Box>
                                <Typography variant="h5">{selectedSale.code}</Typography>
                                <Typography color="text.secondary">
                                    {selectedSale.timeLabel} | {selectedSale.paymentMethodLabel}
                                </Typography>
                            </Box>

                            <Stack spacing={1}>
                                {selectedSale.items.map((item) => (
                                    <Paper key={item.id} elevation={0} sx={{ p: 2, borderRadius: "10px", bgcolor: "#eef3f1" }}>
                                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                                            <Box>
                                                <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                                                <Typography color="text.secondary">
                                                    {item.quantity} x {item.unitPrice}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontWeight: 800 }}>{item.total}</Typography>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>

                            <Paper elevation={0} sx={{ p: 2, borderRadius: "10px", bgcolor: "#f7f9f8" }}>
                                <Stack spacing={1}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="text.secondary">Forma de pagamento</Typography>
                                        <Typography>{selectedSale.paymentMethodLabel}</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="text.secondary">Total</Typography>
                                        <Typography sx={{ fontWeight: 800 }}>{selectedSale.total}</Typography>
                                    </Stack>
                                    {selectedSale.receivedAmount ? (
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography color="text.secondary">Valor recebido</Typography>
                                            <Typography>{selectedSale.receivedAmount}</Typography>
                                        </Stack>
                                    ) : null}
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography color="text.secondary">Troco</Typography>
                                        <Typography>{selectedSale.changeAmount}</Typography>
                                    </Stack>
                                    {selectedSale.observation ? (
                                        <Stack spacing={0.5}>
                                            <Typography color="text.secondary">Observação</Typography>
                                            <Typography>{selectedSale.observation}</Typography>
                                        </Stack>
                                    ) : null}
                                </Stack>
                            </Paper>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setSelectedSale(null)}>Fechar</Button>
                    <Button disabled variant="outlined">
                        Reimprimir
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
