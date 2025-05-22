/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { FaBell, FaSearch, FaCalendarAlt, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Navbar = (props) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:7000/utilisateurs/notifications');
        setNotifications(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // Implement search logic here
  };

  const handleNotificationClick = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  return (
    <>
      <div style={{ marginLeft: props.collapsed ? "5rem" : "18rem" }} className="bg-white shadow-md z-20 fixed w-full ml-72 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center flex-1">
              <div className="relative rounded-md shadow-sm w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="Rechercher..."
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-gray-500">
                <FaCalendarAlt className="h-5 w-5" />
                <span className="ml-2 text-sm font-medium hidden md:inline">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 relative"
                >
                  <FaBell className="h-6 w-6" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                    <div className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700">
                      <h3 className="text-sm font-medium text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          onClick={() => handleNotificationClick(notification.id)}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-indigo-50' : ''}`}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${notification.priority === 'high' ? 'bg-red-500' : notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                            <div className="ml-3 flex-1">
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="py-2 px-4 bg-gray-50 text-center border-t">
                      <Link to="/notifications" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                        Voir toutes les notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 focus:outline-none group"
                >
                  <img
                    className="h-9 w-9 rounded-full border-2 border-indigo-200 group-hover:border-indigo-400 transition-colors"
                    src="src\assets\hiba.jpg"
                    alt="User"
                  />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Hiba ghorbel</p>
                    <p className="text-xs text-gray-500">Administrateur</p>
                  </div>
                </button>
                
                {showUserMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 divide-y divide-gray-100">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <FaUser className="mr-3 h-4 w-4 text-gray-500" />
                        Mon profil
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <FaCog className="mr-3 h-4 w-4 text-gray-500" />
                        Paramètres
                      </Link>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/logout"
                        className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="mr-3 h-4 w-4 text-red-500" />
                        Déconnexion
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;