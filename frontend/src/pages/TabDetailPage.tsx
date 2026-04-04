import { useEffect, useMemo, useState, type ReactNode } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalBarRoundedIcon from "@mui/icons-material/LocalBarRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
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
import { Link, useNavigate, useParams } from "react-router-dom";

import { useTabs } from "../contexts/TabsContext";
import {
    addItemToTab,
    getTabDetail,
    listProducts,
    type Product,
    type TabDetail,
} from "../services/barControlApi";

type ProductCard = Product & {
    icon: ReactNode;
    tone: string;
};

type CategoryFilter = {
    value: string;
    label: string;
};

function resolveProductPresentation(product: Product) {
    switch (product.categorySlug) {
        case "bebidas":
            return { icon: <LocalBarRoundedIcon fontSize="large" />, tone: "#fff3e0" };
        case "drinks":
            return { icon: <LocalBarRoundedIcon fontSize="large" />, tone: "#edf5ff" };
        case "porcoes":
        case "cozinha":
            return { icon: <RestaurantRoundedIcon fontSize="large" />, tone: "#fff1ea" };
        case "mercearia":
        case "conveniencia":
            return { icon: <StorefrontRoundedIcon fontSize="large" />, tone: "#effaf1" };
        default:
            return { icon: <Inventory2RoundedIcon fontSize="large" />, tone: "#f2f4f7" };
    }
}

export function TabDetailPage() {
    const navigate = useNavigate();
    const params = useParams<{ tabId?: string }>();
    const { createTab, refreshTabs, tabs, updateTabStatus } = useTabs();
    const isNewTab = params.tabId === "nova";
    const summaryTab = tabs.find((tab) => tab.id === params.tabId) ?? null;

    const [detail, setDetail] = useState<TabDetail | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [draftCustomerName, setDraftCustomerName] = useState("");
    const [isEditingCustomerName, setIsEditingCustomerName] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("todos");

    useEffect(() => {
        let cancelled = false;

        async function loadProductsData() {
            setProductsLoading(true);
            try {
                const response = await listProducts();
                if (!cancelled) {
                    setProducts(response);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setPageError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Nao foi possivel carregar os produtos.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setProductsLoading(false);
                }
            }
        }

        void loadProductsData();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadTabDetail() {
            if (isNewTab || !params.tabId) {
                setDetail(null);
                setDraftCustomerName("");
                setIsEditingCustomerName(false);
                return;
            }

            setDetailLoading(true);
            setPageError(null);
            try {
                const response = await getTabDetail(params.tabId);
                if (!cancelled) {
                    setDetail(response);
                    setDraftCustomerName(response.customerName);
                    setIsEditingCustomerName(false);
                }
            } catch (requestError) {
                if (!cancelled) {
                    setPageError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Nao foi possivel carregar a comanda.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setDetailLoading(false);
                }
            }
        }

        void loadTabDetail();

        return () => {
            cancelled = true;
        };
    }, [isNewTab, params.tabId]);

    const currentTab = detail ?? summaryTab;
    const isClosed = !isNewTab && currentTab?.status === "closed";
    const hasCustomerName = draftCustomerName.trim().length > 0;
    const customerNameLabel = isNewTab
        ? hasCustomerName
            ? draftCustomerName.trim()
            : "Inserir nome do cliente"
        : currentTab?.customerName ?? "Carregando...";
    const statusLabel = isNewTab ? "Nova" : isClosed ? "Encerrada" : "Aberta";
    const statusHint = isNewTab
        ? "Informe o nome do cliente e confirme para inserir a comanda no mural."
        : isClosed
          ? "Esta comanda esta encerrada. Reabra para voltar a lancar itens."
          : "Comanda aberta para novos lancamentos.";
    const interactionsDisabled = isNewTab || isClosed || detailLoading || actionLoading;
    const totalValue = currentTab?.totalValue ?? "R$ 0,00";
    const items = detail?.items ?? [];
    const itemsCount = detail?.items.length ?? currentTab?.itemsCount ?? 0;
    const tabCode = currentTab?.tabLabel ?? "Comanda #----";

    const categoryFilters = useMemo<CategoryFilter[]>(() => {
        const uniqueCategories = new Map<string, string>();
        products.forEach((product) => {
            uniqueCategories.set(product.categorySlug, product.categoryName);
        });

        return [
            { value: "todos", label: "Todos" },
            ...Array.from(uniqueCategories.entries()).map(([value, label]) => ({ value, label })),
        ];
    }, [products]);

    const visibleProducts = useMemo<ProductCard[]>(() => {
        return products
            .filter((product) => {
                const matchesCategory =
                    selectedCategory === "todos" || product.categorySlug === selectedCategory;
                const normalizedSearch = searchTerm.trim().toLowerCase();
                const matchesSearch =
                    normalizedSearch.length === 0 ||
                    product.name.toLowerCase().includes(normalizedSearch) ||
                    product.description.toLowerCase().includes(normalizedSearch);

                return matchesCategory && matchesSearch;
            })
            .map((product) => ({
                ...product,
                ...resolveProductPresentation(product),
            }));
    }, [products, searchTerm, selectedCategory]);

    async function handleCreateTab() {
        if (!hasCustomerName) {
            setIsEditingCustomerName(true);
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            await createTab(draftCustomerName.trim());
            navigate("/comandas");
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Nao foi possivel abrir a comanda.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleToggleStatus() {
        if (isNewTab || !params.tabId) {
            await handleCreateTab();
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            const response = await updateTabStatus(params.tabId, isClosed ? "open" : "closed");
            setDetail(response);
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Nao foi possivel atualizar a comanda.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleAddProduct(productId: number) {
        if (!params.tabId || isNewTab) {
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            await addItemToTab(params.tabId, productId, 1);
            const updatedDetail = await getTabDetail(params.tabId);
            setDetail(updatedDetail);
            await refreshTabs();
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Nao foi possivel adicionar o item a comanda.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    function handleCustomerNameSubmit() {
        if (!hasCustomerName) {
            return;
        }

        setDraftCustomerName(draftCustomerName.trim());
        setIsEditingCustomerName(false);
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
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h4" sx={{ mb: 1 }}>
                                    {isNewTab ? "Nova comanda para: " : "Lancamentos para: "}
                                    <Box
                                        component="span"
                                        sx={{
                                            color:
                                                isNewTab && !hasCustomerName
                                                    ? "text.secondary"
                                                    : "secondary.main",
                                        }}
                                    >
                                        {customerNameLabel}
                                    </Box>

                                    {isNewTab ? (
                                        <IconButton
                                            aria-label="Editar nome do cliente"
                                            onClick={() =>
                                                setIsEditingCustomerName((currentValue) => !currentValue)
                                            }
                                            size="small"
                                            sx={{ ml: 1, verticalAlign: "middle" }}
                                        >
                                            <EditRoundedIcon fontSize="small" />
                                        </IconButton>
                                    ) : null}
                                </Typography>

                                {isNewTab && isEditingCustomerName ? (
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={1.25}
                                        sx={{ mb: 1.5, maxWidth: 420 }}
                                    >
                                        <TextField
                                            autoFocus
                                            fullWidth
                                            placeholder="Digite o nome do cliente"
                                            size="small"
                                            value={draftCustomerName}
                                            onChange={(event) =>
                                                setDraftCustomerName(event.target.value)
                                            }
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    handleCustomerNameSubmit();
                                                }
                                            }}
                                        />
                                        <IconButton
                                            aria-label="Confirmar nome do cliente"
                                            color="primary"
                                            disabled={!hasCustomerName}
                                            onClick={handleCustomerNameSubmit}
                                        >
                                            <CheckRoundedIcon />
                                        </IconButton>
                                    </Stack>
                                ) : null}

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
                                        Comanda no: {tabCode.replace("Comanda #", "#")}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: "0.78rem",
                                            fontWeight: 800,
                                            color: isNewTab
                                                ? "text.secondary"
                                                : isClosed
                                                  ? "text.secondary"
                                                  : "primary.main",
                                        }}
                                    >
                                        Status: {statusLabel}
                                    </Typography>

                                    <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                                        {statusHint}
                                    </Typography>
                                </Stack>
                            </Box>

                            <TextField
                                disabled={productsLoading || interactionsDisabled}
                                fullWidth
                                placeholder="O que o cliente deseja hoje?"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
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

                        {pageError ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: "10px",
                                    border: "1px solid rgba(167, 59, 33, 0.18)",
                                    bgcolor: "#fff5f2",
                                }}
                            >
                                <Typography color="error">{pageError}</Typography>
                            </Paper>
                        ) : null}

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
                                {categoryFilters.map((category) => (
                                    <Chip
                                        key={category.value}
                                        label={category.label}
                                        color={
                                            selectedCategory === category.value ? "primary" : "default"
                                        }
                                        onClick={() => setSelectedCategory(category.value)}
                                        variant={
                                            selectedCategory === category.value
                                                ? "filled"
                                                : "outlined"
                                        }
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
                            {productsLoading ? (
                                <Typography color="text.secondary">
                                    Carregando produtos...
                                </Typography>
                            ) : null}

                            {!productsLoading && visibleProducts.length === 0 ? (
                                <Typography color="text.secondary">
                                    Nenhum produto encontrado para esse filtro.
                                </Typography>
                            ) : null}

                            {visibleProducts.map((product) => (
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
                                                {product.name}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {product.description || product.categoryName}
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
                                                aria-label={`Adicionar ${product.name}`}
                                                disabled={interactionsDisabled}
                                                onClick={() => void handleAddProduct(product.id)}
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
                            label={`${itemsCount} ${itemsCount === 1 ? "item" : "itens"}`}
                            sx={{ fontWeight: 800, borderRadius: "999px" }}
                        />
                    </Stack>

                    <Stack spacing={1.75} sx={{ px: 3.5, pb: 3, flex: 1, overflow: "auto" }}>
                        {detailLoading && !isNewTab ? (
                            <Typography color="text.secondary">Carregando extrato...</Typography>
                        ) : null}

                        {items.map((item) => (
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
                                    {item.quantityLabel}
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
                                        disabled
                                        size="small"
                                    >
                                        <CloseRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Paper>
                        ))}

                        {items.length === 0 ? (
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
                                {isNewTab
                                    ? "Defina o nome do cliente para inserir esta comanda no mural."
                                    : isClosed
                                      ? "Comanda encerrada. Reabra para adicionar novos itens."
                                      : "Adicione itens para atualizar o total."}
                            </Box>
                        ) : null}
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
                                <Typography color="text.secondary">{totalValue}</Typography>
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
                                    {totalValue}
                                </Typography>
                            </Stack>

                            <Button
                                fullWidth
                                disabled={actionLoading || (isNewTab && !hasCustomerName)}
                                onClick={() => void handleToggleStatus()}
                                size="large"
                                startIcon={
                                    isNewTab ? (
                                        <CheckRoundedIcon />
                                    ) : isClosed ? (
                                        <LockOpenRoundedIcon />
                                    ) : (
                                        <PaymentsRoundedIcon />
                                    )
                                }
                                sx={{
                                    mt: 1,
                                    minHeight: 56,
                                    borderRadius: "10px",
                                    background: isClosed && !isNewTab
                                        ? "linear-gradient(135deg, #d9dedd 0%, #eff2f1 100%)"
                                        : "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                                    color: isClosed && !isNewTab ? "#435150" : "#083f10",
                                    boxShadow: isClosed && !isNewTab
                                        ? "0 14px 28px rgba(67, 81, 80, 0.10)"
                                        : "0 16px 32px rgba(28, 109, 37, 0.16)",
                                    "&.Mui-disabled": {
                                        background:
                                            "linear-gradient(135deg, #dfe6e2 0%, #eef2f0 100%)",
                                        color: "rgba(67, 81, 80, 0.6)",
                                    },
                                    "&:hover": {
                                        background: isClosed && !isNewTab
                                            ? "linear-gradient(135deg, #cfd5d3 0%, #e7ebea 100%)"
                                            : "linear-gradient(135deg, #16571d 0%, #88df82 100%)",
                                    },
                                }}
                                variant="contained"
                            >
                                {isNewTab
                                    ? "Abrir Comanda"
                                    : isClosed
                                      ? "Reabrir Comanda"
                                      : "Fechar Comanda / Ir para Pagamento"}
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
