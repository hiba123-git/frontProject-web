"use client"

// components/AuthForm.jsx
import { useState } from "react"
import { FaLock, FaUser, FaStore, FaPhone, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa"
import axios from "axios"
import { useNavigate } from "react-router-dom"

// eslint-disable-next-line react/prop-types
const AuthForm = ({ isLogin }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    login: "",
    password: "",
    nom: "",
    prenom: "",
    telephone: "",
    magasin: "",
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

   
    if (!formData.login || formData.login.trim() === "") {
      setError("Veuillez entrez votre login.")
      setLoading(false)
      return
    }

   
    if (!formData.password || formData.password.trim() === "") {
      setError("Veuillez entrer votre mot de passe.")
      setLoading(false)
      return
    }

    
    if (formData.login.length < 3) {
      setError("Veuillez entrer un identifiant valide.")
      setLoading(false)
      return
    }

    
    if (formData.password.length < 4) {
      setError("veuillez entrer un mot de passe valide.")
      setLoading(false)
      return
    }

    try {
      const response = await axios.post("http://localhost:7000/users/login", {
        login: formData.login,
        password: formData.password,
      })

      
      if (response.data.token) {
        localStorage.setItem("token", response.data.token)
        navigate("/dashboard")
      }
    
      else if (response.data.error) {
        setError(response.data.error)
      }
   
      else {
        setError("Erreur de connexion. Vérifiez vos identifiants.")
      }
    } catch (error) {
      console.error(error)
      setError("Une erreur s'est produite. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isLogin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                name="nom"
                id="nom"
                value={formData.nom}
                onChange={handleChange}
                className="peer w-full px-4 py-3 pt-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-transparent hover:border-gray-300"
                required
              />
              <label
                htmlFor="nom"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:-translate-y-0"
              >
                Nom
              </label>
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-blue-500 peer-hover:text-gray-500 transition-colors duration-300" />
            </div>
            <div className="relative">
              <input
                type="text"
                name="prenom"
                id="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className="peer w-full px-4 py-3 pt-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-transparent hover:border-gray-300"
                required
              />
              <label
                htmlFor="prenom"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:-translate-y-0"
              >
                Prénom
              </label>
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-blue-500 peer-hover:text-gray-500 transition-colors duration-300" />
            </div>
          </div>

          <div className="relative">
            <input
              type="tel"
              name="telephone"
              id="telephone"
              value={formData.telephone}
              onChange={handleChange}
              className="peer w-full px-4 py-3 pt-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-transparent hover:border-gray-300"
              required
            />
            <label
              htmlFor="telephone"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:-translate-y-0"
            >
              Numéro de téléphone
            </label>
            <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-blue-500 peer-hover:text-gray-500 transition-colors duration-300" />
          </div>

          <div className="relative">
            <input
              type="text"
              name="magasin"
              id="magasin"
              value={formData.magasin}
              onChange={handleChange}
              className="peer w-full px-4 py-3 pt-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-transparent hover:border-gray-300"
              required
            />
            <label
              htmlFor="magasin"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:-translate-y-0"
            >
              Point de vente
            </label>
            <FaStore className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-blue-500 peer-hover:text-gray-500 transition-colors duration-300" />
          </div>
        </>
      )}

      <div className="relative">
                <input
            type="text"
            name="login"
            id="login"
            value={formData.login}
            onChange={handleChange}
            placeholder="Votre identifiant"
            className="peer w-full px-10 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 hover:border-gray-300"
          />
        <label
          htmlFor="login"
          className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:-translate-y-0"
        >
         
        </label>
        <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-blue-500 peer-hover:text-gray-500 transition-colors duration-300" />
      </div>

      <div className="relative">
              <input
          type={showPassword ? "text" : "password"}
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Votre mot de passe"
          className="peer w-full px-10 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-400 hover:border-gray-300"
        />
        <label
          htmlFor="password"
          className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500 peer-focus:-translate-y-0"
        >
         
        </label>
        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 peer-focus:text-blue-500 peer-hover:text-gray-500 transition-colors duration-300" />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md transition-colors duration-200 appearance-none checked:bg-blue-600 checked:border-transparent cursor-pointer"
          />
          
        </div>
        <div className="text-sm">
        
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5" />
            Connexion en cours...
          </>
        ) : (
          <span className="flex items-center">
            {isLogin ? "Se connecter" : "Créer un compte"}
            <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </button>

      {/* Messages d'erreur */}
      {error && (
        <div className="mt-4 text-center text-sm text-red-600 bg-red-100/80 backdrop-blur-sm py-2 px-4 rounded-lg">
          {error}
        </div>
      )}
    </form>
  )
}

export default AuthForm
