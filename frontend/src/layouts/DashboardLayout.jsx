import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text font-sans flex overflow-hidden">
      {/* Sidebar (Full Height, Fixed) */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Page Area */}
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300 lg:pl-64 md:pl-20 pl-0">
        {/* Navbar (Fixed Height, Top Fixed) */}
        <Navbar onMenuToggle={() => setMobileOpen(!mobileOpen)} />

        {/* Main Content Area (Scrollable Independently) */}
        <main className="flex-1 mt-16 p-6 overflow-y-auto h-[calc(100vh-4rem)] bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
