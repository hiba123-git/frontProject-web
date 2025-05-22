"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import {
  FaBoxOpen,
  FaPlus,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaImage,
  FaTag,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBarcode,
  FaEye,
  FaShoppingCart,
  FaFilter,
  FaChartBar,
  FaInfoCircle,
  FaArrowUp,
  FaThLarge,
  FaThList,
  FaSync,
  FaWarehouse,
  FaClipboardList,
  FaLightbulb,
  FaStore,
} from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Tooltip } from "react-tooltip"
import { format, isValid } from "date-fns"

const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  if (!isValid(date)) return "Date invalide"
  return format(date, "dd/MM/yyyy")
}

const Produits = () => {
  // États pour gérer les données et l'interface
  const [produits, setProduits] = useState([])
  const [familles, setFamilles] = useState([])
  const [sousFamilles, setSousFamilles] = useState([])
  const [casiers, setCasiers] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterFamille, setFilterFamille] = useState("")
  const [filterSousFamille, setFilterSousFamille] = useState("")
  const [filterCasier, setFilterCasier] = useState("")
  const [filterStock, setFilterStock] = useState("")
  const [sortField, setSortField] = useState("DesProduit")
  const [sortDirection, setSortDirection] = useState("asc")
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [viewMode, setViewMode] = useState("list") // grid ou list
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailProduct, setDetailProduct] = useState(null)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockData, setStockData] = useState({ id: null, quantiteStock: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState({
    produitsScannés: 0,
    produitsEnStock: 0,
    produitsEnRupture: 0,
    ventes: 0,
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [randomTip, setRandomTip] = useState("")
  const fileInputRef = useRef(null)
  const searchInputRef = useRef(null)
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [distributeData, setDistributeData] = useState({
    id: null,
    productName: "",
    quantityToDistribute: 1,
    pointsOfSale: [
      { id: "", name: "", quantity: 0 },
    ],
    totalDistributed: 0,
  })
  // eslint-disable-next-line no-unused-vars
  const [distributedProducts, setDistributedProducts] = useState([])
  // eslint-disable-next-line no-unused-vars
  const [newlyAddedProducts, setNewlyAddedProducts] = useState([]) // Suivre les nouveaux produits ajoutés
  // État pour le formulaire
  const [formData, setFormData] = useState({
    CodProduit: "",
    DesProduit: "",
    Reference: "",
    Description: "",
    Prix: "",
    CodFam: "",
    CodSFam: "",
    Image: "",
    QuantiteStock: "",
    StockMinimum: "",
    Emplacement: "",
    Collection: "",
    CodCasier: "",
    EnPromotion: false,
    PourcentagePromotion: "",
  })

    const [pointsDeVente, setPointsDeVente] = useState([])
  

  const calculerPrixPromo = (produit) => {
    if (!produit.EnPromotion) return produit.Prix || 0

    // Si le produit a des détails de promotion et une remise
    if (produit.promotionDetails && produit.promotionDetails.remise) {
      return produit.Prix * (1 - produit.promotionDetails.remise / 100)
    }

    // Sinon, utiliser PourcentagePromotion
    if (produit.PourcentagePromotion) {
      return produit.Prix * (1 - produit.PourcentagePromotion / 100)
    }

    // Si aucune remise n'est disponible, retourner le prix original
    return produit.Prix || 0
  }
  // État pour la génération de code-barres
  const [needsBarcode, setNeedsBarcode] = useState(false)
  const [generatedBarcode, setGeneratedBarcode] = useState("")
  const [barcodeType, setBarcodeType] = useState("EAN13")
  const [isPrincipalBarcode, setIsPrincipalBarcode] = useState(true)

  // Fonction pour obtenir l'URL complète de l'image
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.svg"

    // Si l'image est déjà une URL complète, la retourner telle quelle
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath
    }

    // Nettoyer le chemin d'image pour éviter les doublons de "uploads/produits"
    let cleanPath = imagePath

    // Si le chemin contient déjà "uploads/produits", s'assurer qu'il n'y a pas de duplication
    if (cleanPath.includes("uploads/produits")) {
      // Extraire la partie après le dernier "uploads/produits"
      const parts = cleanPath.split("uploads/produits")
      cleanPath = parts[parts.length - 1]

      // Supprimer les slashes au début si présents
      while (cleanPath.startsWith("/")) {
        cleanPath = cleanPath.substring(1)
      }
    }

    // Construire l'URL complète avec le protocole et le domaine
    return `http://localhost:7000/uploads/produits/${cleanPath}`
  }

  // Conseils aléatoires pour l'interface utilisateur
  const tips = [
    "Utilisez la recherche pour trouver rapidement un produit par code ou nom",
    "Cliquez sur les en-têtes de colonnes pour trier les produits",
    "Utilisez les filtres pour affiner votre liste de produits",
    "Passez la souris sur les icônes pour voir leur fonction",
    "Double-cliquez sur un produit pour voir ses détails",
    "Utilisez la vue en grille pour une présentation visuelle",
    "Utilisez la vue en liste pour voir plus d'informations",
    "Mettez à jour régulièrement vos stocks pour éviter les ruptures",
    "Ajoutez des images à vos produits pour une meilleure identification",
    "Exportez vos données pour les sauvegarder ou les analyser",
  ]

  // Effet pour sélectionner un conseil aléatoire
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * tips.length)
    setRandomTip(tips[randomIndex])
  }, [])

  // Filtrer les produits en fonction des critères
  const filteredProduits = produits.filter((produit) => {
    // Filtrer par terme de recherche
    const matchesSearch =
      !searchTerm ||
      produit.CodProduit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.DesProduit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.Reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Ajouter la recherche par code casier
      (produit.CodCasier && produit.CodCasier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Recherche par code-barres existante
      (produit.CodeBarres &&
        produit.CodeBarres.some((barcode) => barcode.CodBarre.toLowerCase().includes(searchTerm.toLowerCase())))
    // Filtrer par famille
    const matchesFamille = !filterFamille || produit.CodFam === filterFamille

    // Filtrer par sous-famille
    const matchesSousFamille = !filterSousFamille || produit.CodSFam === filterSousFamille

    // Filtrer par casier
    const matchesCasier = !filterCasier || produit.CodCasier === filterCasier


    // Filtrer par état du stock
    let matchesStock = true
    if (filterStock === "rupture") {
      matchesStock = produit.QuantiteStock <= produit.StockMinimum
    } else if (filterStock === "stock") {
      matchesStock = produit.QuantiteStock > 0
    } else if (filterStock === "promo") {
      matchesStock = produit.EnPromotion === true
    } else if (filterStock === "nonDistribuee") {
      matchesStock = produit.QuantiteDistribuee == 0
    } 
     else if (filterStock === "with-barcode") {
      matchesStock = produit.CodeBarres && produit.CodeBarres.length > 0
    } else if (filterStock === "without-barcode") {
      matchesStock = !produit.CodeBarres || produit.CodeBarres.length === 0
    }
    return matchesSearch && matchesFamille && matchesSousFamille && matchesCasier && matchesStock
  })
  // Effet pour calculer le nombre total de pages
  useEffect(() => {
    if (filteredProduits.length > 0) {
      setTotalPages(Math.ceil(filteredProduits.length / itemsPerPage))
    } else {
      setTotalPages(1)
    }
  }, [filteredProduits, itemsPerPage])

  // Effet pour charger les données
  useEffect(() => {
    fetchData()
    fetchStats()
    fetchPointsDeVente()
  }, [])


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

  // Effet pour charger les sous-familles lorsque la famille change
  useEffect(() => {
    if (formData.CodFam) {
      fetchSousFamilles(formData.CodFam)
    } else {
      setSousFamilles([])
    }
  }, [formData.CodFam])

  // Effet pour charger les sous-familles lorsque le filtre famille change
  useEffect(() => {
    if (filterFamille) {
      fetchSousFamilles(filterFamille)
    } else {
      setSousFamilles([])
    }
  }, [filterFamille])

  useEffect(() => {
    // Fonction pour vérifier et mettre à jour les produits avec promotions expirées
    const checkExpiredPromotions = () => {
      // Vérifier si des produits ont des promotions expirées mais sont toujours marqués comme en promotion
      const productsWithExpiredPromos = produits.filter(
        (produit) => produit.EnPromotion && produit.promotionDetails && !produit.promotionDetails.isActive,
      )

      if (productsWithExpiredPromos.length > 0) {
        // eslint-disable-next-line no-undef
        console.log(`Détecté ${productsWithExpiredPromotions.length} produits avec promotions expirées`)

        // Mise à jour locale pour afficher le prix correct immédiatement
        const updatedProducts = produits.map((produit) => {
          if (produit.EnPromotion && produit.promotionDetails && !produit.promotionDetails.isActive) {
            return {
              ...produit,
              prixAffiche: produit.Prix,
            }
          }
          return produit
        })

        setProduits(updatedProducts)

        // Notification pour informer l'utilisateur
      }
    }

    // Exécuter la vérification après le chargement initial des produits
    if (!loading && produits.length > 0) {
      checkExpiredPromotions()
    }
  }, [produits, loading])

  useEffect(() => {
    // Vérifier toutes les heures si des promotions ont expiré
    const interval = setInterval(
      () => {
        // Créer une nouvelle date "actuelle" pour forcer la réévaluation
        const currentDate = new Date()

        // Mettre à jour les produits en parcourant ceux qui sont en promotion
        setProduits((prevProduits) => {
          return prevProduits.map((produit) => {
            if (produit.EnPromotion && produit.promotionDetails) {
              const dateFin = produit.promotionDetails.DateF ? new Date(produit.promotionDetails.DateF) : null

              // Si la date de fin existe et est dépassée
              if (dateFin && currentDate > dateFin && produit.promotionDetails.isActive) {
                // Mettre à jour le statut de la promotion
                return {
                  ...produit,
                  promotionDetails: {
                    ...produit.promotionDetails,
                    isActive: false,
                  },
                  prixAffiche: produit.Prix,
                }
              }
            }
            return produit
          })
        })
      },
      60 * 60 * 1000,
    ) // Vérifier toutes les heures

    return () => clearInterval(interval)
  }, [])

  // Fonction pour charger les sous-familles pour tous les produits
  const loadAllSousFamillesForProducts = async (products) => {
    try {
      // Récupérer tous les codes de famille uniques
      const uniqueFamilyCodes = [...new Set(products.filter((p) => p.CodFam).map((p) => p.CodFam))]

      // Pour chaque famille, récupérer les sous-familles
      const sousFamillesPromises = uniqueFamilyCodes.map((codFam) =>
        fetch(`http://localhost:7000/produits/sous-familles/${codFam}`).then((response) => {
          if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des sous-familles pour ${codFam}`)
          }
          return response.json()
        }),
      )

      // Attendre que toutes les requêtes soient terminées
      const sousFamillesResults = await Promise.all(sousFamillesPromises)

      // Fusionner tous les résultats dans un seul tableau
      const allSousFamilles = sousFamillesResults.flat()

      // Mettre à jour l'état des sous-familles
      setSousFamilles(allSousFamilles)
    } catch (error) {
      console.error("Erreur lors du chargement des sous-familles:", error)
    }
  }

  // Fonction pour récupérer les données
  const fetchData = async () => {
    setLoading(true)
    try {
      // Récupérer les listes déroulantes
      const dropdownResponse = await fetch("http://localhost:7000/produits/dropdown-lists")
      if (!dropdownResponse.ok) {
        throw new Error("Erreur lors de la récupération des listes déroulantes")
      }
      const dropdownData = await dropdownResponse.json()
      setFamilles(dropdownData.familles)
      // Trier les casiers par ordre alphabétique selon CodCasier
      const casiersTriés = [...dropdownData.casiers].sort((a, b) => {
        return a.CodCasier.localeCompare(b.CodCasier)
      })
      setCasiers(casiersTriés)
      setCollections(dropdownData.collections) // Stocker les collections

      // Récupérer les produits
      const produitsResponse = await fetch("http://localhost:7000/produits")
      if (!produitsResponse.ok) {
        throw new Error("Erreur lors de la récupération des produits")
      }
      const produitsData = await produitsResponse.json()
      setProduits(produitsData)
      console.log(
        "Produits en promotion:",
        produitsData
          .filter((p) => p.EnPromotion)
          .map((p) => ({
            id: p.ID,
            nom: p.DesProduit,
            prix: p.Prix,
            prixPromo: p.PrixPromotion,
            prixAffiche: p.prixAffiche,
            pourcentage: p.PourcentagePromotion,
            details: p.promotionDetails,
          })),
      )
      // Charger les sous-familles pour tous les produits
      await loadAllSousFamillesForProducts(produitsData)

      setLoading(false)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast.error("Erreur lors du chargement des données")
      setLoading(false)
    }
  }

  // Fonction pour récupérer les statistiques
  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:7000/produits/statistics")
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques")
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error)
    }
  }

  // Fonction pour rafraîchir les données
  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchData()
    await fetchStats()
    setTimeout(() => {
      setIsRefreshing(false)
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 1500)
    }, 800)
  }

  // Fonction pour récupérer les sous-familles par famille
  const fetchSousFamilles = async (codFam) => {
    try {
      const response = await fetch(`http://localhost:7000/produits/sous-familles/${codFam}`)
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des sous-familles pour ${codFam}`)
      }
      const data = await response.json()
      setSousFamilles(data)
    } catch (error) {
      console.error("Erreur lors de la récupération des sous-familles:", error)
      toast.error("Erreur lors de la récupération des sous-familles")
    }
  }

  // Modifier la fonction getSousFamilleNom pour mieux gérer les sous-familles
  const getSousFamilleNom = (codFam, codSFam) => {
    // Rechercher la sous-famille correspondant à la fois au code famille et au code sous-famille
    const sousFamille = sousFamilles.find((sf) => sf.CodFam === codFam && sf.CodSFam === codSFam)
    return sousFamille ? sousFamille.DesSFam : "N/A"
  }

  // Modifier la fonction fetchProductDetails pour charger les sous-familles spécifiques au produit
  const fetchProductDetails = async (id) => {
    try {
      const response = await fetch(`http://localhost:7000/produits/${id}`)
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails du produit")
      }
      const data = await response.json()

      // S'assurer que nous avons les sous-familles pour ce produit
      if (data.CodFam) {
        try {
          const sfResponse = await fetch(`http://localhost:7000/produits/sous-familles/${data.CodFam}`)
          if (sfResponse.ok) {
            const sfData = await sfResponse.json()
            // Ajouter les nouvelles sous-familles sans dupliquer
            setSousFamilles((prev) => {
              const newSousFamilles = [...prev]
              sfData.forEach((sf) => {
                if (
                  !newSousFamilles.some((existing) => existing.CodFam === sf.CodFam && existing.CodSFam === sf.CodSFam)
                ) {
                  newSousFamilles.push(sf)
                }
              })
              return newSousFamilles
            })
          }
        } catch (sfError) {
          console.error("Erreur lors de la récupération des sous-familles pour le détail:", sfError)
        }
      }

      setDetailProduct(data)
      setShowDetailModal(true)
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du produit:", error)
      toast.error("Erreur lors de la récupération des détails du produit")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const productData = { ...formData }

      // Convertir les valeurs numériques et gérer les valeurs vides
      if (productData.Prix) {
        productData.Prix = Number.parseFloat(productData.Prix)
        if (isNaN(productData.Prix)) productData.Prix = 0
      } else {
        productData.Prix = 0
      }

      if (productData.QuantiteStock) {
        productData.QuantiteStock = Number.parseInt(productData.QuantiteStock, 10)
        if (isNaN(productData.QuantiteStock)) productData.QuantiteStock = 0
      } else {
        productData.QuantiteStock = 0
      }

      if (productData.StockMinimum) {
        productData.StockMinimum = Number.parseInt(productData.StockMinimum, 10)
        if (isNaN(productData.StockMinimum)) productData.StockMinimum = 0
      } else {
        productData.StockMinimum = 0
      }

      if (productData.QuantiteStock <= productData.StockMinimum) {
        toast.error("La quantité en stock doit être supérieure au stock minimum.")
        return // Arrête la soumission du formulaire
      }

      if (productData.PourcentagePromotion) {
        productData.PourcentagePromotion = Number.parseFloat(productData.PourcentagePromotion)
        if (isNaN(productData.PourcentagePromotion)) productData.PourcentagePromotion = 0
      } else if (productData.EnPromotion) {
        productData.PourcentagePromotion = 0
      }

      // Supprimer les champs vides pour éviter les erreurs de conversion
      Object.keys(productData).forEach((key) => {
        if (productData[key] === "") {
          delete productData[key]
        }
      })

      // Préparer les données du code-barres si nécessaire
      const barcodeData = []
      if (needsBarcode) {
        // Nettoyer le code-barres (supprimer les espaces)
        const cleanedBarcode = generatedBarcode ? generatedBarcode.trim() : ""

        if (cleanedBarcode) {
          barcodeData.push({
            CodBarre: cleanedBarcode,
            TypeBarre: barcodeType,
            IsPrincipal: isPrincipalBarcode,
          })
        } else {
          // Générer un code-barres aléatoire s'il n'en a pas été fourni
          barcodeData.push({
            CodBarre: Math.floor(Math.random() * 10000000000000)
              .toString()
              .padStart(13, "0"),
            TypeBarre: barcodeType,
            IsPrincipal: isPrincipalBarcode,
          })
        }
      }

      // Si on a des codes-barres, les ajouter aux données du produit
      if (barcodeData.length > 0) {
        productData.barcodes = barcodeData
      }

      if (editMode) {
        // Mise à jour d'un produit existant
        const response = await fetch(`http://localhost:7000/produits/${selectedProduct.ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Réponse d'erreur:", errorData)

          // Vérifier si l'erreur concerne un code-barres existant
          if (errorData.message && errorData.message.includes("code-barres")) {
            toast.error(errorData.message)
          } else {
            throw new Error(errorData.message || "Erreur lors de la mise à jour du produit")
          }
          return
        }

        const updatedProduct = await response.json()

        // Mise à jour locale
        setProduits(produits.map((item) => (item.ID === selectedProduct.ID ? updatedProduct : item)))

        toast.success("Produit mis à jour avec succès")
      } else {
        // Création d'un nouveau produit
        const response = await fetch("http://localhost:7000/produits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Réponse d'erreur:", errorData)

          // Vérifier si l'erreur concerne un code-barres existant
          if (errorData.message && errorData.message.includes("code-barres")) {
            toast.error(errorData.message, { autoClose: 5000 })
          }
          // Vérifier si l'erreur concerne un code produit existant
          else if (errorData.message && errorData.message.includes("code produit existe déjà")) {
            toast.error(`Le code produit "${productData.CodProduit}" existe déjà.`)
          } else {
            toast.error(`Erreur lors de la création du produit : ${errorData.message}`)
          }
          return
        }

        const newProduct = await response.json()
            toast.success(`Produit "${newProduct.DesProduit}" créé avec succès`, {
              autoClose: 3000,
             });
        // Ajout local
        setProduits([...produits, newProduct])
        setNewlyAddedProducts((prev) => {

          return Array.isArray(prev) ? [...prev, newProduct] : [newProduct];
        });
      }

      // Réinitialiser le formulaire
      resetForm()

      // Rafraîchir les statistiques
      fetchStats()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error(`Erreur: ${error.message}`)
    }
  }

  const generateBarcode = async () => {
    try {
      if (!selectedProduct || !selectedProduct.ID) {
        toast.error("Veuillez d'abord enregistrer le produit pour générer un code-barres")
        return
      }

      // Vérification que le code-barres n'est pas vide
      const cleanedBarcode = generatedBarcode ? generatedBarcode.trim() : ""

      const barcodeToAdd =
        cleanedBarcode ||
        Math.floor(Math.random() * 10000000000000)
          .toString()
          .padStart(13, "0")

      const response = await fetch(`http://localhost:7000/produits/${selectedProduct.ID}/barcodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codBarre: barcodeToAdd,
          typeBarre: barcodeType,
          isPrincipal: isPrincipalBarcode,
        }),
      })

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorData = await response.json()

        // Vérifier si l'erreur concerne un code-barres existant
        if (errorData.message && errorData.message.includes("code-barres")) {
          toast.error(errorData.message, { autoClose: 7000 })
        } else {
          throw new Error(errorData.message || "Erreur lors de la génération du code-barres")
        }
        return
      }

      // eslint-disable-next-line no-unused-vars
      const data = await response.json()
      toast.success("Code-barres généré avec succès")

      // Rafraîchir les détails du produit pour afficher le nouveau code-barres
      fetchProductDetails(selectedProduct.ID)

      // Réinitialiser le formulaire de code-barres
      setGeneratedBarcode("")
    } catch (error) {
      console.error("Erreur lors de la génération du code-barres:", error)
      toast.error(`Erreur lors de la génération du code-barres: ${error.message}`)
    }
  }

  // Fonction pour supprimer un produit
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:7000/produits/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Réponse d'erreur:", errorData)
        throw new Error("Erreur lors de la suppression du produit")
      }

      // Suppression locale
      setProduits(produits.filter((item) => item.ID !== id))
      setShowDeleteConfirm(false)
      setProductToDelete(null)

      toast.success("Produit supprimé avec succès")

      // Rafraîchir les statistiques
      fetchStats()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error(`Erreur lors de la suppression: ${error.message}`)
    }
  }

  // Fonction pour confirmer la suppression
  const confirmDelete = (produit) => {
    setProductToDelete(produit)
    setShowDeleteConfirm(true)
  }

  // Fonction pour éditer un produit
  const handleEdit = (produit) => {
    setSelectedProduct(produit)
    setFormData({
      CodProduit: produit.CodProduit || "",
      DesProduit: produit.DesProduit || "",
      Reference: produit.Reference || "",
      Description: produit.Description || "",
      Prix: produit.Prix ? produit.Prix.toString() : "",
      CodFam: produit.CodFam || "",
      CodSFam: produit.CodSFam || "",
      Image: produit.Image || "",
      QuantiteStock: produit.QuantiteStock ? produit.QuantiteStock.toString() : "",
      StockMinimum: produit.StockMinimum ? produit.StockMinimum.toString() : "",
      Emplacement: produit.Emplacement || "",
      Collection: produit.Collection || "",
      CodCasier: produit.CodCasier || "",
      EnPromotion: produit.EnPromotion || false,
      PourcentagePromotion: produit.PourcentagePromotion ? produit.PourcentagePromotion.toString() : "",
    })
    setEditMode(true)
    setShowForm(true)

    // Initialiser l'état du code-barres
    setNeedsBarcode(produit.CodeBarres && produit.CodeBarres.length > 0)
    setGeneratedBarcode("")
    setBarcodeType("EAN13")
    setIsPrincipalBarcode(true)

    // Faire défiler jusqu'au formulaire
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Fonction pour mettre à jour le stock
  const handleUpdateStock = async () => {
    try {
      if (!stockData.id) {
        throw new Error("ID du produit non fourni")
      }

      const response = await fetch(`http://localhost:7000/produits/${stockData.id}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantiteStock: Number.parseInt(stockData.quantiteStock, 10) }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Réponse d'erreur:", errorData)
        throw new Error("Erreur lors de la mise à jour du stock")
      }

      // eslint-disable-next-line no-unused-vars
      const updatedData = await response.json()

      // Mise à jour locale
      setProduits(
        produits.map((item) => (item.ID === stockData.id ? { ...item, QuantiteStock: stockData.quantiteStock } : item)),
      )

      setShowStockModal(false)
      toast.success("Stock mis à jour avec succès")

      // Rafraîchir les statistiques
      fetchStats()
    } catch (error) {
      console.error("Erreur lors de la mise à jour du stock:", error)
      toast.error(`Erreur lors de la mise à jour du stock: ${error.message}`)
    }
  }

  // Fonction pour ouvrir le modal de mise à jour du stock
  const openStockModal = (produit) => {
    setStockData({
      id: produit.ID,
      quantiteStock: produit.QuantiteStock || 0,
      produitNom: produit.DesProduit,
    })
    setShowStockModal(true)
  }

  // Fonction pour ouvrir le modal de distribution
  const openDistributeModal = (produit) => {
    setDistributeData({
      id: produit.ID,
      productName: produit.DesProduit,
      quantityToDistribute: produit.QuantiteStock - produit.StockMinimum || 0,
      pointsOfSale: pointsDeVente.map((pos) => ({ id: pos.id, name: pos.nom, quantity: 0 })),
      totalDistributed: 0,
    })
    console.log("Produit à distribuer:", distributeData)
    setShowDistributeModal(true)
  }

  // Fonction pour mettre à jour la quantité à distribuer
  // eslint-disable-next-line no-unused-vars
  const handleDistributeQuantityChange = (value) => {
    const newValue = Number.parseInt(value, 10)
    if (isNaN(newValue) || newValue < 1) return

    // Trouver le produit pour vérifier le stock disponible
    const produit = produits.find((p) => p.ID === distributeData.id)
    if (!produit) return

    // Limiter à 10 unités et s'assurer qu'il reste au moins 1 unité en stock
    const maxAllowed = Math.min(10, produit.QuantiteStock - 1)
    const validValue = Math.min(newValue, maxAllowed)

    setDistributeData({
      ...distributeData,
      quantityToDistribute:  validValue,
      pointsOfSale: distributeData.pointsOfSale.map((pos) => ({ ...pos, quantity: 0 })),
      totalDistributed: 0,
    })
  }

  // Fonction pour mettre à jour la quantité par point de vente
  const handlePointOfSaleQuantityChange = (id, value) => {
    const newValue = Number.parseInt(value, 10)
    if (isNaN(newValue) || newValue < 0) return

    // Calculer le total déjà distribué aux autres points de vente
    const otherPointsTotal = distributeData.pointsOfSale
      .filter((pos) => pos.id !== id)
      .reduce((sum, pos) => sum + pos.quantity, 0)

    // Limiter la quantité pour ne pas dépasser le total à distribuer
    const maxForThisPoint = distributeData.quantityToDistribute - otherPointsTotal
    const validValue = Math.min(newValue, maxForThisPoint)

    // Mettre à jour la quantité pour le point de vente sélectionné
    const updatedPointsOfSale = distributeData.pointsOfSale.map((pos) =>
      pos.id === id ? { ...pos, quantity: validValue } : pos,
    )

    const newTotalDistributed = updatedPointsOfSale.reduce((sum, pos) => sum + pos.quantity, 0)

    setDistributeData({
      ...distributeData,
      pointsOfSale: updatedPointsOfSale,
      totalDistributed: newTotalDistributed,
    })
  }

// Fonction pour effectuer la distribution
const handleDistribute = async () => {
  try {
    if (!distributeData.id) {
      throw new Error("ID du produit non fourni");
    }

    // Vérifier que la quantité totale distribuée n'est pas supérieure à la quantité à distribuer
    if (distributeData.totalDistributed > distributeData.quantityToDistribute) {
      toast.error("La quantité totale distribuée est supérieure à la quantité à distribuer");
      return;
    }

    // Trouver le produit pour obtenir la quantité actuelle
    const produit = produits.find((p) => p.ID === distributeData.id);
    if (!produit) {
      throw new Error("Produit non trouvé");
    }

    // Filtrer les points de vente qui ont une quantité supérieure à 0
    const filteredPointsOfSale = distributeData.pointsOfSale.filter(
      (point) => point.quantity > 0
    );

    // Vérifier s'il reste des points de vente après le filtrage
    if (filteredPointsOfSale.length === 0) {
      toast.error("Aucun point de vente sélectionné avec une quantité valide");
      return;
    }

    // Calculer la nouvelle quantité en stock
    const newQuantity = produit.QuantiteStock - distributeData.totalDistributed;

    // Mettre à jour le stock dans la base de données
    const response = await axios.put(
      `http://localhost:7000/produits/${distributeData.id}/distribuer-produit`,
      {
        quantiteStock: newQuantity,
        distributeData: filteredPointsOfSale,
      }
    );

    // Avec axios, une réponse réussie a un statut 200 et les données sont dans response.data
    if (response.status === 200) {
      setShowDistributeModal(false);
      toast.success(response.data.message || "Produit distribué avec succès");
      fetchData();
      fetchStats();
    } else {
      throw new Error(response.data.message || "Erreur lors de la mise à jour du stock");
    }
  } catch (error) {
    // Gérer les erreurs axios
    let errorMessage = error.message;
    if (error.response) {
      // Erreur HTTP (par exemple, 400, 404, 500)
      errorMessage = error.response.data.message || error.message;
      console.error("Réponse d'erreur du serveur:", error.response.data);
    } else {
      console.error("Erreur lors de la distribution:", error);
    }
    toast.error(`Erreur lors de la distribution: ${errorMessage}`);
  }
};
  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      CodProduit: "",
      DesProduit: "",
      Reference: "",
      Description: "",
      Prix: "",
      CodFam: "",
      CodSFam: "",
      Image: "",
      QuantiteStock: "",
      StockMinimum: "",
      Emplacement: "",
      Collection: "",
      CodCasier: "",
      EnPromotion: false,
      PourcentagePromotion: "",
    })
    setEditMode(false)
    setShowForm(false)
    setSelectedProduct(null)
    setNeedsBarcode(false)
    setGeneratedBarcode("")
    setBarcodeType("EAN13")
    setIsPrincipalBarcode(true)
  }

  // Fonction pour gérer le tri
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc"
    setSortDirection(isAsc ? "desc" : "asc")
    setSortField(field)
  }

  // Fonction pour obtenir le nom de la famille
  const getFamilleNom = (codFam) => {
    const famille = familles.find((f) => f.CodFam === codFam)
    return famille ? famille.DesFam : codFam
  }

  // Fonction pour obtenir le nom de la sous-famille
  // Modifier la fonction getSousFamilleNom pour mieux gérer les sous-familles
  // const getSousFamilleNom = (codSFam) => {
  //   const sousFamille = sousFamilles.find((sf) => sf.CodSFam === codSFam)
  //   return sousFamille ? sousFamille.DesSFam : codSFam
  // }

  const getCasierNom = (codCasier) => {
    const casier = casiers.find((c) => c.CodCasier === codCasier)
    return casier ? `${casier.CodCasier} - ${casier.DesCasier}` : codCasier
  }

  // Fonction pour gérer le changement d'image
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Nous allons simplement stocker le nom du fichier
      setFormData({ ...formData, Image: file.name })
    }
  }

  // Fonction pour obtenir la couleur en fonction du niveau de stock
  const getStockColor = (quantite, minimum) => {
    if (quantite === 0) return "text-red-600 bg-red-100"
    if (quantite <= minimum) return "text-orange-600 bg-orange-100"
    return "text-green-600 bg-green-100"
  }

  // Animations avec Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  }

  const formVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  }

  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  }

  const filterVariants = {
    hidden: { height: 0, opacity: 0, overflow: "hidden" },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      height: 0,
      opacity: 0,
      overflow: "hidden",
      transition: { duration: 0.3 },
    },
  }

  const statsVariants = {
    hidden: { height: 0, opacity: 0, overflow: "hidden" },
    visible: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      height: 0,
      opacity: 0,
      overflow: "hidden",
      transition: { duration: 0.3 },
    },
  }

  const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  }

  // Fonction pour paginer les produits
  const sortedProduits = [...filteredProduits].sort((a, b) => {
    const aValue = a[sortField] || ""
    const bValue = b[sortField] || ""

    if (typeof aValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue
  })

  // Fonction pour paginer les produits
  const paginatedProduits = sortedProduits.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Fonction pour déboguer les chemins d'images
  // eslint-disable-next-line no-unused-vars
  const debugImagePath = (imagePath) => {
    if (!imagePath) {
      console.log("Image path is null or empty")
      return "/placeholder.svg"
    }

    const processedPath = getImageUrl(imagePath)
    console.log(`Processing image: "${imagePath}" → "${processedPath}"`)

    return processedPath
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <ToastContainer position="top-right" autoClose={3000} />
      <Tooltip id="tooltip" />

      {/* Animation de succès */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            variants={successVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="bg-green-500 text-white rounded-full p-8 shadow-lg">
              <FaCheckCircle size={60} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* En-tête avec titre et actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <motion.h1
          className="text-3xl font-bold text-blue-600 mb-4 md:mb-0 flex items-center"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaBoxOpen className="mr-3" /> Gestion des Produits
        </motion.h1>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <motion.div
            className="relative flex-grow md:flex-grow-0"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <input
              type="text"
              placeholder="Rechercher par code, nom, référence ou code-barres..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              ref={searchInputRef}
              data-tooltip-id="tooltip"
              data-tooltip-content="Rechercher par code, nom, référence ou code-barres"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </motion.div>

          <motion.button
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-tooltip-id="tooltip"
            data-tooltip-content="Ajouter un nouveau produit"
          >
            <FaPlus /> Ajouter
          </motion.button>

          <motion.button
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 bg-purple-600 hover:bg-purple-700"
            onClick={() => setShowFilters(!showFilters)}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-tooltip-id="tooltip"
            data-tooltip-content="Afficher/masquer les filtres"
          >
            <FaFilter /> Filtres
          </motion.button>

          <motion.button
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 bg-green-600 hover:bg-green-700"
            onClick={() => setShowStats(!showStats)}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-tooltip-id="tooltip"
            data-tooltip-content="Afficher/masquer les statistiques"
          >
            <FaChartBar /> Stats
          </motion.button>

          <motion.button
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
              isRefreshing ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
            }`}
            onClick={refreshData}
            disabled={isRefreshing}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={!isRefreshing ? { scale: 1.05 } : {}}
            whileTap={!isRefreshing ? { scale: 0.95 } : {}}
            data-tooltip-id="tooltip"
            data-tooltip-content="Rafraîchir les données"
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </div>

      {/* Conseil aléatoire */}
      <motion.div
        className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="flex items-start">
          <FaLightbulb className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Conseil</p>
            <p className="text-sm text-blue-700">{randomTip}</p>
          </div>
        </div>
      </motion.div>

      {/* Statistiques */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            className="mb-6 bg-white p-6 rounded-lg shadow-md"
            variants={statsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
              <FaChartBar className="mr-2" /> Statistiques
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                className="bg-blue-50 p-4 rounded-lg border border-blue-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Produits en stock</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.produitsEnStock}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaBoxOpen className="text-blue-500 text-xl" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-red-50 p-4 rounded-lg border border-red-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Produits en rupture</p>
                    <p className="text-2xl font-bold text-red-800">{stats.produitsEnRupture}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <FaExclamationTriangle className="text-red-500 text-xl" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-green-50 p-4 rounded-lg border border-green-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Ventes totales</p>
                    <p className="text-2xl font-bold text-green-800">{stats.ventes}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaShoppingCart className="text-green-500 text-xl" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-purple-50 p-4 rounded-lg border border-purple-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Produits scannés</p>
                    <p className="text-2xl font-bold text-purple-800">{stats.produitsScannés}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FaBarcode className="text-purple-500 text-xl" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="mb-6 bg-white p-6 rounded-lg shadow-md overflow-hidden"
            variants={filterVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
              <FaFilter className="mr-2" /> Filtres avancés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Famille</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterFamille}
                  onChange={(e) => {
                    setFilterFamille(e.target.value)
                    setFilterSousFamille("")
                    if (e.target.value) {
                      fetchSousFamilles(e.target.value)
                    }
                  }}
                >
                  <option value="">Toutes les familles</option>
                  {familles.map((famille) => (
                    <option key={famille.CodFam} value={famille.CodFam}>
                      {famille.DesFam}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sous-Famille</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterSousFamille}
                  onChange={(e) => setFilterSousFamille(e.target.value)}
                  disabled={!filterFamille}
                >
                  <option value="">Toutes les sous-familles</option>
                  {sousFamilles.map((sousFamille) => (
                    <option key={sousFamille.CodSFam} value={sousFamille.CodSFam}>
                      {sousFamille.DesSFam}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Casier</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterCasier}
                  onChange={(e) => setFilterCasier(e.target.value)}
                >
                  <option value="">Tous les casiers</option>
                  {casiers.map((casier) => (
                    <option key={casier.CodCasier} value={casier.CodCasier}>
                      {`${casier.CodCasier} - ${casier.DesCasier}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value)}
                >
                  <option value="">Tous les produits</option>
                  <option value="stock">En stock</option>
                  <option value="rupture">En rupture</option>
                  <option value="promo">En promotion</option>
                  <option value="nonDistribuee">Produits non Distribuee</option>
                  <option value="with-barcode">Avec code-barres</option>
                  <option value="without-barcode">Sans code-barres</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Afficher</span>
                <select
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
                <span className="text-sm text-gray-600 ml-2">par page</span>
              </div>

              <div className="flex gap-2">
                <button
                  className={`px-3 py-2 rounded-md ${
                    viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setViewMode("grid")}
                  title="Vue en grille"
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Vue en grille"
                >
                  <FaThLarge />
                </button>
                <button
                  className={`px-3 py-2 rounded-md ${
                    viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setViewMode("list")}
                  title="Vue en liste"
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Vue en liste"
                >
                  <FaThList />
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-4"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulaire d'ajout/édition */}
      <AnimatePresence>
        {showForm &&
          (
            <motion.div
            className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
              {editMode ? (
                <>
                  <FaEdit className="mr-2" /> Modifier le produit
                </>
              ) : (
                <>
                  <FaPlus className="mr-2" /> Ajouter un nouveau produit
                </>
              )}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code Produit*</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border ${
                    editMode ? "bg-gray-100" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={formData.CodProduit}
                  onChange={(e) => setFormData({ ...formData, CodProduit: e.target.value })}
                  required
                  maxLength={20}
                  disabled={editMode}
                  placeholder="ex: PROD001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Désignation*</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.DesProduit}
                  onChange={(e) => setFormData({ ...formData, DesProduit: e.target.value })}
                  required
                  maxLength={255}
                  placeholder="ex: Café moulu arabica"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.Reference}
                  onChange={(e) => setFormData({ ...formData, Reference: e.target.value })}
                  maxLength={50}
                  placeholder="ex: REF-123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix*</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.Prix}
                  onChange={(e) => setFormData({ ...formData, Prix: e.target.value })}
                  required
                  placeholder="ex: 9.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Famille</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.CodFam}
                  onChange={(e) => setFormData({ ...formData, CodFam: e.target.value, CodSFam: "" })}
                >
                  <option value="">Sélectionner une famille</option>
                  {familles.map((famille) => (
                    <option key={famille.CodFam} value={famille.CodFam}>
                      {famille.DesFam}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sous-Famille</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.CodSFam}
                  onChange={(e) => setFormData({ ...formData, CodSFam: e.target.value })}
                  disabled={!formData.CodFam}
                >
                  <option value="">Sélectionner une sous-famille</option>
                  {sousFamilles.map((sousFamille) => (
                    <option key={sousFamille.CodSFam} value={sousFamille.CodSFam}>
                      {sousFamille.DesSFam}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Casier</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.CodCasier}
                  onChange={(e) => setFormData({ ...formData, CodCasier: e.target.value })}
                >
                  <option value="">Sélectionner un casier</option>
                  {casiers.map((casier) => (
                    <option key={casier.CodCasier} value={casier.CodCasier}>
                      {casier.DesCasier}
                    </option>
                  ))}
                </select>
              </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emplacement
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.Emplacement}
                        onChange={(e) => setFormData({ ...formData, Emplacement: e.target.value })}
                        maxLength={50}
                        placeholder="ex: Rayon 3, Étagère 2"
                      />
                    </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en Stock</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.QuantiteStock}
                  onChange={(e) => setFormData({ ...formData, QuantiteStock: e.target.value })}
                  placeholder="ex: 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Minimum</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.StockMinimum}
                  onChange={(e) => setFormData({ ...formData, StockMinimum: e.target.value })}
                  placeholder="ex: 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.Collection}
                  onChange={(e) => setFormData({ ...formData, Collection: e.target.value })}
                >
                  <option value="">Sélectionner une collection</option>
                  {collections.map((collection) => (
                    <option key={collection.Collection} value={collection.Collection}>
                      {collection.Collection}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.Image}
                    onChange={(e) => setFormData({ ...formData, Image: e.target.value })}
                    placeholder="ex: ALI008.jpg"
                  />
                  <button
                    type="button"
                    className="bg-gray-200 px-3 py-2 rounded-r-md hover:bg-gray-300"
                    onClick={() => fileInputRef.current.click()}
                    data-tooltip-id="tooltip"
                    data-tooltip-content="Sélectionner une image"
                  >
                    <FaImage />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enPromotion"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.EnPromotion}
                  onChange={(e) => setFormData({ ...formData, EnPromotion: e.target.checked })}
                />
                <label htmlFor="enPromotion" className="ml-2 block text-sm text-gray-900">
                  En promotion
                </label>
              </div>

              {formData.EnPromotion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage de réduction</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.PourcentagePromotion}
                    onChange={(e) => setFormData({ ...formData, PourcentagePromotion: e.target.value })}
                    placeholder="ex: 15"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.Description}
                  onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                  rows={4}
                  placeholder="Description détaillée du produit..."
                ></textarea>
              </div>

              {/* Section de génération de code-barres */}
              <div className="md:col-span-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FaBarcode className="mr-2 text-blue-600" /> Gestion des codes-barres
                </h3>

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="needsBarcode"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={needsBarcode}
                    onChange={(e) => setNeedsBarcode(e.target.checked)}
                  />
                  <label htmlFor="needsBarcode" className="ml-2 block text-sm text-gray-900">
                    Ce produit nécessite un code-barres
                  </label>
                </div>

                {needsBarcode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={generatedBarcode}
                        onChange={(e) => setGeneratedBarcode(e.target.value)}
                        placeholder="Laisser vide pour générer automatiquement"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type de code-barres</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={barcodeType}
                        onChange={(e) => setBarcodeType(e.target.value)}
                      >
                        <option value="EAN13">EAN-13</option>
                        <option value="EAN8">EAN-8</option>
                        <option value="UPC">UPC</option>
                        <option value="CODE128">CODE 128</option>
                        <option value="CODE39">CODE 39</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPrincipalBarcode"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={isPrincipalBarcode}
                        onChange={(e) => setIsPrincipalBarcode(e.target.checked)}
                      />
                      <label htmlFor="isPrincipalBarcode" className="ml-2 block text-sm text-gray-900">
                        Définir comme code-barres principal
                      </label>
                    </div>

                    {editMode && selectedProduct ? (
                      <div className="flex items-end">
                        <motion.button
                          type="button"
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
                          onClick={generateBarcode}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaBarcode /> Générer un code-barres
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <p className="text-sm text-gray-600 italic">
                          Le code-barres sera généré après la création du produit
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.Image && (
                <div className="md:col-span-2 flex justify-center">
                  <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                    <img
                      src={getImageUrl(formData.Image) || "/placeholder.svg"}
                      alt="Aperçu du produit"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg?key=l71cf"
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
                  onClick={resetForm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTimes /> Annuler
                </motion.button>

                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaSave /> {editMode ? "Mettre à jour" : "Enregistrer"}
                </motion.button>
              </div>
            </form>
          </motion.div>
          )}
      </AnimatePresence>

      {/* Affichage des produits */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredProduits.length === 0 ? (
        <motion.div
          className="p-8 text-center text-gray-500 bg-white rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaInfoCircle className="mx-auto text-4xl text-blue-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
          <p>
            {searchTerm || filterFamille || filterSousFamille || filterCasier || filterStock
              ? "Aucun produit ne correspond à votre recherche"
              : "Aucun produit disponible"}
          </p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            onClick={() => {
              setSearchTerm("")
              setFilterFamille("")
              setFilterSousFamille("")
              setFilterCasier("")
              setFilterStock("")
            }}
          >
            <FaSync /> Réinitialiser les filtres
          </button>
        </motion.div>
      ) : viewMode === "grid" ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {paginatedProduits.map((produit) => (
            <motion.div
              key={produit.ID}
              variants={itemVariants}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300"
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="relative h-48 bg-gray-100">
                {produit.Image ? (
                  <img
                    src={getImageUrl(produit.Image) || "/placeholder.svg"}
                    alt={produit.DesProduit}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?key=bwak7"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <FaBoxOpen className="text-gray-400" size={48} />
                  </div>
                )}
                {produit.EnPromotion && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                    Promo
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{produit.DesProduit}</h3>
                <p className="text-sm text-gray-500 mb-2 truncate">
                  {produit.CodeBarres && produit.CodeBarres.length > 0
                    ? `Code à barre: ${produit.CodeBarres[0].CodBarre}`
                    : produit.Reference
                      ? `Réf: ${produit.Reference}`
                      : "Réf: N/A"}
                </p>

                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-blue-600">
                      {produit.EnPromotion
                        ? `${calculerPrixPromo(produit).toFixed(3)} DT`
                        : `${produit.Prix?.toFixed(3) || "0.000"} DT`}
                    </span>
                    {produit.EnPromotion && (
                      <div className="flex items-center">
                        <span className="text-sm line-through text-gray-400">
                          {produit.Prix?.toFixed(3) || "0.000"} DT
                        </span>
                        <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                          -{produit.promotionDetails?.remise || produit.PourcentagePromotion}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStockColor(
                      produit.QuantiteStock,
                      produit.StockMinimum,
                    )}`}
                  >
                    Stock: {produit.QuantiteStock || 0}
                  </div>
                </div>
                {produit.EnPromotion && produit.promotionDetails && (
                  <div className="text-xs text-gray-600 mb-3">
                    {produit.promotionDetails.isActive ? (
                      <span className="flex items-center text-green-600">
                        <FaTag className="mr-1" size={10} />
                        Promo valide du {formatDate(produit.promotionDetails.dateDebut)} au{" "}
                        {formatDate(produit.promotionDetails.dateFin)}
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600">
                        <FaExclamationTriangle className="mr-1" size={10} />
                        Promotion expirée
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mb-3">
                  {produit.CodFam && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {getFamilleNom(produit.CodFam)}
                    </span>
                  )}
                  {produit.CodSFam && (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      {getSousFamilleNom(produit.CodFam, produit.CodSFam)}
                    </span>
                  )}
                  {produit.CodCasier && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {getCasierNom(produit.CodCasier)}
                    </span>
                  )}
                </div>

                <div className="flex justify-between gap-2 mt-3">
                  <div className="flex gap-1">
                    <button
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
                      onClick={() => fetchProductDetails(produit.ID)}
                      title="Détails"
                      data-tooltip-id="tooltip"
                      data-tooltip-content="Voir les détails"
                    >
                      <FaEye size={16} />
                    </button>
                    <button
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors"
                      onClick={() => openStockModal(produit)}
                      title="Mettre à jour le stock"
                      data-tooltip-id="tooltip"
                      data-tooltip-content="Mettre à jour le stock"
                    >
                      <FaShoppingCart size={16} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    { produit.QuantiteDistribuee == 0 && produit.QuantiteStock > 1 && (
                        <button key={produit.ID}
                          className="text-orange-600 hover:text-orange-900 transition-colors"
                          onClick={() => openDistributeModal(produit)}
                          title="Distribuer maintenant"
                          data-tooltip-id="tooltip"
                          data-tooltip-content="Distribuer maintenant"
                        >
                          <FaStore size={18} />
                        </button>
                      )
                    }
                    <button
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
                      onClick={() => handleEdit(produit)}
                      title="Modifier"
                      data-tooltip-id="tooltip"
                      data-tooltip-content="Modifier le produit"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                      onClick={() => confirmDelete(produit)}
                      title="Supprimer"
                      data-tooltip-id="tooltip"
                      data-tooltip-content="Supprimer le produit"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="bg-white rounded-lg shadow-md overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("CodProduit")}
                  >
                    <div className="flex items-center">
                      Code
                      {sortField === "CodProduit" ? (
                        sortDirection === "asc" ? (
                          <FaSortUp className="ml-1" />
                        ) : (
                          <FaSortDown className="ml-1" />
                        )
                      ) : (
                        <FaSort className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("DesProduit")}
                  >
                    <div className="flex items-center">
                      Désignation
                      {sortField === "DesProduit" ? (
                        sortDirection === "asc" ? (
                          <FaSortUp className="ml-1" />
                        ) : (
                          <FaSortDown className="ml-1" />
                        )
                      ) : (
                        <FaSort className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("Prix")}
                  >
                    <div className="flex items-center">
                      Prix
                      {sortField === "Prix" ? (
                        sortDirection === "asc" ? (
                          <FaSortUp className="ml-1" />
                        ) : (
                          <FaSortDown className="ml-1" />
                        )
                      ) : (
                        <FaSort className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("QuantiteStock")}
                  >
                    <div className="flex items-center">
                      Stock
                      {sortField === "QuantiteStock" ? (
                        sortDirection === "asc" ? (
                          <FaSortUp className="ml-1" />
                        ) : (
                          <FaSortDown className="ml-1" />
                        )
                      ) : (
                        <FaSort className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Catégories
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProduits.map((produit) => (
                  <motion.tr key={produit.ID} variants={itemVariants} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{produit.CodProduit}</div>
                      <div className="text-xs text-gray-500">
                        {produit.CodeBarres && produit.CodeBarres.length > 0
                          ? `Code à barre: ${produit.CodeBarres[0].CodBarre}`
                          : produit.Reference
                            ? `Réf: ${produit.Reference}`
                            : "Réf: N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md overflow-hidden">
                          {produit.Image ? (
                            <img
                              src={getImageUrl(produit.Image) || "/placeholder.svg"}
                              alt={produit.DesProduit}
                              className="h-10 w-10 object-cover"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = "/placeholder.svg?key=fhxwx"
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center bg-gray-200">
                              <FaBoxOpen className="text-gray-400" size={20} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{produit.DesProduit}</div>
                          {produit.EnPromotion && (
                            <div className="text-xs text-red-600 font-semibold">En promotion</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {produit.EnPromotion
                          ? `${calculerPrixPromo(produit).toFixed(3)} DT`
                          : `${produit.Prix?.toFixed(3) || "0.000"} DT`}
                      </div>
                      {produit.EnPromotion && (
                        <>
                          <div className="text-xs text-gray-500 line-through">
                            {produit.Prix?.toFixed(3) || "0.000"} DT
                          </div>
                          {produit.promotionDetails && (
                            <div className="text-xs mt-1">
                              {produit.promotionDetails.isActive ? (
                                <span className="flex items-center text-green-600">
                                  <FaTag className="mr-1" size={10} />
                                  {formatDate(produit.promotionDetails.dateDebut)} -{" "}
                                  {formatDate(produit.promotionDetails.dateFin)}
                                  <span className="ml-1 bg-red-100 text-red-800 px-1 py-0.5 rounded-full text-xs">
                                    -{produit.promotionDetails.pourcentage || produit.PourcentagePromotion}%
                                  </span>
                                </span>
                              ) : (
                                <span className="flex items-center text-orange-600">
                                  <FaExclamationTriangle className="mr-1" size={10} />
                                  Expirée
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockColor(
                          produit.QuantiteStock,
                          produit.StockMinimum,
                        )}`}
                      >
                        {produit.QuantiteStock || 0}
                      </div>
                      {produit.StockMinimum && (
                        <div className="text-xs text-gray-500 mt-1">Min: {produit.StockMinimum}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {produit.CodFam && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {getFamilleNom(produit.CodFam)}
                          </span>
                        )}
                        {produit.CodSFam && (
                          <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                            {getSousFamilleNom(produit.CodFam, produit.CodSFam)}
                          </span>
                        )}
                        {produit.CodCasier && (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {getCasierNom(produit.CodCasier)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          onClick={() => fetchProductDetails(produit.ID)}
                          title="Détails"
                          data-tooltip-id="tooltip"
                          data-tooltip-content="Voir les détails"
                        >
                          <FaEye size={18} />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900 transition-colors"
                          onClick={() => openStockModal(produit)}
                          title="Mettre à jour le stock"
                          data-tooltip-id="tooltip"
                          data-tooltip-content="Mettre à jour le stock"
                        >
                          <FaShoppingCart size={18} />
                        </button>
                          { produit.QuantiteDistribuee == 0 && produit.QuantiteStock > 1 && (
                              <button key={produit.ID}
                                className="text-orange-600 hover:text-orange-900 transition-colors"
                                onClick={() => openDistributeModal(produit)}
                                title="Distribuer maintenant"
                                data-tooltip-id="tooltip"
                                data-tooltip-content="Distribuer maintenant"
                              >
                                <FaStore size={18} />
                              </button>
                            )
                          }
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          onClick={() => handleEdit(produit)}
                          title="Modifier"
                          data-tooltip-id="tooltip"
                          data-tooltip-content="Modifier le produit"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 transition-colors"
                          onClick={() => confirmDelete(produit)}
                          title="Supprimer"
                          data-tooltip-id="tooltip"
                          data-tooltip-content="Supprimer le produit"
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Pagination */}
      {filteredProduits.length > 0 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className={`px-3 py-1 rounded-l-md ${
                page === 1 ? "bg-gray-200 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              &laquo;
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={`px-3 py-1 ${
                page === 1 ? "bg-gray-200 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              &lsaquo;
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculer les pages à afficher
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 ${
                    page === pageNum ? "bg-blue-700 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className={`px-3 py-1 ${
                page === totalPages ? "bg-gray-200 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-r-md ${
                page === totalPages ? "bg-gray-200 text-gray-500" : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              &raquo;
            </button>
          </nav>
        </div>
      )}

      {/* Modal de détails du produit */}
      <AnimatePresence>
        {showDetailModal && detailProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaEye className="mr-2" /> Détails du produit
                </h2>
                <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowDetailModal(false)}>
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {detailProduct.Image ? (
                      <img
                        src={getImageUrl(detailProduct.Image) || "/placeholder.svg"}
                        alt={detailProduct.DesProduit}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg?key=l71cf"
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <FaBoxOpen className="text-gray-400" size={64} />
                      </div>
                    )}
                    {detailProduct.EnPromotion && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        Promo {detailProduct.PourcentagePromotion}%
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <FaInfoCircle className="mr-2" /> Informations générales
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-gray-600">Code:</div>
                      <div className="text-sm font-medium">{detailProduct.CodProduit}</div>

                      <div className="text-sm text-gray-600">Référence:</div>
                      <div className="text-sm font-medium">
                        {detailProduct.CodeBarres && detailProduct.CodeBarres.length > 0
                          ? `Code à barre: ${detailProduct.CodeBarres[0].CodBarre}`
                          : detailProduct.Reference || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">Prix:</div>
                      <div className="text-sm font-medium">
                        {detailProduct.EnPromotion ? (
                          <span>
                            <span className="text-red-600">{calculerPrixPromo(detailProduct).toFixed(3)} DT</span>
                            <span className="ml-2 line-through text-gray-400">
                              {detailProduct.Prix?.toFixed(3) || "0.000"} DT
                            </span>
                          </span>
                        ) : (
                          <span>{detailProduct.Prix?.toFixed(3) || "0.000"} DT</span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">Date de mise à jour:</div>
                      <div className="text-sm font-medium">
                        {detailProduct.DateDerniereMAJ
                          ? new Date(detailProduct.DateDerniereMAJ).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <FaTag className="mr-2" /> Catégorisation
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-gray-600">Famille:</div>
                      <div className="text-sm font-medium">
                        {detailProduct.Famille ? detailProduct.Famille.DesFam : "N/A"}
                      </div>

                      <div className="text-sm text-gray-600">Sous-Famille:</div>
                      <div className="text-sm font-medium">
                        {detailProduct.SousFamille ? detailProduct.SousFamille.DesSFam : "N/A"}
                      </div>

                      <div className="text-sm text-gray-600">Casier:</div>
                      <div className="text-sm font-medium">
                        {detailProduct.Casier ? detailProduct.Casier.DesCasier : "N/A"}
                      </div>

                      <div className="text-sm text-gray-600">Collection:</div>
                      <div className="text-sm font-medium">{detailProduct.Collection || "N/A"}</div>

                      <div className="text-sm text-gray-600">Emplacement:</div>
                      <div className="text-sm font-medium">{detailProduct.Emplacement || "N/A"}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <FaWarehouse className="mr-2" /> Stock
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-gray-600">Quantité en stock:</div>
                      <div className="text-sm font-medium">
                        <span
                          className={`px-2 py-0.5 rounded-full ${getStockColor(
                            detailProduct.QuantiteStock,
                            detailProduct.StockMinimum,
                          )}`}
                        >
                          {detailProduct.QuantiteStock || 0}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">Stock minimum:</div>
                      <div className="text-sm font-medium">{detailProduct.StockMinimum || "N/A"}</div>

                      <div className="text-sm text-gray-600">Quantité Distribuee :</div>
                      <div className="text-sm font-medium">{detailProduct.QuantiteDistribuee || 0}</div>

                      <div className="text-sm text-gray-600">État:</div>
                      <div className="text-sm font-medium">
                        {detailProduct.QuantiteStock === 0 ? (
                          <span className="text-red-600">Rupture de stock</span>
                        ) : detailProduct.QuantiteStock <= detailProduct.StockMinimum ? (
                          <span className="text-orange-600">Stock faible</span>
                        ) : (
                          <span className="text-green-600">En stock</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {detailProduct.CodeBarres && detailProduct.CodeBarres.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <FaBarcode className="mr-2" /> Codes-barres
                      </h3>
                      <ul className="space-y-2">
                        {detailProduct.CodeBarres.map((codeBarre) => (
                          <li key={codeBarre.ID} className="flex items-center gap-2">
                            <FaBarcode className="text-gray-600" />
                            <span className="text-sm">{codeBarre.CodBarre}</span>
                            {codeBarre.IsPrincipal && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Principal
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {detailProduct.Description && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <FaClipboardList className="mr-2" /> Description
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{detailProduct.Description}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
                  onClick={() => setShowDetailModal(false)}
                >
                  <FaTimes /> Fermer
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  onClick={() => {
                    setShowDetailModal(false)
                    handleEdit(detailProduct)
                  }}
                >
                  <FaEdit /> Modifier
                </button>
                {detailProduct.EnPromotion && detailProduct.promotionDetails && (
                  <div className="mt-6 bg-red-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <FaTag className="mr-2 text-red-600" /> Détails de la promotion
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-gray-600">Prix original:</div>
                      <div className="text-sm font-medium line-through">
                        {detailProduct.Prix?.toFixed(3) || "0.000"} DT
                      </div>

                      <div className="text-sm text-gray-600">Prix promotionnel:</div>
                      <div className="text-sm font-bold text-red-600">
                        {(
                          detailProduct.promotionDetails.prixPromotion ||
                          detailProduct.PrixPromotion ||
                          detailProduct.Prix
                        ).toFixed(3)}{" "}
                        DT
                      </div>

                      <div className="text-sm text-gray-600">Pourcentage de remise:</div>
                      <div className="text-sm font-medium">
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          -{detailProduct.promotionDetails.pourcentage || detailProduct.PourcentagePromotion || 0}%
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">Période de validité:</div>
                      <div className="text-sm font-medium">
                        Du {formatDate(detailProduct.promotionDetails.dateDebut)} au{" "}
                        {formatDate(detailProduct.promotionDetails.dateFin)}
                      </div>

                      <div className="text-sm text-gray-600">Statut:</div>
                      <div className="text-sm font-medium">
                        {detailProduct.promotionDetails.isActive ? (
                          <span className="text-green-600 flex items-center">
                            <FaCheckCircle className="mr-1" size={12} /> Active
                          </span>
                        ) : (
                          <span className="text-orange-600 flex items-center">
                            <FaExclamationTriangle className="mr-1" size={12} /> Expirée
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de mise à jour du stock */}
      <AnimatePresence>
        {showStockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
                <FaShoppingCart className="mr-2" /> Mise à jour du stock
              </h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Vous êtes en train de mettre à jour le stock du produit <strong>{stockData.produitNom}</strong>.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en stock</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={stockData.quantiteStock}
                    onChange={(e) => setStockData({ ...stockData, quantiteStock: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
                  onClick={() => setShowStockModal(false)}
                >
                  <FaTimes /> Annuler
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  onClick={handleUpdateStock}
                >
                  <FaSave /> Mettre à jour
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {showDeleteConfirm && productToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
                <FaExclamationTriangle className="mr-2 text-red-500" /> Confirmation de suppression
              </h2>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Êtes-vous sûr de vouloir supprimer le produit <strong>{productToDelete.DesProduit}</strong> ?
                </p>
                <p className="text-sm text-red-600 font-medium">Cette action est irréversible.</p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setProductToDelete(null)
                  }}
                >
                  <FaTimes /> Annuler
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                  onClick={() => handleDelete(productToDelete.ID)}
                >
                  <FaTrash /> Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de distribution */}
      <AnimatePresence>
        {showDistributeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center">
                <FaStore className="mr-2 text-orange-500" /> 📦 Distribuer maintenant
              </h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Vous êtes en train de distribuer le produit <strong>{distributeData.productName}</strong>.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité à distribuer ({distributeData.quantityToDistribute})</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={distributeData.quantityToDistribute}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cette quantité sera retirée du stock central.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Répartition par point de vente</label>
                  <div className="space-y-3 bg-gray-50 p-3 rounded-md">
                    {distributeData.pointsOfSale.map((pos) => (
                      <div key={pos.id} className="flex items-center justify-between">
                        <span className="text-sm">{pos.name}</span>
                        <input
                          type="number"
                          min="0"
                          max={distributeData.quantityToDistribute}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={pos.quantity}
                          onChange={(e) => handlePointOfSaleQuantityChange(pos.id, e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium">Total distribué:</span>
                      <span
                        className={`text-sm font-bold ${distributeData.totalDistributed === distributeData.quantityToDistribute ? "text-green-600" : "text-red-600"}`}
                      >
                        {distributeData.totalDistributed} / {distributeData.quantityToDistribute}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
                  onClick={() => setShowDistributeModal(false)}
                >
                  <FaTimes /> Annuler
                </button>
                <button
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
                  onClick={handleDistribute}
                >
                  <FaStore /> Distribuer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bouton de retour en haut */}
      <motion.button
        className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        data-tooltip-id="tooltip"
        data-tooltip-content="Retour en haut"
      >
        <FaArrowUp />
      </motion.button>
    </div>
  )
}

export default Produits
