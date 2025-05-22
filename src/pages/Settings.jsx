/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  FaStore,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaMoneyBillAlt,
  FaCreditCard,
  FaPercentage,
  FaBuilding,
  FaUniversity,
  FaShoppingCart,
  FaChartLine,
  FaRegClock,
  FaRegCalendarAlt,
  FaRegCheckCircle,
  FaRegStar,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTrash,
  FaEdit,
} from "react-icons/fa";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("societe");
  const [animateCards, setAnimateCards] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [dataSource, setDataSource] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'create' ou 'edit'
  const [modalSection, setModalSection] = useState(null); // 'societe', 'pointdevente', 'modereglement', 'banque'
  const [formData, setFormData] = useState({});
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [currencyFormData, setCurrencyFormData] = useState({
    sigle: "",
    unit: "",
    cours: 0,
    defaut: false,
  });

  // États pour stocker les données du backend
  const [societeInfo, setSocieteInfo] = useState({
    denomination: "",
    adresse: "",
    ville: "",
    cp: "",
    telephone: "",
    fax: "",
    email: "",
    www: "",
    siret: "",
    rcs: "",
    tva_intracom: "",
    description: "",
  });
  const [currencies, setCurrencies] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pointsDeVente, setPointsDeVente] = useState([]);
  const [banks, setBanks] = useState([]);
  const [stats, setStats] = useState({
    magasins: 0,
    devises: 0,
    modesReglement: 0,
    tauxTVA: 0,
  });

  const API_URL = "http://localhost:7000";

  // Fonction pour gérer les erreurs de requête
  const handleRequestError = (error, endpoint) => {
    console.error(`Erreur lors de la requête ${endpoint}:`, error);
    const errorMessage =
      error.response?.data?.message || error.message || "Erreur inconnue";
    const errorDetails = error.response?.data?.error || "";
    const statusCode = error.response?.status || "Inconnu";
    return {
      endpoint,
      message: errorMessage,
      details: errorDetails,
      status: statusCode,
    };
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      setDebugInfo(null)

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Vous n'êtes pas connecté. Veuillez vous connecter.")
          setLoading(false)
          return
        }

        const headers = { Authorization: `Bearer ${token}` }
        const errors = []

        const safeRequest = async (endpoint, setter, defaultValue) => {
          try {
            console.log(`Requête vers ${endpoint}...`)
            const response = await axios.get(`${API_URL}${endpoint}`, { headers })
            console.log(`Réponse de ${endpoint}:`, response.data)

            if (response.data) {
              setter(response.data)
              if (endpoint === "/settings/societe") setDataSource("Base de données")
              return true
            } else {
              console.warn(`Données invalides reçues de ${endpoint}:`, response.data)
              setter(defaultValue)
              if (endpoint === "/settings/societe") setDataSource("Valeurs par défaut (aucune donnée reçue)")
              return false
            }
          } catch (error) {
            errors.push(handleRequestError(error, endpoint))
            setter(defaultValue)
            if (endpoint === "/settings/societe") setDataSource("Valeurs par défaut (erreur de requête)")
            return false
          }
        }

        const results = await Promise.all([
          safeRequest("/settings/stats", setStats, { magasins: 0, devises: 0, modesReglement: 0, tauxTVA: 0 }),
          safeRequest("/settings/societe", setSocieteInfo, {
            denomination: "FlashArt (défaut)",
            adresse: "123 Rue Principale (défaut)",
            ville: "Tunis (défaut)",
            cp: "1000 (défaut)",
            telephone: "+216 71 123 456 (défaut)",
            fax: "+216 71 123 457 (défaut)",
            email: "contact@flashart.com (défaut)",
            www: "www.flashart.com (défaut)",
            siret: "12345678900012 (défaut)",
            rcs: "RCS Tunis B 123456 (défaut)",
            tva_intracom: "TN12345678900 (défaut)",
            description: "Magasin de vente de produits artistiques et fournitures (défaut)",
          }),
          safeRequest("/settings/devises", setCurrencies, []),
          safeRequest("/settings/tva", setTaxRates, []),
          safeRequest("/settings/modes-reglement", setPaymentMethods, []),
          safeRequest("/points-de-vente-original/all", setPointsDeVente, []),
          safeRequest("/settings/banques", setBanks, []),
        ])

        if (errors.length > 0) {
          console.warn("Certaines requêtes ont échoué:", errors)
          setDebugInfo(errors)
          if (results.every((result) => !result)) {
            setError("Impossible de récupérer les données du serveur. Veuillez vérifier votre connexion et réessayer.")
          }
        }

        setLoading(false)
        setTimeout(() => setAnimateCards(true), 100)
      } catch (error) {
        console.error("Erreur générale:", error)
        setError("Une erreur est survenue. Veuillez réessayer.")
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const confirmOperation = new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <FaInfoCircle className="text-blue-500 text-xl" />
              <span>
                Confirmez-vous{" "}
                {modalType === "create" ? "la création" : "la modification"} de{" "}
                {modalSection === "societe"
                  ? "la société"
                  : modalSection === "pointdevente"
                  ? "ce point de vente"
                  : modalSection === "modereglement"
                  ? "ce mode de règlement"
                  : modalSection === "devise"
                  ? "cette devise"
                  : "cette banque"}{" "}
                ?
              </span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
              >
                Confirmer
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
              >
                Annuler
              </button>
            </div>
          </div>
        ),
        { duration: Number.POSITIVE_INFINITY, position: "top-center" }
      );
    });

    if (!(await confirmOperation)) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("Vous n'êtes pas connecté. Veuillez vous connecter.");

      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = "";
      const method = modalType === "create" ? "post" : "put";

      let dataToSend = {};

      switch (modalSection) {
        case "societe":
          dataToSend = { ...formData };
          endpoint = "/settings/societe";
          break;

        case "pointdevente":
          dataToSend = {
            nom: formData.nom || "",
            adresse: formData.adresse || "",
            telephone: formData.telephone || "",
            email: formData.email || "",
          };
          endpoint =
            modalType === "create"
              ? "/points-de-vente-original/create"
              : `/points-de-vente-original/update/${selectedItemId}`;
          break;

        case "modereglement":
          dataToSend = {
            modReg: formData.modReg || "",
            codJournalAch: formData.codJournalAch || "",
            codJournalVte: formData.codJournalVte || "",
            compteAch: formData.compteAch || "",
            compteVte: formData.compteVte || "",
            rem: formData.rem !== undefined ? formData.rem : 0,
            bComptoir:
              formData.bComptoir !== undefined ? formData.bComptoir : false,
          };
          endpoint =
            modalType === "create"
              ? "/settings/modes-reglement"
              : `/settings/modes-reglement/${selectedItemId}`;
          break;

        case "banque":
          dataToSend = {
            banque: formData.banque || "",
            adresse: formData.adresse || "",
          };
          endpoint =
            modalType === "create"
              ? "/settings/banques"
              : `/settings/banques/${selectedItemId}`;
          break;

        case "devise":
          dataToSend = {
            devise: formData.devise || "",
            sigle: formData.sigle || "",
            unit: formData.unit || "",
            cours: Number.parseFloat(formData.cours) || 0,
            defaut: formData.defaut || false,
          };
          endpoint = "/settings/devises";
          if (modalType === "edit" && selectedItemId) {
            endpoint = `${endpoint}/${selectedItemId}`;
          }
          break;

        default:
          throw new Error("Section non reconnue");
      }

      console.log("Données avant envoi:", formData);
      console.log("Données nettoyées envoyées:", dataToSend);

      const response = await axios[method](
        `${API_URL}${endpoint}`,
        dataToSend,
        { headers }
      );
      console.log("Réponse du backend:", response.data);

      switch (modalSection) {
        case "devise":
          setCurrencies((prev) =>
            modalType === "create"
              ? [...prev, response.data.devise]
              : prev.map((item) =>
                  item.id === selectedItemId ? response.data.devise : item
                )
          );
          if (modalType === "create") {
            setStats((prev) => ({
              ...prev,
              devises: prev.devises + 1,
            }));
          }
          toast.success(
            `Devise ${
              modalType === "create" ? "ajoutée" : "mise à jour"
            } avec succès !`
          );
          break;

        case "societe":
          if (response.data.societe) {
            const formattedSocieteInfo = {
              denomination: response.data.societe.DENOMINATION || "",
              adresse: response.data.societe.ADRESSE || "",
              ville: response.data.societe.VILLE || "",
              cp: response.data.societe.CP || "",
              telephone: response.data.societe.TELEPHONE || "",
              fax: response.data.societe.FAX || "",
              email: response.data.societe.EMAIL || "",
              www: response.data.societe.WWW || "",
              siret: response.data.societe.SIRET || "",
              rcs: response.data.societe.RCS || "",
              tva_intracom: response.data.societe.TVA_INTRACOM || "",
              description: response.data.societe.DESCRIPTION || "",
            };
            setSocieteInfo(formattedSocieteInfo);
          } else {
            setSocieteInfo(formData);
          }
          setDataSource("Base de données");
          toast.success("Société mise à jour avec succès !");
          break;

        case "pointdevente":
          setPointsDeVente((prev) =>
            modalType === "create"
              ? [...prev, response.data.pointDeVente]
              : prev.map((item) =>
                  item.id === selectedItemId ? response.data.pointDeVente : item
                )
          );
          toast.success(
            `Point de vente ${
              modalType === "create" ? "créé" : "mis à jour"
            } avec succès !`
          );
          break;

        case "modereglement":
          setPaymentMethods((prev) =>
            modalType === "create"
              ? [...prev, response.data.mode]
              : prev.map((item) =>
                  item.id === selectedItemId ? response.data.mode : item
                )
          );
          toast.success(
            `Mode de règlement ${
              modalType === "create" ? "créé" : "mis à jour"
            } avec succès !`
          );
          break;

        case "banque":
          setBanks((prev) =>
            modalType === "create"
              ? [...prev, response.data.banque]
              : prev.map((item) =>
                  item.idBanque === selectedItemId ? response.data.banque : item
                )
          );
          toast.success(
            `Banque ${
              modalType === "create" ? "créée" : "mise à jour"
            } avec succès !`
          );
          break;
      }

      setShowModal(false);
      setFormData({});
      setSelectedItemId(null);
    } catch (error) {
      console.error("Erreur dans handleFormSubmit:", error);
      setError(
        error.response?.data?.message || error.message || "Erreur inconnue"
      );
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (section, id) => {
    const confirmDelete = new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <FaExclamationTriangle className="text-red-500 text-xl" />
              <span>
                Êtes-vous sûr de vouloir supprimer{" "}
                {section === "pointdevente"
                  ? "ce point de vente"
                  : section === "modereglement"
                  ? "ce mode de règlement"
                  : "cette banque"}{" "}
                ?
              </span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
              >
                Supprimer
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
              >
                Annuler
              </button>
            </div>
          </div>
        ),
        { duration: Number.POSITIVE_INFINITY, position: "top-center" }
      );
    });

    if (!(await confirmDelete)) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("Vous n'êtes pas connecté. Veuillez vous connecter.");

      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = "";

      switch (section) {
        case "pointdevente":
          endpoint = `/points-de-vente-original/delete/${id}`;
          break;
        case "modereglement":
          endpoint = `/settings/modes-reglement/${id}`;
          break;
        case "banque":
          endpoint = `/settings/banques/${id}`;
          break;
        default:
          throw new Error("Section non reconnue");
      }

      await axios.delete(`${API_URL}${endpoint}`, { headers });

      switch (section) {
        case "pointdevente":
          setPointsDeVente((prev) => prev.filter((item) => item.id !== id));
          toast.success("Point de vente supprimé avec succès !");
          break;
        case "modereglement":
          setPaymentMethods((prev) => prev.filter((item) => item.id !== id));
          toast.success("Mode de règlement supprimé avec succès !");
          break;
        case "banque":
          setBanks((prev) => prev.filter((item) => item.idBanque !== id));
          toast.success("Banque supprimée avec succès !");
          break;
      }
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Erreur inconnue"
      );
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

   // eslint-disable-next-line no-unused-vars
  const handleCurrencySubmit = async (e) => {
    e.preventDefault();

    const confirmOperation = new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <FaInfoCircle className="text-blue-500 text-xl" />
              <span>
                Confirmez-vous{" "}
                {modalType === "create" ? "l'ajout" : "la modification"} de
                cette devise ?
              </span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
              >
                Confirmer
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
              >
                Annuler
              </button>
            </div>
          </div>
        ),
        { duration: Number.POSITIVE_INFINITY, position: "top-center" }
      );
    });

    if (!(await confirmOperation)) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("Vous n'êtes pas connecté. Veuillez vous connecter.");

      const headers = { Authorization: `Bearer ${token}` };
      let endpoint = "/settings/devises";
      const method = modalType === "create" ? "post" : "put";

      const dataToSend = {
        sigle: currencyFormData.sigle || "",
        unit: currencyFormData.unit || "",
        cours: Number.parseFloat(currencyFormData.cours) || 0,
        defaut: currencyFormData.defaut || false,
      };

      if (modalType === "edit" && selectedItemId) {
        endpoint = `${endpoint}/${selectedItemId}`;
      }

      console.log("Données de devise avant envoi:", dataToSend);

      const response = await axios[method](
        `${API_URL}${endpoint}`,
        dataToSend,
        { headers }
      );
      console.log("Réponse du backend pour devise:", response.data);

      setCurrencies((prev) =>
        modalType === "create"
          ? [...prev, response.data.devise]
          : prev.map((item) =>
              item.id === selectedItemId ? response.data.devise : item
            )
      );

      if (modalType === "create") {
        setStats((prev) => ({
          ...prev,
          devises: prev.devises + 1,
        }));
      }

      toast.success(
        `Devise ${
          modalType === "create" ? "ajoutée" : "modifiée"
        } avec succès !`
      );

      setShowModal(false);
      setCurrencyFormData({});
      setSelectedItemId(null);
    } catch (error) {
      console.error("Erreur dans handleCurrencySubmit:", error);
      setError(
        error.response?.data?.message || error.message || "Erreur inconnue"
      );
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyDelete = async (id) => {
    const confirmDelete = new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <FaExclamationTriangle className="text-red-500 text-xl" />
              <span>Êtes-vous sûr de vouloir supprimer cette devise ?</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
              >
                Supprimer
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
              >
                Annuler
              </button>
            </div>
          </div>
        ),
        { duration: Number.POSITIVE_INFINITY, position: "top-center" }
      );
    });

    if (!(await confirmDelete)) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("Vous n'êtes pas connecté. Veuillez vous connecter.");

      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = `/settings/devises/${id}`;

      await axios.delete(`${API_URL}${endpoint}`, { headers });

      setCurrencies((prev) => prev.filter((item) => item.id !== id));

      setStats((prev) => ({
        ...prev,
        devises: Math.max(0, prev.devises - 1),
      }));

      toast.success("Devise supprimée avec succès !");
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Erreur inconnue"
      );
      toast.error("Une erreur est survenue lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (value) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "Non spécifié" ||
      (typeof value === "string" && value.includes("(défaut)"))
    ) {
      return "Non renseigné";
    }
    return value;
  };

  const renderFormFields = () => {
    switch (modalSection) {
      case "societe":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Dénomination
              </label>
              <input
                type="text"
                name="denomination"
                value={formData.denomination || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Ville
              </label>
              <input
                type="text"
                name="ville"
                value={formData.ville || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Code Postal
              </label>
              <input
                type="text"
                name="cp"
                value={formData.cp || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="text"
                name="telephone"
                value={formData.telephone || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Fax
              </label>
              <input
                type="text"
                name="fax"
                value={formData.fax || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Site Web
              </label>
              <input
                type="text"
                name="www"
                value={formData.www || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                SIRET
              </label>
              <input
                type="text"
                name="siret"
                value={formData.siret || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                RCS
              </label>
              <input
                type="text"
                name="rcs"
                value={formData.rcs || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Matricule Fiscale
              </label>
              <input
                type="text"
                name="tva_intracom"
                value={formData.tva_intracom || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
          </>
        );
      case "devise":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Code de la devise
              </label>
              <input
                type="text"
                name="devise"
                value={formData.devise || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Symbole
              </label>
              <input
                type="text"
                name="sigle"
                value={formData.sigle || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Taux de change
              </label>
              <input
                type="number"
                step="0.0001"
                name="cours"
                value={formData.cours || 0}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="defaut"
                name="defaut"
                checked={formData.defaut || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all duration-300"
              />
              <label
                htmlFor="defaut"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                Définir comme devise par défaut
              </label>
            </div>
          </>
        );
      case "pointdevente":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="text"
                name="telephone"
                value={formData.telephone || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
          </>
        );
      case "modereglement":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Libellé
              </label>
              <input
                type="text"
                name="modReg"
                value={formData.modReg || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Journal Achat
              </label>
              <input
                type="text"
                name="codJournalAch"
                value={formData.codJournalAch || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Journal Vente
              </label>
              <input
                type="text"
                name="codJournalVte"
                value={formData.codJournalVte || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Compte Achat
              </label>
              <input
                type="text"
                name="compteAch"
                value={formData.compteAch || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Compte Vente
              </label>
              <input
                type="text"
                name="compteVte"
                value={formData.compteVte || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Remise (%)
              </label>
              <input
                type="number"
                name="rem"
                value={formData.rem || 0}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="bComptoir"
                name="bComptoir"
                checked={formData.bComptoir || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all duration-300"
              />
              <label
                htmlFor="bComptoir"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                Comptoir
              </label>
            </div>
          </>
        );
      case "banque":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Nom de la banque
              </label>
              <input
                type="text"
                name="banque"
                value={formData.banque || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse || ""}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all duration-300"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (loading && !showModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="text-center transition-all duration-500">
          <div className="animate-spin">
            <FaSpinner className="text-indigo-600 text-4xl mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-indigo-800">
            Chargement des paramètres...
          </h2>
          <p className="text-indigo-600 mt-2">
            Veuillez patienter pendant que nous récupérons vos données
          </p>
        </div>
      </div>
    );
  }

  if (error && !showModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg transition-all duration-500 transform scale-100">
          <div className="transition-all duration-300">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-red-800">Erreur</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left transition-all duration-300">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                <FaInfoCircle className="mr-2" /> Informations de débogage
              </h3>
              <div className="text-xs text-gray-700 overflow-auto max-h-40">
                {debugInfo.map((err, index) => (
                  <div
                    key={index}
                    className="mb-2 p-2 bg-white rounded border border-gray-200 transition-all duration-300"
                  >
                    <p>
                      <strong>Endpoint:</strong> {err.endpoint}
                    </p>
                    <p>
                      <strong>Status:</strong> {err.status}
                    </p>
                    <p>
                      <strong>Message:</strong> {err.message}
                    </p>
                    {err.details && (
                      <p>
                        <strong>Détails:</strong> {err.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-fade-in-delayed {
          animation: fadeIn 0.5s ease-out 0.2s;
        }
        .animate-cards-pop > * {
          animation: popIn 0.5s ease-out;
          animation-delay: calc(0.1s * var(--index));
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .form-panel-enter {
          opacity: 0;
        }
        .form-panel-enter-active {
          opacity: 1;
          transition: opacity 300ms ease-out;
        }
        .form-panel-exit {
          opacity: 1;
        }
        .form-panel-exit-active {
          opacity: 0;
          transition: opacity 300ms ease-out;
        }
        .form-content-enter {
          transform: scale(0.9);
          opacity: 0;
        }
        .form-content-enter-active {
          transform: scale(1);
          opacity: 1;
          transition: transform 300ms ease-out, opacity 300ms ease-out;
        }
        .form-content-exit {
          transform: scale(1);
          opacity: 1;
        }
        .form-content-exit-active {
          transform: scale(0.9);
          opacity: 0;
          transition: transform 300ms ease-out, opacity 300ms ease-out;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <Toaster position="top-center" />
        <div className="bg-white border-b border-indigo-100 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <nav className="flex overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeTab === "dashboard"
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300 hover:-translate-y-1"
                }`}
              >
                <FaChartLine className="mr-2" /> Tableau de bord
              </button>
              <button
                onClick={() => setActiveTab("societe")}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeTab === "societe"
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300 hover:-translate-y-1"
                }`}
              >
                <FaStore className="mr-2" /> Société
              </button>
              <button
                onClick={() => setActiveTab("pointsdevente")}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeTab === "pointsdevente"
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300 hover:-translate-y-1"
                }`}
              >
                <FaBuilding className="mr-2" /> Points de Vente
              </button>
              <button
                onClick={() => setActiveTab("devises")}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeTab === "devises"
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300 hover:-translate-y-1"
                }`}
              >
                <FaMoneyBillAlt className="mr-2" /> Devises
              </button>
              <button
                onClick={() => setActiveTab("paiement")}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeTab === "paiement"
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300 hover:-translate-y-1"
                }`}
              >
                <FaCreditCard className="mr-2" /> Modes de Règlement
              </button>
              <button
                onClick={() => setActiveTab("tva")}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeTab === "tva"
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300 hover:-translate-y-1"
                }`}
              >
                <FaPercentage className="mr-2" /> TVA
              </button>
              <button
                onClick={() => setActiveTab("banques")}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeTab === "banques"
                    ? "text-indigo-600 border-indigo-600"
                    : "text-gray-500 border-transparent hover:text-indigo-500 hover:border-indigo-300 hover:-translate-y-1"
                }`}
              >
                <FaUniversity className="mr-2" /> Banques
              </button>
            </nav>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-8">
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
              <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold text-indigo-800 mb-6">
                  {modalType === "create" ? "Ajouter" : "Modifier"}{" "}
                  {modalSection === "societe"
                    ? "Société"
                    : modalSection === "pointdevente"
                    ? "Point de Vente"
                    : modalSection === "modereglement"
                    ? "Mode de Règlement"
                    : modalSection === "devise"
                    ? "Devise"
                    : "Banque"}
                </h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg flex items-center shadow-sm transition-all duration-300">
                    <FaExclamationTriangle className="mr-2" />
                    {error}
                  </div>
                )}
                <form onSubmit={handleFormSubmit}>
                  {renderFormFields()}
                  <div className="flex justify-end mt-8 space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setFormData({});
                        setError(null);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-indigo-400 hover:bg-indigo-700 transition-all duration-300 flex items-center transform hover:scale-105"
                    >
                      {loading ? (
                        <FaSpinner className="animate-spin mr-2" />
                      ) : null}
                      {modalType === "create" ? "Créer" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {activeTab === "dashboard" && (
            <div className="transition-all duration-500">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-indigo-800 mb-2">
                  Tableau de Bord des Paramètres
                </h1>
                <p className="text-indigo-600">
                  Vue d'ensemble des paramètres système de magasin pro
                </p>
              </div>
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${
                  animateCards ? "animate-fade-in" : ""
                }`}
              >
                <div
                  className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                  style={{ "--index": 0 }}
                >
                  <div className="p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-200 text-sm">
                          Points de Vente
                        </p>
                        <h3 className="text-3xl font-bold mt-1">
                          {stats.magasins}
                        </h3>
                      </div>
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                        <FaBuilding className="text-white text-2xl" />
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-indigo-200">
                      Dernière mise à jour: aujourd'hui
                    </div>
                  </div>
                </div>
                <div
                  className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                  style={{ "--index": 1 }}
                >
                  <div className="p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-200 text-sm">Devises</p>
                        <h3 className="text-3xl font-bold mt-1">
                          {stats.devises}
                        </h3>
                      </div>
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                        <FaMoneyBillAlt className="text-white text-2xl" />
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-purple-200">
                      Dernière mise à jour: aujourd'hui
                    </div>
                  </div>
                </div>
                <div
                  className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                  style={{ "--index": 2 }}
                >
                  <div className="p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm">
                          Modes de Règlement
                        </p>
                        <h3 className="text-3xl font-bold mt-1">
                          {stats.modesReglement}
                        </h3>
                      </div>
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                        <FaCreditCard className="text-white text-2xl" />
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-blue-200">
                      Dernière mise à jour: aujourd'hui
                    </div>
                  </div>
                </div>
                <div
                  className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                  style={{ "--index": 3 }}
                >
                  <div className="p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-pink-200 text-sm">Taux de TVA</p>
                        <h3 className="text-3xl font-bold mt-1">
                          {stats.tauxTVA}
                        </h3>
                      </div>
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                        <FaPercentage className="text-white text-2xl" />
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-pink-200">
                      Dernière mise à jour: aujourd'hui
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${
                  animateCards ? "animate-fade-in-delayed" : ""
                }`}
              >
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                        <FaStore className="text-white text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          Informations de la Société
                        </h2>
                        <p className="text-indigo-200">
                          Aperçu des informations principales
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                        <FaStore className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dénomination</p>
                        <p className="font-medium text-indigo-800">
                          {displayValue(societeInfo.denomination)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                        <FaMapMarkerAlt className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="font-medium text-indigo-800">
                          {displayValue(societeInfo.adresse)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                        <FaPhone className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium text-indigo-800">
                          {displayValue(societeInfo.telephone)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                        <FaEnvelope className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-indigo-800">
                          {displayValue(societeInfo.email)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                        <FaRegCalendarAlt className="text-white text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          Activité Récente
                        </h2>
                        <p className="text-purple-200">
                          Dernières modifications des paramètres
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-start transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4 mt-1">
                        <FaRegCheckCircle className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Mise à jour des taux de TVA
                        </p>
                        <p className="text-sm text-gray-500">
                          Aujourd'hui, 10:30
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Le taux de TVA réduit a été mis à jour à 5.5%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1">
                        <FaRegStar className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Nouveau point de vente ajouté
                        </p>
                        <p className="text-sm text-gray-500">Hier, 15:45</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Le point de vente Boutique Centre Ville a été ajouté
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4 mt-1">
                        <FaRegClock className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Mise à jour des devises
                        </p>
                        <p className="text-sm text-gray-500">Il y a 2 jours</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Les taux de change ont été mis à jour
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "societe" && (
            <div className="transition-all duration-500">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-indigo-800 mb-2">
                    Informations de la Société
                  </h1>
                  <p className="text-indigo-600">
                    Détails de l'entreprise magasin pro
                  </p>
                  {dataSource && (
                    <div className="mt-2 flex items-center text-sm text-indigo-600">
                      <FaInfoCircle className="mr-1" />
                      <span>Source des données: {dataSource}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setModalType("edit");
                    setModalSection("societe");
                    setFormData(societeInfo);
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm transition-all duration-300 transform hover:scale-105"
                >
                  <FaEdit className="mr-2" /> Modifier
                </button>
              </div>
              <div
                className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-8 ${
                  animateCards ? "animate-fade-in" : ""
                } transform transition-all duration-500 hover:scale-105 hover:shadow-2xl`}
              >
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                      <FaStore className="text-white text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Informations Générales
                      </h2>
                      <p className="text-indigo-200">
                        Détails principaux de l'entreprise
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="transition-all duration-300">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Dénomination
                      </p>
                      <p className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800 font-medium">
                        {displayValue(societeInfo.denomination)}
                      </p>
                    </div>
                    <div className="transition-all duration-300">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Adresse
                      </p>
                      <p className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800">
                        {displayValue(societeInfo.adresse)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 transition-all duration-300">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Ville
                        </p>
                        <p className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800">
                          {displayValue(societeInfo.ville)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Code Postal
                        </p>
                        <p className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800">
                          {displayValue(societeInfo.cp)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="transition-all duration-300">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Téléphone
                      </p>
                      <p className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800">
                        {displayValue(societeInfo.telephone)}
                      </p>
                    </div>
                    <div className="transition-all duration-300">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Fax
                      </p>
                      <p className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800">
                        {displayValue(societeInfo.fax)}
                      </p>
                    </div>
                    <div className="transition-all duration-300">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Email
                      </p>
                      <p className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800">
                        {displayValue(societeInfo.email)}
                      </p>
                    </div>
                    <div className="transition-all duration-300">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Site Web
                      </p>
                      <p className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-800">
                        {displayValue(societeInfo.www)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-8 ${
                  animateCards ? "animate-fade-in-delayed" : ""
                } transform transition-all duration-500 hover:scale-105 hover:shadow-2xl`}
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                      <FaShoppingCart className="text-white text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Informations Légales
                      </h2>
                      <p className="text-blue-200">
                        Détails juridiques et fiscaux
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="transition-all duration-300">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      SIRET
                    </p>
                    <p className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                      {displayValue(societeInfo.siret)}
                    </p>
                  </div>
                  <div className="transition-all duration-300">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      RCS
                    </p>
                    <p className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                      {displayValue(societeInfo.rcs)}
                    </p>
                  </div>
                  <div className="transition-all duration-300">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Matricule Fiscale
                    </p>
                    <p className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                      {displayValue(societeInfo.tva_intracom)}
                    </p>
                  </div>
                </div>
                <div className="p-6 border-t border-blue-100 transition-all duration-300">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Description
                  </p>
                  <p className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                    {displayValue(societeInfo.description)}
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === "pointsdevente" && (
            <div className="transition-all duration-500">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-indigo-800 mb-2">
                    Points de Vente
                  </h1>
                  <p className="text-indigo-600">
                    Liste des magasins et boutiques FlashArt
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModalType("create");
                    setModalSection("pointdevente");
                    setFormData({});
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm transition-all duration-300 transform hover:scale-105"
                >
                  <FaStore className="mr-2" /> Ajouter
                </button>
              </div>
              {pointsDeVente.length > 0 ? (
                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
                    animateCards ? "animate-cards-pop" : ""
                  }`}
                >
                  {pointsDeVente.map((pdv, index) => (
                    <div
                      key={pdv.id}
                      className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                      style={{ "--index": index }}
                    >
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                              <FaBuilding className="text-white text-2xl" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {displayValue(pdv.nom)}
                              </h3>
                              <p className="text-indigo-200 text-sm">
                                {displayValue(pdv.adresse)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center transition-all duration-300">
                          <FaPhone className="text-indigo-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Téléphone</p>
                            <p className="font-medium text-indigo-800">
                              {displayValue(pdv.telephone)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center transition-all duration-300">
                          <FaEnvelope className="text-indigo-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-indigo-800">
                              {displayValue(pdv.email)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 border-t border-indigo-100 flex justify-end space-x-4">
                        <button
                          onClick={() => {
                            setModalType("edit");
                            setModalSection("pointdevente");
                            setFormData({
                              nom: pdv.nom,
                              adresse: pdv.adresse,
                              telephone: pdv.telephone,
                              email: pdv.email,
                            });
                            setSelectedItemId(pdv.id);
                            setShowModal(true);
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
                        >
                          <FaEdit className="inline mr-2" /> Modifier
                        </button>
                        <button
                          onClick={() => handleDelete("pointdevente", pdv.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
                        >
                          <FaTrash className="inline mr-2" /> Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl shadow-xl transition-all duration-500">
                  <FaBuilding className="text-indigo-600 text-4xl mx-auto mb-4" />
                  <p className="text-indigo-800 font-medium">
                    Aucun point de vente trouvé
                  </p>
                  <p className="text-indigo-600 mt-2">
                    Ajoutez un nouveau point de vente pour commencer.
                  </p>
                </div>
              )}{" "}
            </div>
          )}
          {activeTab === "devises" && (
            <div>
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-indigo-800 mb-2">Devises</h1>
                  <p className="text-indigo-600">Gestion des devises et taux de change (DT: Dinar Tunisien)</p>
                </div>
                <button
                  onClick={() => {
                    setModalType("create")
                    setModalSection("devise")
                    setFormData({
                      devise: "",
                      sigle: "",
                      unit: "",
                      cours: 1,
                      defaut: false,
                    })
                    setShowModal(true)
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm"
                >
                  <FaMoneyBillAlt className="mr-2" /> Ajouter
                </button>
              </div>
              {currencies.length > 0 ? (
                <div className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-8 ${animateCards ? "animate-fade-in" : ""}`}>
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                        <FaMoneyBillAlt className="text-white text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Devises et Taux de Change</h2>
                        <p className="text-green-200">Liste des devises utilisées dans le système</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-green-100">
                            <th className="pb-3 font-semibold text-green-800">Code</th>
                            <th className="pb-3 font-semibold text-green-800">Symbole</th>
                            <th className="pb-3 font-semibold text-green-800">Nom</th>
                            <th className="pb-3 font-semibold text-green-800">Taux de change</th>
                            <th className="pb-3 font-semibold text-green-800">Statut</th>
                            <th className="pb-3 font-semibold text-green-800">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currencies.map((currency, index) => (
                            <tr
                              key={index}
                              className="border-b border-green-50 hover:bg-green-50 transition-colors"
                            >
                              <td className="py-4 text-gray-700">{currency.devise === "USD" ? "DT" : currency.devise}</td>
                              <td className="py-4 text-gray-700">{currency.sigle}</td>
                              <td className="py-4 text-gray-700">
                                {currency.unit === "Dollar" ? "Dinar Tunisien" : currency.unit}
                              </td>
                              <td className="py-4 text-gray-700">{currency.cours}</td>
                              <td className="py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${currency.defaut ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                                >
                                  {currency.defaut ? "Par défaut" : "Actif"}
                                </span>
                              </td>
                              <td className="py-4 flex space-x-2">
                                <button
                                  onClick={() => {
                                    setModalType("edit")
                                    setModalSection("devise")
                                    setFormData({
                                      devise: currency.devise,
                                      sigle: currency.sigle,
                                      unit: currency.unit,
                                      cours: currency.cours,
                                      defaut: currency.defaut,
                                    })
                                    setSelectedItemId(currency.devise)
                                    setShowModal(true)
                                  }}
                                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleCurrencyDelete(currency.devise)}
                                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <FaMoneyBillAlt className="text-yellow-500 text-5xl mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucune devise disponible</h2>
                  <p className="text-gray-600">Les devises ne sont pas disponibles dans la base de données.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "paiement" && (
            <div>
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-indigo-800 mb-2">Modes de Règlement</h1>
                  <p className="text-indigo-600">Configuration des moyens de paiement acceptés</p>
                </div>
                <button
                  onClick={() => {
                    setModalType("create")
                    setModalSection("modereglement")
                    setFormData({})
                    setShowModal(true)
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm"
                >
                  <FaCreditCard className="mr-2" /> Ajouter
                </button>
              </div>
              {paymentMethods.length > 0 ? (
                <div className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-8 ${animateCards ? "animate-fade-in" : ""}`}>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                        <FaCreditCard className="text-white text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Modes de Règlement</h2>
                        <p className="text-blue-200">Liste des moyens de paiement configurés</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-blue-100">
                            <th className="pb-3 font-semibold text-blue-800">Code</th>
                            <th className="pb-3 font-semibold text-blue-800">Libellé</th>
                            <th className="pb-3 font-semibold text-blue-800">Journal Achat</th>
                            <th className="pb-3 font-semibold text-blue-800">Journal Vente</th>
                            <th className="pb-3 font-semibold text-blue-800">Compte Achat</th>
                            <th className="pb-3 font-semibold text-blue-800">Compte Vente</th>
                            <th className="pb-3 font-semibold text-blue-800">Remise</th>
                            <th className="pb-3 font-semibold text-blue-800">Comptoir</th>
                            <th className="pb-3 font-semibold text-blue-800">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentMethods.map((method, index) => (
                            <tr
                              key={index}
                              className="border-b border-blue-50 hover:bg-blue-50 transition-colors"
                            >
                              <td className="py-4 font-medium text-blue-700">{method.modReg}</td>
                              <td className="py-4 text-gray-700">{method.libelle}</td>
                              <td className="py-4 text-gray-700">{method.codJournalAch}</td>
                              <td className="py-4 text-gray-700">{method.codJournalVte}</td>
                              <td className="py-4 text-gray-700">{method.compteAch}</td>
                              <td className="py-4 text-gray-700">{method.compteVte}</td>
                              <td className="py-4 text-gray-700">{method.rem}%</td>
                              <td className="py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${method.bComptoir ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                                >
                                  {method.bComptoir ? "Oui" : "Non"}
                                </span>
                              </td>
                              <td className="py-4 flex space-x-2">
                                <button
                                  onClick={() => {
                                    setModalType("edit")
                                    setModalSection("modereglement")
                                    setFormData(method)
                                    setSelectedItemId(method.id)
                                    setShowModal(true)
                                  }}
                                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete("modereglement", method.id)}
                                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <FaCreditCard className="text-yellow-500 text-5xl mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucun mode de règlement disponible</h2>
                  <p className="text-gray-600">Les modes de règlement ne sont pas disponibles dans la base de données.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "tva" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-indigo-800 mb-2">Taux de TVA</h1>
                <p className="text-indigo-600">Configuration des taux de TVA et comptes associés</p>
              </div>
              {taxRates.length > 0 ? (
                <div className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-8 ${animateCards ? "animate-fade-in" : ""}`}>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                        <FaPercentage className="text-white text-2xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Taux de TVA</h2>
                        <p className="text-purple-200">Liste des taux de TVA configurés</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-purple-100">
                            <th className="pb-3 font-semibold text-purple-800">Taux (%)</th>
                            <th className="pb-3 font-semibold text-purple-800">Journal Achat</th>
                            <th className="pb-3 font-semibold text-purple-800">Compte Achat</th>
                            <th className="pb-3 font-semibold text-purple-800">Journal Vente</th>
                            <th className="pb-3 font-semibold text-purple-800">Compte Vente</th>
                            <th className="pb-3 font-semibold text-purple-800">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taxRates.map((tax, index) => (
                            <tr
                              key={index}
                              className="border-b border-purple-50 hover:bg-purple-50 transition-colors"
                            >
                              <td className="py-4 font-medium text-purple-700">{tax.tva}%</td>
                              <td className="py-4 text-gray-700">{tax.codJournalAch}</td>
                              <td className="py-4 text-gray-700">{tax.compteAch}</td>
                              <td className="py-4 text-gray-700">{tax.codJournalVte}</td>
                              <td className="py-4 text-gray-700">{tax.compteVte}</td>
                              <td className="py-4">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {tax.actif ? "Actif" : "Inactif"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <FaPercentage className="text-yellow-500 text-5xl mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Aucun taux de TVA disponible</h2>
                  <p className="text-gray-600">Les taux de TVA ne sont pas disponibles dans la base de données.</p>
                </div>
              )}
            </div>
          )}
          {activeTab === "banques" && (
            <div className="transition-all duration-500">
              <div className="mb-8 flex justify-between items-center">
                <div>
                  {" "}
                  <h1 className="text-3xl font-bold text-indigo-800 mb-2">
                    Banques
                  </h1>{" "}
                  <p className="text-indigo-600">
                    Gestion des comptes bancaires associés
                  </p>{" "}
                </div>
                <button
                  onClick={() => {
                    setModalType("create");
                    setModalSection("banque");
                    setFormData({});
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center shadow-sm transition-all duration-300 transform hover:scale-105"
                >
                  {" "}
                  <FaUniversity className="mr-2" /> Ajouter{" "}
                </button>{" "}
              </div>{" "}
              {banks.length > 0 ? (
                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
                    animateCards ? "animate-cards-pop" : ""
                  }`}
                >
                  {" "}
                  {banks.map((bank, index) => (
                    <div
                      key={bank.idBanque}
                      className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                      style={{ "--index": index }}
                    >
                      {" "}
                      <div className="bg-gradient-to-r from-green-600 to-green-800 p-6">
                        {" "}
                        <div className="flex items-center justify-between">
                          {" "}
                          <div className="flex items-center">
                            {" "}
                            <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                              {" "}
                              <FaUniversity className="text-white text-2xl" />{" "}
                            </div>{" "}
                            <div>
                              {" "}
                              <h3 className="text-lg font-bold text-white">
                                {displayValue(bank.banque)}
                              </h3>{" "}
                              <p className="text-green-200 text-sm">
                                {displayValue(bank.adresse)}
                              </p>{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="p-6 space-y-4">
                        {" "}
                        <div className="flex items-center transition-all duration-300">
                          {" "}
                          <FaMapMarkerAlt className="text-green-600 mr-3" />{" "}
                          <div>
                            {" "}
                            <p className="text-sm text-gray-500">
                              Adresse
                            </p>{" "}
                            <p className="font-medium text-green-800">
                              {displayValue(bank.adresse)}
                            </p>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                      <div className="p-6 border-t border-green-100 flex justify-end space-x-4">
                        {" "}
                        <button
                          onClick={() => {
                            setModalType("edit");
                            setModalSection("banque");
                            setFormData({
                              banque: bank.banque,
                              adresse: bank.adresse,
                            });
                            setSelectedItemId(bank.idBanque);
                            setShowModal(true);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
                        >
                          {" "}
                          <FaEdit className="inline mr-2" /> Modifier{" "}
                        </button>{" "}
                        <button
                          onClick={() => handleDelete("banque", bank.idBanque)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
                        >
                          {" "}
                          <FaTrash className="inline mr-2" /> Supprimer{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>
                  ))}{" "}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl shadow-xl transition-all duration-500">
                  {" "}
                  <FaUniversity className="text-green-600 text-4xl mx-auto mb-4" />{" "}
                  <p className="text-green-800 font-medium">
                    Aucune banque trouvée
                  </p>{" "}
                  <p className="text-green-600 mt-2">
                    Ajoutez une nouvelle banque pour commencer.
                  </p>{" "}
                </div>
              )}{" "}
            </div>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </>
  );
};
export default Settings;
