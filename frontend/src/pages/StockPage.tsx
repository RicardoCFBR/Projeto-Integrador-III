import { useEffect, useMemo, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import {
    Box,
    Button,
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
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [movementDialogOpen, setMovementDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<StockProduct | null>(null);
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
        return products.filter((product) => {
            const normalizedSearch = search.trim().toLowerCase();
            const matchesSearch =
                normalizedSearch.length === 0 ||
                product.name.toLowerCase().includes(normalizedSearch) ||
                product.categoryName.toLowerCase().includes(normalizedSearch);
            const matchesCategory =
                categoryFilter === "all" ? true : product.categoryId === categoryFilter;
            const matchesStatus =
                statusFilter === "all"
                    ? true
                    : statusFilter === "active"
                      ? product.isActive
                      : statusFilter === "inactive"
                        ? !product.isActive
                        : product.isBelowMinimum;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [categoryFilter, products, search, statusFilter]);

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

    function openMovementDialog(product: StockProduct) {
        setMovementForm({
            productId: product.id,
            type: "entrada",
            quantity: 0,
            observation: "",
        });
        setMovementDialogOpen(true);
    }

    async function handleSaveProduct() {
        try {
            setSaving(true);

            if (editingProduct) {
                await updateStockProduct(editingProduct.id, productForm);
            } else {
                await createStockProduct(productForm);
            }

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
            <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", bgcolor: "rgba(255,255,255,0.82)" }}>
                <Stack spacing={1}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Inventory2RoundedIcon color="secondary" />
                        <Typography variant="h4">Estoque</Typography>
                    </Stack>
                    <Typography color="text.secondary">
                        Controle de estoque usando a mesma base de produtos vendidos no sistema.
                    </Typography>
                </Stack>
            </Paper>

            {pageError ? <Typography color="error">{pageError}</Typography> : null}

            {loading ? (
                <Box sx={{ minHeight: "32vh", display: "grid", placeItems: "center" }}>
                    <CircularProgress size={30} />
                </Box>
            ) : (
                <>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", bgcolor: "background.paper" }}>
                        <Stack spacing={2}>
                            <Stack
                                direction={{ xs: "column", lg: "row" }}
                                spacing={1.25}
                                justifyContent="space-between"
                            >
                                <Box>
                                    <Typography variant="h5">Produtos Controlados</Typography>
                                    <Typography color="text.secondary">
                                        Edite saldos, estoque mínimo e cadastro dos produtos controlados.
                                    </Typography>
                                </Box>
                                <Button
                                    startIcon={<AddRoundedIcon />}
                                    variant="contained"
                                    onClick={openCreateDialog}
                                >
                                    Novo Produto
                                </Button>
                            </Stack>

                            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25}>
                                <TextField
                                    label="Buscar produto"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    select
                                    label="Categoria"
                                    value={categoryFilter}
                                    onChange={(event) =>
                                        setCategoryFilter(
                                            event.target.value === "all"
                                                ? "all"
                                                : Number(event.target.value),
                                        )
                                    }
                                    sx={{ minWidth: 220 }}
                                >
                                    <MenuItem value="all">Todas</MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    label="Status"
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value as StockStatusFilter)
                                    }
                                    sx={{ minWidth: 220 }}
                                >
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
                                            <TableRow>
                                                <TableCell colSpan={7}>Nenhum produto encontrado.</TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProducts.map((product) => (
                                                <TableRow key={product.id} hover>
                                                    <TableCell sx={{ fontWeight: 700 }}>
                                                        {product.name}
                                                    </TableCell>
                                                    <TableCell>{product.categoryName}</TableCell>
                                                    <TableCell>{product.unitLabel}</TableCell>
                                                    <TableCell>{product.currentStockLabel}</TableCell>
                                                    <TableCell>{product.minimumStockLabel}</TableCell>
                                                    <TableCell
                                                        sx={{
                                                            color: product.isBelowMinimum
                                                                ? "error.main"
                                                                : "success.main",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {product.isBelowMinimum
                                                            ? "Abaixo do mínimo"
                                                            : "Regular"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openEditDialog(product)}
                                                        >
                                                            <EditRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => openMovementDialog(product)}
                                                        >
                                                            <SwapHorizRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: "12px", bgcolor: "background.paper" }}>
                        <Stack spacing={2}>
                            <Typography variant="h5">Movimentações Recentes</Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Produto</TableCell>
                                            <TableCell>Tipo</TableCell>
                                            <TableCell>Quantidade</TableCell>
                                            <TableCell>Horário</TableCell>
                                            <TableCell>Observação</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {movements.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5}>
                                                    Nenhuma movimentação registrada.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            movements.slice(0, 12).map((movement) => (
                                                <TableRow key={movement.id} hover>
                                                    <TableCell sx={{ fontWeight: 700 }}>
                                                        {movement.productName}
                                                    </TableCell>
                                                    <TableCell>{movement.typeLabel}</TableCell>
                                                    <TableCell>{movement.quantityLabel}</TableCell>
                                                    <TableCell>{movement.timeLabel}</TableCell>
                                                    <TableCell>
                                                        {movement.observation || "Sem observação"}
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
            )}

            <Dialog
                open={productDialogOpen}
                onClose={() => setProductDialogOpen(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto de Estoque"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Nome"
                            value={productForm.name}
                            onChange={(event) =>
                                setProductForm((current) => ({ ...current, name: event.target.value }))
                            }
                        />
                        <TextField
                            label="Descrição"
                            value={productForm.description}
                            onChange={(event) =>
                                setProductForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField
                                label="Preço"
                                type="number"
                                fullWidth
                                value={productForm.price}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        price: Number(event.target.value),
                                    }))
                                }
                            />
                            <TextField
                                select
                                label="Categoria"
                                fullWidth
                                value={productForm.categoryId ?? ""}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        categoryId:
                                            event.target.value === ""
                                                ? null
                                                : Number(event.target.value),
                                    }))
                                }
                            >
                                <MenuItem value="">Sem categoria</MenuItem>
                                {categories.map((category) => (
                                    <MenuItem key={category.id} value={category.id}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField
                                select
                                label="Tipo de estoque"
                                fullWidth
                                value={productForm.stockType}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        stockType: event.target.value,
                                    }))
                                }
                            >
                                {stockTypeOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Unidade"
                                fullWidth
                                value={productForm.unit}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        unit: event.target.value as StockUnit,
                                    }))
                                }
                            >
                                {unitOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                            <TextField
                                label="Estoque atual"
                                type="number"
                                fullWidth
                                value={productForm.currentStock}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        currentStock: Number(event.target.value),
                                    }))
                                }
                            />
                            <TextField
                                label="Estoque mínimo"
                                type="number"
                                fullWidth
                                value={productForm.minimumStock}
                                onChange={(event) =>
                                    setProductForm((current) => ({
                                        ...current,
                                        minimumStock: Number(event.target.value),
                                    }))
                                }
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        disabled={saving}
                        onClick={() => void handleSaveProduct()}
                    >
                        {saving ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={movementDialogOpen}
                onClose={() => setMovementDialogOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Registrar Movimentação</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            select
                            label="Tipo"
                            value={movementForm.type}
                            onChange={(event) =>
                                setMovementForm((current) => ({
                                    ...current,
                                    type: event.target.value as Exclude<StockMovementType, "venda">,
                                }))
                            }
                        >
                            {movementOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Quantidade"
                            type="number"
                            value={movementForm.quantity}
                            onChange={(event) =>
                                setMovementForm((current) => ({
                                    ...current,
                                    quantity: Number(event.target.value),
                                }))
                            }
                        />
                        <TextField
                            label="Observação"
                            value={movementForm.observation}
                            onChange={(event) =>
                                setMovementForm((current) => ({
                                    ...current,
                                    observation: event.target.value,
                                }))
                            }
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMovementDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        disabled={saving}
                        onClick={() => void handleSaveMovement()}
                    >
                        {saving ? "Registrando..." : "Registrar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
