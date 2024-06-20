import React from 'react';
import { SidebarData } from './SidebarData';
import '../App.css';
import { TbLogout } from "react-icons/tb";
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

function Sidebar() {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className='Sidebar'>
            <ul className='SidebarList'>
                {SidebarData.map((val, key) => (
                    <li
                        key={key}
                        className="row"
                        id={window.location.pathname === val.link ? "active" : ""}
                        onClick={() => navigate(val.link)}
                    >
                        <div id="icon">
                            {val.icon}
                        </div>
                        <div id="title">
                            {val.title}
                        </div>
                    </li>
                ))}
                {isLoggedIn && (
                    <li className="row" onClick={handleLogout}>
                        <div id="icon"><TbLogout /></div>
                        <div id="title">Logout</div>
                    </li>
                )}
            </ul>
        </div>
    );
};

export default Sidebar;
