import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
    getCurrentUser,
    getStoredAuthToken,
    login,
    logout,
    setStoredAuthToken,
    type AuthUser,
} from "../services/barControlApi";

type AuthContextValue = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    loginUser: (input: { username: string; password: string }) => Promise<void>;
    logoutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            const token = getStoredAuthToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const currentUser = await getCurrentUser();
                if (!cancelled) {
                    setUser(currentUser);
                    setError(null);
                }
            } catch (requestError) {
                setStoredAuthToken(null);
                if (!cancelled) {
                    setUser(null);
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Nao foi possivel restaurar a sessao.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void bootstrap();

        return () => {
            cancelled = true;
        };
    }, []);

    async function loginUser(input: { username: string; password: string }) {
        setError(null);
        const response = await login(input);
        setUser(response.user);
    }

    async function logoutUser() {
        setError(null);
        try {
            await logout();
        } finally {
            setUser(null);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: user !== null,
                loading,
                error,
                loginUser,
                logoutUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
