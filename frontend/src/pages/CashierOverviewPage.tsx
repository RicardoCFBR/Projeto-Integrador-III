import { useMemo, useState } from "react";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import {
    alpha,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
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
import { Link } from "react-router-dom";

import { useCashSession } from "../contexts/CashSessionContext";
import { createCashMovement, type CashMovementType } from "../services/barControlApi";

type MovementDialogMode = "withdrawal" | "supply" | null;

function parseMoneyInput(value: string) {
    const normalized = value.replace(/[^\d,]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatOpenedAt(isoDate: string | null) {
    if (!isoDate) {
        return "--:--";
    }

    return new Date(isoDate).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function movementToneColor(type: CashMovementType) {
    switch (type) {
        case "withdrawal":
            return "#a73b21";
        case "opening":
        case "supply":
            return "#1c6d25";
        default:
            return "#4a5a5b";
    }
}

export function CashierOverviewPage() {
    const {
        closeCash,
        error,
        isCashOpen,
        loading,
        movements,
        openCash,
        refreshCashSession,
        session,
        summary,
    } = useCashSession();
    const [openingFundInput, setOpeningFundInput] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);
    const [movementDialogMode, setMovementDialogMode] = useState<MovementDialogMode>(null);
    const [movementValueInput, setMovementValueInput] = useState("");
    const [movementDescription, setMovementDescription] = useState("");

    const summaryCards = useMemo(
        () => [
            {
                label: "Operações de Venda",
                value: String(summary.salesCount),
                hint: "Vendas finalizadas no dia",
                icon: <ReceiptLongRoundedIcon color="secondary" />,
            },
            {
                label: "Fundo Inicial",
                value: summary.openingFund,
                hint: "Valor informado na abertura do caixa",
                icon: <SavingsRoundedIcon color="secondary" />,
            },
            {
                label: "Saldo em Caixa",
                value: summary.balance,
                hint: "Saldo parcial pelas movimentações registradas",
                icon: <PointOfSaleRoundedIcon color="secondary" />,
            },
            {
                label: "Movimentações",
                value: String(summary.movementsCount),
                hint: "Aberturas, sangrias, suprimentos e fechamento",
                icon: <TimelineRoundedIcon color="secondary" />,
            },
        ],
        [summary],
    );

    const overviewRows = useMemo(
        () =>
            movements.map((movement) => ({
                id: movement.id,
                registerType: "Movimentação",
                code: movement.code,
                description: movement.description || movement.typeLabel,
                detail: movement.typeLabel,
                timeLabel: movement.timeLabel,
                value: movement.value,
                tone: movementToneColor(movement.type),
            })),
        [movements],
    );

    async function handleOpenCash() {
        try {
            setActionLoading(true);
            setPageError(null);
            await openCash(parseMoneyInput(openingFundInput));
            setOpeningFundInput("");
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível abrir o caixa.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleCloseCash() {
        try {
            setActionLoading(true);
            setPageError(null);
            await closeCash();
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível fechar o caixa.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    async function handleCreateMovement() {
        if (!movementDialogMode) {
            return;
        }

        try {
            setActionLoading(true);
            setPageError(null);
            await createCashMovement({
                type: movementDialogMode,
                value: parseMoneyInput(movementValueInput),
                description: movementDescription.trim(),
            });
            await refreshCashSession();
            setMovementDialogMode(null);
            setMovementValueInput("");
            setMovementDescription("");
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível registrar a movimentação.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    if (!isCashOpen) {
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
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <PointOfSaleRoundedIcon color="secondary" />
                        <Box>
                            <Typography variant="h4">Caixa</Typography>
                            <Typography color="text.secondary">
                                Status do PDV: Caixa Fechado
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>

                <Box
                    sx={{
                        minHeight: "calc(100vh - 240px)",
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            width: "min(100%, 460px)",
                            p: { xs: 3, md: 4 },
                            borderRadius: "24px",
                            bgcolor: alpha("#ffffff", 0.9),
                            backdropFilter: "blur(14px)",
                            boxShadow: "0 24px 60px rgba(45, 52, 51, 0.08)",
                        }}
                    >
                        <Stack spacing={3} alignItems="center" textAlign="center">
                            <Box
                                sx={{
                                    width: 78,
                                    height: 78,
                                    display: "grid",
                                    placeItems: "center",
                                    borderRadius: "24px",
                                    bgcolor: "rgba(157, 241, 151, 0.34)",
                                    color: "primary.main",
                                }}
                            >
                                <PointOfSaleRoundedIcon sx={{ fontSize: 40 }} />
                            </Box>

                            <Box>
                                <Typography variant="h4" sx={{ mb: 1 }}>
                                    Abertura de Caixa
                                </Typography>
                                <Typography color="text.secondary">
                                    Inicie o turno definindo o valor inicial para troco e habilite
                                    as comandas e as vendas no caixa.
                                </Typography>
                            </Box>

                            {pageError || error ? (
                                <Typography color="error" sx={{ fontWeight: 700 }}>
                                    {pageError ?? error}
                                </Typography>
                            ) : null}

                            <TextField
                                fullWidth
                                label="Fundo de Troco Inicial"
                                placeholder="0,00"
                                value={openingFundInput}
                                onChange={(event) => setOpeningFundInput(event.target.value)}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        minHeight: 68,
                                        borderRadius: "14px",
                                        bgcolor: "#eef3f1",
                                    },
                                }}
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

                            <Button
                                fullWidth
                                disabled={actionLoading}
                                onClick={() => void handleOpenCash()}
                                size="large"
                                startIcon={<LockOpenRoundedIcon />}
                                sx={{
                                    minHeight: 58,
                                    borderRadius: "14px",
                                    background: "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                                    color: "#083f10",
                                }}
                                variant="contained"
                            >
                                Abrir Caixa
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            </Stack>
        );
    }

    return (
        <>
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
                                <Typography variant="h4">Caixa Aberto</Typography>
                            </Stack>
                            <Typography color="text.secondary">
                                Aberto às {formatOpenedAt(session.openedAt)} com fundo inicial de{" "}
                                {session.openingFund}.
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                            <Button
                                component={Link}
                                to="/caixa/nova-venda"
                                startIcon={<AddRoundedIcon />}
                            >
                                Inserir Venda
                            </Button>
                            <Button
                                color="inherit"
                                disabled={actionLoading}
                                onClick={() => void handleCloseCash()}
                                startIcon={<LockRoundedIcon />}
                            >
                                Fechar Sessão
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                {pageError || error ? (
                    <Typography color="error" sx={{ fontWeight: 700 }}>
                        {pageError ?? error}
                    </Typography>
                ) : null}

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
                                    md: "repeat(2, minmax(0, 1fr))",
                                    xl: "repeat(4, minmax(0, 1fr))",
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
                                bgcolor: "background.paper",
                                boxShadow: "0 12px 28px rgba(45, 52, 51, 0.05)",
                            }}
                        >
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="h5" sx={{ mb: 0.5 }}>
                                        Resumo Operacional do Dia
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Todas as vendas e movimentações do caixa aparecem juntas aqui.
                                    </Typography>
                                </Box>

                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Registro</TableCell>
                                            <TableCell>Código</TableCell>
                                            <TableCell>Descrição</TableCell>
                                            <TableCell>Identificação</TableCell>
                                            <TableCell>Horário</TableCell>
                                            <TableCell align="right">Valor</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {overviewRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} sx={{ color: "text.secondary" }}>
                                                    Nenhum registro operacional no dia até o momento.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            overviewRows.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>{row.registerType}</TableCell>
                                                    <TableCell>{row.code}</TableCell>
                                                    <TableCell>{row.description}</TableCell>
                                                    <TableCell>{row.detail}</TableCell>
                                                    <TableCell>{row.timeLabel}</TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontWeight: 800,
                                                            color: row.tone,
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {row.value}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
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
                                Movimentações do Caixa
                            </Typography>
                            <Typography color="text.secondary">
                                Registros reais da sessão aberta no backend.
                            </Typography>
                        </Box>

                        <Stack spacing={1.5}>
                            {movements.length === 0 ? (
                                <Typography color="text.secondary">
                                    Nenhuma movimentação registrada até o momento.
                                </Typography>
                            ) : (
                                movements.map((movement) => (
                                    <Paper
                                        elevation={0}
                                        key={movement.id}
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
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        mb: 0.4,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {movement.description || movement.typeLabel}
                                                </Typography>
                                                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                                                    {movement.code} - {movement.timeLabel}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    color: movementToneColor(movement.type),
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {movement.value}
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                ))
                            )}
                        </Stack>

                        <Stack spacing={1.25} sx={{ mt: "auto" }}>
                            <Button
                                fullWidth
                                disabled={actionLoading}
                                onClick={() => setMovementDialogMode("withdrawal")}
                                variant="outlined"
                            >
                                Registrar Sangria
                            </Button>
                            <Button
                                fullWidth
                                disabled={actionLoading}
                                onClick={() => setMovementDialogMode("supply")}
                                variant="outlined"
                            >
                                Registrar Suprimento
                            </Button>
                            <Button
                                fullWidth
                                disabled={actionLoading}
                                onClick={() => void handleCloseCash()}
                                startIcon={<ReceiptLongRoundedIcon />}
                                sx={{
                                    minHeight: 54,
                                    borderRadius: "12px",
                                    background: "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                                    color: "#083f10",
                                }}
                                variant="contained"
                            >
                                Fechar Caixa
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            </Stack>

            <Dialog
                fullWidth
                maxWidth="xs"
                onClose={() => setMovementDialogMode(null)}
                open={movementDialogMode !== null}
            >
                <DialogTitle>
                    {movementDialogMode === "withdrawal"
                        ? "Registrar Sangria"
                        : "Registrar Suprimento"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        <TextField
                            label="Valor"
                            placeholder="0,00"
                            value={movementValueInput}
                            onChange={(event) => setMovementValueInput(event.target.value)}
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
                        <TextField
                            label="Descrição"
                            placeholder={
                                movementDialogMode ? `${movementDialogMode === "withdrawal" ? "Sangria" : "Suprimento"} do caixa` : ""
                            }
                            value={movementDescription}
                            onChange={(event) => setMovementDescription(event.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button disabled={actionLoading} onClick={() => setMovementDialogMode(null)}>
                        Cancelar
                    </Button>
                    <Button
                        disabled={actionLoading}
                        onClick={() => void handleCreateMovement()}
                        variant="contained"
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
