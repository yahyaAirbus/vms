import React from "react";
import { HiOutlineVideoCamera } from "react-icons/hi2";
import { IoMdAdd } from "react-icons/io";
import { IoIosRecording } from "react-icons/io";
import { RiHome6Line } from "react-icons/ri";
import { FiUploadCloud } from "react-icons/fi";
import { AiOutlineVideoCameraAdd } from "react-icons/ai";

export const SidebarData = [
    {
        title: 'Home',
        icon: <RiHome6Line />,
        link: '/Home',
    },
    {
        title: 'Live',
        icon: <HiOutlineVideoCamera />,
        link: '/Live',
    },
    {
        title: 'Archive',
        icon: < IoIosRecording />,
        link: '/Archive',
    },
    {
        title: 'Add device',
        icon: <IoMdAdd />,
        link: '/Add-device',
    },
    {
        title: 'Add recording',
        icon: <FiUploadCloud />,
        link: '/Add-recording',
    },
    {
        title: 'Add external video',
        icon: <AiOutlineVideoCameraAdd />,
        link: '/youtube-to-rtsp',
    }
]