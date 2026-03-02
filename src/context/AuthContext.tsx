import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getOrInitDB } from '../db/db';

interface AuthContextType {
    user: User | null;
    login: (name: string, password?: string) => Promise<boolean>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuthAndDB = async () => {
            try {
                const db = await getOrInitDB();
                const storedUserId = localStorage.getItem('auth_user_id');
                if (storedUserId) {
                    const result = await db.exec({
                        sql: 'SELECT * FROM users WHERE id = ?',
                        bind: [parseInt(storedUserId)],
                        returnValue: 'resultRows'
                    });

                    if (result && result.length > 0) {
                        setUser(result[0] as unknown as User);
                    } else {
                        localStorage.removeItem('auth_user_id');
                    }
                }
            } catch (error) {
                console.error("Auth Init Error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuthAndDB();
    }, []);

    const login = async (name: string, password?: string) => {
        try {
            const db = await getOrInitDB();
            const result = await db.exec({
                sql: 'SELECT * FROM users WHERE (name = ? OR email = ?) AND password = ?',
                bind: [name, name, password],
                returnValue: 'resultRows'
            });

            if (result && result.length > 0) {
                const loggedInUser = result[0] as unknown as User;
                setUser(loggedInUser);
                localStorage.setItem('auth_user_id', loggedInUser.id.toString());
                return true;
            }
        } catch (error) {
            console.error("Login failed:", error);
        }

        // Hardcoded Fallback for Emergency access
        const fallbacks: Record<string, any> = {
            'admin@intezia.com': { id: 1, name: 'Administrador', role: 'Super admin' },
            'jean@intezia.com': { id: 2, name: 'Jean Valery', role: 'Super admin' }
        };

        if (fallbacks[name] && (password === '123456' || password === 'admin')) {
            const fUser = { ...fallbacks[name], email: name } as User;
            setUser(fUser);
            localStorage.setItem('auth_user_id', fUser.id.toString());
            return true;
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('auth_user_id');
    };

    const refreshUser = async () => {
        const storedUserId = localStorage.getItem('auth_user_id');
        if (!storedUserId) return;
        try {
            const db = await getOrInitDB();
            const result = await db.exec({
                sql: 'SELECT * FROM users WHERE id = ?',
                bind: [parseInt(storedUserId)],
                returnValue: 'resultRows'
            });
            if (result && result.length > 0) {
                setUser(result[0] as unknown as User);
            }
        } catch (error) {
            console.error("Refresh User Error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth error');
    return context;
};
