import React from 'react';
import { useAuth } from './AuthProvider';

const LogoutButton = () => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div onClick={handleLogout}>Logout</div>
    );
};

export default LogoutButton;
