import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../components/AuthProvider";
import '../App.css';
import { PiMonitorPlayFill } from "react-icons/pi";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isLoggedIn, login } = useAuth();

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        const success = await login(email, password);
        if (success) {
            navigate('/Home');
        } else {
            setError('Email or password is incorrect.');
        }
    }

    return (
        <div className="login-container">
            <div id="title">
                <h1><PiMonitorPlayFill /> Video Management System</h1>
            </div>
            <div className="login-form">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" placeholder="Enter Email" className="form-control"
                            value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" placeholder="Enter Password" className="form-control"
                            value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn btn-success">Login</button>
                </form>
            </div>
            <footer>
                <p>&copy;AIRBUS PSS</p>
            </footer>
        </div>
    );
}

export default Login;
