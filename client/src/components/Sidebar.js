import React, { useContext, useEffect, useState } from 'react'
import { getUsers, getChats } from '../http';
import { useHistory } from 'react-router-dom';
import { CartContext } from '../CartContext';

const Sidebar = ({ socket }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { user, setUser, allUser, setAllUser, setRightTop, setMessageList, setShowChat, BASE_URL, setLoader } = useContext(CartContext);
    const [onlineStatus, setOnlineStatus] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(false);
    const history = useHistory();

    // useEffect(() => {
    //     (async () => {
    //         try {
    //             const token = JSON.parse(localStorage.getItem("token"));
    //             const { data } = await getUsers({ token });
    //             setAllUser(data.alluser);
    //         } catch (err) {
    //             console.log(err);
    //         }
    //     })();
    // }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-mode', !isDarkMode); // Add/remove class from body
    };

    useEffect(() => {
        (async () => {
            try {
                const token = JSON.parse(localStorage.getItem("token"));
                const { data } = await getUsers({ token });
                setAllUser(data.alluser);
            } catch (err) {
                console.log(err);
            }
        })();

        // Emit user_connected event when the user connects
        socket.emit('user_connected', user._id);

        socket.on('update_user_status', ({ userId, status }) => {
            setOnlineStatus(prevStatus => ({
                ...prevStatus,
                [userId]: status
            }));
        });

        // Listen for the list of online users when the user connects
        socket.on('online_users', (onlineUserIds) => {
            const updatedStatus = onlineUserIds.reduce((status, id) => {
                status[id] = 'online';
                return status;
            }, {});
            setOnlineStatus(prevStatus => ({
                ...prevStatus,
                ...updatedStatus
            }));
        });

        // Listen for new users joining
        socket.on("new_user", async () => {
            try {
                const token = JSON.parse(localStorage.getItem("token"));
                const { data } = await getUsers({ token });
                setAllUser(data.alluser);
            } catch (err) {
                console.log(err);
            }
        });

        // Cleanup on unmount
        return () => {
            socket.off("new_user");
            socket.off('update_user_status');
            socket.off('online_users');
        };
    }, [socket, setAllUser,user._id]);

    useEffect(() => {
        socket.on('update_user_status', ({ userId, status }) => {
            setOnlineStatus(prevStatus => ({
                ...prevStatus,
                [userId]: status
            }));
        });

        // Clean up the listener on component unmount
        return () => {
            socket.off('update_user_status');
        };
    }, [socket]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        history.push("/");
    }

    const handleOpen = async (Navuser) => {
        setLoader(true);
        if (Navuser.avatar)
            setRightTop({
                _id: Navuser._id,
                name: Navuser.name,
                email: Navuser.email,
                avatar: Navuser.avatar
            });
        else
            setRightTop({
                _id: Navuser._id,
                name: Navuser.name,
                email: Navuser.email,
                avatar: ''
            });


        let roomId = user.email + Navuser.email;
        roomId = roomId.split('').sort().join('')

        // Join User
        await socket.emit("join_room",roomId);
        console.log(roomId)
        const token = JSON.parse(localStorage.getItem("token"));
        const { data } = await getChats({ roomId, token });
        setMessageList(data);
        setShowChat(true);
        setLoader(false);
        // document.querySelector(".mainTopBack").classList.add("show");
        document.querySelector(".sidebar").classList.add("open");
        document.querySelector(".main").classList.add("close");
    }

    const filterUsers = () => {
        if (!allUser) {
            return [];
        }
    
        return allUser.filter(Navuser => {
            return (
                Navuser.email !== user.email &&
                (Navuser.name.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === '')
            );
        });
    }


    return (
        <div className="sidebar">
            <div className="sidebarTop">
                <div className="sidebarTopImg">
                    <img src={user.avatar ? `${BASE_URL}/${user.avatar}` : '/images/ppp3.jpg'} alt="logo" />
                    <span>{user.name}</span>
                </div>
                <div className="topMenu btn-group">
                    <i className="fa-solid fa-ellipsis-vertical dropdown-toggle-split" data-mdb-toggle="dropdown" aria-expanded="false" />
                    <ul className="dropdown-menu">
                        <li><a className="dropdown-item" data-mdb-toggle="modal" data-mdb-target="#exampleModal">Profile</a></li>
                        <li><a className="dropdown-item" href="#">Settings</a></li>
                        <li><a className="dropdown-item"  onClick={toggleDarkMode}>Dark Mode</a></li>
                        <li><a className="dropdown-item" onClick={handleLogout}>Logout</a></li>
                    </ul>
                </div>
            </div>
            <div className="sidebarSearch">
                <input
                    type="search"
                    className="form-control"
                    placeholder="Search for chats"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="sidebarList list-group list-group-light">

                {filterUsers().map((Navuser, index) => (
                    <div
                        className="userss list-group-item list-group-item-action px-3 border-1 bg-slate-700"
                        onClick={() => handleOpen(Navuser)}
                        key={index}
                    >
                        <img src={Navuser.avatar ? `${BASE_URL}/${Navuser.avatar}` : '/images/ppp3.jpg'} alt="logo" />
                        <span>{Navuser.name}</span>
                        <span
                            style={{
                                backgroundColor: onlineStatus[Navuser._id] === 'online' ? 'green' : 'red',
                                borderRadius: '50%',
                                width: '10px',
                                height: '10px',
                                display: 'inline-block',
                                marginLeft: '10px'
                            }}
                        />
                    </div>
                ))}

            </div>
        </div>
    )
}

export default Sidebar