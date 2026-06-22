import { Link, useLocation } from 'react-router-dom';
import { Settings, X, Wallet } from 'lucide-react';
import { navigationConfig } from '../data/navigationConfig';

export default function Sidebar({ mobileOpen, onClose }) {
  const location = useLocation();

  const renderNavLinks = (showText = true) => {
    return navigationConfig.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.route;

      return (
        <Link
          key={item.route}
          to={item.route}
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group relative ${
            isActive
              ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[14px]'
              : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
          }`}
        >
          <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`} />
          {showText && <span className="truncate">{item.title}</span>}
          
          {/* Tooltip for collapsed tablet sidebar */}
          {!showText && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-white/10 text-text text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {item.title}
            </div>
          )}
        </Link>
      );
    });
  };

  return (
    <>
      {/* 1. Desktop & Tablet Sidebar (Fixed) */}
      <aside className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-40 bg-card border-r border-white/5 h-screen transition-all duration-300 lg:w-64 md:w-20">
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-extrabold text-lg tracking-wider text-text hidden lg:inline">CROSS-CHAIN</span>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {/* Render links. Show text on lg screens, hide text on md screens */}
          <div className="lg:block hidden">{renderNavLinks(true)}</div>
          <div className="lg:hidden block">{renderNavLinks(false)}</div>
        </nav>

        {/* Bottom Section (Settings) */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all group relative"
          >
            <Settings className="h-5 w-5 shrink-0 group-hover:rotate-45 transition-transform duration-300" />
            <span className="truncate lg:inline hidden">Settings</span>
            <div className="lg:hidden absolute left-full ml-2 px-2 py-1 bg-card border border-white/10 text-text text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          </Link>
        </div>
      </aside>

      {/* 2. Mobile Drawer Sidebar (with backdrop) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 max-w-xs bg-card border-r border-white/5 h-full p-4 z-50">
            {/* Header / Close button */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6 text-primary" />
                <span className="font-extrabold text-lg tracking-wider text-text">CROSS-CHAIN</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {renderNavLinks(true)}
            </nav>

            {/* Mobile Settings */}
            <div className="border-t border-white/5 pt-4 mt-auto">
              <Link
                to="/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all group"
              >
                <Settings className="h-5 w-5 shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                <span className="truncate">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
