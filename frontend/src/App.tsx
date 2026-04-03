import { NavLink, Route, Routes } from "react-router-dom";

import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
    return (
        <div className="shell">
            <header className="topbar">
                <div className="brand">
                    <strong>BarControl</strong>
                    <span>Controle de mercadorias, comandas e vendas</span>
                </div>

                <nav aria-label="Navegação principal" className="nav-links">
                    <NavLink className="nav-link" to="/">
                        Visão Geral
                    </NavLink>
                    <NavLink className="nav-link" to="/dashboard">
                        Dashboard
                    </NavLink>
                </nav>
            </header>

            <main className="main-grid">
                <Routes>
                    <Route element={<HomePage />} path="/" />
                    <Route element={<DashboardPage />} path="/dashboard" />
                </Routes>
            </main>
        </div>
    );
}
