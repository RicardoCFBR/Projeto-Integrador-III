import type { ReactElement } from "react";

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
import { CashSessionProvider, useCashSession } from "./contexts/CashSessionContext";
import { TabsProvider } from "./contexts/TabsContext";
import { DashboardPage } from "./pages/DashboardPage";
import { CashierPage } from "./pages/CashierPage";
import { CashierOverviewPage } from "./pages/CashierOverviewPage";
import { FinancePage } from "./pages/FinancePage";
import { SalesHistoryPage } from "./pages/SalesHistoryPage";
import { TabDetailPage } from "./pages/TabDetailPage";
import { TabsPage } from "./pages/TabsPage";

let theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#1c6d25",
            light: "#9df197",
        },
        secondary: {
            main: "#0062a5",
        },
        background: {
            default: "#f8faf9",
            paper: "#ffffff",
        },
        text: {
            primary: "#243132",
            secondary: "#6e7878",
        },
        error: {
            main: "#a73b21",
        },
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
                    background: "linear-gradient(180deg, #fbfdfc 0%, #f5f9f7 100%)",
                },
            },
        },
    },
});

theme = responsiveFontSizes(theme);

function HomeRoute() {
    const { isCashOpen, loading } = useCashSession();

    if (loading) {
        return (
            <Box sx={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    return <Navigate replace to={isCashOpen ? "/comandas" : "/caixa"} />;
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

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

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
                                </Routes>
                            </Box>
                        </Box>
                    </Box>
                </TabsProvider>
            </CashSessionProvider>
        </ThemeProvider>
    );
}
