// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { FaStore, FaBox, FaExclamationTriangle, FaShoppingBag } from 'react-icons/fa';
import { LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const salesData = [
    { month: 'Jan', ventes: 4000, demandes: 2400, profit: 2400 },
    { month: 'Fév', ventes: 5000, demandes: 3398, profit: 2800 },
    { month: 'Mar', ventes: 6000, demandes: 4800, profit: 3200 },
    { month: 'Avr', ventes: 4780, demandes: 3908, profit: 2900 },
    { month: 'Mai', ventes: 5890, demandes: 4800, profit: 3400 },
    { month: 'Jun', ventes: 6390, demandes: 5800, profit: 3700 },
  ];

  // Define slightly darker colors for each family
  const familyColors = {
    'Alimentaire': '#FF6666', // Deeper Coral
    'Beauté & Santé': '#3399FF', // Richer Sky Blue
    'Maison & Déco': '#FF9966', // Solid Orange
    'High-Tech': '#9966CC', // Deeper Purple
    'Vêtements': '#66CC66', // Pronounced Green
  };

  // Map backend data to include colors, filtering out families not in familyColors
  const stockData = (dashboardData?.repartitionStock || [])
    .filter(item => item.name && familyColors[item.name]) // Only include families with defined colors
    .map(item => ({
      name: item.name,
      value: item.value || 0,
      count: item.count || 0,
      color: familyColors[item.name],
    }));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/stats');
      if (response.data.success) {
        setDashboardData(response.data.data);
        setError(null);
        setRetryCount(0);
      } else {
        setError(response.data.message || 'Erreur lors du chargement des données');
        setRetryCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      setError(err.response?.data?.message || 'Erreur de connexion au serveur');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (error && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Tentative de reconnexion ${retryCount + 1}/3...`);
        fetchDashboardData();
      }, 5000); // 5 seconds
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount]);

  const stats = dashboardData ? [
    {
      title: 'Points de Vente',
      value: dashboardData.pointsDeVente.total.toString(),
      change: `+${dashboardData.pointsDeVente.nouveaux}`,
      icon: FaStore,
      color: 'bg-blue-500',
      detail: dashboardData.pointsDeVente.detail
    },
    {
      title: 'Demandes en Attente',
      value: dashboardData.demandesEnAttente.total.toString(),
      change: '+5',
      icon: FaBox,
      color: 'bg-yellow-500',
      detail: dashboardData.demandesEnAttente.detail
    },
    {
      title: 'Total Produits',
      value: dashboardData.totalProduits.total.toString(),
      change: '+0',
      icon: FaShoppingBag,
      color: 'bg-green-500',
      detail: dashboardData.totalProduits.detail
    },
    {
      title: 'Alertes Stock',
      value: dashboardData.alertesStock.total.toString(),
      change: dashboardData.alertesStock.change,
      icon: FaExclamationTriangle,
      color: 'bg-red-500',
      detail: dashboardData.alertesStock.detail
    }
  ] : [
    {
      title: 'Points de Vente',
      value: '0',
      change: '+0',
      icon: FaStore,
      color: 'bg-blue-500',
      detail: 'Actifs ce mois'
    },
    {
      title: 'Demandes en Attente',
      value: '0',
      change: '+0',
      icon: FaBox,
      color: 'bg-yellow-500',
      detail: 'À traiter'
    },
    {
      title: 'Total Produits',
      value: '0',
      change: '+0',
      icon: FaShoppingBag,
      color: 'bg-green-500',
      detail: 'Total visible'
    },
    {
      title: 'Alertes Stock',
      value: '0',
      change: '0',
      icon: FaExclamationTriangle,
      color: 'bg-red-500',
      detail: 'Produits'
    }
  ];

  const handleRefresh = () => {
    setRetryCount(0);
    fetchDashboardData();
  };

  // eslint-disable-next-line no-unused-vars
  const handleMouseEnter = (data, index) => {
    if (data && typeof data.count !== 'undefined') {
      setHoveredSegment({ name: data.name, count: data.count });
    } else {
      setHoveredSegment(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
          <p className="text-gray-600">Vue d ensemble de votre magasin central</p>
          {loading && <p className="text-xs text-blue-500 mt-2">Chargement des données...</p>}
          {error && (
            <div className="flex items-center mt-2">
              <p className="text-xs text-red-500">{error}</p>
              {retryCount >= 3 && (
                <button
                  onClick={handleRefresh}
                  className="ml-2 text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  Réessayer
                </button>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
          disabled={loading}
        >
          {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} rounded-full p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h2>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-2">{stat.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Performance des Ventes</h2>
            <select className="text-sm border rounded-lg px-3 py-1">
              <option>6 derniers mois</option>
              <option>Cette année</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="ventes" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Répartition des produits </h2>
            <button className="text-blue-500 hover:text-blue-700 text-sm">
              Voir détails
            </button>
          </div>
          {stockData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {stockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    `${name} (Produits: ${stockData.find(d => d.name === name)?.count || 0})`
                  ]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                />
                <Legend
                  formatter={(value) => `${value} ${hoveredSegment?.name === value ? `(Produits: ${hoveredSegment.count})` : ''}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
              <p>Aucune donnée de répartition de stock à afficher</p>
              {loading && <p className="text-xs mt-2">Chargement des données...</p>}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Demandes Récentes</h2>
          {dashboardData && dashboardData.demandesRecentes && dashboardData.demandesRecentes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Magasin</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Produit</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Quantité</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.demandesRecentes.map((demande, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{demande.magasin}</td>
                      <td className="py-3 px-4">{demande.produit}</td>
                      <td className="py-3 px-4">{demande.quantite}</td>
                      <td className="py-3 px-4">
                        <span className={`bg-${demande.statut === 'En attente' ? 'yellow' : demande.statut === 'Validé' ? 'green' : 'red'}-100 text-${demande.statut === 'En attente' ? 'yellow' : demande.statut === 'Validé' ? 'green' : 'red'}-800 text-xs font-semibold px-2.5 py-0.5 rounded`}>
                          {demande.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-gray-500">
              <p>Aucune demande récente à afficher</p>
              {loading && <p className="text-xs mt-2">Chargement des données...</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Alertes Stock</h2>
          {dashboardData && dashboardData.alertesProduits && dashboardData.alertesProduits.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.alertesProduits.map((alerte, index) => (
                <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                  <FaExclamationTriangle className="text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{alerte.type}</p>
                    <p className="text-xs text-red-600">{alerte.produit} - {alerte.quantite} unités restantes</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-gray-500">
              <p>Aucune alerte de stock à afficher</p>
              {loading && <p className="text-xs mt-2">Chargement des données...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;