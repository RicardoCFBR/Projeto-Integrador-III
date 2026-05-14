import { useEffect, useMemo, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
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
    createStockMovement,
    createStockProduct,
    listProductCategories,
    listStockMovements,
    listStockProducts,
    updateStockProduct,
    type ProductCategory,
    type StockMovement,
    type StockMovementType,
    type StockProduct,
    type StockProductInput,
    type StockUnit,
} from "../services/barControlApi";

type StockStatusFilter = "all" | "active" | "inactive" | "below_minimum";
type MovementPeriodFilter = "all" | "today" | "last_7_days" | "last_30_days";

const unitOptions: Array<{ value: StockUnit; label: string }> = [
    { value: "un", label: "Unidade" },
    { value: "g", label: "Grama" },
    { value: "kg", label: "Quilograma" },
    { value: "ml", label: "Mililitro" },
    { value: "l", label: "Litro" },
    { value: "porcao", label: "Porção" },
];

const stockTypeOptions = [
    { value: "unit", label: "Unitário" },
    { value: "recipe", label: "Receita" },
    { value: "untracked", label: "Não controlado" },
];

const movementOptions: Array<{ value: Exclude<StockMovementType, "venda">; label: string }> = [
    { value: "entrada", label: "Entrada" },
    { value: "estorno", label: "Estorno" },
    { value: "uso_interno", label: "Uso interno" },
    { value: "ajuste", label: "Ajuste" },
    { value: "perda", label: "Perda" },
];

const emptyProductForm: StockProductInput = {
    name: "",
    description: "",
    price: 0,
    categoryId: null,
    stockType: "unit",
    controlsStock: true,
    unit: "un",
    currentStock: 0,
    minimumStock: 0,
    isActive: true,
};

function getStockLevel(product: StockProduct) {
    if (!product.controlsStock) return { label: "Não controlado", percent: 100, color: "#94a3b8" };
    if (product.minimumStock <= 0) {
        return {
            label: "Sem mínimo definido",
            percent: product.currentStock > 0 ? 100 : 0,
            color: product.currentStock > 0 ? "#2e7d32" : "#c2410c",
        };
    }
    const percent = Math.max(0, Math.min((product.currentStock / product.minimumStock) * 100, 100));
    if (percent < 10) return { label: "Crítico", percent, color: "#b42318" };
    if (percent < 20) return { label: "Muito baixo", percent, color: "#d92d20" };
    if (percent < 40) return { label: "Baixo", percent, color: "#f97316" };
    if (percent < 70) return { label: "Atenção", percent, color: "#f59e0b" };
    if (percent < 100) return { label: "Próximo do ideal", percent, color: "#84cc16" };
    return { label: "Regular", percent: 100, color: "#2e7d32" };
}

function matchesPeriodFilter(isoDate: string, filter: MovementPeriodFilter) {
    if (filter === "all") return true;
    const value = new Date(isoDate);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (filter === "today") return value >= todayStart;
    const rangeStart = new Date(todayStart);
    rangeStart.setDate(rangeStart.getDate() - (filter === "last_7_days" ? 6 : 29));
    return value >= rangeStart;
}

function getMovementColor(type: StockMovementType) {
    if (type === "entrada") return "success";
    if (type === "estorno") return "primary";
    if (type === "uso_interno") return "warning";
    if (type === "ajuste") return "info";
    if (type === "perda") return "error";
    return "secondary";
}

export function StockPage() {
    const [products, setProducts] = useState<StockProduct[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
    const [statusFilter, setStatusFilter] = useState<StockStatusFilter>("all");
    const [movementTypeFilter, setMovementTypeFilter] = useState<StockMovementType | "all">("all");
    const [movementProductFilter, setMovementProductFilter] = useState<number | "all">("all");
    const [movementPeriodFilter, setMovementPeriodFilter] = useState<MovementPeriodFilter>("all");
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [movementDialogOpen, setMovementDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<StockProduct | null>(null);
    const [historyProduct, setHistoryProduct] = useState<StockProduct | null>(null);
    const [productForm, setProductForm] = useState<StockProductInput>(emptyProductForm);
    const [movementForm, setMovementForm] = useState({
        productId: 0,
        type: "entrada" as Exclude<StockMovementType, "venda">,
        quantity: 0,
        observation: "",
    });

    async function loadData() {
        try {
            setLoading(true);
            setPageError(null);
            const [productList, categoryList, movementList] = await Promise.all([
                listStockProducts(),
                listProductCategories(),
                listStockMovements(),
            ]);
            setProducts(productList);
            setCategories(categoryList);
            setMovements(movementList);
        } catch (error) {
            setPageError(error instanceof Error ? error.message : "Não foi possível carregar o estoque.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadData();
    }, []);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return products.filter((product) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                product.name.toLowerCase().includes(normalizedSearch) ||
                product.categoryName.toLowerCase().includes(normalizedSearch);
            const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter;
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && product.isActive) ||
                (statusFilter === "inactive" && !product.isActive) ||
                (statusFilter === "below_minimum" && product.isBelowMinimum);
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [categoryFilter, products, search, statusFilter]);

    const filteredMovements = useMemo(() => {
        return movements.filter((movement) => {
            const matchesType = movementTypeFilter === "all" || movement.type === movementTypeFilter;
            const matchesProduct =
                movementProductFilter === "all" || movement.productId === movementProductFilter;
            const matchesPeriod = matchesPeriodFilter(movement.createdAt, movementPeriodFilter);
            return matchesType && matchesProduct && matchesPeriod;
        });
    }, [movementPeriodFilter, movementProductFilter, movementTypeFilter, movements]);

    const historyMovements = useMemo(() => {
        return historyProduct
            ? movements.filter((movement) => movement.productId === historyProduct.id)
            : [];
    }, [historyProduct, movements]);

    function openCreateDialog() {
        setEditingProduct(null);
        setProductForm(emptyProductForm);
        setProductDialogOpen(true);
    }

    function openEditDialog(product: StockProduct) {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            description: product.description,
            price: product.priceNumber,
            categoryId: product.categoryId,
            stockType: product.stockType,
            controlsStock: product.controlsStock,
            unit: product.unit,
            currentStock: product.currentStock,
            minimumStock: product.minimumStock,
            isActive: product.isActive,
        });
        setProductDialogOpen(true);
    }

    async function handleSaveProduct() {
        try {
            setSaving(true);
            if (editingProduct) await updateStockProduct(editingProduct.id, productForm);
            else await createStockProduct(productForm);
            setProductDialogOpen(false);
            await loadData();
        } catch (error) {
            setPageError(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveMovement() {
        try {
            setSaving(true);
            await createStockMovement(movementForm);
            setMovementDialogOpen(false);
            await loadData();
        } catch (error) {
            setPageError(
                error instanceof Error ? error.message : "Não foi possível registrar a movimentação.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <Stack spacing={3}>
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
                    Estoque
                </h1>
                <Typography color="text.secondary" sx={{ mt: 2.5 }}>
                    Controle de estoque usando a mesma base de produtos vendidos no sistema.
                </Typography>
            </Box>

            {pageError ? <Typography color="error">{pageError}</Typography> : null}

            {loading ? (
                <Box sx={{ minHeight: "32vh", display: "grid", placeItems: "center" }}>
                    <CircularProgress size={30} />
                </Box>
            ) : (
                <>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", bgcolor: "background.paper" }}>
                        <Stack spacing={2}>
                            <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={1.25}>
                                <Box>
                                    <Typography variant="h5">Produtos Controlados</Typography>
                                    <Typography color="text.secondary">
                                        Edite saldos, estoque mínimo e cadastro dos produtos controlados.
                                    </Typography>
                                </Box>
                                <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={openCreateDialog}>
                                    Novo Produto
                                </Button>
                            </Stack>
                            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25}>
                                <TextField label="Buscar produto" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
                                <TextField select label="Categoria" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value))} sx={{ minWidth: 220 }}>
                                    <MenuItem value="all">Todas</MenuItem>
                                    {categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
                                </TextField>
                                <TextField select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StockStatusFilter)} sx={{ minWidth: 220 }}>
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="active">Ativos</MenuItem>
                                    <MenuItem value="inactive">Inativos</MenuItem>
                                    <MenuItem value="below_minimum">Abaixo do mínimo</MenuItem>
                                </TextField>
                            </Stack>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Produto</TableCell>
                                            <TableCell>Categoria</TableCell>
                                            <TableCell>Unidade</TableCell>
                                            <TableCell>Atual</TableCell>
                                            <TableCell>Mínimo</TableCell>
                                            <TableCell>Situação</TableCell>
                                            <TableCell align="right">Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredProducts.length === 0 ? (
                                            <TableRow><TableCell colSpan={7}>Nenhum produto encontrado.</TableCell></TableRow>
                                        ) : filteredProducts.map((product) => {
                                            const stockLevel = getStockLevel(product);
                                            return (
                                                <TableRow key={product.id} hover>
                                                    <TableCell sx={{ fontWeight: 700 }}>{product.name}</TableCell>
                                                    <TableCell>{product.categoryName}</TableCell>
                                                    <TableCell>{product.unitLabel}</TableCell>
                                                    <TableCell>
                                                        <Stack spacing={0.75} sx={{ minWidth: 120 }}>
                                                            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>
                                                                {product.currentStockLabel}
                                                            </Typography>
                                                            <Box sx={{ width: "100%", height: 6, borderRadius: 999, bgcolor: "#e7ecea", overflow: "hidden" }}>
                                                                <Box sx={{ width: `${stockLevel.percent}%`, minWidth: product.currentStock > 0 ? "16px" : 0, height: "100%", borderRadius: 999, bgcolor: stockLevel.color }} />
                                                            </Box>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>{product.minimumStockLabel}</TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ color: stockLevel.color, fontWeight: 700, fontSize: "0.9rem" }}>
                                                            {stockLevel.label}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" onClick={() => openEditDialog(product)}><EditRoundedIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" onClick={() => { setMovementForm({ productId: product.id, type: "entrada", quantity: 0, observation: "" }); setMovementDialogOpen(true); }}><SwapHorizRoundedIcon fontSize="small" /></IconButton>
                                                        <IconButton size="small" onClick={() => setHistoryProduct(product)}><HistoryRoundedIcon fontSize="small" /></IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", bgcolor: "background.paper" }}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="h5">Movimentações de Estoque</Typography>
                                <Typography color="text.secondary">
                                    Acompanhe entradas, estornos, uso interno, ajustes, perdas e baixas automáticas por venda.
                                </Typography>
                            </Box>
                            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25}>
                                <TextField select label="Tipo" value={movementTypeFilter} onChange={(e) => setMovementTypeFilter(e.target.value as StockMovementType | "all")} sx={{ minWidth: 220 }}>
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="entrada">Entrada</MenuItem>
                                    <MenuItem value="estorno">Estorno</MenuItem>
                                    <MenuItem value="uso_interno">Uso interno</MenuItem>
                                    <MenuItem value="ajuste">Ajuste</MenuItem>
                                    <MenuItem value="perda">Perda</MenuItem>
                                    <MenuItem value="venda">Venda</MenuItem>
                                </TextField>
                                <TextField select label="Produto" value={movementProductFilter} onChange={(e) => setMovementProductFilter(e.target.value === "all" ? "all" : Number(e.target.value))} sx={{ minWidth: 260 }}>
                                    <MenuItem value="all">Todos os produtos</MenuItem>
                                    {products.map((product) => <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>)}
                                </TextField>
                                <TextField select label="Período" value={movementPeriodFilter} onChange={(e) => setMovementPeriodFilter(e.target.value as MovementPeriodFilter)} sx={{ minWidth: 220 }}>
                                    <MenuItem value="all">Todo período</MenuItem>
                                    <MenuItem value="today">Hoje</MenuItem>
                                    <MenuItem value="last_7_days">Últimos 7 dias</MenuItem>
                                    <MenuItem value="last_30_days">Últimos 30 dias</MenuItem>
                                </TextField>
                            </Stack>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Produto</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Quantidade</TableCell>
                                            <TableCell>Data</TableCell>
                                            <TableCell>Horário</TableCell>
                                            <TableCell>Observação</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredMovements.length === 0 ? (
                                            <TableRow><TableCell colSpan={6}>Nenhuma movimentação encontrada.</TableCell></TableRow>
                                        ) : filteredMovements.map((movement) => (
                                            <TableRow key={movement.id} hover>
                                                <TableCell sx={{ fontWeight: 700 }}>{movement.productName}</TableCell>
                                                <TableCell><Chip label={movement.typeLabel} size="small" color={getMovementColor(movement.type)} variant="outlined" /></TableCell>
                                                <TableCell>{movement.quantityLabel}</TableCell>
                                                <TableCell>{new Date(movement.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                                                <TableCell>{movement.timeLabel}</TableCell>
                                                <TableCell>{movement.observation || "Sem observação"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    </Paper>
                </>
            )}

            <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto de Estoque"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Nome" value={productForm.name} onChange={(e) => setProductForm((current) => ({ ...current, name: e.target.value }))} />
                        <TextField label="Descrição" value={productForm.description} onChange={(e) => setProductForm((current) => ({ ...current, description: e.target.value }))} />
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField label="Preço" type="number" fullWidth value={productForm.price} onChange={(e) => setProductForm((current) => ({ ...current, price: Number(e.target.value) }))} />
                            <TextField select label="Categoria" fullWidth value={productForm.categoryId ?? ""} onChange={(e) => setProductForm((current) => ({ ...current, categoryId: e.target.value === "" ? null : Number(e.target.value) }))}>
                                <MenuItem value="">Sem categoria</MenuItem>
                                {categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
                            </TextField>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField select label="Tipo de estoque" fullWidth value={productForm.stockType} onChange={(e) => setProductForm((current) => ({ ...current, stockType: e.target.value }))}>
                                {stockTypeOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                            </TextField>
                            <TextField select label="Unidade" fullWidth value={productForm.unit} onChange={(e) => setProductForm((current) => ({ ...current, unit: e.target.value as StockUnit }))}>
                                {unitOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                            </TextField>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField label="Estoque atual" type="number" fullWidth value={productForm.currentStock} onChange={(e) => setProductForm((current) => ({ ...current, currentStock: Number(e.target.value) }))} />
                            <TextField label="Estoque mínimo" type="number" fullWidth value={productForm.minimumStock} onChange={(e) => setProductForm((current) => ({ ...current, minimumStock: Number(e.target.value) }))} />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
                    <Button variant="contained" disabled={saving} onClick={() => void handleSaveProduct()}>{saving ? "Salvando..." : "Salvar"}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={movementDialogOpen} onClose={() => setMovementDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Registrar Movimentação</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField select label="Tipo" value={movementForm.type} onChange={(e) => setMovementForm((current) => ({ ...current, type: e.target.value as Exclude<StockMovementType, "venda"> }))}>
                            {movementOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                        </TextField>
                        <TextField label="Quantidade" type="number" value={movementForm.quantity} onChange={(e) => setMovementForm((current) => ({ ...current, quantity: Number(e.target.value) }))} />
                        <TextField label="Observação" value={movementForm.observation} onChange={(e) => setMovementForm((current) => ({ ...current, observation: e.target.value }))} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMovementDialogOpen(false)}>Cancelar</Button>
                    <Button variant="contained" disabled={saving} onClick={() => void handleSaveMovement()}>{saving ? "Registrando..." : "Registrar"}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(historyProduct)} onClose={() => setHistoryProduct(null)} fullWidth maxWidth="md">
                <DialogTitle>Histórico do Produto</DialogTitle>
                <DialogContent>
                    {historyProduct ? (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Box>
                                <Typography variant="h6">{historyProduct.name}</Typography>
                                <Typography color="text.secondary">
                                    {historyProduct.categoryName} • Estoque atual {historyProduct.currentStockLabel}
                                </Typography>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Quantidade</TableCell>
                                            <TableCell>Data</TableCell>
                                            <TableCell>Horário</TableCell>
                                            <TableCell>Observação</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {historyMovements.length === 0 ? (
                                            <TableRow><TableCell colSpan={5}>Nenhuma movimentação registrada para este produto.</TableCell></TableRow>
                                        ) : historyMovements.slice(0, 20).map((movement) => (
                                            <TableRow key={movement.id} hover>
                                                <TableCell><Chip label={movement.typeLabel} size="small" color={getMovementColor(movement.type)} variant="outlined" /></TableCell>
                                                <TableCell>{movement.quantityLabel}</TableCell>
                                                <TableCell>{new Date(movement.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                                                <TableCell>{movement.timeLabel}</TableCell>
                                                <TableCell>{movement.observation || "Sem observação"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryProduct(null)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
