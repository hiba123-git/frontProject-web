"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSave, FaTimes, FaSort, FaSortUp, FaSortDown } from "react-icons/fa"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const Familles = () => {
  // États pour gérer les données et l'interface
  const [familles, setFamilles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [sortField, setSortField] = useState("CodFam")
  const [sortDirection, setSortDirection] = useState("asc")

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)

  // État pour le formulaire
  const [formData, setFormData] = useState({
    CodFam: "",
    DesFam: "",
  })

  const filteredAndSortedFamilles = familles
    .filter(
      (famille) =>
        famille.CodFam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        famille.DesFam.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (typeof aValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    })

  // Effet pour calculer le nombre total de pages
  useEffect(() => {
    if (filteredAndSortedFamilles.length > 0) {
      setTotalPages(Math.ceil(filteredAndSortedFamilles.length / itemsPerPage))
      // Réinitialiser la page courante si elle dépasse le nombre total de pages
      if (currentPage > Math.ceil(filteredAndSortedFamilles.length / itemsPerPage)) {
        setCurrentPage(1)
      }
    } else {
      setTotalPages(1)
    }
  }, [filteredAndSortedFamilles.length, itemsPerPage, currentPage])

  // Effet pour charger les données
  useEffect(() => {
    fetchFamilles()
  }, [])

  // Fonction pour récupérer les données
  const fetchFamilles = async () => {
    setLoading(true)
    try {
      // Notez que les routes sont sous /promotions/families d'après votre app.js
      const response = await fetch("http://localhost:7000/promotions/families/all")
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des familles")
      }
      const data = await response.json()
      setFamilles(data)
      setLoading(false)
    } catch (error) {
      console.error("Erreur lors du chargement des familles:", error)
      toast.error("Erreur lors du chargement des données")
      setLoading(false)
    }
  }

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editMode) {
        // Correction du format des données envoyées pour la mise à jour
        const response = await fetch(`http://localhost:7000/promotions/families/${formData.CodFam}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ DesFam: formData.DesFam }),
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error("Réponse d'erreur:", errorData)
          throw new Error("Erreur lors de la mise à jour de la famille")
        }

        // Mise à jour locale
        setFamilles(familles.map((item) => (item.CodFam === formData.CodFam ? formData : item)))

        toast.success("Famille mise à jour avec succès")
      } else {
        // Vérifier si le code existe déjà
        if (familles.some((f) => f.CodFam === formData.CodFam)) {
          toast.error("Ce code famille existe déjà")
          return
        }

        // Correction du format des données envoyées pour la création
        const response = await fetch("http://localhost:7000/promotions/families", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            CodFam: formData.CodFam,
            DesFam: formData.DesFam,
          }),
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error("Réponse d'erreur:", errorData)
          throw new Error("Erreur lors de la création de la famille")
        }

        const newFamily = await response.json()
        // Ajout local
        setFamilles([...familles, newFamily])

        toast.success("Famille ajoutée avec succès")
      }

      // Réinitialiser le formulaire
      resetForm()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error(`Erreur lors de l'enregistrement: ${error.message}`)
    }
  }

  // Fonction pour supprimer une famille
  const handleDelete = async (codFam) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette famille?")) {
      try {
        const response = await fetch(`http://localhost:7000/promotions/families/${codFam}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de la famille")
        }

        // Suppression locale pour la démo
        setFamilles(familles.filter((item) => item.CodFam !== codFam))

        toast.success("Famille supprimée avec succès")
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        toast.error("Erreur lors de la suppression")
      }
    }
  }

  // Fonction pour éditer une famille
  const handleEdit = (famille) => {
    setFormData({
      CodFam: famille.CodFam,
      DesFam: famille.DesFam,
    })
    setEditMode(true)
    setShowForm(true)
  }

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      CodFam: "",
      DesFam: "",
    })
    setEditMode(false)
    setShowForm(false)
  }

  // Fonction pour gérer le tri
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc"
    setSortDirection(isAsc ? "desc" : "asc")
    setSortField(field)
  }

  // Fonction pour filtrer et trier les données

  // Obtenir les éléments de la page courante
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return filteredAndSortedFamilles.slice(indexOfFirstItem, indexOfLastItem)
  }

  // Fonction pour changer de page
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Animations avec Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* En-tête avec titre et actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <motion.h1
          className="text-3xl font-bold text-gray-800 mb-4 md:mb-0"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-blue-600">Gestion des Familles</span>
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
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${showForm ? "bg-gray-600 hover:bg-gray-700" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={() => {
              if (showForm && !editMode) {
                setShowForm(false)
              } else {
                resetForm()
                setShowForm(!showForm)
              }
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showForm && !editMode ? (
              <>
                <FaTimes /> Annuler
              </>
            ) : (
              <>
                <FaPlus /> Ajouter une famille
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showForm && (
        <motion.div
          className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200"
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            {editMode ? "Modifier la famille" : "Ajouter une nouvelle famille"}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code Famille*</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border ${editMode ? "bg-gray-100" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={formData.CodFam}
                onChange={(e) => setFormData({ ...formData, CodFam: e.target.value.toUpperCase() })}
                required
                maxLength={10}
                disabled={editMode}
                placeholder="ex: ALIMENT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.DesFam}
                onChange={(e) => setFormData({ ...formData, DesFam: e.target.value })}
                required
                placeholder="ex: Alimentaire"
              />
            </div>

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

      {/* Tableau des familles */}
      <motion.div
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredAndSortedFamilles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? "Aucune famille ne correspond à votre recherche" : "Aucune famille disponible"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("CodFam")}
                  >
                    <div className="flex items-center">
                      Code
                      {sortField === "CodFam" ? (
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
                    onClick={() => handleSort("DesFam")}
                  >
                    <div className="flex items-center">
                      Description
                      {sortField === "DesFam" ? (
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
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentItems().map((famille) => (
                  <motion.tr
                    key={famille.CodFam}
                    variants={itemVariants}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{famille.CodFam}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{famille.DesFam}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          onClick={() => handleEdit(famille)}
                          title="Modifier"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 transition-colors"
                          onClick={() => handleDelete(famille.CodFam)}
                          title="Supprimer"
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
        )}

        {/* Pagination */}
        {!loading && filteredAndSortedFamilles.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center">
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
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">éléments par page</span>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-4">
                  Page {currentPage} sur {totalPages} ({filteredAndSortedFamilles.length} résultats)
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
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Familles
