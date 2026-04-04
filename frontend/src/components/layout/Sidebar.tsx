import type { ReactNode } from "react";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";

import logo from "../../assets/logo.png";

type NavItem = {
    label: string;
    to?: string;
    icon: ReactNode;
};

const navItems: NavItem[] = [
    { label: "Dashboard", to: "/dashboard", icon: <DashboardRoundedIcon /> },
    { label: "Comandas", to: "/comandas", icon: <ReceiptLongRoundedIcon /> },
    { label: "Estoque", icon: <Inventory2RoundedIcon /> },
    { label: "Financeiro", icon: <PaymentsRoundedIcon /> },
    { label: "Configuracoes", icon: <SettingsRoundedIcon /> },
];

export function Sidebar() {
    const location = useLocation();

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
                    alt="BarControl Gestao de Bar e Mercearia"
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
                {navItems.map((item) => {
                    const selected =
                        item.to !== undefined &&
                        (location.pathname === item.to ||
                            (item.to === "/comandas" &&
                                (location.pathname === "/" ||
                                    location.pathname.startsWith("/comandas/"))));

                    if (!item.to) {
                        return (
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
                        );
                    }

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
            </List>
        </Box>
    );
}
