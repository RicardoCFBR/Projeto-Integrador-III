import { useEffect, useMemo, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Switch,
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
    createStockItem,
    listStockItems,
    updateStockItem,
    type StockItem,
    type StockItemInput,
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

const defaultForm: StockItemInput = {
    name: "",
    unit: "un",
    currentStock: 0,
    minimumStock: 0,
    isActive: true,
};

export function StockPage() {
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [dialogError, setDialogError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [unitFilter, setUnitFilter] = useState<"all" | StockUnit>("all");
    const [statusFilter, setStatusFilter] = useState<StockStatusFilter>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [form, setForm] = useState<StockItemInput>(defaultForm);

    async function loadItems() {
        try {
            setLoading(true);
            setPageError(null);
            const response = await listStockItems();
            setItems(response);
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível carregar os insumos.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadItems();
    }, []);

    const summaryCards = useMemo(() => {
        const activeItems = items.filter((item) => item.isActive);
        const itemsBelowMinimum = activeItems.filter((item) => item.isBelowMinimum);

        return [
            {
                title: "Total de Insumos",
                value: String(items.length),
                description: "Itens cadastrados na base de estoque.",
                icon: <Inventory2RoundedIcon color="secondary" />,
            },
            {
                title: "Ativos",
                value: String(activeItems.length),
                description: "Insumos disponíveis para controle.",
                icon: <WarehouseRoundedIcon color="secondary" />,
            },
            {
                title: "Abaixo do Mínimo",
                value: String(itemsBelowMinimum.length),
                description: "Insumos que precisam de reposição.",
                icon: <ReportProblemRoundedIcon color="error" />,
            },
        ];
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
            const matchesUnit = unitFilter === "all" ? true : item.unit === unitFilter;
            const matchesStatus =
                statusFilter === "all"
                    ? true
                    : statusFilter === "active"
                      ? item.isActive
                      : statusFilter === "inactive"
                        ? !item.isActive
                        : item.isBelowMinimum;

            return matchesSearch && matchesUnit && matchesStatus;
        });
    }, [items, search, unitFilter, statusFilter]);

    function openCreateDialog() {
        setEditingItem(null);
        setForm(defaultForm);
        setDialogError(null);
        setDialogOpen(true);
    }

    function openEditDialog(item: StockItem) {
        setEditingItem(item);
        setForm({
            name: item.name,
            unit: item.unit,
            currentStock: item.currentStock,
            minimumStock: item.minimumStock,
            isActive: item.isActive,
        });
        setDialogError(null);
        setDialogOpen(true);
    }

    function closeDialog() {
        if (saving) {
            return;
        }

        setDialogOpen(false);
        setDialogError(null);
        setEditingItem(null);
        setForm(defaultForm);
    }

    async function handleSubmit() {
        if (!form.name.trim()) {
            setDialogError("Informe o nome do insumo.");
            return;
        }

        try {
            setSaving(true);
            setDialogError(null);

            if (editingItem) {
                await updateStockItem(editingItem.id, form);
            } else {
                await createStockItem(form);
            }

            await loadItems();
            closeDialog();
        } catch (requestError) {
            setDialogError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível salvar o insumo.",
            );
        } finally {
            setSaving(false);
        }
    }

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
                <Stack spacing={1}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Inventory2RoundedIcon color="secondary" />
                        <Typography variant="h4">Estoque</Typography>
                    </Stack>
                    <Typography color="text.secondary">
                        Visão inicial dos insumos controlados pelo sistema, com foco em reposição e
                        base para as próximas etapas de movimentação.
                    </Typography>
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
                                md: "repeat(3, minmax(0, 1fr))",
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
                                    <Typography variant="h5">Insumos Cadastrados</Typography>
                                    <Typography color="text.secondary">
                                        Filtre, cadastre e edite os insumos básicos do estoque.
                                    </Typography>
                                </Box>

                                <Button
                                    onClick={openCreateDialog}
                                    startIcon={<AddRoundedIcon />}
                                    variant="contained"
                                >
                                    Novo Insumo
                                </Button>
                            </Stack>

                            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25}>
                                <TextField
                                    fullWidth
                                    label="Buscar insumo"
                                    onChange={(event) => setSearch(event.target.value)}
                                    value={search}
                                />
                                <TextField
                                    label="Unidade"
                                    onChange={(event) =>
                                        setUnitFilter(event.target.value as "all" | StockUnit)
                                    }
                                    select
                                    value={unitFilter}
                                    sx={{ minWidth: { xs: "100%", lg: 180 } }}
                                >
                                    <MenuItem value="all">Todas</MenuItem>
                                    {unitOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="Status"
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value as StockStatusFilter)
                                    }
                                    select
                                    value={statusFilter}
                                    sx={{ minWidth: { xs: "100%", lg: 200 } }}
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
                                            <TableCell>Insumo</TableCell>
                                            <TableCell>Unidade</TableCell>
                                            <TableCell>Estoque Atual</TableCell>
                                            <TableCell>Estoque Mínimo</TableCell>
                                            <TableCell>Situação</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    sx={{ py: 4, color: "text.secondary" }}
                                                >
                                                    Nenhum insumo encontrado para os filtros aplicados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredItems.map((item) => (
                                                <TableRow hover key={item.id}>
                                                    <TableCell sx={{ fontWeight: 700 }}>
                                                        {item.name}
                                                    </TableCell>
                                                    <TableCell>{item.unitLabel}</TableCell>
                                                    <TableCell>{item.currentStockLabel}</TableCell>
                                                    <TableCell>{item.minimumStockLabel}</TableCell>
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: item.isBelowMinimum
                                                                ? "error.main"
                                                                : "success.main",
                                                        }}
                                                    >
                                                        {item.isBelowMinimum
                                                            ? "Abaixo do mínimo"
                                                            : "Regular"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.isActive ? "Ativo" : "Inativo"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            aria-label={`Editar ${item.name}`}
                                                            onClick={() => openEditDialog(item)}
                                                            size="small"
                                                        >
                                                            <EditRoundedIcon fontSize="small" />
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
                </>
            ) : null}

            <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={dialogOpen}>
                <DialogTitle>
                    {editingItem ? "Editar Insumo" : "Cadastrar Novo Insumo"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {dialogError ? (
                            <Typography color="error" sx={{ fontWeight: 700 }}>
                                {dialogError}
                            </Typography>
                        ) : null}

                        <TextField
                            autoFocus
                            label="Nome do insumo"
                            onChange={(event) =>
                                setForm((current) => ({ ...current, name: event.target.value }))
                            }
                            value={form.name}
                        />

                        <TextField
                            label="Unidade"
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    unit: event.target.value as StockUnit,
                                }))
                            }
                            select
                            value={form.unit}
                        >
                            {unitOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                                fullWidth
                                label="Estoque atual"
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        currentStock: Number(event.target.value),
                                    }))
                                }
                                type="number"
                                value={form.currentStock}
                            />
                            <TextField
                                fullWidth
                                label="Estoque mínimo"
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        minimumStock: Number(event.target.value),
                                    }))
                                }
                                type="number"
                                value={form.minimumStock}
                            />
                        </Stack>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.isActive}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            isActive: event.target.checked,
                                        }))
                                    }
                                />
                            }
                            label="Insumo ativo"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button disabled={saving} onClick={closeDialog}>
                        Cancelar
                    </Button>
                    <Button disabled={saving} onClick={() => void handleSubmit()} variant="contained">
                        {saving ? "Salvando..." : editingItem ? "Salvar Alterações" : "Cadastrar Insumo"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
