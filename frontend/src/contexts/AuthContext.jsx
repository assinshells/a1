import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        try {
            const data = await authAPI.getMe(token);
            setUser(data.user);
        } catch (error) {
            console.error('Failed to load user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (identifier, password) => {
        const data = await authAPI.login(identifier, password);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return data;
    };

    const register = async (username, email, password) => {
        const data = await authAPI.register(username, email, password);
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return data;
    };

    const logout = async () => {
        try {
            if (token) {
                await authAPI.logout(token);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
        }
    };

    const updateProfile = async (updates) => {
        const data = await authAPI.updateProfile(updates, token);
        setUser(data.user);
        return data;
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};