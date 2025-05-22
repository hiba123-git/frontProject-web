// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { useState } from 'react';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

function Layout() {

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar setCollapsed={setCollapsed} />

      <Navbar collapsed={collapsed} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8 " style={{ marginTop: '30px'}}>
        <div className="max-w-7xl mx-auto">
          <Outlet /> {/* Contenu des pages */}
        </div>
      </main>
    </div>
  );
}

export default Layout;