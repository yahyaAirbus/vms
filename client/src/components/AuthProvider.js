import React, { useContext, createContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        const storedLogin = localStorage.getItem('isLoggedIn');
        return storedLogin === 'true';
    });
    const vmIp = process.env.REACT_APP_VM_IP_PUBLIC

    const login = async (email, password) => {
        try {
            const request_url = `http://${vmIp}:3001/Login`
            const response = await axios.post(request_url, { email, password });

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
