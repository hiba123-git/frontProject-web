"use client"

// pages/Login.jsx
import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import AuthForm from "../components/AuthForm"

const Login = () => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useLocation()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)

    // Animation des particules
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"
    script.async = true
    script.onload = () => {
      window.particlesJS("particles-js", {
        particles: {
          number: { value: 80, density: { enable: true, value_area: 800 } },
          color: { value: "#ffffff" },
          opacity: { value: 0.5, random: false },
          size: { value: 3, random: true },
          line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: { enable: true, mode: "grab" },
            onclick: { enable: true, mode: "push" },
          },
        },
      })
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-400 to-gray-300">
      {/* Effet de particules */}
      <div id="particles-js" className="absolute inset-0 z-0"></div>

      {/* Conteneur principal */}
      <div className={`w-full max-w-5xl rounded-2xl z-10 overflow-hidden transition-all duration-1000 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl">
          {/* Section image */}
          <div className="w-full md:w-1/2 relative overflow-hidden min-h-[300px] md:min-h-[550px]">
            <img 
              src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Magasin Central" 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "brightness(1.1) contrast(1.1) saturate(1.2)" }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white bg-gradient-to-t from-black/80">
              <h3 className="text-3xl font-bold mb-3" style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}>
                Bienvenue sur MagasinPro
              </h3>
              <p className="text-lg text-gray-200" style={{ textShadow: "1px 1px 3px rgba(0, 0, 0, 0.5)" }}>
                Votre solution complète pour la gestion de magasins
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="ml-4 text-white" style={{ textShadow: "1px 1px 3px rgba(0, 0, 0, 0.5)" }}>
                    Gestion centralisée
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="ml-4 text-white" style={{ textShadow: "1px 1px 3px rgba(0, 0, 0, 0.5)" }}>
                    Performance optimisée
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section formulaire */}
          <div className="w-full md:w-1/2 p-6 lg:p-10 bg-white/95 backdrop-blur-sm">
            <div className="max-w-[360px] mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Connexion
                </h2>
                <p className="text-gray-500 font-medium">Accédez à votre espace de gestion</p>
              </div>

              <AuthForm isLogin={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center left-0 right-0 text-gray-600 text-sm z-10">
        © 2025 MagasinPro. Tous droits réservés.
      </div>
    </div>
  )
}

export default Login