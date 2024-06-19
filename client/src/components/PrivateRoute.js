import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export const PrivateRoute = ({ children }) => {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return <Navigate to="/" />;
    }

    return children;
};

export default PrivateRoute