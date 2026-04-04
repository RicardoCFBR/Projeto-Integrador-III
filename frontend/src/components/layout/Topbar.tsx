import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { AppBar, Avatar, Box, IconButton, Toolbar, Typography } from "@mui/material";

export function Topbar() {
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
                    justifyContent: "flex-end",
                    gap: 2,
                    px: { xs: 2, md: 3.5 },
                }}
            >
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
