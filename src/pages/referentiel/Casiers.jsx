"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSave,
  FaTimes,
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
} from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const Casiers = () => {
  const [casiers, setCasiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [formData, setFormData] = useState({ CodCasier: "", DesCasier: "" })
  const [selectedCasier, setSelectedCasier] = useState(null)
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchCasiers()
  }, [])

  const fetchCasiers = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:7000/produits/casiers")
      if (!response.ok) throw new Error("Erreur lors de la récupération des casiers")
      const data = await response.json()
      setCasiers(data)
      setLoading(false)
    } catch (error) {
      console.error("Erreur lors du chargement des casiers:", error)
      toast.error("Erreur lors du chargement des données")
      setLoading(false)
    }
  }

  const fetchProductsByCasier = async (codCasier) => {
    try {
      const response = await fetch(`http://localhost:7000/produits/casier/${codCasier}`)
      if (!response.ok) throw new Error("Erreur lors de la récupération des produits")
      const data = await response.json()
      setProducts(data.products || [])
      setSelectedCasier(data.casier)
      setShowModal(true)
    } catch (error) {
      console.error("Erreur lors de la récupération des produits:", error)
      toast.error("Erreur lors du chargement des produits")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editMode) {
        const response = await fetch(`http://localhost:7000/produits/casiers/${formData.CodCasier}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ DesCasier: formData.DesCasier }),
        })
        if (!response.ok) throw new Error("Erreur lors de la mise à jour du casier")
        toast.success("Casier mis à jour avec succès")
      } else {
        if (casiers.some((c) => c.CodCasier === formData.CodCasier)) {
          toast.error("Ce code casier existe déjà")
          return
        }
        const response = await fetch("http://localhost:7000/produits/casiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error("Erreur lors de la création du casier")
        toast.success("Casier ajouté avec succès")
      }
      // Rafraîchir la liste des casiers depuis le serveur
      await fetchCasiers()
      resetForm()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error(`Erreur lors de l'enregistrement: ${error.message}`)
    }
  }

  const handleDelete = async (codCasier) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce casier?")) {
      try {
        const response = await fetch(`http://localhost:7000/produits/casiers/${codCasier}`, {
          method: "DELETE",
        })
        if (!response.ok) throw new Error("Erreur lors de la suppression du casier")
        setCasiers(casiers.filter((item) => item.CodCasier !== codCasier))
        toast.success("Casier supprimé avec succès")
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        toast.error(`Erreur lors de la suppression: ${error.message}`)
      }
    }
  }

  const handleEdit = (casier) => {
    setFormData({ CodCasier: casier.CodCasier, DesCasier: casier.DesCasier })
    setEditMode(true)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({ CodCasier: "", DesCasier: "" })
    setEditMode(false)
    setShowForm(false)
  }

  const getCasierColor = (code) => {
    const prefix = code.charAt(0)
    const colors = {
      A: { bg: "bg-green-100", text: "text-green-800", icon: "text-green-600" },
      B: { bg: "bg-pink-100", text: "text-pink-800", icon: "text-pink-600" },
      E: { bg: "bg-blue-100", text: "text-blue-800", icon: "text-blue-600" },
      K: { bg: "bg-orange-100", text: "text-orange-800", icon: "text-orange-600" },
      M: { bg: "bg-purple-100", text: "text-purple-800", icon: "text-purple-600" },
      S: { bg: "bg-red-100", text: "text-red-800", icon: "text-red-600" },
      T: { bg: "bg-gray-100", text: "text-gray-800", icon: "text-gray-600" },
      V: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "text-yellow-600" },
    }
    return colors[prefix] || { bg: "bg-gray-100", text: "text-gray-800", icon: "text-gray-600" }
  }

  const getCategoryName = (prefix) => {
    const categories = {
      A: "Alimentaire",
      B: "Beauté & Santé",
      E: "Électroménager",
      K: "Enfants & Bébés",
      M: "Maison & Déco",
      S: "Sport & Loisirs",
      T: "High-Tech",
      V: "Vêtements",
    }
    return categories[prefix] || "Autre"
  }

  const filteredCasiers = useMemo(() => {
    return casiers.filter(
      (casier) =>
        casier.CodCasier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        casier.DesCasier.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [casiers, searchTerm])

  const groupedCasiers = useMemo(() => {
    return filteredCasiers.reduce((acc, casier) => {
      const prefix = casier.CodCasier.charAt(0)
      if (!acc[prefix]) acc[prefix] = []
      acc[prefix].push(casier)
      return acc
    }, {})
  }, [filteredCasiers])

  // eslint-disable-next-line no-unused-vars
  const sortedCategories = useMemo(() => Object.keys(groupedCasiers).sort(), [groupedCasiers])

  const totalFilteredCasiers = useMemo(() => filteredCasiers.length, [filteredCasiers])

  const totalPages = useMemo(() => Math.ceil(totalFilteredCasiers / itemsPerPage) || 1, [
    totalFilteredCasiers,
    itemsPerPage,
  ])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1)
  }, [totalPages, currentPage])

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) setCurrentPage(pageNumber)
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
      const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
      if (endPage - startPage + 1 < maxPagesToShow) startPage = Math.max(1, endPage - maxPagesToShow + 1)
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i)
    }
    return pageNumbers
  }

  const getPaginatedCasiers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredCasiers.slice(startIndex, endIndex)
  }

  const getPaginatedGroupedCasiers = () => {
    const paginatedCasiers = getPaginatedCasiers()
    const grouped = paginatedCasiers.reduce((acc, casier) => {
      const prefix = casier.CodCasier.charAt(0)
      if (!acc[prefix]) acc[prefix] = []
      acc[prefix].push(casier)
      return acc
    }, {})
    return Object.keys(grouped)
      .sort()
      .map((category) => ({ category, casiers: grouped[category] }))
  }

  // eslint-disable-next-line no-unused-vars
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  }

  const formVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
    exit: { height: 0, opacity: 0, transition: { duration: 0.3 } },
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <motion.h1
          className="text-3xl font-bold text-blue-600 mb-4 md:mb-0"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Gestion des Casiers
        </motion.h1>

        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <motion.div
            className="relative"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          >
            <FaPlus /> Ajouter un casier
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              {editMode ? "Modifier le casier" : "Ajouter un nouveau casier"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code Casier*</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border ${editMode ? "bg-gray-100" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={formData.CodCasier}
                  onChange={(e) => setFormData({ ...formData, CodCasier: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                  disabled={editMode}
                  placeholder="ex: A1"
                />
                <p className="mt-1 text-xs text-gray-500">Format recommandé: lettre + chiffre (ex: A1, B2)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.DesCasier}
                  onChange={(e) => setFormData({ ...formData, DesCasier: e.target.value })}
                  required
                  placeholder="ex: Épicerie"
                  maxLength={50}
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
                  onClick={() => setShowForm(false)}
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

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCasiers.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">
          {searchTerm ? "Aucun casier ne correspond à votre recherche" : "Aucun casier disponible"}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <select
                className="mr-2 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
              <span className="text-sm text-gray-600">éléments par page</span>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                Page {currentPage} sur {totalPages} ({filteredCasiers.length} résultats)
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

          <div className="space-y-8">
            {getPaginatedGroupedCasiers().map(({ category, casiers }) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-2 ${getCasierColor(category).bg} ${getCasierColor(category).text}`}
                  >
                    {category}
                  </span>
                  {getCategoryName(category)}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {casiers.map((casier) => (
                    <motion.div
                      key={casier.CodCasier}
                      variants={itemVariants}
                      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-300"
                      whileHover={{ scale: 1.03, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                    >
                      <div className="p-4 flex flex-col items-center">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${getCasierColor(casier.CodCasier).bg}`}
                        >
                          <FaBoxOpen className={`text-2xl ${getCasierColor(casier.CodCasier).icon}`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{casier.CodCasier}</h3>
                        <p className="text-sm text-gray-600 text-center mt-1">{casier.DesCasier}</p>

                        <div className="mt-4 flex justify-center gap-3">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEdit(casier)}
                            title="Modifier"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(casier.CodCasier)}
                            title="Supprimer"
                          >
                            <FaTrash size={18} />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-800"
                            onClick={() => fetchProductsByCasier(casier.CodCasier)}
                            title="Voir les produits"
                          >
                            <FaEye size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

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
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()} // Empêche la fermeture en cliquant dans le modal
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Produits dans {selectedCasier?.CodCasier} - {selectedCasier?.DesCasier}
                </h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <motion.div
                      key={product.ID}
                      className="bg-gray-50 rounded-lg p-4 shadow-md border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3 className="text-lg font-semibold text-blue-600">{product.CodProduit}</h3>
                      <p className="text-sm text-gray-600">{product.DesProduit}</p>
                      <p className="text-sm text-green-600 mt-2">Stock: {product.QuantiteStock}</p>
                      <p className="text-sm text-gray-500">Prix: {(product.Prix || 0).toFixed(3)} DT</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">Aucun produit dans ce casier.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Casiers