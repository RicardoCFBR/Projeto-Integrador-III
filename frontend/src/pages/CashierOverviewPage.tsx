import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import { alpha, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

type CashSaleSummary = {
    sequence: number;
    customerLabel: string;
    soldAt: string;
    paymentMethod: string;
    totalLabel: string;
    status: "paga" | "estornada";
};

type CashMovement = {
    sequence: number;
    label: string;
    movedAt: string;
    valueLabel: string;
    tone: "neutral" | "danger" | "success";
};

function formatShortDate(date: Date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    return `${day}${month}${year}`;
}

function formatSaleCode(sequence: number, date: Date) {
    return `CX-${formatShortDate(date)}-${String(sequence).padStart(3, "0")}`;
}

function formatMovementCode(sequence: number) {
    return `MOV-${String(sequence).padStart(2, "0")}`;
}

const referenceDate = new Date(2026, 3, 4);

const salesOfDay: CashSaleSummary[] = [
    {
        sequence: 1,
        customerLabel: "Venda no balcão",
        soldAt: "08:12",
        paymentMethod: "Pix",
        totalLabel: "R$ 48,70",
        status: "paga",
    },
    {
        sequence: 2,
        customerLabel: "Venda no balcão",
        soldAt: "09:35",
        paymentMethod: "Cartão",
        totalLabel: "R$ 29,90",
        status: "paga",
    },
    {
        sequence: 3,
        customerLabel: "Venda no balcão",
        soldAt: "11:08",
        paymentMethod: "Dinheiro",
        totalLabel: "R$ 16,50",
        status: "paga",
    },
];

const cashMovements: CashMovement[] = [
    {
        sequence: 1,
        label: "Abertura de caixa",
        movedAt: "07:55",
        valueLabel: "R$ 150,00",
        tone: "success",
    },
    {
        sequence: 2,
        label: "Sangria parcial",
        movedAt: "12:10",
        valueLabel: "R$ 80,00",
        tone: "danger",
    },
    {
        sequence: 3,
        label: "Suprimento",
        movedAt: "13:05",
        valueLabel: "R$ 50,00",
        tone: "neutral",
    },
];

const summaryCards = [
    {
        label: "Vendas Hoje",
        value: "R$ 95,10",
        hint: "3 operações registradas",
        icon: <AttachMoneyRoundedIcon color="secondary" />,
    },
    {
        label: "Dinheiro em Caixa",
        value: "R$ 120,00",
        hint: "Saldo parcial do turno",
        icon: <SavingsRoundedIcon color="secondary" />,
    },
    {
        label: "Movimentacoes",
        value: "3",
        hint: "Abertura, sangria e suprimento",
        icon: <ReceiptLongRoundedIcon color="secondary" />,
    },
];

function movementColor(tone: CashMovement["tone"]) {
    switch (tone) {
        case "danger":
            return "#a73b21";
        case "success":
            return "#1c6d25";
        default:
            return "#4a5a5b";
    }
}

export function CashierOverviewPage() {
    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: "12px",
                    bgcolor: alpha("#ffffff", 0.78),
                    backdropFilter: "blur(12px)",
                }}
            >
                <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", lg: "center" }}
                >
                    <Box>
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                            <PointOfSaleRoundedIcon color="secondary" />
                            <Typography variant="h4">Venda no Caixa</Typography>
                        </Stack>

                        <Typography color="text.secondary">
                            Acompanhe as vendas do dia, movimentações do caixa e o fechamento do
                            turno.
                        </Typography>
                    </Box>

                    <Button
                        component={Link}
                        to="/caixa/nova-venda"
                        size="large"
                        startIcon={<AddRoundedIcon />}
                        sx={{
                            minHeight: 54,
                            px: 3,
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                            color: "#083f10",
                            boxShadow: "0 16px 32px rgba(28, 109, 37, 0.16)",
                            "&:hover": {
                                background: "linear-gradient(135deg, #16571d 0%, #88df82 100%)",
                            },
                        }}
                        variant="contained"
                    >
                        Inserir Venda
                    </Button>
                </Stack>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        xl: "minmax(0, 1fr) 360px",
                    },
                    gap: 3,
                }}
            >
                <Stack spacing={3}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: 2,
                        }}
                    >
                        {summaryCards.map((card) => (
                            <Paper
                                elevation={0}
                                key={card.label}
                                sx={{
                                    p: 2.5,
                                    borderRadius: "12px",
                                    bgcolor: "background.paper",
                                    boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                                }}
                            >
                                <Stack spacing={1.25}>
                                    {card.icon}
                                    <Typography color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                                        {card.label}
                                    </Typography>
                                    <Typography variant="h5">{card.value}</Typography>
                                    <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                                        {card.hint}
                                    </Typography>
                                </Stack>
                            </Paper>
                        ))}
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2.5, md: 3 },
                            borderRadius: "12px",
                            bgcolor: "background.default",
                        }}
                    >
                        <Stack spacing={2.25}>
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={1.5}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", md: "center" }}
                            >
                                <Box>
                                    <Typography variant="h5" sx={{ mb: 0.5 }}>
                                        Vendas do Dia
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Visualize as operações finalizadas no caixa de hoje.
                                    </Typography>
                                </Box>

                                <Chip
                                    color="secondary"
                                    label={`${salesOfDay.length} vendas registradas`}
                                    sx={{ borderRadius: "999px", fontWeight: 800 }}
                                />
                            </Stack>

                            <Stack spacing={1.5}>
                                {salesOfDay.map((sale) => (
                                    <Paper
                                        elevation={0}
                                        key={sale.sequence}
                                        sx={{
                                            p: 2.25,
                                            borderRadius: "10px",
                                            bgcolor: "background.paper",
                                            boxShadow: "0 10px 24px rgba(45, 52, 51, 0.04)",
                                        }}
                                    >
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={2}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "flex-start", md: "center" }}
                                        >
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                                                    {sale.customerLabel}
                                                </Typography>
                                                <Typography
                                                    color="text.secondary"
                                                    sx={{ fontSize: "0.82rem" }}
                                                >
                                                    {formatSaleCode(sale.sequence, referenceDate)} -{" "}
                                                    {sale.soldAt} - {sale.paymentMethod}
                                                </Typography>
                                            </Box>

                                            <Stack
                                                direction="row"
                                                spacing={1.5}
                                                alignItems="center"
                                            >
                                                <Chip
                                                    label={sale.status === "paga" ? "Paga" : "Estornada"}
                                                    color={
                                                        sale.status === "paga" ? "success" : "default"
                                                    }
                                                    sx={{ borderRadius: "999px", fontWeight: 800 }}
                                                />
                                                <Typography variant="h6">{sale.totalLabel}</Typography>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </Stack>
                    </Paper>
                </Stack>

                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3 },
                        borderRadius: "12px",
                        bgcolor: "#eef3f1",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                    }}
                >
                    <Box>
                        <Typography variant="h5" sx={{ mb: 0.5 }}>
                            Movimentacoes do Caixa
                        </Typography>
                        <Typography color="text.secondary">
                            Registros auxiliares para sangria, suprimento e fechamento.
                        </Typography>
                    </Box>

                    <Stack spacing={1.5}>
                        {cashMovements.map((movement) => (
                            <Paper
                                elevation={0}
                                key={movement.sequence}
                                sx={{
                                    p: 2,
                                    borderRadius: "10px",
                                    bgcolor: "background.paper",
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1.5}
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 0.4 }}>
                                            {movement.label}
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                                            {formatMovementCode(movement.sequence)} -{" "}
                                            {movement.movedAt}
                                        </Typography>
                                    </Box>

                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            color: movementColor(movement.tone),
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {movement.valueLabel}
                                    </Typography>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>

                    <Stack spacing={1.25} sx={{ mt: "auto" }}>
                        <Button fullWidth variant="outlined">
                            Registrar Sangria
                        </Button>
                        <Button fullWidth variant="outlined">
                            Registrar Suprimento
                        </Button>
                        <Button
                            fullWidth
                            startIcon={<ReceiptLongRoundedIcon />}
                            sx={{
                                minHeight: 54,
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                                color: "#083f10",
                                "&:hover": {
                                    background: "linear-gradient(135deg, #16571d 0%, #88df82 100%)",
                                },
                            }}
                            variant="contained"
                        >
                            Fechar Caixa
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Stack>
    );
}
