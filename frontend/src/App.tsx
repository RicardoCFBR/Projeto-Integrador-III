import {
    Box,
    CssBaseline,
    ThemeProvider,
    createTheme,
    responsiveFontSizes,
} from "@mui/material";
import { Route, Routes } from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { TabsProvider } from "./contexts/TabsContext";
import { DashboardPage } from "./pages/DashboardPage";
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

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

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
                                <Route element={<TabsPage />} path="/" />
                                <Route element={<TabsPage />} path="/comandas" />
                                <Route element={<TabDetailPage />} path="/comandas/:tabId" />
                                <Route element={<DashboardPage />} path="/dashboard" />
                            </Routes>
                        </Box>
                    </Box>
                </Box>
            </TabsProvider>
        </ThemeProvider>
    );
}
