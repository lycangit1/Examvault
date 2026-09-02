import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ContentProtection } from '../common/ContentProtection';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isWorkspace = /^\/(setter|reviewer|approver|admin2|investigator)/.test(location.pathname);

  return (
    <div className={`min-h-screen flex flex-col bg-[#faf8ff] text-[#1a1b21] font-sans antialiased selection:bg-blue-100 selection:text-[#00236f] ${isWorkspace ? 'protected-workspace' : ''}`}>
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          <Outlet />
        </main>
      </div>
      <ContentProtection />
    </div>
  );
};

export default AppLayout;
