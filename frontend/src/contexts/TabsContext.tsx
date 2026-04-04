import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    mockTabs,
    newTabDraft,
    type TabStatus,
    type TabSummary,
} from "../mocks/tabs";

type TabsContextValue = {
    tabs: TabSummary[];
    getTabById: (tabId?: string) => TabSummary;
    updateTabStatus: (tabId: string, status: TabStatus) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProviderProps = {
    children: ReactNode;
};

export function TabsProvider({ children }: TabsProviderProps) {
    const [tabs, setTabs] = useState<TabSummary[]>(mockTabs);

    const value = useMemo<TabsContextValue>(
        () => ({
            tabs,
            getTabById(tabId) {
                if (tabId === "nova") {
                    return newTabDraft;
                }

                return tabs.find((tab) => tab.id === tabId) ?? tabs[0] ?? newTabDraft;
            },
            updateTabStatus(tabId, status) {
                setTabs((currentTabs) =>
                    currentTabs.map((tab) => (tab.id === tabId ? { ...tab, status } : tab)),
                );
            },
        }),
        [tabs],
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
