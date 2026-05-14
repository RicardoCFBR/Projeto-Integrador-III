import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeModeContextValue = {
    mode: ThemeMode;
    toggleMode: () => void;
};

const THEME_MODE_STORAGE_KEY = "barcontrol-theme-mode";

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function applyDocumentTheme(mode: ThemeMode) {
    if (typeof document === "undefined") {
        return;
    }

    document.documentElement.dataset.theme = mode;
}

function getInitialMode(): ThemeMode {
    if (typeof window === "undefined") {
        return "light";
    }

    const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    const initialMode = storedMode === "dark" ? "dark" : "light";
    applyDocumentTheme(initialMode);
    return initialMode;
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(() => getInitialMode());

    useEffect(() => {
        window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    }, [mode]);

    const value = useMemo<ThemeModeContextValue>(
        () => ({
            mode,
            toggleMode: () =>
                setMode((currentMode) => {
                    const nextMode = currentMode === "light" ? "dark" : "light";
                    applyDocumentTheme(nextMode);
                    return nextMode;
                }),
        }),
        [mode],
    );

    return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
    const context = useContext(ThemeModeContext);

    if (!context) {
        throw new Error("useThemeMode must be used within a ThemeModeProvider.");
    }

    return context;
}
