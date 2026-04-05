import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
    closeCashSession,
    getCashOverview,
    openCashSession,
    type CashMovement,
    type CashOverview,
    type CashSession,
} from "../services/barControlApi";

type CashSessionContextValue = {
    session: CashSession;
    movements: CashMovement[];
    summary: CashOverview["summary"];
    isCashOpen: boolean;
    loading: boolean;
    error: string | null;
    openCash: (openingFund: number) => Promise<void>;
    closeCash: () => Promise<void>;
    refreshCashSession: () => Promise<void>;
};

const closedSession: CashSession = {
    id: null,
    status: "closed",
    openingFund: "R$ 0,00",
    openingFundNumber: 0,
    openedAt: null,
    closedAt: null,
    openedBy: "Ricardo Silva",
};

const defaultSummary: CashOverview["summary"] = {
    openingFund: "R$ 0,00",
    openingFundNumber: 0,
    balance: "R$ 0,00",
    balanceNumber: 0,
    movementsCount: 0,
    salesCount: 0,
};

const CashSessionContext = createContext<CashSessionContextValue | undefined>(undefined);

export function CashSessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<CashSession>(closedSession);
    const [movements, setMovements] = useState<CashMovement[]>([]);
    const [summary, setSummary] = useState(defaultSummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    function applyOverview(overview: CashOverview) {
        setSession(overview.session);
        setMovements(overview.movements);
        setSummary(overview.summary);
    }

    async function refreshCashSession() {
        try {
            setLoading(true);
            setError(null);
            const overview = await getCashOverview();
            applyOverview(overview);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Não foi possível carregar a sessão de caixa.",
            );
            applyOverview({
                session: closedSession,
                movements: [],
                summary: defaultSummary,
            });
        } finally {
            setLoading(false);
        }
    }

    async function openCash(openingFund: number) {
        setError(null);
        const overview = await openCashSession(openingFund);
        applyOverview(overview);
    }

    async function closeCash() {
        setError(null);
        const overview = await closeCashSession();
        applyOverview(overview);
    }

    useEffect(() => {
        void refreshCashSession();
    }, []);

    return (
        <CashSessionContext.Provider
            value={{
                session,
                movements,
                summary,
                isCashOpen: session.status === "open",
                loading,
                error,
                openCash,
                closeCash,
                refreshCashSession,
            }}
        >
            {children}
        </CashSessionContext.Provider>
    );
}

export function useCashSession() {
    const context = useContext(CashSessionContext);

    if (!context) {
        throw new Error("useCashSession must be used within a CashSessionProvider.");
    }

    return context;
}
