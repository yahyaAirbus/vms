import React, { useState, useEffect } from 'react';
import { SidebarData } from './SidebarData';
import '../App.css';
import { TbLogout } from "react-icons/tb";
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';

function Sidebar() {
    const { isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();
    const [viewHeight, setViewHeight] = useState('100vh');

    useEffect(() => {
        const updateHeight = () => {
            const sidebar = document.querySelector('.Sidebar');
            if (sidebar) {
                const parentHeight = sidebar.parentElement?.clientHeight || document.documentElement.clientHeight;
                setViewHeight(parentHeight + 'px');
            }
        };
        const timeoutId = setTimeout(updateHeight, 10);

        window.addEventListener('resize', updateHeight);

        const observer = new MutationObserver(() => {
            updateHeight();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateHeight);
            observer.disconnect();
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className='Sidebar' style={{ height: viewHeight }}>
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
}

export default Sidebar;
