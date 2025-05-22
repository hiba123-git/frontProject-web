"use client"

/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  FaChartPie,
  FaUsers,
  FaBoxes,
  FaPercentage,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaStore,
  FaChevronDown,
  FaChevronRight,
  FaChevronLeft,
  FaLayerGroup,
  FaFolder,
  FaFolderOpen,
  FaArchive,
  FaBox,
  FaArrowLeft,
} from "react-icons/fa"
import axios from "axios"

const Sidebar = (props) => {
  const location = useLocation()
  const [expandedMenu, setExpandedMenu] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [showSubmenuInCollapsed, setShowSubmenuInCollapsed] = useState(false)
  const [activeSubmenuParent, setActiveSubmenuParent] = useState(null)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:7000/utilisateurs/notifications')
        setNotifications(response.data)
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error)
      }
    }
    fetchNotifications()
  }, [])

  const menuItems = [
    {
      title: "Tableau de bord",
      icon: <FaChartPie />,
      path: "/dashboard",
    },
    {
      title: "Gestion des utilisateurs",
      icon: <FaUsers />,
      path: "/users",
    },
    {
      title: "Demande-Réapprovisionnement",
      icon: <FaBoxes />,
      path: "/approvisionnement",
    },
    {
      title: "Référentiel articles",
      icon: <FaLayerGroup />,
      path: "/referentiel",
      submenu: [
        {
          title: "Familles",
          path: "/referentiel/familles",
          icon: <FaFolder />,
        },
        {
          title: "Sous-Famille",
          path: "/referentiel/sous-familles",
          icon: <FaFolderOpen />,
        },
        {
          title: "Casier",
          path: "/referentiel/casiers",
          icon: <FaArchive />,
        },
        {
          title: "Produit",
          path: "/referentiel/produits",
          icon: <FaBox />,
        },
      ],
    },
    {
      title: "Promotions",
      icon: <FaPercentage />,
      path: "/promotions",
    },
    {
      title: "Notifications",
      icon: <FaBell />,
      path: "/notifications",
      badge: notifications.filter(n => !n.read).length,
    },
    {
      title: "Paramètres",
      icon: <FaCog />,
      path: "/settings",
    },
  ]

  const toggleSubmenu = (index) => {
    if (isCollapsed) {
      // En mode réduit, afficher les sous-menus dans la barre latérale
      setShowSubmenuInCollapsed(true)
      setActiveSubmenuParent(index)
    } else {
      // En mode normal, comportement habituel
      if (expandedMenu === index) {
        setExpandedMenu(null)
      } else {
        setExpandedMenu(index)
      }
    }
  }

  const handleBackToMainMenu = () => {
    setShowSubmenuInCollapsed(false)
    setActiveSubmenuParent(null)
  }

  useEffect(() => {
    props.setCollapsed(isCollapsed)
    // Réinitialiser l'affichage des sous-menus lorsque la barre latérale change d'état
    if (!isCollapsed) {
      setShowSubmenuInCollapsed(false)
      setActiveSubmenuParent(null)
    }
  }, [isCollapsed])

  function Logout() {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  // Ajouter les styles CSS pour les animations
  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideInRight {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideInDown {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes glow {
        0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
        100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
      }
      
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .sidebar-container {
        box-shadow: 0 0 20px rgba(37, 99, 235, 0.15);
        transition: width 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
      }
      
      .sidebar-header {
        animation: fadeIn 0.8s ease forwards;
      }
      
      .sidebar-profile {
        animation: fadeIn 1s ease forwards;
      }
      
      .menu-item {
        animation: slideInRight 0.5s ease forwards;
        transition: all 0.3s ease;
      }
      
      .menu-item:hover {
        transform: translateX(5px);
      }
      
      .menu-item.active {
        position: relative;
        overflow: hidden;
      }
      
      .menu-item.active::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 5px;
        height: 100%;
        background: linear-gradient(to bottom, #3B82F6, #2563EB);
        animation: slideInDown 0.3s ease forwards;
      }
      
      .submenu-item {
        animation: slideInDown 0.3s ease forwards;
        transition: all 0.2s ease;
      }
      
      .submenu-item:hover {
        transform: translateX(3px);
      }
      
      .icon-container {
        transition: all 0.3s ease;
      }
      
      .icon-container:hover {
        transform: scale(1.2);
      }
      
      .badge {
        animation: pulse 2s infinite;
      }
      
      .collapse-button {
        transition: all 0.3s ease;
      }
      
      .collapse-button:hover {
        transform: scale(1.2);
        animation: glow 2s infinite;
      }
      
      .profile-image {
        transition: all 0.3s ease;
      }
      
      .profile-image:hover {
        transform: scale(1.1);
        border-color: white;
      }
      
      .logout-button {
        transition: all 0.3s ease;
      }
      
      .logout-button:hover {
        transform: translateY(-2px);
      }
      
      .logout-icon {
        transition: all 0.3s ease;
      }
      
      .logout-button:hover .logout-icon {
        animation: bounce 0.5s ease infinite;
      }
      
      .menu-icon {
        transition: all 0.3s ease;
      }
      
      .menu-item:hover .menu-icon {
        transform: scale(1.2);
      }
      
      .chevron-icon {
        transition: transform 0.3s ease;
      }
      
      .chevron-down {
        transform: rotate(0deg);
      }
      
      .chevron-right {
        transform: rotate(0deg);
      }
      
      .menu-item:hover .chevron-down {
        transform: rotate(180deg);
      }
      
      .menu-item:hover .chevron-right {
        transform: rotate(90deg);
      }
      
      .submenu-container {
        overflow: hidden;
        transition: max-height 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
      }
      
      .hovered {
        background: rgba(255, 255, 255, 0.15);
        transform: translateX(5px);
      }

      .tooltip {
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        background: #1E40AF;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        margin-left: 10px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 101;
      }

      .collapsed-menu-item:hover .tooltip {
        opacity: 1;
      }

      .collapsed-menu-item {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 12px 0;
        position: relative;
        transition: all 0.3s ease;
      }

      .collapsed-menu-item:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .collapsed-menu-item.active {
        background: rgba(255, 255, 255, 0.2);
      }

      .submenu-title {
        font-size: 10px;
        text-align: center;
        margin-top: 4px;
        opacity: 0.8;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div
      className={`sidebar-container h-full flex flex-col bg-gradient-to-br from-blue-600 to-blue-800 text-white ${isCollapsed ? "w-20" : "w-72"}`}
    >
      <div className="sidebar-header p-5 flex items-center space-x-3 border-b border-blue-500/30">
        <div className="icon-container">
          <FaStore className="h-8 w-8 text-white flex-shrink-0" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold">MagasinCentral</h1>
            <p className="text-xs text-blue-100">Gestion centralisée</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="collapse-button ml-auto text-white/80 hover:text-white"
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      <div className="sidebar-profile p-4 border-b border-blue-500/30 bg-blue-700/30">
        <div className="flex items-center space-x-3">
          <img
            src="src\assets\hiba.jpg"
            alt="Profile"
            className="profile-image h-10 w-10 rounded-full border-2 border-blue-300"
          />
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold">Hiba ghorbel</h2>
              <p className="text-xs text-blue-200">Administrateur</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Mode réduit avec sous-menus affichés */}
        {isCollapsed && showSubmenuInCollapsed && activeSubmenuParent !== null && (
          <div className="space-y-1">
            <button
              onClick={handleBackToMainMenu}
              className="collapsed-menu-item w-full flex justify-center items-center mb-4"
            >
              <FaArrowLeft className="text-lg" />
              <span className="tooltip">Retour</span>
            </button>

            <div className="text-xs text-center mb-2 opacity-70">{menuItems[activeSubmenuParent].title}</div>

            {menuItems[activeSubmenuParent].submenu.map((subItem, subIndex) => (
              <Link
                key={subIndex}
                to={subItem.path}
                className={`collapsed-menu-item ${location.pathname === subItem.path ? "active" : ""}`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xl">{subItem.icon}</span>
                  <span className="submenu-title">{subItem.title}</span>
                </div>
                <span className="tooltip">{subItem.title}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Mode normal ou mode réduit sans sous-menus */}
        {(!isCollapsed || (isCollapsed && !showSubmenuInCollapsed)) && (
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(index)}
                      onMouseEnter={() => setHoveredItem(index)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`menu-item flex items-center justify-between w-full px-4 py-3 text-sm rounded-lg ${
                        location.pathname.startsWith(item.path)
                          ? "active bg-blue-700/50 text-white"
                          : "text-white hover:bg-blue-600/40"
                      } ${hoveredItem === index ? "hovered" : ""}`}
                    >
                      <div className="flex items-center">
                        <span className="menu-icon text-lg">{item.icon}</span>
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </div>
                      {!isCollapsed && (
                        <span className={`chevron-icon ${expandedMenu === index ? "chevron-down" : "chevron-right"}`}>
                          {expandedMenu === index ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                      )}
                    </button>

                    {expandedMenu === index && !isCollapsed && (
                      <ul
                        className="submenu-container pl-10 mt-1 space-y-1"
                        style={{ maxHeight: item.submenu.length * 40 + "px" }}
                      >
                        {item.submenu.map((subItem, subIndex) => (
                          <li key={subIndex} style={{ animationDelay: `${subIndex * 0.1}s` }}>
                            <Link
                              to={subItem.path}
                              className={`submenu-item flex items-center px-4 py-2 text-sm rounded-lg ${
                                location.pathname === subItem.path
                                  ? "bg-blue-600/50 text-white"
                                  : "text-white/90 hover:bg-blue-600/30"
                              }`}
                            >
                              <span className="mr-2">{subItem.icon}</span>
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`menu-item flex items-center px-4 py-3 text-sm rounded-lg ${
                      location.pathname === item.path
                        ? "active bg-blue-700/50 text-white"
                        : "text-white hover:bg-blue-600/40"
                    } ${hoveredItem === index ? "hovered" : ""}`}
                  >
                    <span className="menu-icon text-lg">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="ml-3">{item.title}</span>
                        {item.badge && (
                          <span className="badge ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="badge absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-blue-500/30">
        <button className="logout-button flex items-center w-full px-4 py-2 text-sm text-white hover:bg-blue-600/40 rounded-lg">
          <span className="logout-icon text-lg">
            <FaSignOutAlt />
          </span>
          {!isCollapsed && (
            <span className="ml-3" onClick={() => Logout()}>
              Déconnexion
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
export default Sidebar