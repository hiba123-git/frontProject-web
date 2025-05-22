/* eslint-disable no-unused-vars */
"use client"
import { ToastContainer,toast } from "react-toastify";
import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Percent,
  Edit,
  Plus,
  Bell,
  Tag,
  Store,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Send,
  Package,
  Check,
  BellOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"


const API_BASE_URL =
  typeof window !== "undefined" ? window.ENV?.NEXT_PUBLIC_API_URL || "http://localhost:7000" : "http://localhost:7000"
console.log("API URL configurée:", API_BASE_URL)

axios.defaults.baseURL = API_BASE_URL
axios.defaults.headers.common["Content-Type"] = "application/json"
axios.defaults.timeout = 15000

axios.interceptors.request.use(
  (config) => {
    console.log(`Requête envoyée: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error("Erreur de requête:", error)
    return Promise.reject(error)
  },
)

axios.interceptors.response.use(
  (response) => {
    console.log(`Réponse reçue: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error(
      "Erreur de réponse:",
      error.response
        ? {
            status: error.response.status,
            data: error.response.data,
            url: error.config.url,
          }
        : error.message,
    )
    return Promise.reject(error)
  },
)

const PromotionsManagement = () => {
  // Fonction pour obtenir la date actuelle au format YYYY-MM-DD
  const getCurrentDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  // Ajouter cette fonction juste après la fonction getCurrentDate()
  const isPromotionExpired = (endDate) => {
    if (!endDate) return false
    const today = new Date()
    const expiryDate = new Date(endDate)
    today.setHours(0, 0, 0, 0)
    expiryDate.setHours(0, 0, 0, 0)
    return today > expiryDate
  }

  // Ajoutez cette fonction pour déboguer les données reçues
  // eslint-disable-next-line no-unused-vars
  const logPromotionData = (promotion) => {
    console.log("Données de promotion:", {
      id: promotion.id || promotion.ID_Compagne,
      title: promotion.title || promotion.Nom,
      discount: promotion.discount || promotion.Pourcent,
      startDate: promotion.startDate || promotion.DateD,
      endDate: promotion.endDate || promotion.DateF,
      status: promotion.status || getStatusFromCode(promotion.CodeStatut),
      products: promotion.products || [],
      stores: promotion.stores || [],
      collection: promotion.collection || promotion.Collection,
     /*  marque: promotion.marque || promotion.Marque, */
    })
  }

  const [promotions, setPromotions] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    discount: "",
    startDate: "",
    endDate: "",
    products: [],
    productIds: [],
    productDetails: [], 
    stores: [],
    storeIds: [],
    status: "scheduled",
    statusId: 2,
    sendNotification: true,
    allArticles: false,
    allClients: false,
    collection: "",
/*     marque: "", */
  })

  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationPromotion, setNotificationPromotion] = useState(null)
  const [notificationMessage, setNotificationMessage] = useState("")

  const [editMode, setEditMode] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortDirection, setSortDirection] = useState("asc")
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [apiError, setApiError] = useState(null)

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  const [promotionTypes, setPromotionTypes] = useState([])
  const [promotionStatuses, setPromotionStatuses] = useState([])
  const [families, setFamilies] = useState([])
  const [collections, setCollections] = useState([])
/*   const [marques, setMarques] = useState([]) */
  const [pointsDeVente, setPointsDeVente] = useState([])

  // Nouvelles variables d'état pour la gestion des produits par famille
  const [selectedFamily, setSelectedFamily] = useState("")
  const [productsInFamily, setProductsInFamily] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [selectAllProducts, setSelectAllProducts] = useState(false)

  useEffect(() => {
    checkApiConnection()
  }, [])

  const checkApiConnection = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get("/promotions")
      console.log("Connexion à l'API réussie:", response.data)

      fetchPromotionTypes()
      fetchPromotionStatuses()
      fetchFamilies()
      fetchCollections()
 /*      fetchMarques() */
      fetchPointsDeVente()
      fetchPromotions()
    } catch (error) {
      console.error("Erreur de connexion à l'API:", error)
      setApiError("Impossible de se connecter à l'API. Veuillez vérifier que le serveur est en cours d'exécution.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPromotions = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("/promotions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { timestamp: Date.now() },
      })

      const notificationsResponse = await axios.get("/promotions/list/notifications", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const notifications = notificationsResponse.data || []
      const promotionsWithNotifications = new Set(notifications.map((notif) => notif.ID_Compagne || notif.id_compagne))

      // On enrichit chaque promotion avec le type et le statut de la dernière notification
      const normalizedPromotions = await Promise.all(
        (response.data || []).map(async (promo) => {
          const promoId = promo.id || promo.ID_Compagne
          // Vérifier s'il y a eu une modification
          const hasModification = await axios
            .get(`/promotions/${promoId}/check-modification`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            .then((res) => res.data.hasModification)
            .catch(() => false)
          // Récupérer le type et le statut de la dernière notification
          let lastNotifType = null
          let lastNotifStatut = null
          try {
            const notifTypeRes = await axios.get(`/promotions/${promoId}/last-notification-type`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            lastNotifType = notifTypeRes.data.type // "promotion", "update" ou null
            lastNotifStatut = notifTypeRes.data.statut // "envoyée", "lue", etc.
          } catch {
            lastNotifType = null
            lastNotifStatut = null
          }
          return {
            ...promo,
            id: promoId,
            title: promo.title || promo.Nom || "",
            discount: promo.discount || promo.Pourcent || 0,
            startDate: promo.startDate || promo.DateD,
            endDate: promo.endDate || promo.DateF,
            status: promo.status || getStatusFromCode(promo.CodeStatut),
            statusId: promo.statusId || promo.CodeStatut || 2,
            products: promo.products || [],
            stores: promo.stores || [],
            collection: promo.collection || promo.Collection || "",
/*             marque: promo.marque || promo.Marque || "", */
            allArticles: promo.allArticles || promo.AllArticle || false,
            allClients: promo.allClients || promo.AllClient || false,
            notificationSent: promotionsWithNotifications.has(promoId),
            hasModification: hasModification,
            lastNotifType, // Ajouté ici
            lastNotifStatut, // Ajouté ici
          }
        }),
      )
      setPromotions(normalizedPromotions)
    } catch (error) {
      console.error("Erreur lors de la récupération des promotions:", error)
      const errorMessage = error.response?.data?.message || "Erreur lors de la récupération des promotions"
      showNotification(errorMessage)
      setPromotions([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPromotionTypes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("/promotions/types/all", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setPromotionTypes(response.data || [])
    } catch (error) {
      console.error("Erreur lors de la récupération des types de promotion:", error)
      setPromotionTypes([])
    }
  }

  const fetchPromotionStatuses = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("/promotions/statuses/all", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setPromotionStatuses(response.data || [])
    } catch (error) {
      console.error("Erreur lors de la récupération des statuts de promotion:", error)
      setPromotionStatuses([])
    }
  }

  const fetchFamilies = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("/promotions/families/all", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setFamilies(response.data || [])
    } catch (error) {
      console.error("Erreur lors de la récupération des familles:", error)
      setFamilies([])
    }
  }

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("/promotions/collections/all", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setCollections(response.data || [])
    } catch (error) {
      console.error("Erreur lors de la récupération des collections:", error)
      setCollections([])
    }
  }

/*   const fetchMarques = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("/promotions/marques/all", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setMarques(response.data || [])
    } catch (error) {
      console.error("Erreur lors de la récupération des marques:", error)
      setMarques([])
    }
  }
 */

  const fetchPointsDeVente = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("/points-de-vente", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setPointsDeVente(response.data || [])
    } catch (error) {
      console.error("Erreur lors de la récupération des points de vente:", error)
      setPointsDeVente([])
    }
  }

  const fetchProductsByFamily = async (familyCode) => {
    if (!familyCode) {
      setProductsInFamily([])
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      // Modifier cette ligne pour utiliser le bon chemin
      const response = await axios.get(`/produits/family/${familyCode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      console.log("Produits récupérés pour la famille:", response.data)
      setProductsInFamily(response.data || [])
    } catch (error) {
      console.error("Erreur lors de la récupération des produits de la famille:", error)
      showNotification("Erreur lors de la récupération des produits de la famille")
      setProductsInFamily([])
    } finally {
      setIsLoading(false)
    }
  }

  // Remplacer la définition actuelle de filteredPromotions par celle-ci:
  const filteredPromotions = useMemo(() => {
   return promotions
    .map((promo) => {
      // Vérifier si la promotion est expirée et mettre à jour son statut
      if (isPromotionExpired(promo.endDate || promo.DateF) && promo.status !== "expired") {
        return { ...promo, status: "expired", statusId: 3 }
      }
      return promo
    })
      .filter((promo) => {
        const matchesSearch =
          promo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (promo.products && promo.products.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))) ||
          (promo.stores && promo.stores.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())))

        const matchesStatus = filterStatus === "all" || promo.status === (filterStatus
           === "recently-expired" && promo.status === "expired" && isRecentlyExpired(promo.endDate || promo.DateF));

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          const dateA = new Date(a.startDate)
          const dateB = new Date(b.startDate)
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA
        } else if (sortBy === "discount") {
          return sortDirection === "asc" ? a.discount - b.discount : b.discount - a.discount
        } else if (sortBy === "title") {
          return sortDirection === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
        }
        return 0
      })
  }, [promotions, searchTerm, filterStatus, sortBy, sortDirection])

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredPromotions.length / itemsPerPage) || 1
  }, [filteredPromotions.length, itemsPerPage])

  // Effet pour réinitialiser la page courante si elle dépasse le nombre total de pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Obtenir les promotions pour la page courante
  const paginatedPromotions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredPromotions.slice(startIndex, endIndex)
  }, [filteredPromotions, currentPage, itemsPerPage])

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

  // Filtrer les produits de la famille sélectionnée en fonction du terme de recherche
  const filteredProductsInFamily = productsInFamily.filter(
    (product) =>
      product.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.reference?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(productSearchTerm.toLowerCase()),
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    if (name === "discount") {
      const numValue = Number.parseFloat(value);
      if (!isNaN(numValue)) {
        if (numValue < 0 || numValue > 100) {
          showNotification("Le pourcentage de réduction doit être compris entre 0 et 100.");
          return;
        }
        
        // Mettre à jour les prix réduits pour tous les produits sélectionnés
        setFormData((prev) => {
          if (prev.productDetails && prev.productDetails.length > 0) {
            const updatedProductDetails = prev.productDetails.map(product => {
              const discountedPrice = product.originalPrice * (1 - numValue / 100);
              return {
                ...product,
                discountedPrice: discountedPrice.toFixed(3)
              };
            });
            
            // Mettre à jour les noms affichés avec les nouveaux prix réduits
            const updatedProducts = updatedProductDetails.map(p => 
              `${p.name} (${p.originalPrice} DT → ${p.discountedPrice} DT)`
            );
            
            return {
              ...prev,
              discount: value,
              productDetails: updatedProductDetails,
              products: updatedProducts
            };
          }
          return { ...prev, discount: value };
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  
    if (name === "type") {
      setFormData((prev) => ({ ...prev, typeId: value }));
    } else if (name === "collection") {
      setFormData((prev) => ({ ...prev, collectionId: value }));
    } /* else if (name === "marque") {
      setFormData((prev) => ({ ...prev, marqueId: value }));
    }  */else if (name === "status") {
      let statusId;
      switch (value) {
        case "active":
          statusId = 1;
          break;
        case "scheduled":
          statusId = 2;
          break;
        case "expired":
          statusId = 3;
          break;
        default:
          statusId = 2;
      }
      setFormData((prev) => ({ ...prev, statusId }));
    }
  };
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setFormData({ ...formData, [name]: checked })
  }

  const handleStoresChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
    const selectedIds = selectedOptions.map((value) => Number.parseInt(value, 10))
    const selectedNames = selectedIds
      .map((id) => {
        const store = pointsDeVente.find((s) => s.id === id)
        return store ? store.nom : ""
      })
      .filter((name) => name)

    setFormData({
      ...formData,
      storeIds: selectedIds,
      stores: selectedNames,
    })
  }

  // Nouvelle fonction pour gérer la sélection d'une famille
  const handleFamilySelect = async (familyCode) => {
    setSelectedFamily(familyCode)
    setSelectedProducts([])
    setSelectAllProducts(false)
    await fetchProductsByFamily(familyCode)
    setShowProductsModal(true)
  }

  // Fonction pour gérer la sélection/désélection d'un produit
  const handleProductSelection = (productId) => {
    let produit = null;
    filteredProductsInFamily.forEach((product) => {
      if (product.id === productId) {
        produit = product;
      }
    });
   if (produit.enPromotion === true) {
  const endDate = new Date(produit.promotions[0].endDate);
  const now = new Date();
  const diffInMs = endDate - now;

  if (!isNaN(diffInMs)) {
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    toast.error("Ce produit est en promotion, la promotion se termine après " + diffInDays + " jour(s)");
  } else {
    toast.error("Date de fin de promotion invalide.");
  }

  return;
}


    if (produit.stock == 0) {
      toast.error("Impossible de créer ce promotion , Ce produit est en rupture de stock");
      return;
    }
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  // Fonction pour gérer la sélection/désélection de tous les produits
  const handleSelectAllProducts = () => {
    const newSelectAll = !selectAllProducts
    setSelectAllProducts(newSelectAll)

    if (newSelectAll) {
      // Sélectionner tous les produits filtrés
      setSelectedProducts(filteredProductsInFamily.map((product) => product.id || product.code))
    } else {
      // Désélectionner tous les produits
      setSelectedProducts([])
    }
  }

  const addSelectedProductsToPromotion = () => {
    if (selectedProducts.length === 0) {
      const family = families.find((f) => f.CodFam === selectedFamily);
      if (family) {
        setFormData((prev) => {
          const updatedProductIds = [...prev.productIds, family.CodFam];
          const updatedProducts = [...prev.products, family.DesFam];
          return {
            ...prev,
            productIds: updatedProductIds,
            products: updatedProducts,
          };
        });
      }
    } else {
      const discountPercent = Number.parseFloat(formData.discount) || 0;
      
      const productDetails = selectedProducts.map((productId) => {
        const product = productsInFamily.find((p) => (p.id || p.code) === productId);
        const originalPrice = parseFloat(product.price) || 0;
        // Calcul du prix réduit selon la formule: prix * (1 - pourcentage / 100)
        const discountedPrice = originalPrice * (1 - discountPercent / 100);
        
        return {
          id: product.id || product.code,
          name: product.name || product.reference || product.description,
          originalPrice: originalPrice,
          discountedPrice: discountedPrice.toFixed(3),
        };
      });
  
      setFormData((prev) => {
        const updatedProductIds = [...prev.productIds, ...productDetails.map((p) => p.id)];
        // Inclure le prix original et le prix réduit dans le nom affiché
        const updatedProducts = [...prev.products, ...productDetails.map((p) => 
          `${p.name} (${p.originalPrice} DT → ${p.discountedPrice} DT)`
        )];
        return {
          ...prev,
          productIds: updatedProductIds,
          products: updatedProducts,
          productDetails: [...(prev.productDetails || []), ...productDetails],
        };
      });
    }
  
    setShowProductsModal(false);
    setSelectedFamily("");
    setProductsInFamily([]);
    setSelectedProducts([]);
    setProductSearchTerm("");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      type: "",
      discount: "",
      startDate: "",
      endDate: "",
      products: [],
      productIds: [],
      stores: [],
      storeIds: [],
      status: "scheduled",
      statusId: 2,
      sendNotification: true,
      allArticles: false,
      allClients: false,
      collection: "",
 /*      marque: "", */
    })
    setEditMode(false)
    setCurrentId(null)
  }
const handleSubmit = async (e) => {
  e.preventDefault();

  // Validation du pourcentage de remise
  const discountValue = Number.parseFloat(formData.discount);
  if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
    showNotification("Le pourcentage de réduction doit être compris entre 0 et 100.");
    return;
  }

  // Validation des dates
  const startDateObj = new Date(formData.startDate);
  const endDateObj = new Date(formData.endDate);
  if (endDateObj <= startDateObj) {
    showNotification("La date de fin doit être supérieure à la date de début.");
    return;
  }

  // Valider les productIds
  const validProductIds = formData.productIds.filter(id => id !== null && id !== undefined && id !== '');
  if (!formData.allArticles && validProductIds.length === 0 && formData.families?.length === 0) {
    showNotification("Veuillez sélectionner au moins un produit ou une famille, ou activer 'Tous les articles'.");
    return;
  }

  setIsLoading(true);
  const payload = {
    title: formData.title,
    startDate: formData.startDate,
    endDate: formData.endDate,
    discount: discountValue,
    allArticles: formData.allArticles,
    allClients: formData.allClients,
    collection: formData.collection || null,
    type: formData.type || null,
    CodeStatut: formData.status || "active",
    products: formData.allArticles ? [] : validProductIds,
    stores: formData.allClients ? [] : formData.storeIds.map(id => Number.parseInt(id, 10)),
    families: formData.allArticles ? [] : formData.families || [],
  };

  console.log("Payload envoyé:", JSON.stringify(payload, null, 2));

  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    let response;
    if (editMode && currentId) {
      response = await axios.put(`/promotions/${currentId}`, payload, { headers });
      showNotification("Promotion modifiée avec succès");
    } else {
      response = await axios.post("/promotions", payload, { headers });
      showNotification("Promotion créée avec succès");
    }

    setShowModal(false);
    resetForm();
    await fetchPromotions();
  } catch (error) {
    console.error("Erreur lors de la soumission:", error);
    showNotification(error.response?.data?.message || "Erreur lors de la création/modification");
    setShowModal(false);
    resetForm();
  } finally {
    setIsLoading(false);
  }
};







const handleEdit = async (id) => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(`/promotions/${id}`, { headers });
    const promotion = response.data;

    console.log("Données de la promotion récupérée:", promotion);

    const productIds = promotion.productIds || [];
    const productNames = promotion.products || [];
    const storeIds = promotion.storeIds || [];
    const storeNames = promotion.stores || [];

    setFormData({
      title: promotion.title || promotion.Nom || "",
      type: promotion.type || promotion.TypePromotion || "",
      discount: promotion.discount || promotion.Pourcent || "",
      startDate: formatDateForInput(promotion.startDate || promotion.DateD),
      endDate: formatDateForInput(promotion.endDate || promotion.DateF),
      products: productNames,
      productIds: productIds,
      stores: storeNames,
      storeIds: storeIds,
      status: promotion.status || getStatusFromCode(promotion.CodeStatut),
      statusId: promotion.statusId || promotion.CodeStatut || 2,
      sendNotification: true,
      allArticles: promotion.allArticles || promotion.AllArticle || false,
      allClients: promotion.allClients || promotion.AllClient || false,
      collection: promotion.collection || promotion.Collection || "",
    });

    setEditMode(true);
    setCurrentId(id);
    setShowModal(true);
  } catch (error) {
    console.error("Erreur lors de la récupération de la promotion:", error);
    showNotification("Erreur lors de la récupération de la promotion");
  } finally {
    setIsLoading(false);
  }
};
  const formatDateForInput = (dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      return date.toISOString().split("T")[0]
    } catch (e) {
      return ""
    }
  }

  const getStatusFromCode = (codeStatut) => {
    if (!codeStatut) return "scheduled"
    switch (Number.parseInt(codeStatut)) {
      case 1:
        return "active"
      case 2:
        return "scheduled"
      case 3:
        return "expired"
      default:
        return "scheduled"
    }
  }

  // eslint-disable-next-line no-unused-vars
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette promotion ?")) {
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      await axios.delete(`/promotions/${id}`, { headers })
      showNotification("Promotion supprimée avec succès")
      fetchPromotions()
    } catch (error) {
      console.error("Erreur lors de la suppression de la promotion:", error)
      showNotification("Erreur lors de la suppression de la promotion")
    } finally {
      setIsLoading(false)
    }
  }

  const openNotificationModal = (promotion) => {
    // Si une notification a déjà été envoyée, ne rien faire
    if (promotion.notificationSent) {
      showNotification("Une notification a déjà été envoyée pour cette promotion.")
      return
    }

    const storeNames = promotion.stores?.join(", ") || "tous les magasins"
    const productsList = promotion.products?.join(", ") || "tous les produits"

    const prefilledMessage = `Nouvelle promotion "${promotion.title}" : ${promotion.discount}% de réduction sur ${productsList}. Valable du ${formatDate(promotion.startDate)} au ${formatDate(promotion.endDate)} pour ${storeNames}.`

    setNotificationPromotion(promotion)
    setNotificationMessage(prefilledMessage)
    setShowNotificationModal(true)
  }

  const sendNotification = async () => {
    if (!notificationPromotion) {
      showNotification("Aucune promotion sélectionnée.")
      return
    }

    if (!notificationMessage.trim()) {
      showNotification("Veuillez entrer un message pour la notification.")
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const promotionId = notificationPromotion.id || notificationPromotion.ID_Compagne
      if (!promotionId) {
        throw new Error("ID de la promotion manquant.")
      }

      // Simplify payload, don't send the date - let the server handle it
      const response = await axios.post(
        `/promotions/${promotionId}/notification`,
        {
          message: notificationMessage,
          // No dateEnvoi field - let the server create this value
        },
        { headers },
      )

      console.log("Réponse du serveur pour la notification:", response.data)
      showNotification("Notification envoyée et enregistrée avec succès")
      setShowNotificationModal(false)
      setNotificationMessage("")
      setNotificationPromotion(null)
      await fetchPromotions()
      // Mettre à jour l'état local pour marquer cette promotion comme ayant une notification
      setPromotions((prevPromotions) =>
        prevPromotions.map((promo) =>
          promo.id === promotionId || promo.ID_Compagne === promotionId ? { ...promo, notificationSent: true } : promo,
        ),
      )
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error)
      let errorMessage = "Erreur lors de l'envoi de la notification"

      if (error.response) {
        console.error("Détails de l'erreur:", {
          data: error.response.data,
          status: error.response.status,
        })
        errorMessage = error.response.data?.message || `Erreur ${error.response.status}: Problème serveur`
      } else if (error.request) {
        errorMessage = "Aucune réponse du serveur. Vérifiez votre connexion."
      } else {
        errorMessage = error.message
      }

      showNotification(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message) => {
    setNotification(message)
    setTimeout(() => setNotification(null), 3000)
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr })
    } catch (e) {
      return dateString
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-500"
      case "scheduled":
        return "bg-sky-500"
      case "expired":
        return "bg-slate-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Active"
      case "scheduled":
        return "Planifiée"
      case "expired":
        return "Expirée"
      default:
        return status
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />
      case "scheduled":
        return <Clock className="w-4 h-4" />
      case "expired":
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }
// Fonction pour déterminer si une promotion a expiré récemment (dans les 7 derniers jours)
const isRecentlyExpired = (endDate) => {
  if (!endDate) return false;
  
  const expiryDate = new Date(endDate);
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  return expiryDate >= sevenDaysAgo && expiryDate <= today;
};



  // Ajoutez un effet pour rafraîchir les données périodiquement
  useEffect(() => {
    // Rafraîchir les données au montage du composant
    fetchPromotions()

    // Rafraîchir les données lorsque le modal se ferme
    // eslint-disable-next-line no-unused-vars
    const handleModalClose = () => {
      if (!showModal && !showNotificationModal && !isLoading) {
        fetchPromotions()
      }
    }

    // Ajouter des écouteurs d'événements pour les changements d'état des modals
    return () => {
      // Nettoyage des écouteurs si nécessaire
    }
  }, [showModal, showNotificationModal])

  if (apiError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Erreur de connexion</h2>
            <p className="text-gray-600 mt-2">{apiError}</p>
          </div>
          <button
            onClick={checkApiConnection}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  
  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <RefreshCw className="w-8 h-8 text-indigo-600" />
            </motion.div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold text-gray-900 tracking-tight"
            >
              Gestion des Promotions
            </motion.h1>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 flex items-center space-x-2 transition-all duration-300 shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Nouvelle Promotion</span>
            </motion.button>

                <motion.button
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.5, delay: 0.5 }}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get("/promotions/check-expired", { headers });
      
      console.log("Vérification des promotions expirées:", response.data);
      showNotification(`${response.data.result.campaignsUpdated || 0} promotions et ${response.data.result.productsProcessed || 0} produits mis à jour`);
      
      // Rafraîchir les données
      await fetchPromotions();
    } catch (error) {
      console.error("Erreur lors de la vérification des promotions expirées:", error);
      showNotification("Erreur lors de la vérification des promotions expirées");
    } finally {
      setIsLoading(false);
    }
  }}
  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-orange-700 flex items-center space-x-2 transition-all duration-300 shadow-md"
>
  <Clock className="w-5 h-5" />
 <span>Vérifier les expirations</span>
</motion.button>



          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-4 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une promotion..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative">
                <select
  value={filterStatus}
  onChange={(e) => setFilterStatus(e.target.value)}
  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
>
  <option value="all">Tous les statuts</option>
  <option value="active">Actives</option>
  <option value="scheduled">Planifiées</option>
  <option value="expired">Expirées</option>
  <option value="recently-expired">Expirées récemment</option>
</select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={`${sortBy}-${sortDirection}`}
                    onChange={(e) => {
                      const [newSortBy, newSortDirection] = e.target.value.split("-")
                      setSortBy(newSortBy)
                      setSortDirection(newSortDirection)
                    }}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="date-asc">Date (croissant)</option>
                    <option value="date-desc">Date (décroissant)</option>
                    <option value="discount-asc">Réduction (croissant)</option>
                    <option value="discount-desc">Réduction (décroissant)</option>
                    <option value="title-asc">Titre (A-Z)</option>
                    <option value="title-desc">Titre (Z-A)</option>
                  </select>
                  {sortDirection === "asc" ? (
                    <ChevronUp className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pagination Controls - Top */}
        {filteredPromotions.length > 0 && (
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
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
              </select>
              <span className="text-sm text-gray-600">promotions par page</span>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                Page {currentPage} sur {totalPages} ({filteredPromotions.length} résultats)
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
                  <ChevronLeft size={14} />
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
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredPromotions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 bg-white rounded-xl shadow-sm"
          >
            <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Tag className="w-12 h-12 text-indigo-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune promotion trouvée</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Aucune promotion ne correspond à vos critères de recherche. Essayez de modifier vos filtres ou créez une
              nouvelle promotion.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPromotions.map((promo, index) => (
              <motion.div
                key={promo.id || promo.ID_Compagne || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
              >
                <div className={`h-2 ${getStatusColor(promo.status)}`} />

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{promo.title || promo.Nom}</h3>
                    <span
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(promo.status)}`}
                    >
                      {getStatusIcon(promo.status)}
                      {getStatusText(promo.status)}
                    </span>
                  </div>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                      <Percent className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-3xl font-bold text-indigo-600">{promo.discount || promo.Pourcent}%</span>
                      <span className="text-gray-500 text-sm ml-1">de réduction</span>
                    </div>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-500">Période</div>
                        <div className="font-medium">
                          {formatDate(promo.startDate || promo.DateD)} - {formatDate(promo.endDate || promo.DateF)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Tag className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-500">Produits</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {promo.allArticles || promo.AllArticle ? (
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                              Tous les articles
                            </span>
                          ) : promo.products && promo.products.length > 0 ? (
                            promo.products.map((product, i) => (
                              <span key={i} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                                {product}
                              </span>
                            ))
                          ) : (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Aucun produit</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Store className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-500">Magasins</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {promo.allClients || promo.AllClient ? (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              Tous les magasins
                            </span>
                          ) : promo.stores && promo.stores.length > 0 ? (
                            promo.stores.map((store, i) => (
                              <span key={i} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                {store}
                              </span>
                            ))
                          ) : (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Aucun magasin</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {(promo.collection || promo.Collection || promo.marque || promo.Marque) && (
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex flex-wrap gap-2">
                          {(promo.collection || promo.Collection) && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              {promo.collection || promo.Collection}
                            </span>
                          )}
                          {/* {(promo.marque || promo.Marque) && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              {promo.marque || promo.Marque}
                            </span>
                          )} */}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2 pt-4 border-t"></div>{" "}
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    {promo.status !== "expired" && (
                      <>
                        {promo.lastNotifStatut === "envoyée" ? (
                          <div
                            className="p-2 rounded-full bg-green-100 text-green-600 cursor-not-allowed relative"
                            title="Notification déjà envoyée"
                          >
                            <BellOff className="w-5 h-5" />
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openNotificationModal(promo)}
                            className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                            title="Envoyer une notification"
                          >
                            <Bell className="w-5 h-5" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(promo.id || promo.ID_Compagne)}
                          className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </motion.button>
                      </>
                    )}
                    {/* Le bouton supprimer a été retiré */}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Controls - Bottom */}
        {filteredPromotions.length > 0 && (
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
                <ChevronLeft size={14} />
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
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-900">
                  {editMode ? "Modifier la promotion" : "Nouvelle Promotion"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        placeholder="Ex: Soldes d'été"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="">Sélectionnez un type</option>
                        {promotionTypes.map((type) => (
                          <option key={type.TypePromotion} value={type.TypePromotion}>
                            {type.TypePromotion}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Réduction (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          name="discount"
                          value={formData.discount}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                          min="0"
                          max="100"
                          step="0.1"
                          onBlur={(e) => {
                            if (e.target.value !== "") {
                              const value = Number.parseFloat(e.target.value)
                              if (!isNaN(value)) {
                                setFormData({
                                  ...formData,
                                  discount: Math.max(0, Math.min(100, value)).toFixed(3),
                                })
                              }
                            }
                          }}
                        />
                        <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                        min={getCurrentDate()}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                        min={formData.startDate || getCurrentDate()}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                      <select
                        name="collection"
                        value={formData.collection}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Sélectionnez une collection</option>
                        {collections.map((collection) => (
                          <option key={collection.Collection} value={collection.Collection}>
                            {collection.Collection}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                      <select
                        name="marque"
                        value={formData.marque}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Sélectionnez une marque</option>
                        {marques.map((marque) => (
                          <option key={marque.Marque} value={marque.Marque}>
                            {marque.Marque}
                          </option>
                        ))}
                      </select>
                    </div> */}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Familles et produits concernés
                    </label>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="allArticles"
                        name="allArticles"
                        checked={formData.allArticles}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allArticles" className="ml-2 block text-sm text-gray-700">
                        Tous les familles
                      </label>
                    </div>

                    {!formData.allArticles && (
                      <>
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Familles sélectionnées</label>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFamily("")
                                setShowProductsModal(true)
                              }}
                              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              <Package className="w-4 h-4" />
                              Sélectionner une famille
                            </button>
                          </div>
                          <div className="border border-gray-300 rounded-lg p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                          {formData.products.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {formData.products.map((product, index) => (
                                <span
                                  key={index}
                                  className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded flex items-center gap-1"
                                >
                                  {product}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => {
                                        const newProducts = [...prev.products];
                                        const newProductIds = [...prev.productIds];
                                        const newProductDetails = [...(prev.productDetails || [])];
                                        
                                        newProducts.splice(index, 1);
                                        newProductIds.splice(index, 1);
                                        newProductDetails.splice(index, 1);
                                        
                                        return {
                                          ...prev,
                                          products: newProducts,
                                          productIds: newProductIds,
                                          productDetails: newProductDetails,
                                        };
                                      });
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 ml-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">Aucune famille ou produit sélectionné</p>
                          )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clients concernés</label>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="allClients"
                        name="allClients"
                        checked={formData.allClients}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allClients" className="ml-2 block text-sm text-gray-700">
                        Tous les clients
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Magasins concernés</label>
                    <select
                      multiple
                      name="stores"
                      value={formData.storeIds.map(String)}
                      onChange={handleStoresChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 h-32"
                    >
                      {pointsDeVente.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.nom}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs magasins
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      {promotionStatuses.length > 0 ? (
                        promotionStatuses.map((status) => (
                          <option
                            key={status.CodeStatut}
                            value={
                              status.CodeStatut === 1 ? "active" : status.CodeStatut === 2 ? "scheduled" : "expired"
                            }
                          >
                            {status.LibelleStatut}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="scheduled">Planifiée</option>
                          <option value="active">Active</option>
                          <option value="expired">Expirée</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? "Traitement..." : editMode ? "Mettre à jour" : "Créer"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal pour sélectionner une famille et ses produits */}
      <AnimatePresence>
        {showProductsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedFamily ? "Sélectionner des produits" : "Sélectionner une famille"}
                </h3>
                <button
                  onClick={() => setShowProductsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {!selectedFamily ? (
                  // Affichage des familles
                  <div className="space-y-4">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher une famille..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {families
                        .filter((family) => family.DesFam?.toLowerCase().includes(productSearchTerm.toLowerCase()))
                        .map((family) => (
                          <div
                            key={family.CodFam}
                            onClick={() => handleFamilySelect(family.CodFam)}
                            className="border border-gray-200 rounded-lg p-3 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-colors"
                          >
                            <div className="font-medium">{family.DesFam}</div>
                            <div className="text-sm text-gray-500">Code: {family.CodFam}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  // Affichage des produits de la famille sélectionnée
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-medium">
                          Famille: {families.find((f) => f.CodFam === selectedFamily)?.DesFam}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Sélectionnez les produits à mettre en promotion ou mettez toute la famille en promotion
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFamily("")
                          setSelectedProducts([])
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Retour aux familles
                      </button>
                    </div>

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="selectAllProducts"
                        checked={selectAllProducts}
                        onChange={handleSelectAllProducts}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="selectAllProducts" className="ml-2 block text-sm text-gray-700">
                        Sélectionner tous les produits
                      </label>
                    </div>

                    {filteredProductsInFamily.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Aucun produit trouvé dans cette famille</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Sélection
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Référence
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Nom
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Prix
                              </th>
                            </tr>
                          </thead>
                    
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredProductsInFamily.map((product) => {
                            // Calculer le prix réduit en temps réel
                            const originalPrice = parseFloat(product.price) || 0;
                            const discountPercent = Number.parseFloat(formData.discount) || 0;
                            const discountedPrice = originalPrice * (1 - discountPercent / 100);
                            const formattedDiscountedPrice = discountedPrice.toFixed(3);
                            
                            const isSelected = selectedProducts.includes(product.id || product.code);
                            
                            return (
                              <tr
                                key={product.id || product.code}
                                className={
                                  isSelected
                                    ? "bg-indigo-50"
                                    : "hover:bg-gray-50"
                                }
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleProductSelection(product.id || product.code)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.reference || product.code}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {product.name || product.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {product.price ? (
                                    <div>
                                      <span className={isSelected ? "line-through text-gray-400" : "text-gray-500"}>
                                        {originalPrice} DT
                                      </span>
                                      {isSelected && discountPercent > 0 && (
                                        <span className="ml-2 text-green-600 font-medium">
                                          {formattedDiscountedPrice} DT
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    "N/A"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowProductsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  {selectedFamily && (
                    <button
                      type="button"
                      onClick={addSelectedProductsToPromotion}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {selectedProducts.length > 0
                        ? `Ajouter ${selectedProducts.length} produit(s)`
                        : "Ajouter toute la famille"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900">Envoyer une notification</h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Vous êtes sur le point d envoyer une notification aux gérants des points de vente concernés par
                    cette promotion.
                  </p>
                  <div className="bg-indigo-50 p-3 rounded-lg mb-4">
                    <h4 className="font-medium text-indigo-700 mb-1">Promotion concernée :</h4>
                    <p className="text-indigo-900">
                      {notificationPromotion?.title || ""} - {notificationPromotion?.discount || ""}% de réduction
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="notificationMessage" className="block text-sm font-medium text-gray-700 mb-2">
                    Message de notification
                  </label>
                  <textarea
                    id="notificationMessage"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 h-32"
                    placeholder="Message à envoyer aux gérants..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowNotificationModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={sendNotification}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <Send className="w-4 h-4" />
                    {isLoading ? "Envoi en cours..." : "Envoyer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <ToastContainer></ToastContainer>
    </>
  )
}

export default PromotionsManagement
