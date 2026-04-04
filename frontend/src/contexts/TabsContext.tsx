import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    createTab as createTabRequest,
    listTabsMural,
    updateTabStatus as updateTabStatusRequest,
    type TabDetail,
    type TabStatus,
    type TabSummary,
} from "../services/barControlApi";

type TabsContextValue = {
    tabs: TabSummary[];
    loading: boolean;
    error: string | null;
    refreshTabs: () => Promise<void>;
    createTab: (customerName: string) => Promise<TabDetail>;
    updateTabStatus: (tabId: string, status: TabStatus) => Promise<TabDetail>;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProviderProps = {
    children: ReactNode;
};

export function TabsProvider({ children }: TabsProviderProps) {
    const [tabs, setTabs] = useState<TabSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function refreshTabs() {
        setLoading(true);
        setError(null);

        try {
            const response = await listTabsMural();
            setTabs(response);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Nao foi possivel carregar as comandas.",
            );
        } finally {
            setLoading(false);
        }
    }

    async function createTab(customerName: string) {
        const createdTab = await createTabRequest(customerName);
        await refreshTabs();
        return createdTab;
    }

    async function updateTabStatus(tabId: string, status: TabStatus) {
        const updatedTab = await updateTabStatusRequest(tabId, status);
        await refreshTabs();
        return updatedTab;
    }

    useEffect(() => {
        void refreshTabs();
    }, []);

    const value = useMemo<TabsContextValue>(
        () => ({
            tabs,
            loading,
            error,
            refreshTabs,
            createTab,
            updateTabStatus,
        }),
        [tabs, loading, error],
    );

    return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useTabs() {
    const context = useContext(TabsContext);

    if (!context) {
        throw new Error("useTabs must be used within a TabsProvider");
    }

    return context;
}
