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
    createTab: (customerName: string) => TabSummary;
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
            createTab(customerName) {
                let createdTab = newTabDraft;

                setTabs((currentTabs) => {
                    const nextId = String(
                        currentTabs.reduce((maxId, tab) => {
                            const numericId = Number(tab.id);
                            return Number.isNaN(numericId) ? maxId : Math.max(maxId, numericId);
                        }, 0) + 1,
                    );
                    const nextTabNumber =
                        currentTabs.reduce((maxNumber, tab) => {
                            const numericLabel = Number(tab.tabLabel.replace(/\D/g, ""));
                            return Number.isNaN(numericLabel)
                                ? maxNumber
                                : Math.max(maxNumber, numericLabel);
                        }, 2400) + 1;

                    createdTab = {
                        id: nextId,
                        customerName,
                        elapsedTime: "Ha 0 min",
                        totalLabel: "Total parcial",
                        totalValue: "R$ 0,00",
                        status: "open",
                        tabLabel: `Comanda #${nextTabNumber}`,
                    };

                    return [createdTab, ...currentTabs];
                });

                return createdTab;
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
