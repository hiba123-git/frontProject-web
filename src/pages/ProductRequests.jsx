/* // eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';

const RestockRequests = () => {
  // eslint-disable-next-line no-unused-vars
  const [requests, setRequests] = useState([
    {
      id: 1,
      productName: 'Smartphone XYZ',
      quantity: 50,
      requestDate: '2024-02-15',
      expectedDeliveryDate: '2024-02-20',
      status: 'pending',
      store: 'Point de Vente Paris',
      urgency: 'high'
    },
    // Add more sample requests
  ]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Demandes de Réapprovisionnement</h1>

        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} 
                 className={`bg-white rounded-lg shadow-lg p-6 border-l-4 
                           ${request.urgency === 'high' ? 'border-red-500' : 
                             request.urgency === 'medium' ? 'border-yellow-500' : 'border-green-500'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{request.productName}</h3>
                  <p className="text-gray-600">Point de vente: {request.store}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-green-600 hover:bg-green-100 rounded">
                    <FaCheck />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-100 rounded">
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="text-gray-600">Quantité demandée:</div>
                  <div className="ml-2 font-semibold">{request.quantity}</div>
                </div>
                <div className="flex items-center">
                  <FaClock className="text-gray-400 mr-2" />
                  <div className="text-gray-600">Date prévue:</div>
                  <div className="ml-2 font-semibold">{request.expectedDeliveryDate}</div>
                </div>
                <div className="flex items-center">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold
                                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestockRequests; */