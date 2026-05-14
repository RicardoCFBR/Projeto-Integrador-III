import { useEffect, useMemo, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalBarRoundedIcon from "@mui/icons-material/LocalBarRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
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
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

import { useCashSession } from "../contexts/CashSessionContext";
import {
    createCashSale,
    listProducts,
    type CashSalePaymentMethod,
    type Product,
} from "../services/barControlApi";

type CashierCartItem = Product & {
    quantity: number;
};

type CategoryFilter = {
    value: string;
    label: string;
};

const CASHIER_CATEGORY_SLUGS = new Set(["bebidas", "mercearia", "conveniencia"]);

function resolveCashierProductPresentation(product: Product) {
    switch (product.categorySlug) {
        case "bebidas":
            return {
                icon: <LocalBarRoundedIcon fontSize="large" />,
                tone: "#fff3e0",
            };
        case "mercearia":
        case "conveniencia":
            return {
                icon: <StorefrontRoundedIcon fontSize="large" />,
                tone: "#effaf1",
            };
        default:
            return {
                icon: <Inventory2RoundedIcon fontSize="large" />,
                tone: "#f2f4f7",
            };
    }
}

function isProductOutOfStock(product: Product) {
    return product.controlsStock && product.currentStock <= 0;
}

function buildOperationCode() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");

    return `${year}${month}${day}-${hour}${minute}`;
}

function parseMoneyInput(value: string) {
    const normalized = value.replace(/[^\d,]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function CashierPage() {
    const navigate = useNavigate();
    const { refreshCashSession } = useCashSession();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CashierCartItem[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("todos");
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [submittingSale, setSubmittingSale] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<CashSalePaymentMethod>("pix");
    const [receivedAmountInput, setReceivedAmountInput] = useState("");
    const [observation, setObservation] = useState("");
    const [operationCode] = useState(() => buildOperationCode());
    const [openedAt] = useState(() =>
        new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    );

    useEffect(() => {
        let cancelled = false;

        async function loadProductsData() {
            setProductsLoading(true);

            try {
                const response = await listProducts();
                if (!cancelled) {
                    setProducts(
                        response.filter(
                            (product) =>
                                product.stockType === "unit" &&
                                CASHIER_CATEGORY_SLUGS.has(product.categorySlug),
                        ),
                    );
                }
            } catch (requestError) {
                if (!cancelled) {
                    setPageError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Não foi possível carregar os produtos para a venda no caixa.",
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

    const categoryFilters = useMemo<CategoryFilter[]>(() => {
        const uniqueCategories = new Map<string, string>();
        products.forEach((product) => {
            uniqueCategories.set(product.categorySlug, product.categoryName);
        });

        return [
            { value: "todos", label: "Tudo" },
            ...Array.from(uniqueCategories.entries()).map(([value, label]) => ({
                value,
                label,
            })),
        ];
    }, [products]);

    const visibleProducts = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return products
            .filter((product) => {
                const matchesCategory =
                    selectedCategory === "todos" || product.categorySlug === selectedCategory;
                const matchesSearch =
                    normalizedSearch.length === 0 ||
                    product.name.toLowerCase().includes(normalizedSearch) ||
                    product.description.toLowerCase().includes(normalizedSearch);

                return matchesCategory && matchesSearch;
            })
            .map((product) => ({
                ...product,
                ...resolveCashierProductPresentation(product),
            }));
    }, [products, searchTerm, selectedCategory]);

    const itemsCount = useMemo(
        () => cart.reduce((total, item) => total + item.quantity, 0),
        [cart],
    );
    const subtotalNumber = useMemo(
        () => cart.reduce((total, item) => total + item.priceNumber * item.quantity, 0),
        [cart],
    );
    const subtotalLabel = useMemo(() => formatCurrency(subtotalNumber), [subtotalNumber]);
    const receivedAmountNumber = useMemo(
        () => parseMoneyInput(receivedAmountInput),
        [receivedAmountInput],
    );
    const changeAmountNumber = useMemo(() => {
        if (paymentMethod !== "cash") {
            return 0;
        }
        return Math.max(receivedAmountNumber - subtotalNumber, 0);
    }, [paymentMethod, receivedAmountNumber, subtotalNumber]);

    function addToCart(product: Product) {
        setCart((currentCart) => {
            const existingItem = currentCart.find((item) => item.id === product.id);
            const maxQuantity = product.controlsStock ? Math.max(0, Math.floor(product.currentStock)) : Number.POSITIVE_INFINITY;

            if (maxQuantity <= 0) {
                return currentCart;
            }

            if (!existingItem) {
                return [...currentCart, { ...product, quantity: 1 }];
            }

            if (existingItem.quantity >= maxQuantity) {
                return currentCart;
            }

            return currentCart.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
            );
        });
    }

    function incrementCartItem(productId: number) {
        setCart((currentCart) =>
            currentCart.map((item) => {
                if (item.id !== productId) {
                    return item;
                }

                const maxQuantity = item.controlsStock ? Math.max(0, Math.floor(item.currentStock)) : Number.POSITIVE_INFINITY;
                if (item.quantity >= maxQuantity) {
                    return item;
                }

                return { ...item, quantity: item.quantity + 1 };
            }),
        );
    }

    function decrementCartItem(productId: number) {
        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    item.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
                )
                .filter((item) => item.quantity > 0),
        );
    }

    function removeCartItem(productId: number) {
        setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
    }

    function clearCart() {
        setCart([]);
    }

    function openCheckoutDialog() {
        setPageError(null);
        setPaymentMethod("pix");
        setReceivedAmountInput("");
        setObservation("");
        setCheckoutOpen(true);
    }

    function closeCheckoutDialog() {
        if (submittingSale) {
            return;
        }
        setCheckoutOpen(false);
    }

    async function finalizeSale() {
        try {
            setSubmittingSale(true);
            setPageError(null);
            await createCashSale({
                paymentMethod,
                receivedAmount: paymentMethod === "cash" ? receivedAmountNumber : null,
                observation,
                items: cart.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity,
                })),
            });
            await refreshCashSession();
            setCart([]);
            setCheckoutOpen(false);
            navigate("/caixa");
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível finalizar a venda.",
            );
        } finally {
            setSubmittingSale(false);
        }
    }

    return (
        <>
            <Stack spacing={3}>
                <Box>
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
                                Venda no Caixa
                            </h1>

                            <Typography color="text.secondary" sx={{ mt: 2.5 }}>
                                Monte a venda direta e finalize o recebimento no caixa.
                            </Typography>
                        </Box>

                        <Button component={Link} to="/caixa" variant="text">
                            Voltar ao Caixa
                        </Button>
                    </Stack>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            xl: "minmax(0, 1fr) 430px",
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
                        <Stack spacing={3}>
                            <Typography
                                sx={{
                                    fontSize: "0.84rem",
                                    fontWeight: 800,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    color: "text.secondary",
                                }}
                            >
                                Categorias
                            </Typography>

                            <Stack
                                direction={{ xs: "column", xl: "row" }}
                                spacing={2}
                                justifyContent="space-between"
                                alignItems={{ xs: "stretch", xl: "center" }}
                            >
                                <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                                    {categoryFilters.map((category) => (
                                        <Chip
                                            clickable
                                            key={category.value}
                                            label={category.label}
                                            onClick={() => setSelectedCategory(category.value)}
                                            variant={
                                                selectedCategory === category.value
                                                    ? "filled"
                                                    : "outlined"
                                            }
                                            color={
                                                selectedCategory === category.value
                                                    ? "secondary"
                                                    : "default"
                                            }
                                            sx={{
                                                borderRadius: "999px",
                                                fontWeight: 800,
                                                px: 1,
                                            }}
                                        />
                                    ))}
                                </Stack>

                                <TextField
                                    placeholder="O que o cliente está levando?"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    sx={{
                                        width: { xs: "100%", xl: 360 },
                                        flexShrink: 0,
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "10px",
                                            bgcolor: "#ffffff",
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
                                <Typography color="error" sx={{ fontWeight: 700 }}>
                                    {pageError}
                                </Typography>
                            ) : null}

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
                                                    width: 56,
                                                    height: 56,
                                                    display: "grid",
                                                    placeItems: "center",
                                                    borderRadius: "10px",
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
                                                    disabled={isProductOutOfStock(product)}
                                                    onClick={() => addToCart(product)}
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
                            <Box>
                                <Typography variant="h5">Extrato da Venda</Typography>
                                <Typography color="text.secondary" sx={{ fontSize: "0.82rem", mt: 0.5 }}>
                                    Operação #{operationCode} - {openedAt}
                                </Typography>
                            </Box>

                            <Chip
                                color="secondary"
                                label={`${itemsCount} ${itemsCount === 1 ? "item" : "itens"}`}
                                sx={{ fontWeight: 800, borderRadius: "999px" }}
                            />
                        </Stack>

                        <Stack spacing={1.75} sx={{ px: 3.5, pb: 3, flex: 1, overflow: "auto" }}>
                            {cart.map((item) => (
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
                                            aria-label={`Diminuir ${item.name}`}
                                            color="inherit"
                                            onClick={() => decrementCartItem(item.id)}
                                            size="small"
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: "#eef3f1",
                                                color: "text.primary",
                                                borderRadius: "8px",
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
                                                bgcolor: "#eef3f1",
                                                fontWeight: 800,
                                                fontSize: "0.82rem",
                                            }}
                                        >
                                            {item.quantity}
                                        </Box>

                                        <IconButton
                                            aria-label={`Aumentar ${item.name}`}
                                            color="inherit"
                                            onClick={() => incrementCartItem(item.id)}
                                            disabled={item.controlsStock && item.quantity >= Math.max(0, Math.floor(item.currentStock))}
                                            size="small"
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: "#eef3f1",
                                                color: "text.primary",
                                                borderRadius: "8px",
                                                "&.Mui-disabled": {
                                                    opacity: 0.4,
                                                },
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
                                            {item.name}
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                                            Unitário: {item.price}
                                        </Typography>
                                    </Box>

                                    <Stack alignItems="flex-end" spacing={0.5}>
                                        <Typography sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                                            {formatCurrency(item.priceNumber * item.quantity)}
                                        </Typography>

                                        <IconButton
                                            aria-label={`Remover ${item.name}`}
                                            color="error"
                                            onClick={() => removeCartItem(item.id)}
                                            size="small"
                                            sx={{ width: 28, height: 28 }}
                                        >
                                            <DeleteOutlineRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Paper>
                            ))}

                            {cart.length === 0 ? (
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
                                        px: 2,
                                        textAlign: "center",
                                    }}
                                >
                                    Adicione produtos para montar a venda no caixa.
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
                                    <Typography color="text.secondary">{subtotalLabel}</Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between">
                                    <Typography color="error.main">Descontos</Typography>
                                    <Typography color="error.main">- R$ 0,00</Typography>
                                </Stack>

                                <Divider />

                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Total a Pagar</Typography>
                                    <Typography
                                        sx={{
                                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                                            fontSize: "1.8rem",
                                            fontWeight: 800,
                                            color: "secondary.main",
                                        }}
                                    >
                                        {subtotalLabel}
                                    </Typography>
                                </Stack>

                                <Button
                                    fullWidth
                                    disabled={cart.length === 0}
                                    onClick={openCheckoutDialog}
                                    size="large"
                                    startIcon={<PaymentsRoundedIcon />}
                                    sx={{
                                        mt: 1,
                                        minHeight: 56,
                                        borderRadius: "10px",
                                        background: "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                                        color: "#083f10",
                                        boxShadow: "0 16px 32px rgba(28, 109, 37, 0.16)",
                                        "&.Mui-disabled": {
                                            background:
                                                "linear-gradient(135deg, #dfe6e2 0%, #eef2f0 100%)",
                                            color: "rgba(67, 81, 80, 0.6)",
                                        },
                                    }}
                                    variant="contained"
                                >
                                    Finalizar Venda / Cobrar
                                </Button>

                                <Button
                                    fullWidth
                                    disabled={cart.length === 0}
                                    onClick={clearCart}
                                    startIcon={<DeleteOutlineRoundedIcon />}
                                    variant="text"
                                >
                                    Limpar Carrinho
                                </Button>
                            </Stack>
                        </Box>
                    </Paper>
                </Box>
            </Stack>

            <Dialog fullWidth maxWidth="sm" onClose={closeCheckoutDialog} open={checkoutOpen}>
                <DialogTitle>Finalizar Venda</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        <Box>
                            <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                                Total da venda
                            </Typography>
                            <Typography variant="h4">{subtotalLabel}</Typography>
                        </Box>

                        <FormControl fullWidth>
                            <InputLabel id="cashier-payment-method">Forma de pagamento</InputLabel>
                            <Select
                                label="Forma de pagamento"
                                labelId="cashier-payment-method"
                                value={paymentMethod}
                                onChange={(event) =>
                                    setPaymentMethod(event.target.value as CashSalePaymentMethod)
                                }
                            >
                                    <MenuItem value="cash">Dinheiro</MenuItem>
                                    <MenuItem value="pix">Pix</MenuItem>
                                    <MenuItem value="debit">Débito</MenuItem>
                                    <MenuItem value="credit">Crédito</MenuItem>
                            </Select>
                        </FormControl>

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
                                <Box>
                                    <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                                        Troco
                                    </Typography>
                                    <Typography variant="h5">{formatCurrency(changeAmountNumber)}</Typography>
                                </Box>
                            </>
                        ) : null}

                        <TextField
                            fullWidth
                            label="Observação"
                            placeholder="Observação da venda"
                            value={observation}
                            onChange={(event) => setObservation(event.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button disabled={submittingSale} onClick={closeCheckoutDialog}>
                        Cancelar
                    </Button>
                    <Button
                        disabled={
                            submittingSale ||
                            (paymentMethod === "cash" && receivedAmountNumber < subtotalNumber)
                        }
                        onClick={() => void finalizeSale()}
                        variant="contained"
                    >
                        Confirmar venda
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
