import React, { useContext, createContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        const storedLogin = localStorage.getItem('isLoggedIn');
        return storedLogin === 'true';
    });

    const login = async (email, password) => {
        try {
            const response = await axios.post('https://18.191.200.18:3001/Login', { email, password });

            if (response.status === 200) {
                setIsLoggedIn(true);
                localStorage.setItem('isLoggedIn', true);
                return true;
            } else {
                console.error('Login failed:', response.data.message);
                return false;
            }
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
    };

    const value = { isLoggedIn, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
