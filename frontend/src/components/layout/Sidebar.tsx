import { useEffect, useState } from "react";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
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
} from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useCashSession } from "../../contexts/CashSessionContext";
import logo from "../../assets/logo.png";

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

const bottomItems = [
    { label: "Estoque", icon: <Inventory2RoundedIcon /> },
    { label: "Financeiro", icon: <PaymentsRoundedIcon /> },
    { label: "Configurações", icon: <SettingsRoundedIcon /> },
];

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isCashOpen } = useCashSession();
    const cashGroupSelected =
        location.pathname.startsWith("/caixa") || location.pathname.startsWith("/comandas");
    const [cashGroupExpanded, setCashGroupExpanded] = useState(false);

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
                background: "linear-gradient(180deg, #f7fbf9 0%, #eef6f2 100%)",
            }}
        >
            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
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
                                minHeight: 48,
                                px: 1.75,
                                borderRadius: "14px",
                                color: selected ? "#1b58d8" : "#3e4d4f",
                                "& .MuiListItemIcon-root": {
                                    color: "inherit",
                                    minWidth: 36,
                                },
                                "& .MuiListItemText-primary": {
                                    fontWeight: selected ? 700 : 500,
                                },
                                "&.Mui-selected": {
                                    bgcolor: "rgba(255,255,255,0.92)",
                                    boxShadow: "0 10px 22px rgba(45, 52, 51, 0.04)",
                                },
                                "&.Mui-selected:hover": {
                                    bgcolor: "rgba(255,255,255,0.92)",
                                },
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.75)",
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
                            minHeight: 48,
                            px: 1.75,
                            borderRadius: "14px",
                            color: cashGroupSelected || cashGroupExpanded ? "#1b58d8" : "#3e4d4f",
                            "& .MuiListItemIcon-root": {
                                color: "inherit",
                                minWidth: 36,
                            },
                            "& .MuiListItemText-primary": {
                                fontWeight: cashGroupSelected || cashGroupExpanded ? 700 : 500,
                            },
                            "&.Mui-selected": {
                                bgcolor: "rgba(255,255,255,0.92)",
                                boxShadow: "0 10px 22px rgba(45, 52, 51, 0.04)",
                            },
                            "&.Mui-selected:hover": {
                                bgcolor: "rgba(255,255,255,0.92)",
                            },
                            "&:hover": {
                                bgcolor: "rgba(255,255,255,0.75)",
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
                            aria-label={
                                cashGroupExpanded
                                    ? "Recolher menu do caixa"
                                    : "Expandir menu do caixa"
                            }
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
                                    color: "rgba(62, 77, 79, 0.42)",
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
                        sx={{
                            display: isCashOpen && cashGroupExpanded ? "block" : "none",
                        }}
                    >
                        <Stack spacing={0.5} sx={{ mt: 0.5, pl: 1.5 }}>
                            {cashChildren.map((item) => {
                                const selected =
                                    item.to === "/comandas"
                                        ? location.pathname === "/comandas" ||
                                          location.pathname.startsWith("/comandas/")
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
                                            color:
                                                !isCashOpen
                                                    ? "rgba(62, 77, 79, 0.42)"
                                                    : selected
                                                      ? "#1b58d8"
                                                      : "#526163",
                                            "& .MuiListItemIcon-root": {
                                                color: "inherit",
                                                minWidth: 32,
                                            },
                                            "& .MuiListItemText-primary": {
                                                fontWeight: selected ? 700 : 500,
                                                fontSize: "0.95rem",
                                            },
                                            "&.Mui-selected": {
                                                bgcolor: "rgba(255,255,255,0.92)",
                                            },
                                            "&.Mui-selected:hover": {
                                                bgcolor: "rgba(255,255,255,0.92)",
                                            },
                                            "&.Mui-disabled": {
                                                opacity: 1,
                                            },
                                            "&:hover": {
                                                bgcolor: isCashOpen
                                                    ? "rgba(255,255,255,0.75)"
                                                    : "transparent",
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
                        minHeight: 48,
                        px: 1.75,
                        borderRadius: "14px",
                        color: location.pathname.startsWith(historyItem.to) ? "#1b58d8" : "#3e4d4f",
                        "& .MuiListItemIcon-root": {
                            color: "inherit",
                            minWidth: 36,
                        },
                        "& .MuiListItemText-primary": {
                            fontWeight: location.pathname.startsWith(historyItem.to) ? 700 : 500,
                        },
                        "&.Mui-selected": {
                            bgcolor: "rgba(255,255,255,0.92)",
                            boxShadow: "0 10px 22px rgba(45, 52, 51, 0.04)",
                        },
                        "&.Mui-selected:hover": {
                            bgcolor: "rgba(255,255,255,0.92)",
                        },
                        "&:hover": {
                            bgcolor: "rgba(255,255,255,0.75)",
                            color: "primary.main",
                        },
                    }}
                    to={historyItem.to}
                >
                    <ListItemIcon>{historyItem.icon}</ListItemIcon>
                    <ListItemText primary={historyItem.label} />
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
                            <ListItemIcon
                                sx={{
                                    minWidth: 36,
                                    color: "text.secondary",
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </Paper>
                ))}
            </List>
        </Box>
    );
}
