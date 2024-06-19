import React, { useState } from 'react';
import axios from 'axios';
import { PiMonitorPlayFill } from "react-icons/pi";
import { SidebarData } from '../components/SidebarData';
import { NavLink } from 'react-router-dom';

function Home() {
    const [activeLink, setActiveLink] = useState('Home');
    const [data, setData] = useState(null);

    const handleLinkClick = async (link) => {
        setActiveLink(link);
        /*try {
            const response = await axios.get(`https://vms-demo.onrender.com/${link.toLowerCase()}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }*/
    };

    return (
        <div className="Home">
            <header className="home-header">
                <h1><PiMonitorPlayFill /> Video management system</h1>
                <nav className="home-nav">
                    <ul>
                        {SidebarData.map((item, index) => (
                            <li className='home-row' key={index}>
                                <NavLink
                                    to={item.link}
                                    onClick={() => handleLinkClick(item.title)}
                                >
                                    <span id='home-icon'>{item.icon}</span>
                                    <span id='home-title'>{item.title}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>
            <footer>
                <p>&copy;AIRBUS PSS</p>
            </footer>
        </div>
    );
}

export default Home;
