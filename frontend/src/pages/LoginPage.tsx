import { useState } from "react";

import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
    Alert,
    Box,
    Button,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";

export function LoginPage() {
    const { loginUser } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setSubmitting(true);
            setPageError(null);
            await loginUser({
                username: username.trim(),
                password,
            });
        } catch (requestError) {
            setPageError(
                requestError instanceof Error
                    ? requestError.message
                    : "Nao foi possivel entrar no sistema.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "grid",
                placeItems: "center",
                px: 2,
                py: 4,
                background:
                    "radial-gradient(circle at top right, rgba(157, 241, 151, 0.18), transparent 30%), linear-gradient(180deg, #fbfdfc 0%, #eef6f2 100%)",
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 440,
                    p: { xs: 3, md: 4 },
                    borderRadius: "20px",
                    boxShadow: "0 24px 60px rgba(36, 49, 50, 0.08)",
                }}
            >
                <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                    <Stack spacing={1.5} alignItems="center" textAlign="center">
                        <Box
                            component="img"
                            src={logo}
                            alt="BarControl"
                            sx={{ width: 180, height: "auto" }}
                        />
                        <Box>
                            <Typography
                                sx={{
                                    color: "#4a76d6",
                                    fontSize: "clamp(2rem, 3vw, 3rem)",
                                    lineHeight: 1,
                                    letterSpacing: "-0.04em",
                                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                                    fontWeight: 800,
                                }}
                            >
                                Entrar no Sistema
                            </Typography>
                            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                                Acesse o BarControl com seu usuário de operador ou gerente.
                            </Typography>
                        </Box>
                    </Stack>

                    <Alert severity="info" sx={{ borderRadius: "14px" }}>
                        Acesso inicial de demonstração: <strong>admin</strong> /{" "}
                        <strong>admin123</strong>
                    </Alert>

                    {pageError ? <Alert severity="error">{pageError}</Alert> : null}

                    <TextField
                        autoFocus
                        fullWidth
                        label="Usuário"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonRoundedIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOpenRoundedIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        disabled={submitting || username.trim().length === 0 || password.length === 0}
                        size="large"
                        variant="contained"
                        sx={{
                            minHeight: 56,
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #1c6d25 0%, #9df197 100%)",
                            color: "#083f10",
                            boxShadow: "0 16px 32px rgba(28, 109, 37, 0.16)",
                        }}
                    >
                        {submitting ? "Entrando..." : "Entrar"}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
