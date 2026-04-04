export type TabStatus = "open" | "closed";

export type TabSummary = {
    id: string;
    customerName: string;
    elapsedTime: string;
    totalLabel: string;
    totalValue: string;
    note?: string;
    status: TabStatus;
    tabLabel: string;
};

export const mockTabs: TabSummary[] = [
    {
        id: "1",
        customerName: "Ricardo",
        elapsedTime: "Ha 45 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 145,90",
        note: "Mesa com 3 pessoas",
        status: "open",
        tabLabel: "Comanda #2402",
    },
    {
        id: "2",
        customerName: "Joao do Balcao",
        elapsedTime: "Ha 12 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 42,00",
        status: "open",
        tabLabel: "Comanda #2403",
    },
    {
        id: "3",
        customerName: "Ana Clara",
        elapsedTime: "Ha 1h 20 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 312,50",
        note: "Conta em andamento",
        status: "open",
        tabLabel: "Comanda #2404",
    },
    {
        id: "4",
        customerName: "Marcos",
        elapsedTime: "Encerrada as 19:45",
        totalLabel: "Final",
        totalValue: "R$ 89,00",
        status: "closed",
        tabLabel: "Comanda #2405",
    },
    {
        id: "5",
        customerName: "Carlos Eduardo",
        elapsedTime: "Ha 5 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 0,00",
        status: "open",
        tabLabel: "Comanda #2406",
    },
    {
        id: "6",
        customerName: "Beatriz Lopes",
        elapsedTime: "Ha 2h 15 min",
        totalLabel: "Total parcial",
        totalValue: "R$ 842,00",
        note: "Cliente premium",
        status: "open",
        tabLabel: "Comanda #2407",
    },
];

export const newTabDraft: TabSummary = {
    id: "nova",
    customerName: "Nova Comanda",
    elapsedTime: "Recem-aberta",
    totalLabel: "Total parcial",
    totalValue: "R$ 0,00",
    status: "open",
    tabLabel: "Comanda #----",
};

export function getMockTabById(tabId?: string) {
    if (tabId === "nova") {
        return newTabDraft;
    }

    return mockTabs.find((tab) => tab.id === tabId) ?? mockTabs[0];
}
