import { useEffect, useMemo, useState, type ReactNode } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalBarRoundedIcon from "@mui/icons-material/LocalBarRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useCashSession } from "../contexts/CashSessionContext";
import { useTabs } from "../contexts/TabsContext";
import {
    addItemToTab,
    type CashSalePaymentMethod,
    decrementTabItem,
    getTabDetail,
    incrementTabItem,
    listProducts,
    payTab,
    type Product,
    type TabDetail,
} from "../services/barControlApi";
import { printTabConference } from "../utils/printTemplates";

type ProductCard = Product & {
    icon: ReactNode;
    tone: string;
};

type CategoryFilter = {
    value: string;
    label: string;
};

const EXCLUDED_TAB_CATEGORY_SLUGS = new Set(["mercearia", "conveniencia"]);

function resolveProductPresentation(product: Product, darkMode: boolean) {
    switch (product.categorySlug) {
        case "bebidas":
            return {
                icon: <LocalBarRoundedIcon fontSize="large" />,
                tone: darkMode ? "rgba(231, 151, 58, 0.16)" : "#fff3e0",
            };
        case "drinks":
            return {
                icon: <LocalBarRoundedIcon fontSize="large" />,
                tone: darkMode ? "rgba(110, 163, 255, 0.16)" : "#edf5ff",
            };
        case "porcoes":
        case "cozinha":
            return {
                icon: <RestaurantRoundedIcon fontSize="large" />,
                tone: darkMode ? "rgba(255, 133, 104, 0.16)" : "#fff1ea",
            };
        case "mercearia":
        case "conveniencia":
            return {
                icon: <StorefrontRoundedIcon fontSize="large" />,
                tone: darkMode ? "rgba(85, 220, 40, 0.14)" : "#effaf1",
            };
        default:
            return {
                icon: <Inventory2RoundedIcon fontSize="large" />,
                tone: darkMode ? "rgba(110, 163, 255, 0.14)" : "#f2f4f7",
            };
    }
}

function isProductOutOfStock(product: Product) {
    return product.controlsStock && product.currentStock <= 0;
}

export function TabDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const params = useParams<{ tabId?: string }>();
    const { createTab, refreshTabs, tabs, updateTabStatus } = useTabs();
    const { refreshCashSession } = useCashSession();
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
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<CashSalePaymentMethod>("pix");
    const [receivedAmountInput, setReceivedAmountInput] = useState("");
    const [paymentObservation, setPaymentObservation] = useState("");

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
    const isPaid = !isNewTab && Boolean(currentTab?.isPaid);
    const hasCustomerName = draftCustomerName.trim().length > 0;
    const customerNameLabel = isNewTab
        ? hasCustomerName
            ? draftCustomerName.trim()
            : "Inserir nome do cliente"
        : currentTab?.customerName ?? "Carregando...";
    const statusLabel = isNewTab ? "Nova" : isPaid ? "Paga" : isClosed ? "Encerrada" : "Aberta";
    const statusHint = isNewTab
        ? "Informe o nome do cliente e confirme para inserir a comanda no mural."
        : isPaid
          ? `Pagamento registrado${currentTab?.saleCode ? ` em ${currentTab.saleCode}` : ""}.`
        : isClosed
          ? "Esta comanda esta encerrada. Reabra para voltar a lancar itens."
          : "Comanda aberta para novos lancamentos.";
    const interactionsDisabled = isNewTab || isClosed || isPaid || detailLoading || actionLoading;
    const totalValue = currentTab?.totalValue ?? "R$ 0,00";
    const items = detail?.items ?? [];
    const itemsCount = detail?.items.length ?? currentTab?.itemsCount ?? 0;
    const tabCode = currentTab?.tabLabel ?? "Comanda #----";
    const commandProducts = useMemo(
        () =>
            products.filter(
                (product) => !EXCLUDED_TAB_CATEGORY_SLUGS.has(product.categorySlug),
            ),
        [products],
    );

    const categoryFilters = useMemo<CategoryFilter[]>(() => {
        const uniqueCategories = new Map<string, string>();
        commandProducts.forEach((product) => {
            uniqueCategories.set(product.categorySlug, product.categoryName);
        });

        return [
            { value: "todos", label: "Todos" },
            ...Array.from(uniqueCategories.entries()).map(([value, label]) => ({ value, label })),
        ];
    }, [commandProducts]);

    const visibleProducts = useMemo<ProductCard[]>(() => {
        return commandProducts
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
                ...resolveProductPresentation(product, theme.palette.mode === "dark"),
            }));
    }, [commandProducts, searchTerm, selectedCategory, theme.palette.mode]);

    const receivedAmountNumber = Number.parseFloat(
        receivedAmountInput.replace(/[^\d,.-]/g, "").replace(",", "."),
    );
    const parsedReceivedAmount = Number.isNaN(receivedAmountNumber) ? 0 : receivedAmountNumber;
    const changeAmountNumber =
        paymentMethod === "cash"
            ? Math.max(0, parsedReceivedAmount - (currentTab?.totalValueNumber ?? 0))
            : 0;

    async function refreshCurrentTab(tabId: string) {
        const updatedDetail = await getTabDetail(tabId);
        setDetail(updatedDetail);
        await refreshTabs();
        return updatedDetail;
    }

    async function handleCreateTab() {
        if (!hasCustomerName) {
            setIsEditingCustomerName(true);
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            const createdTab = await createTab(draftCustomerName.trim());
            navigate(`/comandas/${createdTab.id}`);
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

        if (!isClosed && !isPaid) {
            setReceivedAmountInput("");
            setPaymentObservation("");
            setPaymentMethod("pix");
            setPaymentDialogOpen(true);
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

    async function handlePayTab() {
        if (!params.tabId || isNewTab || !currentTab) {
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            const response = await payTab({
                tabId: params.tabId,
                paymentMethod,
                receivedAmount: paymentMethod === "cash" ? parsedReceivedAmount : null,
                observation: paymentObservation.trim(),
            });
            setDetail(response);
            setPaymentDialogOpen(false);
            await refreshTabs();
            await refreshCashSession();
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Nao foi possivel registrar o pagamento da comanda.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleAddProduct(productId: number) {
        if (!params.tabId || isNewTab) {
            return;
        }

        const product = products.find((currentProduct) => currentProduct.id === productId);
        if (product && isProductOutOfStock(product)) {
            setPageError(`O produto ${product.name} esta sem estoque disponivel no momento.`);
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            await addItemToTab(params.tabId, productId, 1);
            await refreshCurrentTab(params.tabId);
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

    async function handleIncrementItem(itemId: number) {
        if (!params.tabId || isNewTab || isClosed) {
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            await incrementTabItem(itemId);
            await refreshCurrentTab(params.tabId);
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Nao foi possivel aumentar a quantidade do item.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDecrementItem(itemId: number) {
        if (!params.tabId || isNewTab || isClosed) {
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            await decrementTabItem(itemId);
            await refreshCurrentTab(params.tabId);
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Nao foi possivel diminuir a quantidade do item.",
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

        if (isNewTab) {
            void handleCreateTab();
        }
    }

    return (
        <>
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: "12px",
                    bgcolor: "var(--surface-float)",
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
                    gridTemplateColumns: {
                        xs: "1fr",
                        xl: "minmax(0, 1fr) 500px",
                    },
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
                                            : isPaid
                                              ? "secondary.main"
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
                                            bgcolor:
                                                selectedCategory === category.value
                                                    ? theme.palette.mode === "dark"
                                                        ? "rgba(110, 163, 255, 0.22)"
                                                        : undefined
                                                    : theme.palette.mode === "dark"
                                                      ? "rgba(255,255,255,0.04)"
                                                      : undefined,
                                            color:
                                                selectedCategory === category.value
                                                    ? theme.palette.mode === "dark"
                                                        ? "#dbe7ff"
                                                        : undefined
                                                    : theme.palette.mode === "dark"
                                                      ? "text.primary"
                                                      : undefined,
                                            borderColor:
                                                selectedCategory === category.value
                                                    ? theme.palette.mode === "dark"
                                                        ? "rgba(110, 163, 255, 0.32)"
                                                        : undefined
                                                    : theme.palette.mode === "dark"
                                                      ? "rgba(255,255,255,0.12)"
                                                      : undefined,
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
                                            {isProductOutOfStock(product) ? (
                                                <Typography color="error" sx={{ fontSize: "0.75rem", mt: 0.5, fontWeight: 700 }}>
                                                    Sem estoque disponivel
                                                </Typography>
                                            ) : null}
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
                                                disabled={interactionsDisabled || isProductOutOfStock(product)}
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
                        bgcolor: "var(--surface-soft)",
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
                                    gridTemplateColumns: "auto minmax(0, 1fr) auto",
                                    gap: 1.25,
                                    alignItems: "center",
                                }}
                            >
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <IconButton
                                        aria-label={`Diminuir ${item.title}`}
                                        color="inherit"
                                        disabled={interactionsDisabled}
                                        onClick={() => void handleDecrementItem(item.id)}
                                        size="small"
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: "var(--surface-soft)",
                                            color: "text.primary",
                                            borderRadius: "8px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <RemoveRoundedIcon fontSize="small" />
                                    </IconButton>

                                    <Box
                                        sx={{
                                            minWidth: 34,
                                            height: 32,
                                            px: 0.75,
                                            borderRadius: "8px",
                                            display: "grid",
                                            placeItems: "center",
                                            bgcolor: "var(--surface-soft)",
                                            fontWeight: 800,
                                            fontSize: "0.82rem",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {item.quantityLabel}
                                    </Box>

                                    <IconButton
                                        aria-label={`Aumentar ${item.title}`}
                                        color="inherit"
                                        disabled={interactionsDisabled}
                                        onClick={() => void handleIncrementItem(item.id)}
                                        size="small"
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: "var(--surface-soft)",
                                            color: "text.primary",
                                            borderRadius: "8px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <AddRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Stack>

                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: 700,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {item.title}
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                                        {item.timeLabel}
                                    </Typography>
                                </Box>

                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        whiteSpace: "nowrap",
                                        justifySelf: "end",
                                    }}
                                >
                                    {item.value}
                                </Typography>
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
                                    : isPaid
                                      ? "Comanda paga. Consulte o historico de vendas para reimpressao."
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
                                disabled={actionLoading || isPaid || (isNewTab && !hasCustomerName)}
                                onClick={() => void handleToggleStatus()}
                                size="large"
                                startIcon={
                                    isNewTab ? (
                                        <CheckRoundedIcon />
                                    ) : isPaid ? (
                                        <ReceiptLongRoundedIcon />
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
                                    background: (isClosed || isPaid) && !isNewTab
                                        ? "linear-gradient(135deg, #d9dedd 0%, #eff2f1 100%)"
                                        : "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                                    color: (isClosed || isPaid) && !isNewTab ? "#435150" : "#083f10",
                                    boxShadow: (isClosed || isPaid) && !isNewTab
                                        ? "0 14px 28px rgba(67, 81, 80, 0.10)"
                                        : "0 16px 32px rgba(28, 109, 37, 0.16)",
                                    "&.Mui-disabled": {
                                        background:
                                            "linear-gradient(135deg, #dfe6e2 0%, #eef2f0 100%)",
                                        color: "rgba(67, 81, 80, 0.6)",
                                    },
                                    "&:hover": {
                                        background: (isClosed || isPaid) && !isNewTab
                                            ? "linear-gradient(135deg, #cfd5d3 0%, #e7ebea 100%)"
                                            : "linear-gradient(135deg, #16571d 0%, #88df82 100%)",
                                    },
                                }}
                                variant="contained"
                            >
                                {isNewTab
                                    ? "Abrir Comanda"
                                    : isPaid
                                      ? "Pagamento Registrado"
                                    : isClosed
                                      ? "Reabrir Comanda"
                                      : "Fechar Comanda / Ir para Pagamento"}
                            </Button>

                            <Button
                                fullWidth
                                startIcon={<PrintRoundedIcon />}
                                variant="text"
                                disabled={isNewTab || currentTab === null}
                                onClick={() => {
                                    if (currentTab) {
                                        printTabConference(currentTab);
                                    }
                                }}
                            >
                                Imprimir Conferencia
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            </Box>
        </Stack>

        <Dialog
            fullWidth
            maxWidth="sm"
            onClose={() => setPaymentDialogOpen(false)}
            open={paymentDialogOpen}
        >
            <DialogTitle>Pagamento da Comanda</DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                    <Typography color="text.secondary">
                        Confirme a forma de pagamento para registrar esta comanda no caixa.
                    </Typography>

                    <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", bgcolor: "var(--surface-soft)" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography color="text.secondary">Total da comanda</Typography>
                            <Typography variant="h6">{totalValue}</Typography>
                        </Stack>
                    </Paper>

                    <TextField
                        select
                        label="Forma de pagamento"
                        value={paymentMethod}
                        onChange={(event) =>
                            setPaymentMethod(event.target.value as CashSalePaymentMethod)
                        }
                    >
                                    <MenuItem value="pix">Pix</MenuItem>
                                    <MenuItem value="debit">Débito</MenuItem>
                                    <MenuItem value="credit">Crédito</MenuItem>
                                    <MenuItem value="cash">Dinheiro</MenuItem>
                    </TextField>

                    {paymentMethod === "cash" ? (
                        <>
                            <TextField
                                label="Valor recebido"
                                placeholder="0,00"
                                value={receivedAmountInput}
                                onChange={(event) => setReceivedAmountInput(event.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Typography sx={{ fontWeight: 800, color: "primary.main" }}>
                                                R$
                                            </Typography>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Paper
                                elevation={0}
                                sx={{ p: 2, borderRadius: "12px", bgcolor: "background.default" }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography color="text.secondary">Troco</Typography>
                                    <Typography sx={{ fontWeight: 800 }}>
                                        {new Intl.NumberFormat("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        }).format(changeAmountNumber)}
                                    </Typography>
                                </Stack>
                            </Paper>
                        </>
                    ) : null}

                    <TextField
                        label="Observação"
                        multiline
                        minRows={2}
                        placeholder="Observação do pagamento"
                        value={paymentObservation}
                        onChange={(event) => setPaymentObservation(event.target.value)}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button disabled={actionLoading} onClick={() => setPaymentDialogOpen(false)}>
                    Cancelar
                </Button>
                <Button
                    disabled={
                        actionLoading ||
                        items.length === 0 ||
                        (paymentMethod === "cash" && parsedReceivedAmount < (currentTab?.totalValueNumber ?? 0))
                    }
                    onClick={() => void handlePayTab()}
                    variant="contained"
                >
                    Confirmar Pagamento
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
}
