"use client"

// eslint-disable-next-line no-unused-vars
import { useState, useEffect, useMemo } from "react"
import { FaCheck, FaTimes, FaClock, FaSearch, FaUser, FaStore, FaChevronLeft, FaChevronRight } from "react-icons/fa"
import axios from "axios"

// URL de l'API - à remplacer par votre URL réelle
const API_URL = "http://localhost:7000"

const Approvisionnement = () => {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showReapproModal, setShowReapproModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [animateModal, setAnimateModal] = useState(false)
  const [animateContent, setAnimateContent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Charger les demandes depuis l'API au chargement du composant
  useEffect(() => {
    fetchDemandesReappro()
  }, [])

  // Fonction pour récupérer les demandes depuis l'API
  const fetchDemandesReappro = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${API_URL}/demandeReappro`)
      console.log("Données reçues de l'API:", response.data)

      // Transformer les données du backend au format attendu par le composant
      const formattedRequests = response.data.map((demande) => {
        // Récupérer le premier produit de la demande (ou info par défaut)
        const firstProduit =
          demande.Details && demande.Details.length > 0 ? demande.Details[0].Produit : { DesProduit: "Produit inconnu" }

        // Calculer l'urgence basée sur le stock
        let urgency = "low"
        if (firstProduit && firstProduit.QuantiteStock < 5) {
          urgency = "high"
        } else if (firstProduit && firstProduit.QuantiteStock < 10) {
          urgency = "medium"
        }

        // Convertir le statut au format attendu
        let status = "pending"
        if (demande.Statut === "Approuvé") status = "approved"
        if (demande.Statut === "Rejeté") status = "rejected"
        if (demande.Statut === "Livré") status = "delivered"

        // Obtenir la date de livraison prévue du premier détail
        const expectedDeliveryDate =
          demande.Details && demande.Details.length > 0
            ? formatDate(demande.Details[0].DatePrevueLivraison)
            : "Non spécifiée"

        // Calculer la quantité totale demandée
        const totalQuantity = demande.Details
          ? demande.Details.reduce((sum, detail) => sum + detail.QuantiteDemandee, 0)
          : 0

        // Récupérer les informations de l'utilisateur et du point de vente
        const userName = demande.Utilisateur
          ? `${demande.Utilisateur.prenom} ${demande.Utilisateur.nom}`
          : "Utilisateur inconnu"

        const storeName = demande.PointDeVente ? demande.PointDeVente.nom : "Point de vente non spécifié"

        return {
          id: demande.ID,
          numDemande: demande.NumDemande,
          productName: firstProduit.DesProduit || "Produit inconnu",
          quantity: totalQuantity,
          requestDate: formatDate(demande.DateDemande),
          expectedDeliveryDate: expectedDeliveryDate,
          status: status,
          store: storeName,
          userName: userName,
          utilisateurId: demande.UtilisateurID,
          pointDeVenteId: demande.PointDeVenteID,
          urgency: urgency,
          currentStock: firstProduit.QuantiteStock || 0,
          supplier: "Fournisseur", // Information non disponible dans l'API
          // Garder la référence originale pour les mises à jour
          originalData: demande,
        }
      })

      setRequests(formattedRequests)
    } catch (error) {
      console.error("Erreur lors de la récupération des demandes:", error)
      // Données factices en cas d'erreur pour que l'interface reste fonctionnelle
      setRequests([
        {
          id: 1,
          productName: "Erreur de chargement",
          quantity: 0,
          requestDate: "N/A",
          expectedDeliveryDate: "N/A",
          status: "pending",
          store: "N/A",
          userName: "N/A",
          urgency: "low",
          currentStock: 0,
          supplier: "N/A",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Formater une date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return "Non spécifiée"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR")
    } catch (error) {
      return dateString
    }
  }

  // Filtrer les demandes selon les critères
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesFilter = filter === "all" || request.status === filter
      const matchesSearch =
        request.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.numDemande && request.numDemande.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (request.userName && request.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (request.store && request.store.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    })
  }, [requests, filter, searchQuery])

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredRequests.length / itemsPerPage) || 1
  }, [filteredRequests.length, itemsPerPage])

  // Effet pour réinitialiser la page courante si elle dépasse le nombre total de pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Obtenir les demandes pour la page courante
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredRequests.slice(startIndex, endIndex)
  }, [filteredRequests, currentPage, itemsPerPage])

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

  // Mettre à jour le statut d'une demande via l'API
  const updateStatus = async (id, newStatus) => {
    try {
      // Convertir le statut au format attendu par le backend
      let apiStatus = "En attente"
      if (newStatus === "approved") apiStatus = "Approuvé"
      if (newStatus === "rejected") apiStatus = "Rejeté"
      if (newStatus === "delivered") apiStatus = "Livré"

      await axios.put(`${API_URL}/demandeReappro/${id}/status`, { statut: apiStatus })
      console.log(`Statut mis à jour avec succès: ${apiStatus}`)

      // Mettre à jour l'état local
      setRequests(requests.map((request) => (request.id === id ? { ...request, status: newStatus } : request)))

      // Rafraîchir les données après une mise à jour
      setTimeout(() => {
        fetchDemandesReappro()
      }, 500)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      alert("Erreur lors de la mise à jour du statut. Veuillez réessayer.")
    }
  }

  // Remplacer par cette nouvelle fonction qui vérifie le stock avant d'approuver
  const handleApprove = (id) => {
    // Trouver la demande correspondante
    const request = requests.find((req) => req.id === id)

    // Vérifier si la quantité demandée est supérieure au stock actuel
    if (request && request.quantity > request.currentStock) {
      // Afficher une popup d'avertissement
      const modalOverlay = document.createElement("div")
      modalOverlay.className =
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay show"

      const modalContent = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 modal-container show">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-xl font-bold modal-content modal-title show">
                Stock insuffisant
              </h2>
              <p class="text-gray-600 mt-1 modal-content modal-description show">
                La quantité demandée (${request.quantity}) est supérieure au stock actuel (${request.currentStock}).
              </p>
            </div>
            <button id="close-stock-modal" class="text-gray-500 hover:text-gray-700 transition-colors duration-200">
              ×
            </button>
          </div>

          <div class="bg-red-50 border-l-4 border-red-400 p-4 mt-4 modal-content modal-description show">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">
                  Veuillez contacter le fournisseur car le stock actuel de ce produit est insuffisant.
                </p>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 mt-8 modal-content modal-buttons show">
            <button id="cancel-stock-modal" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 hover-scale">
              Annuler
            </button>
         
          </div>
        </div>
      `

      modalOverlay.innerHTML = modalContent
      document.body.appendChild(modalOverlay)

      // Ajouter les gestionnaires d'événements pour les boutons
      document.getElementById("close-stock-modal").addEventListener("click", () => {
        document.body.removeChild(modalOverlay)
      })

      document.getElementById("cancel-stock-modal").addEventListener("click", () => {
        document.body.removeChild(modalOverlay)
      })

      document.getElementById("approve-anyway").addEventListener("click", () => {
        document.body.removeChild(modalOverlay)
        updateStatus(id, "approved")
      })
    } else {
      // Si le stock est suffisant, approuver normalement
      updateStatus(id, "approved")
    }
  }

  const handleReject = (id) => {
    updateStatus(id, "rejected")
  }

  const handleReapprovisionnement = (request) => {
    setSelectedRequest(request)
    setShowReapproModal(true)
    setTimeout(() => {
      setAnimateModal(true)
      setTimeout(() => {
        setAnimateContent(true)
      }, 300)
    }, 10)
  }

  const closeModal = () => {
    setAnimateContent(false)
    setAnimateModal(false)
    setTimeout(() => {
      setShowReapproModal(false)
    }, 500)
  }

  const handleConfirmReappro = () => {
    // Animation de confirmation
    const confirmBtn = document.getElementById("confirm-btn")
    if (confirmBtn) {
      confirmBtn.classList.add("confirm-animation")
      setTimeout(() => {
        // Logique pour gérer le réapprovisionnement via l'API
        updateStatus(selectedRequest.id, "delivered")
        closeModal()
      }, 800)
    } else {
      // Fallback si l'élément n'est pas trouvé
      updateStatus(selectedRequest.id, "delivered")
      closeModal()
    }
  }

  // Ajouter les styles CSS pour les animations
  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
      
      @keyframes confirmAnimation {
        0% { background-color: #111827; }
        50% { background-color: #10B981; box-shadow: 0 0 15px #10B981; }
        100% { background-color: #111827; }
      }
      
      .modal-overlay {
        transition: opacity 0.5s ease;
        opacity: 0;
      }
      
      .modal-overlay.show {
        opacity: 1;
      }
      
      .modal-container {
        transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        transform: scale(0.8);
        opacity: 0;
      }
      
      .modal-container.show {
        transform: scale(1);
        opacity: 1;
      }
      
      .modal-content {
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
      }
      
      .modal-content.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      .modal-title {
        transition-delay: 0.1s;
      }
      
      .modal-description {
        transition-delay: 0.2s;
      }
      
      .modal-grid {
        transition-delay: 0.3s;
      }
      
      .modal-buttons {
        transition-delay: 0.4s;
      }
      
      .pulse-button {
        animation: pulse 2s infinite;
      }
      
      .confirm-animation {
        animation: confirmAnimation 0.8s forwards;
      }
      
      .hover-scale {
        transition: transform 0.2s ease;
      }
      
      .hover-scale:hover {
        transform: scale(1.05);
      }

      .user-info-badge {
        display: inline-flex;
        align-items: center;
        background-color: #EBF5FF;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        margin-top: 0.25rem;
        margin-right: 0.5rem;
      }

      .store-info-badge {
        display: inline-flex;
        align-items: center;
        background-color: #E6FFFA;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        margin-top: 0.25rem;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Demandes de Réapprovisionnement</h1>

        {/* Filtres et Recherche */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg ${
                filter === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              } transition duration-200`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg ${
                filter === "pending" ? "bg-yellow-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              } transition duration-200`}
            >
              En Attente
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded-lg ${
                filter === "approved" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              } transition duration-200`}
            >
              Approuvées
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-lg ${
                filter === "rejected" ? "bg-red-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              } transition duration-200`}
            >
              Rejetées
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une demande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Pagination Controls - Top */}
        {!isLoading && filteredRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <select
                className="mr-2 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1) // Réinitialiser à la première page lors du changement d'éléments par page
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              <span className="text-sm text-gray-600">demandes par page</span>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                Page {currentPage} sur {totalPages} ({filteredRequests.length} résultats)
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
                        ? "bg-blue-600 text-white font-medium"
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

        {/* État de chargement */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Aucune demande */}
        {!isLoading && filteredRequests.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Aucune demande trouvée</h3>
            <p className="mt-2 text-gray-600">
              {searchQuery
                ? "Aucune demande ne correspond à votre recherche."
                : "Aucune demande de réapprovisionnement n'est disponible."}
            </p>
          </div>
        )}

        {/* Liste des Demandes */}
        <div className="grid gap-6">
          {paginatedRequests.map((request) => (
            <div
              key={request.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                request.urgency === "high"
                  ? "border-red-500"
                  : request.urgency === "medium"
                    ? "border-yellow-500"
                    : "border-green-500"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {request.numDemande ? `${request.numDemande} - ${request.productName}` : request.productName}
                  </h3>
                  <div className="flex flex-wrap mt-1">
                    <div className="user-info-badge">
                      <FaUser className="text-blue-500 mr-1" size={14} />
                      <span className="text-sm text-blue-800">{request.userName}</span>
                    </div>
                    <div className="store-info-badge">
                      <FaStore className="text-teal-500 mr-1" size={14} />
                      <span className="text-sm text-teal-800">{request.store}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {request.status !== "approved" && request.status !== "delivered" && (
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded"
                    >
                      <FaCheck />
                    </button>
                  )}
                  {request.status !== "rejected" && request.status !== "delivered" && (
                    <button
                      onClick={() => handleReject(request.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <FaTimes />
                    </button>
                  )}
                  {request.status === "approved" && (
                    <button
                      onClick={() => handleReapprovisionnement(request)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded pulse-button"
                    >
                      Réappro
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="text-gray-600">Quantité demandée:</div>
                  <div className="ml-2 font-semibold">{request.quantity}</div>
                </div>
                <div className="flex items-center">
                  <FaClock className="text-gray-400 mr-2" />
                  <div className="text-gray-600">Date prévue:</div>
                  <div className="ml-2 font-semibold">{request.expectedDeliveryDate}</div>
                </div>
                <div className="flex items-center">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      request.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : request.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : request.status === "delivered"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {request.status === "pending"
                      ? "En attente"
                      : request.status === "approved"
                        ? "Approuvé"
                        : request.status === "delivered"
                          ? "Livré"
                          : "Rejeté"}
                  </div>
                </div>
              </div>

              {/* Détails Supplémentaires */}
              <div className="mt-4 text-sm text-gray-600">
                <p>Date de demande: {request.requestDate}</p>
                <p>Stock actuel: {request.currentStock}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls - Bottom */}
        {!isLoading && filteredRequests.length > 0 && (
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
                      ? "bg-blue-600 text-white font-medium"
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
      </div>

      {/* Modal de Réapprovisionnement avec Animation */}
      {showReapproModal && selectedRequest && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay ${animateModal ? "show" : ""}`}
        >
          <div
            className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 modal-container ${animateModal ? "show" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className={`text-xl font-bold modal-content modal-title ${animateContent ? "show" : ""}`}>
                  Confirmer la livraison
                </h2>
                <p className={`text-gray-600 mt-1 modal-content modal-description ${animateContent ? "show" : ""}`}>
                  Confirmez la livraison pour{" "}
                  {selectedRequest.numDemande
                    ? `la demande ${selectedRequest.numDemande}`
                    : selectedRequest.productName}
                  .
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                ×
              </button>
            </div>

            <div className={`grid grid-cols-2 gap-4 mt-6 modal-content modal-grid ${animateContent ? "show" : ""}`}>
              <div>
                <p className="text-sm font-medium mb-1">Produit</p>
                <p>{selectedRequest.productName}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Demandé par</p>
                <p>{selectedRequest.userName}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Quantité demandée</p>
                <p>{selectedRequest.quantity}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Point de vente</p>
                <p>{selectedRequest.store}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 modal-content modal-description">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Cette action est irréversible. Les quantités seront ajoutées au stock actuel.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`flex justify-end space-x-3 mt-8 modal-content modal-buttons ${animateContent ? "show" : ""}`}
            >
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 hover-scale"
              >
                Annuler
              </button>
              <button
                id="confirm-btn"
                onClick={handleConfirmReappro}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors duration-200 hover-scale"
              >
                Confirmer la livraison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Approvisionnement
