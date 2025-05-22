"use client"

import { useState, useEffect, useMemo } from "react"
import {
  FaEdit,
  FaTrash,
  FaBell,
  FaUserPlus,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSearch,
  FaFilter,
  FaChevronDown,
  FaUser,
  FaIdCard,
  FaLock,
  FaPhone,
  FaStore,
  FaUserTag,
  FaEnvelope,
  FaImage,
  FaEye,
  FaEyeSlash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"
import axios from "axios"

const UserManagement = () => {
  const [utilisateurs, setUtilisateurs] = useState([])
  const [filteredUtilisateurs, setFilteredUtilisateurs] = useState([])
  const [roles, setRoles] = useState([])
  const [pointsDeVente, setPointsDeVente] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    login: "",
    password: "",
    telephone: "",
    pointDeVenteId: "",
    image: null,
    roleId: "",
    email: "",
  })
  const [notifyEmail, setNotifyEmail] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedUtilisateurId, setSelectedUtilisateurId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterPointDeVente, setFilterPointDeVente] = useState("")

  const [toast, setToast] = useState({ show: false, message: "", type: "", title: "" })

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const API_URL = "http://localhost:7000"

  const showToast = (message, type = "success", title = "") => {
    const defaultTitle =
      type === "success" ? "Succès!" : type === "error" ? "Erreur!" : type === "warning" ? "Attention!" : "Information"

    setToast({
      show: true,
      message,
      type,
      title: title || defaultTitle,
    })

    setTimeout(() => {
      setToast({ show: false, message: "", type: "", title: "" })
    }, 5000)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("token")
        console.log("Token récupéré:", token ? "Présent" : "Absent")

        if (!token) {
          setError("Vous n'êtes pas connecté. Veuillez vous connecter.")
          setLoading(false)
          return
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        }

        try {
          const [utilisateursRes, rolesRes, pointsDeVenteRes] = await Promise.all([
            axios.get(`${API_URL}/utilisateurs/all`, { headers }),
            axios.get(`${API_URL}/utilisateurs/roles`, { headers }),
            axios.get(`${API_URL}/utilisateurs/points-de-vente`, { headers }),
          ])

          console.log("Utilisateurs récupérés:", utilisateursRes.data.length)
          console.log("Rôles récupérés:", rolesRes.data.length)
          console.log("Points de vente récupérés:", pointsDeVenteRes.data.length)

          setUtilisateurs(utilisateursRes.data)
          setFilteredUtilisateurs(utilisateursRes.data)
          setRoles(rolesRes.data)
          setPointsDeVente(pointsDeVenteRes.data)
          setLoading(false)
        } catch (fetchError) {
          console.error("Erreur lors de la récupération des données:", fetchError.response?.data || fetchError.message)
          setError("Erreur lors de la récupération des données. Veuillez réessayer.")
          setLoading(false)
        }
      } catch (error) {
        console.error("Erreur générale:", error)
        setError("Une erreur est survenue. Veuillez réessayer.")
        setLoading(false)
      }
    }

    fetchData()
  }, [reloadKey])

  useEffect(() => {
    let result = [...utilisateurs]

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(
        (user) =>
          user.nom?.toLowerCase().includes(searchLower) ||
          user.prenom?.toLowerCase().includes(searchLower) ||
          `${user.prenom} ${user.nom}`.toLowerCase().includes(searchLower) ||
          `${user.nom} ${user.prenom}`.toLowerCase().includes(searchLower) ||
          user.login?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower),
      )
    }

    if (filterRole) {
      result = result.filter((user) => user.role?.id === Number.parseInt(filterRole))
    }

    if (filterPointDeVente) {
      result = result.filter((user) => user.pointDeVente?.id === Number.parseInt(filterPointDeVente))
    }

    setFilteredUtilisateurs(result)
    // Réinitialiser à la première page lors du changement de filtres
    setCurrentPage(1)
  }, [utilisateurs, searchTerm, filterRole, filterPointDeVente])

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredUtilisateurs.length / itemsPerPage) || 1
  }, [filteredUtilisateurs.length, itemsPerPage])

  // Obtenir les utilisateurs pour la page courante
  const paginatedUtilisateurs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUtilisateurs.slice(startIndex, endIndex)
  }, [filteredUtilisateurs, currentPage, itemsPerPage])

  // Fonction pour changer de page
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Générer les numéros de page pour la pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Nombre maximum de pages à afficher

    if (totalPages <= maxPagesToShow) {
      // Si le nombre total de pages est inférieur ou égal au nombre maximum à afficher, afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Sinon, afficher un sous-ensemble de pages avec la page courante au milieu si possible
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

      // Ajuster si on est proche de la fin
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
    }

    return pageNumbers
  }

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    if (name === "image") {
      setFormData({ ...formData, image: files[0] })
    } else if (name === "telephone") {
      const numericValue = value.replace(/\D/g, "")
      if (numericValue.length <= 8) {
        setFormData({ ...formData, [name]: numericValue })
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)

    if (formData.telephone && formData.telephone.length !== 8) {
      showToast("Le numéro de téléphone tunisien doit contenir exactement 8 chiffres.", "error", "Erreur de validation")
      setSubmitLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== "") {
          if (key === "roleId" || key === "pointDeVenteId") {
            formDataToSend.append(key, String(formData[key]))
          } else {
            formDataToSend.append(key, formData[key])
          }
        }
      })

      console.log("Données envoyées:", {
        nom: formData.nom,
        prenom: formData.prenom,
        login: formData.login,
        password: formData.password ? "***" : undefined,
        telephone: formData.telephone,
        pointDeVenteId: formData.pointDeVenteId,
        roleId: formData.roleId,
        email: formData.email,
        image: formData.image ? "File présent" : "Pas de fichier",
      })

      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      }

      let response
      if (editingId) {
        response = await axios.put(`${API_URL}/utilisateurs/${editingId}`, formDataToSend, {
          headers,
          timeout: 15000,
        })
      } else {
        response = await axios.post(`${API_URL}/utilisateurs/create`, formDataToSend, {
          headers,
          timeout: 15000,
        })
      }

      console.log("Réponse du serveur:", response.data)

      setShowModal(false)
      setFormData({
        nom: "",
        prenom: "",
        login: "",
        password: "",
        telephone: "",
        pointDeVenteId: "",
        image: null,
        roleId: "",
        email: "",
      })
      setEditingId(null)
      setReloadKey((prev) => prev + 1)

      if (!editingId && response.data.emailSent) {
        if (response.data.emailStatus) {
          showToast(
            `Utilisateur ajouté avec succès. Un email contenant les identifiants a été envoyé à ${formData.email}.`,
            "success",
            "Utilisateur créé!",
          )
        } else {
          showToast(
            `Utilisateur ajouté avec succès. L'envoi d'email a échoué, mais l'utilisateur a bien été créé.`,
            "warning",
            "Utilisateur créé avec avertissement",
          )
        }
      } else {
        showToast(
          editingId
            ? `Les informations de ${formData.prenom} ${formData.nom} ont été mises à jour avec succès.`
            : `L'utilisateur ${formData.prenom} ${formData.nom} a été ajouté avec succès.`,
          "success",
          editingId ? "Modification réussie!" : "Nouvel utilisateur!",
        )
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error)

      let errorMessage = "Une erreur est survenue lors de la soumission"

      if (error.response) {
        console.error("Détails de l'erreur:", error.response.data)
        errorMessage = error.response.data?.message || errorMessage
        if (error.response.data?.error) {
          errorMessage += `: ${error.response.data.error}`
        }
      } else if (error.request) {
        errorMessage = "Pas de réponse du serveur. Vérifiez votre connexion."
      } else {
        errorMessage = `Erreur: ${error.message}`
      }

      showToast(errorMessage, "error", "Échec de l'opération")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (utilisateur) => {
    setFormData({
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      login: utilisateur.login,
      telephone: utilisateur.telephone || "",
      pointDeVenteId: utilisateur.pointDeVente?.id || "",
      image: null,
      roleId: utilisateur.role?.id || "",
      email: utilisateur.email || "",
    })
    setEditingId(utilisateur.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await axios.delete(`${API_URL}/utilisateurs/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setReloadKey((prev) => prev + 1)
        showToast("Utilisateur supprimé avec succès", "success", "Suppression réussie")
      } catch (error) {
        console.error("Erreur lors de la suppression:", error.response?.data || error.message)
        showToast(
          "Erreur lors de la suppression: " + (error.response?.data?.message || "Une erreur est survenue"),
          "error",
          "Échec de la suppression",
        )
      }
    }
  }

  const handleNotify = (userId) => {
    const utilisateur = utilisateurs.find((u) => u.id === userId)
    if (!utilisateur) {
      showToast("Utilisateur non trouvé", "error", "Erreur de notification")
      return
    }

    if (!utilisateur.email) {
      showToast(
        "Cet utilisateur n'a pas d'email enregistré. Veuillez d'abord mettre à jour son profil avec un email.",
        "warning",
        "Email manquant",
      )
      return
    }

    setNotifyEmail(utilisateur.email)
    setSelectedUtilisateurId(userId)
    setShowNotifyModal(true)
  }

  const handleSendNotification = async () => {
    try {
      setSendingNotification(true)

      const utilisateur = utilisateurs.find((u) => u.id === selectedUtilisateurId)
      if (!utilisateur) {
        showToast("Utilisateur non trouvé", "error", "Erreur de notification")
        setSendingNotification(false)
        return
      }

      if (!notifyEmail || !notifyEmail.includes("@")) {
        showToast("Veuillez saisir une adresse email valide", "warning", "Email invalide")
        setSendingNotification(false)
        return
      }

      if (utilisateur.email !== notifyEmail) {
        showToast(
          `L'email saisi (${notifyEmail}) ne correspond pas à l'email de l'utilisateur (${utilisateur.email})`,
          "error",
          "Email non correspondant",
        )
        setSendingNotification(false)
        return
      }

      try {
        const response = await axios.post(
          `${API_URL}/utilisateurs/notifications/send`,
          {
            email: notifyEmail,
            login: utilisateur.login,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          },
        )

        console.log("Réponse du serveur:", response.data)

        if (response.data.simulated) {
          if (response.data.tempPassword) {
            showToast(
              `Le mot de passe a été réinitialisé à: ${response.data.tempPassword}. En mode de production, ce mot de passe serait envoyé par email à l'utilisateur.`,
              "info",
              "Simulation d'envoi",
            )
          } else {
            showToast(
              "Le mot de passe a été réinitialisé. En mode de développement, l'email est simulé.",
              "info",
              "Simulation d'envoi",
            )
          }
        } else {
          showToast(
            `Notification envoyée avec succès à ${notifyEmail}. Un email contenant les nouveaux identifiants a été envoyé.`,
            "success",
            "Email envoyé!",
          )
        }

        setShowNotifyModal(false)
        setNotifyEmail("")
      } catch (error) {
        console.error("Erreur lors de l'envoi de la notification:", error)

        let errorMessage = "Erreur lors de l'envoi de la notification"

        if (error.response && error.response.data) {
          errorMessage = error.response.data.message || errorMessage
          if (error.response.data.error) {
            errorMessage += `: ${error.response.data.error}`
          }
          if (error.response.data.details) {
            errorMessage += ` (${error.response.data.details})`
          }
        } else if (error.request) {
          errorMessage = "Pas de réponse du serveur. Vérifiez votre connexion."
        } else {
          errorMessage = `Erreur: ${error.message}`
        }

        showToast(errorMessage, "error", "Échec de l'envoi")
      } finally {
        setSendingNotification(false)
      }
    } catch (error) {
      console.error("Exception dans handleSendNotification:", error)
      showToast(`Une erreur inattendue s'est produite: ${error.message}`, "error", "Erreur système")
      setSendingNotification(false)
    }
  }

  const resetFilters = () => {
    setSearchTerm("")
    setFilterRole("")
    setFilterPointDeVente("")
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={() => setReloadKey((prev) => prev + 1)}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 h-full overflow-auto bg-gray-50">
      {toast.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className={`pointer-events-auto rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full mx-4`}
            style={{
              animation: "toastPulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: `3px solid ${
                toast.type === "success"
                  ? "#10B981"
                  : toast.type === "error"
                    ? "#EF4444"
                    : toast.type === "warning"
                      ? "#F59E0B"
                      : "#3B82F6"
              }`,
            }}
          >
            <div className="flex flex-col md:flex-row">
              <div
                className={`${
                  toast.type === "success"
                    ? "bg-green-500"
                    : toast.type === "error"
                      ? "bg-red-500"
                      : toast.type === "warning"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                } flex items-center justify-center p-6 md:w-1/3`}
                style={{
                  animation: toast.type === "success" ? "successPulse 1.5s infinite" : "",
                }}
              >
                {toast.type === "success" && (
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                      <FaCheck
                        className="h-14 w-14 text-white"
                        style={{ animation: "checkmark 0.8s ease-in-out forwards" }}
                      />
                    </div>
                    <div
                      className="absolute inset-0 rounded-full border-4 border-white border-opacity-30"
                      style={{ animation: "ripple 1.5s infinite" }}
                    ></div>
                  </div>
                )}
                {toast.type === "error" && (
                  <div className="h-24 w-24 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                    <FaTimes className="h-14 w-14 text-white" style={{ animation: "shake 0.5s ease-in-out" }} />
                  </div>
                )}
                {toast.type === "warning" && (
                  <div className="h-24 w-24 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                    <FaExclamationTriangle
                      className="h-14 w-14 text-white"
                      style={{ animation: "bounce 1s infinite" }}
                    />
                  </div>
                )}
                {toast.type === "info" && (
                  <div className="h-24 w-24 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                    <FaInfoCircle className="h-14 w-14 text-white" style={{ animation: "pulse 1.5s infinite" }} />
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div
                    className={`text-2xl font-bold mb-3 ${
                      toast.type === "success"
                        ? "text-green-700"
                        : toast.type === "error"
                          ? "text-red-700"
                          : toast.type === "warning"
                            ? "text-yellow-700"
                            : "text-blue-700"
                    }`}
                  >
                    {toast.title}
                  </div>
                  <div className="text-gray-700 text-lg leading-relaxed">{toast.message}</div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-500 flex items-center">
                    <FaInfoCircle className="mr-2" />
                    <span>Cette notification disparaîtra automatiquement</span>
                  </div>

                  <button
                    onClick={() => setToast({ ...toast, show: false })}
                    className={`p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none ${
                      toast.type === "success"
                        ? "text-green-500"
                        : toast.type === "error"
                          ? "text-red-500"
                          : toast.type === "warning"
                            ? "text-yellow-500"
                            : "text-blue-500"
                    }`}
                  >
                    <FaTimes className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`h-2 ${
                toast.type === "success"
                  ? "bg-green-500"
                  : toast.type === "error"
                    ? "bg-red-500"
                    : toast.type === "warning"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
              }`}
              style={{
                width: "100%",
                animation: "countdown 5s linear forwards",
              }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition duration-200 shadow-lg"
        >
          <FaUserPlus className="text-lg" />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="pl-12 pr-4 py-3 w-full rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="relative">
          <button
            className="flex items-center justify-between w-full md:w-48 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => document.getElementById("roleDropdown").classList.toggle("hidden")}
          >
            <span className="flex items-center">
              <FaFilter className="text-gray-400 mr-2" />
              <span className="text-gray-700">
                {filterRole
                  ? roles.find((r) => r.id === Number.parseInt(filterRole))?.nom || "Tous les rôles"
                  : "Tous les rôles"}
              </span>
            </span>
            <FaChevronDown className="text-gray-400" />
          </button>
          <div
            id="roleDropdown"
            className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg hidden"
          >
            <ul className="py-1 max-h-60 overflow-auto">
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setFilterRole("")
                  document.getElementById("roleDropdown").classList.add("hidden")
                }}
              >
                Tous les rôles
              </li>
              {roles.map((role) => (
                <li
                  key={role.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setFilterRole(role.id.toString())
                    document.getElementById("roleDropdown").classList.add("hidden")
                  }}
                >
                  {role.nom}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative">
          <button
            className="flex items-center justify-between w-full md:w-48 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => document.getElementById("pointDeVenteDropdown").classList.toggle("hidden")}
          >
            <span className="flex items-center">
              <FaFilter className="text-gray-400 mr-2" />
              <span className="text-gray-700">
                {filterPointDeVente
                  ? pointsDeVente.find((pdv) => pdv.id === Number.parseInt(filterPointDeVente))?.nom ||
                    "Tous les points de vente"
                  : "Tous les points de vente"}
              </span>
            </span>
            <FaChevronDown className="text-gray-400" />
          </button>
          <div
            id="pointDeVenteDropdown"
            className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg hidden"
          >
            <ul className="py-1 max-h-60 overflow-auto">
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setFilterPointDeVente("")
                  document.getElementById("pointDeVenteDropdown").classList.add("hidden")
                }}
              >
                Tous les points de vente
              </li>
              {pointsDeVente.map((pdv) => (
                <li
                  key={pdv.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setFilterPointDeVente(pdv.id.toString())
                    document.getElementById("pointDeVenteDropdown").classList.add("hidden")
                  }}
                >
                  {pdv.nom}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Pagination Controls - Top */}
      {utilisateurs.length > 0 && filteredUtilisateurs.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <select
              className="mr-2 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1) // Réinitialiser à la première page lors du changement d'éléments par page
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600">utilisateurs par page</span>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-4">
              Page {currentPage} sur {totalPages} ({filteredUtilisateurs.length} résultats)
            </span>
            <div className="flex">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-l-md border border-gray-300 ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaChevronLeft size={14} />
              </button>

              {getPageNumbers().map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-1 border-t border-b border-gray-300 ${
                    currentPage === number
                      ? "bg-indigo-600 text-white font-medium"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-r-md border border-gray-300 ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {utilisateurs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500">
            Aucun utilisateur trouvé. Ajoutez votre premier utilisateur en cliquant sur le bouton ci-dessus.
          </p>
        </div>
      ) : filteredUtilisateurs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500">
            Aucun utilisateur ne correspond à vos critères de recherche. Veuillez modifier vos filtres.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">Nom & Prénom</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">Login</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">Téléphone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">Point de Vente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">Rôle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUtilisateurs.map((utilisateur) => (
                <tr key={utilisateur.id} className="hover:bg-gray-50 transition duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={
                        utilisateur.imagePath ? `${API_URL}${utilisateur.imagePath}` : "https://via.placeholder.com/40"
                      }
                      alt={`${utilisateur.nom} ${utilisateur.prenom}`}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "https://via.placeholder.com/40"
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {utilisateur.nom} {utilisateur.prenom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{utilisateur.login}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {utilisateur.email ? (
                        <span className="text-indigo-600 font-medium">{utilisateur.email}</span>
                      ) : (
                        <span className="text-gray-400 italic">Non renseigné</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{utilisateur.telephone || "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 rounded-full">
                      {utilisateur.pointDeVente?.nom || "Non assigné"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                      {utilisateur.role?.nom || "Non défini"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEdit(utilisateur)}
                      className="text-blue-600 hover:text-blue-900 transition duration-200"
                      title="Modifier"
                    >
                      <FaEdit className="inline-block" />
                    </button>
                    <button
                      onClick={() => handleDelete(utilisateur.id)}
                      className="text-red-600 hover:text-red-900 transition duration-200"
                      title="Supprimer"
                    >
                      <FaTrash className="inline-block" />
                    </button>
                    <button
                      onClick={() => handleNotify(utilisateur.id)}
                      className="text-yellow-600 hover:text-yellow-900 transition duration-200"
                      title="Envoyer une notification"
                    >
                      <FaBell className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls - Bottom */}
      {utilisateurs.length > 0 && filteredUtilisateurs.length > 0 && (
        <div className="mt-8 flex justify-center">
          <div className="flex">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-l-md border border-gray-300 ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaChevronLeft size={14} />
            </button>

            {getPageNumbers().map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 border-t border-b border-gray-300 ${
                  currentPage === number
                    ? "bg-indigo-600 text-white font-medium"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-r-md border border-gray-300 ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
              style={{ backdropFilter: "blur(5px)" }}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"></span>

            <div
              className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              style={{
                animation: "modalZoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                maxHeight: "90vh",
              }}
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold">{editingId ? "Modifier" : "Ajouter"} un utilisateur</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 transition duration-200 focus:outline-none"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 60px)" }}>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-indigo-500" />
                      </div>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        placeholder="Entrez le nom"
                        className="pl-10 pr-3 py-3 block w-full rounded-md border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-indigo-500" />
                      </div>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        placeholder="Entrez le prénom"
                        className="pl-10 pr-3 py-3 block w-full rounded-md border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaIdCard className="h-5 w-5 text-indigo-500" />
                      </div>
                      <input
                        type="text"
                        name="login"
                        value={formData.login}
                        onChange={handleInputChange}
                        placeholder="Entrez le login"
                        className="pl-10 pr-3 py-3 block w-full rounded-md border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {!editingId && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaLock className="h-5 w-5 text-indigo-500" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Entrez le mot de passe"
                          className="pl-10 pr-12 py-3 block w-full rounded-md border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                          required={!editingId}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="focus:outline-none"
                          >
                            {showPassword ? (
                              <FaEyeSlash className="h-5 w-5 text-gray-500" />
                            ) : (
                              <FaEye className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaPhone className="h-5 w-5 text-indigo-500" />
                      </div>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        onKeyPress={(e) => {
                          const charCode = e.charCode
                          if (charCode < 48 || charCode > 57) {
                            e.preventDefault()
                          }
                        }}
                        placeholder="Entrez le numéro de téléphone (8 chiffres)"
                        pattern="[0-9]{8}"
                        maxLength={8}
                        title="Le numéro de téléphone tunisien doit contenir exactement 8 chiffres"
                        className={`pl-10 pr-3 py-3 block w-full rounded-md ${
                          formData.telephone && formData.telephone.length !== 8
                            ? "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                        } shadow-sm transition-colors`}
                      />
                    </div>
                    {formData.telephone && formData.telephone.length !== 8 && (
                      <p className="mt-1 text-sm text-red-600">
                        Le numéro de téléphone tunisien doit contenir exactement 8 chiffres.
                      </p>
                    )}
                    {formData.telephone && formData.telephone.length === 8 && (
                      <p className="mt-1 text-sm text-green-600">Format de numéro valide ✓</p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Point de Vente</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaStore className="h-5 w-5 text-indigo-500" />
                      </div>
                      <select
                        name="pointDeVenteId"
                        value={formData.pointDeVenteId}
                        onChange={handleInputChange}
                        className="pl-10 pr-3 py-3 block w-full rounded-md border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                      >
                        <option value="">Sélectionner un point de vente</option>
                        {pointsDeVente.map((pdv) => (
                          <option key={pdv.id} value={pdv.id}>
                            {pdv.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUserTag className="h-5 w-5 text-indigo-500" />
                      </div>
                      <select
                        name="roleId"
                        value={formData.roleId}
                        onChange={handleInputChange}
                        className="pl-10 pr-3 py-3 block w-full rounded-md border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                        required
                      >
                        <option value="">Sélectionner un rôle</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="h-5 w-5 text-indigo-500" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Entrez l'adresse email"
                        className="pl-10 pr-3 py-3 block w-full rounded-md border-gray-300 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaImage className="h-5 w-5 text-indigo-500" />
                      </div>
                      <input
                        type="file"
                        name="image"
                        onChange={handleInputChange}
                        className="pl-10 pr-3 py-3 block w-full rounded-md border-gray-300 bg-gray-50 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 focus:ring-indigo-500 focus:border-indigo-500"
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="bg-white text-gray-700 px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      disabled={submitLoading}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-6 py-2 rounded-md hover:from-indigo-700 hover:to-indigo-900 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                          Traitement...
                        </>
                      ) : editingId ? (
                        "Modifier"
                      ) : (
                        "Ajouter"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotifyModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={() => setShowNotifyModal(false)}
              style={{ backdropFilter: "blur(5px)" }}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"></span>

            <div
              className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              style={{
                animation: "modalZoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              }}
            >
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold">Envoyer une notification</h3>
                <button
                  onClick={() => setShowNotifyModal(false)}
                  className="text-white hover:text-gray-200 transition duration-200 focus:outline-none"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email de l utilisateur</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-yellow-500" />
                    </div>
                    <input
                      type="email"
                      value={notifyEmail}
                      readOnly={true}
                      className="pl-10 pr-3 py-3 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    L email doit correspondre à celui enregistré pour cet utilisateur.
                  </p>
                </div>
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(false)}
                    className="bg-white text-gray-700 px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSendNotification}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-md hover:from-yellow-600 hover:to-orange-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 flex items-center"
                    disabled={sendingNotification}
                  >
                    {sendingNotification ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                        Envoi...
                      </>
                    ) : (
                      "Envoyer"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalZoomIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes toastPulse {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            transform: scale(1.05) translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes checkmark {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes countdown {
          from { width: 100%; }
          to { width: 0%; }
        }

        @keyframes successPulse {
          0% { background-color: #10B981; }
          50% { background-color: #059669; }
          100% { background-color: #10B981; }
        }
      `}</style>
    </div>
  )
}

export default UserManagement
