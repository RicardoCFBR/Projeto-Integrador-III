import { useEffect, useState, type ReactNode } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LiquorRoundedIcon from "@mui/icons-material/LiquorRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LocalBarRoundedIcon from "@mui/icons-material/LocalBarRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SportsBarRoundedIcon from "@mui/icons-material/SportsBarRounded";
import WineBarRoundedIcon from "@mui/icons-material/WineBarRounded";
import {
    alpha,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link, useParams } from "react-router-dom";

import { getMockTabById, type TabStatus } from "../mocks/tabs";

type QuickCategory = {
    label: string;
    selected?: boolean;
};

type ProductCard = {
    id: number;
    title: string;
    subtitle: string;
    price: string;
    tone: string;
    icon: ReactNode;
};

type OrderItem = {
    id: number;
    quantity: string;
    title: string;
    timeLabel: string;
    value: string;
};

const quickCategories: QuickCategory[] = [
    { label: "Bebidas", selected: true },
    { label: "Porcoes" },
    { label: "Drinks" },
];

const productCards: ProductCard[] = [
    {
        id: 1,
        title: "Cerveja 600ml",
        subtitle: "Original, Heineken, Spaten",
        price: "R$ 16,90",
        tone: "#fff3e0",
        icon: <SportsBarRoundedIcon fontSize="large" />,
    },
    {
        id: 2,
        title: "Batata Frita",
        subtitle: "Porcao inteira (400g)",
        price: "R$ 42,00",
        tone: "#fff1ea",
        icon: <RestaurantRoundedIcon fontSize="large" />,
    },
    {
        id: 3,
        title: "Dose de Gin",
        subtitle: "Tanqueray + Tonica",
        price: "R$ 28,00",
        tone: "#edf5ff",
        icon: <LocalBarRoundedIcon fontSize="large" />,
    },
    {
        id: 4,
        title: "Caipirinha",
        subtitle: "Limao com Cachaca",
        price: "R$ 22,00",
        tone: "#effaf1",
        icon: <LiquorRoundedIcon fontSize="large" />,
    },
    {
        id: 5,
        title: "Taca de Vinho",
        subtitle: "Tinto Malbec 150ml",
        price: "R$ 24,00",
        tone: "#fff0f0",
        icon: <WineBarRoundedIcon fontSize="large" />,
    },
];

const orderItems: OrderItem[] = [
    {
        id: 1,
        quantity: "1x",
        title: "Cerveja Spaten 600ml",
        timeLabel: "Lancado ha 15 min",
        value: "R$ 16,90",
    },
    {
        id: 2,
        quantity: "1x",
        title: "Batata Frita c/ Cheddar",
        timeLabel: "Lancado ha 12 min",
        value: "R$ 48,00",
    },
    {
        id: 3,
        quantity: "2x",
        title: "Dose de Gin Tanqueray",
        timeLabel: "Lancado ha 2 min",
        value: "R$ 56,00",
    },
];

export function TabDetailPage() {
    const params = useParams<{ tabId?: string }>();
    const tab = getMockTabById(params.tabId);
    const [status, setStatus] = useState<TabStatus>(tab.status);

    useEffect(() => {
        setStatus(tab.status);
    }, [tab.id, tab.status]);

    const isClosed = status === "closed";
    const statusLabel = isClosed ? "Encerrada" : "Aberta";
    const primaryActionLabel = isClosed
        ? "Reabrir Comanda"
        : "Fechar Comanda / Ir para Pagamento";
    const statusHint = isClosed
        ? "Esta comanda esta encerrada. Reabra para voltar a lancar itens."
        : "Comanda aberta para novos lancamentos.";

    function handleToggleStatus() {
        setStatus((currentStatus) => (currentStatus === "open" ? "closed" : "open"));
    }

    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: "12px",
                    bgcolor: alpha("#ffffff", 0.78),
                    backdropFilter: "blur(12px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <IconButton
                        aria-label="Voltar para comandas"
                        component={Link}
                        to="/comandas"
                    >
                        <ArrowBackRoundedIcon />
                    </IconButton>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <HomeRoundedIcon color="action" fontSize="small" />
                        <Typography
                            color="text.secondary"
                            sx={{
                                fontSize: "0.78rem",
                                fontWeight: 800,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                            }}
                        >
                            Painel de Atendimento
                        </Typography>
                    </Stack>
                </Stack>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 420px" },
                    gap: 3,
                    minHeight: "calc(100vh - 220px)",
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 4 },
                        borderRadius: "12px",
                        bgcolor: "background.default",
                    }}
                >
                    <Stack spacing={4}>
                        <Stack
                            direction={{ xs: "column", lg: "row" }}
                            spacing={3}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", lg: "flex-end" }}
                        >
                            <Box>
                                <Typography variant="h4" sx={{ mb: 1 }}>
                                    Lancamentos para:{" "}
                                    <Box component="span" sx={{ color: "secondary.main" }}>
                                        {tab.customerName}
                                    </Box>
                                </Typography>

                                <Stack spacing={0.35}>
                                    <Typography
                                        color="text.secondary"
                                        sx={{
                                            fontSize: "0.78rem",
                                            fontWeight: 800,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Comanda n°: {tab.tabLabel.replace("Comanda ", "")}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: "0.78rem",
                                            fontWeight: 800,
                                            color: isClosed ? "text.secondary" : "primary.main",
                                        }}
                                    >
                                        Status: {statusLabel}
                                    </Typography>

                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontSize: "0.8rem" }}
                                    >
                                        {statusHint}
                                    </Typography>
                                </Stack>
                            </Box>

                            <TextField
                                disabled={isClosed}
                                fullWidth
                                placeholder="O que o cliente deseja hoje?"
                                sx={{
                                    maxWidth: 420,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "10px",
                                        bgcolor: "background.paper",
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRoundedIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Stack>

                        <Stack
                            direction={{ xs: "column", lg: "row" }}
                            justifyContent="space-between"
                            spacing={2}
                            alignItems={{ xs: "flex-start", lg: "center" }}
                        >
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <BoltRoundedIcon color="primary" />
                                <Typography variant="h6" color="text.secondary">
                                    Atalhos Rapidos
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1.25} flexWrap="wrap">
                                {quickCategories.map((category) => (
                                    <Chip
                                        key={category.label}
                                        label={category.label}
                                        color={category.selected ? "primary" : "default"}
                                        variant={category.selected ? "filled" : "outlined"}
                                        sx={{
                                            borderRadius: "999px",
                                            fontWeight: 800,
                                            px: 1,
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Stack>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "repeat(2, minmax(0, 1fr))",
                                    xl: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: 2.5,
                            }}
                        >
                            {productCards.map((product) => (
                                <Paper
                                    elevation={0}
                                    key={product.id}
                                    sx={{
                                        p: 3,
                                        borderRadius: "10px",
                                        bgcolor: "background.paper",
                                        boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                                        transition: "transform 160ms ease, box-shadow 160ms ease",
                                        "&:hover": {
                                            transform: "translateY(-3px)",
                                            boxShadow: "0 18px 34px rgba(45, 52, 51, 0.08)",
                                        },
                                    }}
                                >
                                    <Stack spacing={2.25}>
                                        <Box
                                            sx={{
                                                width: 52,
                                                height: 52,
                                                display: "grid",
                                                placeItems: "center",
                                                borderRadius: "8px",
                                                bgcolor: product.tone,
                                                color: "primary.main",
                                            }}
                                        >
                                            {product.icon}
                                        </Box>

                                        <Box>
                                            <Typography variant="h6" sx={{ mb: 0.5 }}>
                                                {product.title}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {product.subtitle}
                                            </Typography>
                                        </Box>

                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                        >
                                            <Typography
                                                sx={{
                                                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                                                    fontWeight: 800,
                                                    fontSize: "1.15rem",
                                                    color: "primary.main",
                                                }}
                                            >
                                                {product.price}
                                            </Typography>

                                            <IconButton
                                                aria-label={`Adicionar ${product.title}`}
                                                disabled={isClosed}
                                                sx={{
                                                    bgcolor: "primary.main",
                                                    color: "primary.contrastText",
                                                    "&.Mui-disabled": {
                                                        bgcolor: "rgba(117, 124, 123, 0.16)",
                                                        color: "rgba(36, 49, 50, 0.32)",
                                                    },
                                                    "&:hover": {
                                                        bgcolor: "primary.dark",
                                                    },
                                                }}
                                            >
                                                <AddRoundedIcon />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: "10px",
                                    border: "2px dashed rgba(117, 124, 123, 0.22)",
                                    bgcolor: "transparent",
                                    display: "grid",
                                    placeItems: "center",
                                    minHeight: 220,
                                }}
                            >
                                <Stack spacing={1.5} alignItems="center">
                                    <GridViewRoundedIcon color="action" fontSize="large" />
                                    <Typography variant="subtitle1" color="text.secondary">
                                        Ver Menu Completo
                                    </Typography>
                                </Stack>
                            </Paper>
                        </Box>
                    </Stack>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        bgcolor: "#eef3f1",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: { xs: 520, xl: "auto" },
                    }}
                >
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ p: 3.5, pb: 2 }}
                    >
                        <Typography variant="h5">Extrato da Comanda</Typography>
                        <Chip
                            color="secondary"
                            label={`${orderItems.length} itens`}
                            sx={{ fontWeight: 800, borderRadius: "999px" }}
                        />
                    </Stack>

                    <Stack spacing={1.75} sx={{ px: 3.5, pb: 3, flex: 1, overflow: "auto" }}>
                        {orderItems.map((item) => (
                            <Paper
                                elevation={0}
                                key={item.id}
                                sx={{
                                    p: 2,
                                    borderRadius: "10px",
                                    bgcolor: "background.paper",
                                    display: "grid",
                                    gridTemplateColumns: "52px minmax(0, 1fr) auto",
                                    gap: 1.75,
                                    alignItems: "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: "8px",
                                        display: "grid",
                                        placeItems: "center",
                                        bgcolor: "#eef3f1",
                                        fontWeight: 800,
                                    }}
                                >
                                    {item.quantity}
                                </Box>

                                <Box>
                                    <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                                    <Typography color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                                        {item.timeLabel}
                                    </Typography>
                                </Box>

                                <Stack alignItems="flex-end" spacing={0.5}>
                                    <Typography sx={{ fontWeight: 800 }}>{item.value}</Typography>
                                    <IconButton
                                        aria-label={`Remover ${item.title}`}
                                        color="error"
                                        disabled={isClosed}
                                        size="small"
                                    >
                                        <CloseRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Paper>
                        ))}

                        <Box
                            sx={{
                                minHeight: 92,
                                borderRadius: "10px",
                                border: "1px dashed rgba(117, 124, 123, 0.24)",
                                display: "grid",
                                placeItems: "center",
                                color: "text.secondary",
                                fontSize: "0.82rem",
                                fontStyle: "italic",
                                opacity: 0.75,
                            }}
                        >
                            {isClosed
                                ? "Comanda encerrada. Reabra para adicionar novos itens."
                                : "Adicione itens para atualizar o total."}
                        </Box>
                    </Stack>

                    <Box
                        sx={{
                            mt: "auto",
                            p: 3.5,
                            bgcolor: "background.paper",
                            boxShadow: "0 -10px 30px rgba(0,0,0,0.04)",
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography color="text.secondary">Subtotal</Typography>
                                <Typography color="text.secondary">R$ 120,90</Typography>
                            </Stack>
                            <Divider />
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">Total Geral</Typography>
                                <Typography
                                    sx={{
                                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                                        fontSize: "1.8rem",
                                        fontWeight: 800,
                                        color: "primary.main",
                                    }}
                                >
                                    R$ 120,90
                                </Typography>
                            </Stack>

                            <Button
                                fullWidth
                                onClick={handleToggleStatus}
                                size="large"
                                startIcon={
                                    isClosed ? <LockOpenRoundedIcon /> : <PaymentsRoundedIcon />
                                }
                                sx={{
                                    mt: 1,
                                    minHeight: 56,
                                    borderRadius: "10px",
                                    background: isClosed
                                        ? "linear-gradient(135deg, #d9dedd 0%, #eff2f1 100%)"
                                        : "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                                    color: isClosed ? "#435150" : "#083f10",
                                    boxShadow: isClosed
                                        ? "0 14px 28px rgba(67, 81, 80, 0.10)"
                                        : "0 16px 32px rgba(28, 109, 37, 0.16)",
                                    "&:hover": {
                                        background: isClosed
                                            ? "linear-gradient(135deg, #cfd5d3 0%, #e7ebea 100%)"
                                            : "linear-gradient(135deg, #16571d 0%, #88df82 100%)",
                                    },
                                }}
                                variant="contained"
                            >
                                {primaryActionLabel}
                            </Button>

                            <Button fullWidth startIcon={<PrintRoundedIcon />} variant="text">
                                Imprimir Conferencia
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            </Box>
        </Stack>
    );
}
