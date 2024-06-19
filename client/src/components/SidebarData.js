import React from "react";
import { HiOutlineVideoCamera } from "react-icons/hi2";
import { GiCctvCamera } from "react-icons/gi";
import { IoMdAdd } from "react-icons/io";
import { IoIosRecording } from "react-icons/io";
import { RiHome6Line } from "react-icons/ri";
import { FiUploadCloud } from "react-icons/fi";
import { AiOutlineVideoCameraAdd } from "react-icons/ai";

export const SidebarData = [
    {
        title: 'Home',
        icon: <RiHome6Line />,
        link: 'https://vms-demoteam.onrender.com/Home',
    },
    {
        title: 'Live',
        icon: <HiOutlineVideoCamera />,
        link: 'https://vms-demoteam.onrender.com/Live',
    },
    {
        title: 'Archive',
        icon: < IoIosRecording />,
        link: 'https://vms-demoteam.onrender.com/Archive',
    },
    {
        title: 'Devices',
        icon: <GiCctvCamera />,
        link: 'https://vms-demoteam.onrender.com/Devices',
    },
    {
        title: 'Add device',
        icon: <IoMdAdd />,
        link: 'https://vms-demoteam.onrender.com/Add-device',
    },
    {
        title: 'Add recording',
        icon: <FiUploadCloud />,
        link: 'https://vms-demoteam.onrender.com/Add-recording',
    },
    {
        title: 'Add external video',
        icon: <AiOutlineVideoCameraAdd />,
        link: 'https://vms-demoteam.onrender.com/youtube-to-rtsp',
    }
]