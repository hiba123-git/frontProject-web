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
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const SousFamilles = () => {
  // États pour gérer les données et l'interface
  const [sousFamilles, setSousFamilles] = useState([])
  const [familles, setFamilles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [sortField, setSortField] = useState("CodSFam")
  const [sortDirection, setSortDirection] = useState("asc")
  const [filterFamille, setFilterFamille] = useState("")

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // État pour le formulaire
  const [formData, setFormData] = useState({
    CodFam: "",
    CodSFam: "",
    DesSFam: "",
  })

  // Effet pour charger les données
  useEffect(() => {
    fetchData()
  }, [])

  // Effet pour charger les sous-familles lorsque le filtre change
  useEffect(() => {
    if (filterFamille) {
      fetchSousFamillesByFamille(filterFamille)
    }
  }, [filterFamille])

  // Fonction pour filtrer et trier les données
  const filteredAndSortedSousFamilles = useMemo(() => {
    return sousFamilles
      .filter(
        (sousFamille) =>
          (filterFamille === "" || sousFamille.CodFam === filterFamille) &&
          (sousFamille.CodSFam.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sousFamille.DesSFam.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sousFamille.CodFam.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      .sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (typeof aValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      })
  }, [sousFamilles, filterFamille, searchTerm, sortField, sortDirection])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedSousFamilles.length / itemsPerPage) || 1
  }, [filteredAndSortedSousFamilles.length, itemsPerPage])

  // Effet pour calculer le nombre total de pages
  useEffect(() => {
    // Réinitialiser la page courante si elle dépasse le nombre total de pages
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  // Fonction pour récupérer les données
  const fetchData = async () => {
    setLoading(true)
    try {
      // Récupérer les familles
      const famResponse = await fetch("http://localhost:7000/promotions/families/all")
      if (!famResponse.ok) {
        throw new Error("Erreur lors de la récupération des familles")
      }
      const famillesData = await famResponse.json()
      setFamilles(famillesData)

      // Si un filtre est actif, récupérer les sous-familles pour cette famille
      if (filterFamille) {
        await fetchSousFamillesByFamille(filterFamille)
      } else {
        // Sinon, récupérer toutes les sous-familles (en combinant les résultats de chaque famille)
        const allSousFamilles = []
        for (const famille of famillesData) {
          try {
            const sfResponse = await fetch(`http://localhost:7000/produits/sous-familles/${famille.CodFam}`)
            if (sfResponse.ok) {
              const sfData = await sfResponse.json()
              allSousFamilles.push(...sfData)
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération des sous-familles pour ${famille.CodFam}:`, error)
          }
        }
        setSousFamilles(allSousFamilles)
      }

      setLoading(false)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast.error("Erreur lors du chargement des données")
      setLoading(false)
    }
  }

  // Fonction pour récupérer les sous-familles par famille
  const fetchSousFamillesByFamille = async (codFam) => {
    try {
      const response = await fetch(`http://localhost:7000/produits/sous-familles/${codFam}`)
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des sous-familles pour ${codFam}`)
      }
      const data = await response.json()
      setSousFamilles(data)
    } catch (error) {
      console.error(`Erreur lors de la récupération des sous-familles pour ${codFam}:`, error)
      toast.error(`Erreur lors de la récupération des sous-familles pour ${codFam}`)
    }
  }

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editMode) {
        // Mise à jour d'une sous-famille existante
        const response = await fetch(
          `http://localhost:7000/produits/sous-familles/${formData.CodFam}/${formData.CodSFam}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ DesSFam: formData.DesSFam }),
          },
        )

        if (!response.ok) {
          const errorData = await response.text()
          console.error("Réponse d'erreur:", errorData)
          throw new Error("Erreur lors de la mise à jour de la sous-famille")
        }

        // Mise à jour locale
        setSousFamilles(
          sousFamilles.map((item) =>
            item.CodFam === formData.CodFam && item.CodSFam === formData.CodSFam ? formData : item,
          ),
        )

        toast.success("Sous-famille mise à jour avec succès")
      } else {
        // Vérifier si le code existe déjà
        if (sousFamilles.some((sf) => sf.CodFam === formData.CodFam && sf.CodSFam === formData.CodSFam)) {
          toast.error("Cette sous-famille existe déjà pour cette famille")
          return
        }

        // Création d'une nouvelle sous-famille
        const response = await fetch("http://localhost:7000/produits/sous-familles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error("Réponse d'erreur:", errorData)
          throw new Error("Erreur lors de la création de la sous-famille")
        }

        const newSousFamille = await response.json()
        // Ajout local
        setSousFamilles([...sousFamilles, newSousFamille])

        toast.success("Sous-famille ajoutée avec succès")
      }

      // Réinitialiser le formulaire
      resetForm()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error(`Erreur lors de l'enregistrement: ${error.message}`)
    }
  }

  // Fonction pour supprimer une sous-famille
  const handleDelete = async (codFam, codSFam) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette sous-famille?")) {
      try {
        const response = await fetch(`http://localhost:7000/produits/sous-familles/${codFam}/${codSFam}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error("Réponse d'erreur:", errorData)
          throw new Error("Erreur lors de la suppression de la sous-famille")
        }

        // Suppression locale
        setSousFamilles(sousFamilles.filter((item) => !(item.CodFam === codFam && item.CodSFam === codSFam)))

        toast.success("Sous-famille supprimée avec succès")
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
        toast.error(`Erreur lors de la suppression: ${error.message}`)
      }
    }
  }

  // Fonction pour éditer une sous-famille
  const handleEdit = (sousFamille) => {
    setFormData({
      CodFam: sousFamille.CodFam,
      CodSFam: sousFamille.CodSFam,
      DesSFam: sousFamille.DesSFam,
    })
    setEditMode(true)
    setShowForm(true)
  }

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      CodFam: filterFamille || "",
      CodSFam: "",
      DesSFam: "",
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

  // Fonction pour obtenir le nom de la famille
  const getFamilleNom = (codFam) => {
    const famille = familles.find((f) => f.CodFam === codFam)
    return famille ? famille.DesFam : codFam
  }

  // Obtenir les éléments de la page courante
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return filteredAndSortedSousFamilles.slice(indexOfFirstItem, indexOfLastItem)
  }

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
          <span className="text-blue-600">Gestion des Sous-Familles</span>
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
                <FaPlus /> Ajouter une sous-famille
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Filtre par famille */}
      <motion.div
        className="mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-700">
            <FaFilter />
            <span>Filtrer par famille:</span>
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            value={filterFamille}
            onChange={(e) => setFilterFamille(e.target.value)}
          >
            <option value="">Toutes les familles</option>
            {familles.map((famille) => (
              <option key={famille.CodFam} value={famille.CodFam}>
                {famille.DesFam} ({famille.CodFam})
              </option>
            ))}
          </select>

          {filterFamille && (
            <button
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              onClick={() => setFilterFamille("")}
            >
              Réinitialiser le filtre
            </button>
          )}
        </div>
      </motion.div>

      {/* Formulaire d'ajout/édition */}
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
              {editMode ? "Modifier la sous-famille" : "Ajouter une nouvelle sous-famille"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Famille*</label>
                <select
                  className={`w-full px-3 py-2 border ${editMode ? "bg-gray-100" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={formData.CodFam}
                  onChange={(e) => setFormData({ ...formData, CodFam: e.target.value })}
                  required
                  disabled={editMode}
                >
                  <option value="" disabled>
                    Sélectionnez une famille
                  </option>
                  {familles.map((famille) => (
                    <option key={famille.CodFam} value={famille.CodFam}>
                      {famille.DesFam} ({famille.CodFam})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code Sous-Famille*</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border ${editMode ? "bg-gray-100" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={formData.CodSFam}
                  onChange={(e) => setFormData({ ...formData, CodSFam: e.target.value.toUpperCase() })}
                  required
                  maxLength={3}
                  disabled={editMode}
                  placeholder="ex: BOI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.DesSFam}
                  onChange={(e) => setFormData({ ...formData, DesSFam: e.target.value })}
                  required
                  placeholder="ex: Boissons"
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
      </AnimatePresence>

      {/* Tableau des sous-familles */}
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
        ) : filteredAndSortedSousFamilles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || filterFamille
              ? "Aucune sous-famille ne correspond à votre recherche"
              : "Aucune sous-famille disponible"}
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
                      Famille
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
                    onClick={() => handleSort("CodSFam")}
                  >
                    <div className="flex items-center">
                      Code
                      {sortField === "CodSFam" ? (
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
                    onClick={() => handleSort("DesSFam")}
                  >
                    <div className="flex items-center">
                      Description
                      {sortField === "DesSFam" ? (
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
                {getCurrentItems().map((sousFamille) => (
                  <motion.tr
                    key={`${sousFamille.CodFam}-${sousFamille.CodSFam}`}
                    variants={itemVariants}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{sousFamille.CodFam}</div>
                        <div className="ml-2 text-xs text-gray-500">({getFamilleNom(sousFamille.CodFam)})</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sousFamille.CodSFam}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sousFamille.DesSFam}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          onClick={() => handleEdit(sousFamille)}
                          title="Modifier"
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 transition-colors"
                          onClick={() => handleDelete(sousFamille.CodFam, sousFamille.CodSFam)}
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
        {!loading && filteredAndSortedSousFamilles.length > 0 && (
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
                  Page {currentPage} sur {totalPages} ({filteredAndSortedSousFamilles.length} résultats)
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

export default SousFamilles
