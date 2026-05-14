import { useEffect, useState } from "react";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
    Box,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    useTheme,
} from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { useCashSession } from "../../contexts/CashSessionContext";
import { useThemeMode } from "../../contexts/ThemeModeContext";

const topItems = [{ label: "Dashboard", to: "/dashboard", icon: <DashboardRoundedIcon /> }];

const cashChildren = [
    { label: "Comandas", to: "/comandas", icon: <ReceiptLongRoundedIcon /> },
    { label: "Venda no Caixa", to: "/caixa/nova-venda", icon: <PointOfSaleRoundedIcon /> },
];

const historyItem = {
    label: "Histórico de Vendas",
    to: "/historico-vendas",
    icon: <ReceiptLongRoundedIcon />,
};

const financeItem = {
    label: "Financeiro",
    to: "/financeiro",
    icon: <PaymentsRoundedIcon />,
};

const stockItem = {
    label: "Estoque",
    to: "/estoque",
    icon: <Inventory2RoundedIcon />,
};

const bottomItems = [{ label: "Configurações", icon: <SettingsRoundedIcon /> }];

const linkSx = {
    minHeight: 48,
    px: 1.75,
    borderRadius: "14px",
    "& .MuiListItemIcon-root": {
        color: "inherit",
        minWidth: 36,
    },
};

export function Sidebar() {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { isCashOpen } = useCashSession();
    const { mode, toggleMode } = useThemeMode();
    const cashGroupSelected =
        location.pathname.startsWith("/caixa") || location.pathname.startsWith("/comandas");
    const [cashGroupExpanded, setCashGroupExpanded] = useState(false);
    const selectedBg = "var(--surface-selected)";
    const hoverBg = "var(--surface-hover)";
    const selectedShadow = "var(--shadow-selected)";
    const baseTextColor = theme.palette.mode === "dark" ? "#d5e1de" : "#3e4d4f";
    const mutedTextColor = theme.palette.mode === "dark" ? "#a7bbb8" : "#526163";
    const disabledTextColor =
        theme.palette.mode === "dark" ? "rgba(213, 225, 222, 0.42)" : "rgba(62, 77, 79, 0.42)";

    useEffect(() => {
        if (isCashOpen) {
            setCashGroupExpanded(true);
            return;
        }

        setCashGroupExpanded(false);
    }, [isCashOpen]);

    const cashLabelId = "cash-group-label";

    return (
        <Box
            component="aside"
            sx={{
                position: { md: "sticky" },
                top: 0,
                height: { md: "100vh" },
                p: { xs: 2, md: "28px 22px" },
                display: "flex",
                flexDirection: "column",
                background:
                    "var(--sidebar-background)",
                borderRight: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
                <Box
                    component="img"
                    alt="BarControl Gestão de Bar e Mercearia"
                    src={logo}
                    sx={{
                        display: "block",
                        width: "min(100%, 180px)",
                        height: "auto",
                        mx: "auto",
                    }}
                />
            </Box>

            <List disablePadding sx={{ display: "grid", gap: 1 }}>
                {topItems.map((item) => {
                    const selected = location.pathname === item.to;

                    return (
                        <ListItemButton
                            component={NavLink}
                            key={item.label}
                            selected={selected}
                            sx={{
                                ...linkSx,
                                color: selected ? "#1b58d8" : baseTextColor,
                                "& .MuiListItemText-primary": {
                                    fontWeight: selected ? 700 : 500,
                                },
                                "&.Mui-selected": {
                                    bgcolor: selectedBg,
                                    boxShadow: selectedShadow,
                                },
                                "&.Mui-selected:hover": {
                                    bgcolor: selectedBg,
                                },
                                "&:hover": {
                                    bgcolor: hoverBg,
                                    color: "primary.main",
                                },
                            }}
                            to={item.to}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    );
                })}

                <Box sx={{ mt: 0.5 }}>
                    <ListItemButton
                        onClick={() => navigate("/caixa")}
                        selected={cashGroupSelected || cashGroupExpanded}
                        sx={{
                            ...linkSx,
                            color: cashGroupSelected || cashGroupExpanded ? "#1b58d8" : baseTextColor,
                            "& .MuiListItemText-primary": {
                                fontWeight: cashGroupSelected || cashGroupExpanded ? 700 : 500,
                            },
                            "&.Mui-selected": {
                                bgcolor: selectedBg,
                                boxShadow: selectedShadow,
                            },
                            "&.Mui-selected:hover": {
                                bgcolor: selectedBg,
                            },
                            "&:hover": {
                                bgcolor: hoverBg,
                                color: "primary.main",
                            },
                        }}
                    >
                        <ListItemIcon>
                            <PointOfSaleRoundedIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary="Caixa"
                            secondary={isCashOpen ? "Caixa aberto" : "Caixa fechado"}
                            id={cashLabelId}
                        />
                        <IconButton
                            aria-label={cashGroupExpanded ? "Recolher menu do caixa" : "Expandir menu do caixa"}
                            aria-controls="cash-group-children"
                            aria-expanded={isCashOpen ? cashGroupExpanded : false}
                            aria-labelledby={cashLabelId}
                            disabled={!isCashOpen}
                            edge="end"
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (!isCashOpen) {
                                    return;
                                }
                                setCashGroupExpanded((currentValue) => !currentValue);
                            }}
                            sx={{
                                color: "text.secondary",
                                "&.Mui-disabled": {
                                    color: disabledTextColor,
                                },
                            }}
                        >
                            <ExpandMoreRoundedIcon
                                sx={{
                                    transform: cashGroupExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 160ms ease",
                                }}
                            />
                        </IconButton>
                    </ListItemButton>

                    <Box
                        id="cash-group-children"
                        sx={{ display: isCashOpen && cashGroupExpanded ? "block" : "none" }}
                    >
                        <Stack spacing={0.5} sx={{ mt: 0.5, pl: 1.5 }}>
                            {cashChildren.map((item) => {
                                const selected =
                                    item.to === "/comandas"
                                        ? location.pathname === "/comandas" || location.pathname.startsWith("/comandas/")
                                        : location.pathname.startsWith("/caixa/nova-venda");

                                return (
                                    <ListItemButton
                                        component={NavLink}
                                        disabled={!isCashOpen}
                                        key={item.label}
                                        selected={isCashOpen && selected}
                                        sx={{
                                            minHeight: 40,
                                            pl: 2,
                                            pr: 1.25,
                                            borderRadius: "12px",
                                            color: !isCashOpen
                                                ? disabledTextColor
                                                : selected
                                                  ? "#1b58d8"
                                                  : mutedTextColor,
                                            "& .MuiListItemIcon-root": {
                                                color: "inherit",
                                                minWidth: 32,
                                            },
                                            "& .MuiListItemText-primary": {
                                                fontWeight: selected ? 700 : 500,
                                                fontSize: "0.95rem",
                                            },
                                            "&.Mui-selected": {
                                                bgcolor: selectedBg,
                                            },
                                            "&.Mui-selected:hover": {
                                                bgcolor: selectedBg,
                                            },
                                            "&.Mui-disabled": {
                                                opacity: 1,
                                            },
                                            "&:hover": {
                                                bgcolor: isCashOpen ? hoverBg : "transparent",
                                            },
                                        }}
                                        to={item.to}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.label} />
                                    </ListItemButton>
                                );
                            })}
                        </Stack>
                    </Box>
                </Box>

                <ListItemButton
                    component={NavLink}
                    selected={location.pathname.startsWith(historyItem.to)}
                    sx={{
                        ...linkSx,
                        color: location.pathname.startsWith(historyItem.to) ? "#1b58d8" : baseTextColor,
                        "& .MuiListItemText-primary": {
                            fontWeight: location.pathname.startsWith(historyItem.to) ? 700 : 500,
                        },
                        "&.Mui-selected": {
                            bgcolor: selectedBg,
                            boxShadow: selectedShadow,
                        },
                        "&.Mui-selected:hover": {
                            bgcolor: selectedBg,
                        },
                        "&:hover": {
                            bgcolor: hoverBg,
                            color: "primary.main",
                        },
                    }}
                    to={historyItem.to}
                >
                    <ListItemIcon>{historyItem.icon}</ListItemIcon>
                    <ListItemText primary={historyItem.label} />
                </ListItemButton>

                <ListItemButton
                    component={NavLink}
                    selected={location.pathname.startsWith(financeItem.to)}
                    sx={{
                        ...linkSx,
                        color: location.pathname.startsWith(financeItem.to) ? "#1b58d8" : baseTextColor,
                        "& .MuiListItemText-primary": {
                            fontWeight: location.pathname.startsWith(financeItem.to) ? 700 : 500,
                        },
                        "&.Mui-selected": {
                            bgcolor: selectedBg,
                            boxShadow: selectedShadow,
                        },
                        "&.Mui-selected:hover": {
                            bgcolor: selectedBg,
                        },
                        "&:hover": {
                            bgcolor: hoverBg,
                            color: "primary.main",
                        },
                    }}
                    to={financeItem.to}
                >
                    <ListItemIcon>{financeItem.icon}</ListItemIcon>
                    <ListItemText primary={financeItem.label} />
                </ListItemButton>

                <ListItemButton
                    component={NavLink}
                    selected={location.pathname.startsWith(stockItem.to)}
                    sx={{
                        ...linkSx,
                        color: location.pathname.startsWith(stockItem.to) ? "#1b58d8" : baseTextColor,
                        "& .MuiListItemText-primary": {
                            fontWeight: location.pathname.startsWith(stockItem.to) ? 700 : 500,
                        },
                        "&.Mui-selected": {
                            bgcolor: selectedBg,
                            boxShadow: selectedShadow,
                        },
                        "&.Mui-selected:hover": {
                            bgcolor: selectedBg,
                        },
                        "&:hover": {
                            bgcolor: hoverBg,
                            color: "primary.main",
                        },
                    }}
                    to={stockItem.to}
                >
                    <ListItemIcon>{stockItem.icon}</ListItemIcon>
                    <ListItemText primary={stockItem.label} />
                </ListItemButton>

                {bottomItems.map((item) => (
                    <Paper
                        elevation={0}
                        key={item.label}
                        sx={{
                            borderRadius: "14px",
                            bgcolor: "transparent",
                            opacity: 0.7,
                        }}
                    >
                        <ListItemButton disabled sx={{ minHeight: 48, px: 1.75 }}>
                            <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </Paper>
                ))}
            </List>

            <Box sx={{ mt: "auto", pt: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.25,
                        borderRadius: "18px",
                        bgcolor: "transparent",
                        border: "none",
                    }}
                >
                    <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="center">
                        
                        <Box
                            role="switch"
                            aria-checked={mode === "dark"}
                            aria-label="Alternar entre modo claro e modo escuro"
                            onClick={toggleMode}
                            sx={{
                                bgcolor:
                                    mode === "dark" ? "#201e1f" : "#f4f4f1",
                                borderRadius: "999px",
                                width: 116,
                                height: 58,
                                p: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow:
                                    mode === "dark"
                                        ? "inset 0 1px 0 rgba(255,255,255,0.04)"
                                        : "inset 0 1px 0 rgba(255,255,255,0.6)",
                                cursor: "pointer",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: "999px",
                                    bgcolor: mode === "dark" ? "transparent" : "#3d45b6",
                                    color: mode === "dark" ? "rgba(255,255,255,0.62)" : "#ffffff",
                                    display: "grid",
                                    placeItems: "center",
                                    transition: "all 160ms ease",
                                }}
                            >
                                <LightModeRoundedIcon fontSize="small" />
                            </Box>

                            <Box
                                sx={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: "999px",
                                    bgcolor: mode === "dark" ? "#3d45b6" : "transparent",
                                    color: mode === "dark" ? "#ffffff" : "rgba(38, 44, 53, 0.26)",
                                    display: "grid",
                                    placeItems: "center",
                                    transition: "all 160ms ease",
                                }}
                            >
                                <DarkModeRoundedIcon fontSize="small" />
                            </Box>
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}
