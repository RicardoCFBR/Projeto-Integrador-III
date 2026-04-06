import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

const periodOptions = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "week", label: "Últimos 7 dias" },
    { value: "custom", label: "Período personalizado" },
];

const previewCards = [
    {
        title: "Receita Consolidada",
        value: "Em preparação",
        description: "Vendas do caixa e comandas pagas no período selecionado.",
        icon: <AttachMoneyRoundedIcon color="secondary" />,
    },
    {
        title: "Formas de Pagamento",
        value: "Em preparação",
        description: "Separação entre dinheiro, Pix e cartão para análise financeira.",
        icon: <PaymentsRoundedIcon color="secondary" />,
    },
    {
        title: "Fechamentos de Caixa",
        value: "Em preparação",
        description: "Diferenças apuradas, sessões abertas e conferências encerradas.",
        icon: <CalendarMonthRoundedIcon color="secondary" />,
    },
    {
        title: "Indicadores Gerenciais",
        value: "Em preparação",
        description: "Ticket médio, volume de vendas e comportamento por período.",
        icon: <InsightsRoundedIcon color="secondary" />,
    },
];

export function FinancePage() {
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
                                Área gerencial para consolidar vendas, caixa e resultados do período.
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
                            {periodOptions.map((option, index) => (
                                <Chip
                                    key={option.value}
                                    color={index === 0 ? "primary" : "default"}
                                    label={option.label}
                                    variant={index === 0 ? "filled" : "outlined"}
                                    sx={{ borderRadius: "999px", fontWeight: 800 }}
                                />
                            ))}
                        </Stack>

                        <Button disabled variant="contained">
                            Aplicar filtros
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 2,
                }}
            >
                {previewCards.map((card) => (
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
                <Stack spacing={1.25}>
                    <Typography variant="h5">Estrutura Inicial</Typography>
                    <Typography color="text.secondary">
                        Nesta primeira etapa, a aba financeira foi criada para validar navegação,
                        layout e organização visual. Na próxima etapa entram os KPIs reais do
                        período e o resumo consolidado por forma de pagamento.
                    </Typography>
                </Stack>
            </Paper>
        </Stack>
    );
}
