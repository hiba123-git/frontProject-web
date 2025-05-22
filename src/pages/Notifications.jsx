"use client"

import { useState, useEffect } from "react"
import { FaBell, FaBox, FaExclamationCircle, FaCheck, FaKey, FaUser, FaStore } from "react-icons/fa"
import axios from "axios"
import { useNavigate } from "react-router-dom"

// URL de l'API - à remplacer par votre URL réelle
const API_URL = "http://localhost:7000"

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const Navigate = useNavigate();

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/utilisateurs/notifications`)
      setNotifications(response.data)
      setError(null)
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications:", err)
      setError("Impossible de charger les notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/utilisateurs/notifications/${id}/read`)
      setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
    } catch (err) {
      console.error("Erreur lors du marquage de la notification:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/utilisateurs/notifications/read-all`)
      setNotifications(notifications.map((notif) => ({ ...notif, isRead: true })))
    } catch (err) {
      console.error("Erreur lors du marquage de toutes les notifications:", err)
    }
  }

  const handlePasswordChangeRequest = async (notificationId) => {
    try {
      // Marquer la notification comme lue
      await markAsRead(notificationId);
  
      // Rediriger vers la page de gestion des utilisateurs
      Navigate('/users');
    } catch (err) {
      console.error("Erreur lors du traitement de la demande:", err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "password_change":
        return <FaKey className="text-blue-600" />
      case "restock":
        return <FaBox className="text-indigo-600" />
      case "error":
        return <FaExclamationCircle className="text-red-600" />
      default:
        return <FaBell className="text-gray-600" />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} min ago`
    } else if (diffHours < 24) {
      return `${diffHours} h ago`
    } else {
      return `${diffDays} days ago`
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaBell className="mr-3 text-indigo-600" />
              Notifications
            </h1>
          </div>
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaBell className="mr-3 text-indigo-600" />
              Notifications
            </h1>
          </div>
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaBell className="mr-3 text-indigo-600" />
            Notifications
          </h1>
          <button className="text-indigo-600 hover:text-indigo-800" onClick={markAllAsRead}>
            Tout marquer comme lu
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <FaBell className="mx-auto text-gray-300 text-5xl mb-3" />
            <p className="text-gray-500">Aucune notification pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => {
              const details = notif.details ? JSON.parse(notif.details) : {}

              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-lg shadow-md p-4 border-l-4 
                    ${
                      notif.priority === "high"
                        ? "border-red-500"
                        : notif.priority === "medium"
                          ? "border-yellow-500"
                          : "border-green-500"
                    }
                    ${!notif.isRead ? "bg-indigo-50" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                      <div>
                        <p className="text-gray-900 font-medium">{notif.message}</p>
                        <p className="text-gray-500 text-sm">{formatDate(notif.createdAt)}</p>

                        {notif.type === "password_change" && details && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-md">
                            <div className="flex items-center text-sm text-gray-600">
                              <FaUser className="mr-2" />
                              <span>Utilisateur: {details.nom}</span>
                            </div>
                            {details.pointDeVente && (
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <FaStore className="mr-2" />
                                <span>Point de vente: {details.pointDeVente}</span>
                              </div>
                            )}
                            <div className="mt-2">
                              <button
                                onClick={() => handlePasswordChangeRequest(notif.id, details.utilisateurId)}
                                className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                              >
                                Traiter la demande
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {!notif.isRead && (
                      <button onClick={() => markAsRead(notif.id)} className="text-indigo-600 hover:text-indigo-800">
                        <FaCheck />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
