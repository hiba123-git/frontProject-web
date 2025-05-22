// src/App.js
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Promotions from './pages/Promotions';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Approvisionnement from './pages/Approvisionnement'; 
import Layout from './components/Layout';


import Familles from "./pages/referentiel/Familles"
import SousFamilles from "./pages/referentiel/SousFamilles"
import Casiers from "./pages/referentiel/Casiers"
import Produits from "./pages/referentiel/Produits"


function AuthCheck() {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
}

function App() {
  return (
   
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<AuthCheck />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/approvisionnement" element={<Approvisionnement />} /> {/* Nouvelle route */}

            <Route path="/referentiel/familles" element={<Familles />} />
          <Route path="/referentiel/sous-familles" element={<SousFamilles />} />
          <Route path="/referentiel/casiers" element={<Casiers />} />
          <Route path="/referentiel/produits" element={<Produits />} />
          </Route>
        </Routes>
      </Router>
   
  );
}

export default App;
