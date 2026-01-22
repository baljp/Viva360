import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initSession = async () => {
            try {
                const stored = localStorage.getItem('viva360_user');
                if (stored) {
                    const u = JSON.parse(stored);
                    setUser(u);
                }
                
                // Optional: Validate token with backend here
                // const profile = await api.users.getProfile();
                // setUser(profile);
            } catch (error) {
                console.error("Session restoration failed", error);
                localStorage.removeItem('viva360_user');
            } finally {
                setIsLoading(false);
            }
        };
        initSession();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('viva360_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('viva360_user');
        localStorage.removeItem('viva360_token');
        window.location.href = '/login'; // Force redirect
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('viva360_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
