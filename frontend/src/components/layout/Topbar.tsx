import { useState } from "react";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import {
    AppBar,
    Avatar,
    Box,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Typography,
    useTheme,
} from "@mui/material";

import { useAuth } from "../../contexts/AuthContext";
import { useCashSession } from "../../contexts/CashSessionContext";

export function Topbar() {
    const theme = useTheme();
    const { isCashOpen } = useCashSession();
    const { user, logoutUser } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const avatarMenuOpen = Boolean(anchorEl);

    return (
        <AppBar
            color="transparent"
            elevation={0}
            position="sticky"
            sx={{
                backdropFilter: "blur(14px)",
                bgcolor: "var(--topbar-background)",
                borderBottom: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Toolbar
                sx={{
                    minHeight: "76px",
                    justifyContent: "space-between",
                    gap: 2,
                    px: { xs: 2, md: 3.5 },
                }}
            >
                <Chip
                    color={isCashOpen ? "success" : "default"}
                    label={isCashOpen ? "Caixa Aberto" : "Caixa Fechado"}
                    sx={{
                        borderRadius: "999px",
                        fontWeight: 800,
                        bgcolor: isCashOpen ? "rgba(28, 109, 37, 0.12)" : "var(--surface-soft)",
                        color: isCashOpen ? "primary.main" : "text.secondary",
                    }}
                />

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: "auto" }}>
                    <IconButton
                        aria-label="Notificações"
                        sx={{
                            bgcolor: "var(--surface-soft)",
                            color: "text.secondary",
                            "&:hover": {
                                bgcolor: "var(--surface-strong)",
                            },
                        }}
                    >
                        <NotificationsRoundedIcon />
                    </IconButton>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            pl: 2.25,
                            borderLeft: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Box sx={{ textAlign: "right" }}>
                            <Typography
                                sx={{
                                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    lineHeight: 1.2,
                                }}
                            >
                                {user?.fullName ?? "Operador"}
                            </Typography>
                            <Typography color="text.secondary" sx={{ fontSize: "0.76rem" }}>
                                {user?.isStaff ? "Perfil: Gerente" : "Perfil: Operador"}
                            </Typography>
                        </Box>

                        <IconButton
                            aria-label="Abrir menu do usuário"
                            onClick={(event) => setAnchorEl(event.currentTarget)}
                            sx={{ p: 0 }}
                        >
                            <Avatar
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: "#20492c",
                                    fontSize: "0.75rem",
                                    fontWeight: 800,
                                }}
                            >
                                {user?.initials ?? "BC"}
                            </Avatar>
                        </IconButton>
                    </Box>
                </Stack>

                <Menu
                    anchorEl={anchorEl}
                    open={avatarMenuOpen}
                    onClose={() => setAnchorEl(null)}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                    <MenuItem
                        onClick={async () => {
                            setAnchorEl(null);
                            await logoutUser();
                        }}
                    >
                        <LogoutRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                        Sair
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
}
