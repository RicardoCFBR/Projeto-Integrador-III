import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { AppBar, Avatar, Box, Chip, IconButton, Toolbar, Typography } from "@mui/material";

import { useCashSession } from "../../contexts/CashSessionContext";

export function Topbar() {
    const { isCashOpen } = useCashSession();

    return (
        <AppBar
            color="transparent"
            elevation={0}
            position="sticky"
            sx={{
                backdropFilter: "blur(14px)",
                bgcolor: "rgba(255,255,255,0.82)",
                borderBottom: "1px solid rgba(117, 124, 123, 0.12)",
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
                        bgcolor: isCashOpen ? "rgba(28, 109, 37, 0.12)" : "#f1f4f3",
                        color: isCashOpen ? "primary.main" : "text.secondary",
                    }}
                />

                <IconButton
                    aria-label="Notificacoes"
                    sx={{
                        bgcolor: "#f1f4f3",
                        color: "text.secondary",
                        "&:hover": {
                            bgcolor: "#e6ecea",
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
                        borderLeft: "1px solid rgba(117, 124, 123, 0.12)",
                    }}
                >
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                lineHeight: 1.2,
                            }}
                        >
                            Gerente Bar
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: "0.76rem" }}>
                            Turno: Noite
                        </Typography>
                    </Box>

                    <Avatar
                        sx={{
                            width: 40,
                            height: 40,
                            bgcolor: "#20492c",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                        }}
                    >
                        RB
                    </Avatar>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
