import type { ReactElement } from "react";
import { useMemo } from "react";

import {
    Box,
    CircularProgress,
    CssBaseline,
    ThemeProvider,
    createTheme,
    responsiveFontSizes,
} from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CashSessionProvider, useCashSession } from "./contexts/CashSessionContext";
import { TabsProvider } from "./contexts/TabsContext";
import { ThemeModeProvider, useThemeMode } from "./contexts/ThemeModeContext";
import { DashboardPage } from "./pages/DashboardPage";
import { CashierPage } from "./pages/CashierPage";
import { CashierOverviewPage } from "./pages/CashierOverviewPage";
import { FinancePage } from "./pages/FinancePage";
import { LoginPage } from "./pages/LoginPage";
import { StockPage } from "./pages/StockPage";
import { SalesHistoryPage } from "./pages/SalesHistoryPage";
import { TabDetailPage } from "./pages/TabDetailPage";
import { TabsPage } from "./pages/TabsPage";

function buildTheme(mode: "light" | "dark") {
    const rootStyles =
        typeof window === "undefined" ? null : window.getComputedStyle(document.documentElement);
    const getCssVar = (name: string, fallback: string) =>
        rootStyles?.getPropertyValue(name).trim() || fallback;

    let theme = createTheme({
        palette: {
            mode,
            primary: {
                main: getCssVar("--primary", "#1c6d25"),
                light: getCssVar("--primary-soft", "#9df197"),
            },
            secondary: {
                main: getCssVar("--secondary", "#1b58d8"),
                light: getCssVar("--secondary", "#1b58d8"),
            },
            background: {
                default: getCssVar("--background", "#f8faf9"),
                paper: getCssVar("--surface", "#ffffff"),
            },
            text: {
                primary: getCssVar("--text", "#243132"),
                secondary: getCssVar("--muted", "#6e7878"),
            },
            error: {
                main: getCssVar("--attention", "#a73b21"),
            },
            divider: getCssVar("--border-soft", "rgba(117, 124, 123, 0.12)"),
        },
        shape: {
            borderRadius: 18,
        },
        typography: {
            fontFamily: '"Manrope", sans-serif',
            h1: {
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
            },
            h2: {
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
            },
            h3: {
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 700,
            },
            button: {
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                textTransform: "none",
            },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        background: "var(--body-background)",
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === "dark" ? "var(--surface-soft)" : undefined,
                    },
                },
            },
        },
    });

    theme = responsiveFontSizes(theme);
    return theme;
}

function HomeRoute() {
    const { loading } = useCashSession();

    if (loading) {
        return (
            <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    return <Navigate replace to="/dashboard" />;
}

function AuthenticatedOnlyRoute({ children }: { children: ReactElement }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate replace to="/login" />;
    }

    return children;
}

function CashEnabledRoute({ children }: { children: ReactElement }) {
    const { isCashOpen, loading } = useCashSession();

    if (loading) {
        return (
            <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    if (!isCashOpen) {
        return <Navigate replace to="/caixa" />;
    }

    return children;
}

function LoginOnlyRoute() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (isAuthenticated) {
        return <Navigate replace to="/dashboard" />;
    }

    return <LoginPage />;
}

function AuthenticatedAppShell() {
    return (
        <CashSessionProvider>
            <TabsProvider>
                <Box
                    sx={{
                        minHeight: "100vh",
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" },
                    }}
                >
                    <Sidebar />

                    <Box sx={{ minWidth: 0 }}>
                        <Topbar />

                        <Box component="main" className="app-shell__main">
                            <Routes>
                                <Route element={<HomeRoute />} path="/" />
                                <Route
                                    element={
                                        <CashEnabledRoute>
                                            <TabsPage />
                                        </CashEnabledRoute>
                                    }
                                    path="/comandas"
                                />
                                <Route
                                    element={
                                        <CashEnabledRoute>
                                            <TabDetailPage />
                                        </CashEnabledRoute>
                                    }
                                    path="/comandas/:tabId"
                                />
                                <Route element={<CashierOverviewPage />} path="/caixa" />
                                <Route element={<FinancePage />} path="/financeiro" />
                                <Route element={<StockPage />} path="/estoque" />
                                <Route element={<SalesHistoryPage />} path="/historico-vendas" />
                                <Route
                                    element={
                                        <CashEnabledRoute>
                                            <CashierPage />
                                        </CashEnabledRoute>
                                    }
                                    path="/caixa/nova-venda"
                                />
                                <Route element={<DashboardPage />} path="/dashboard" />
                                <Route element={<Navigate replace to="/" />} path="*" />
                            </Routes>
                        </Box>
                    </Box>
                </Box>
            </TabsProvider>
        </CashSessionProvider>
    );
}

function AppContent() {
    const { mode } = useThemeMode();
    const theme = useMemo(() => buildTheme(mode), [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Routes>
                    <Route element={<LoginOnlyRoute />} path="/login" />
                    <Route
                        path="*"
                        element={
                            <AuthenticatedOnlyRoute>
                                <AuthenticatedAppShell />
                            </AuthenticatedOnlyRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default function App() {
    return (
        <ThemeModeProvider>
            <AppContent />
        </ThemeModeProvider>
    );
}
