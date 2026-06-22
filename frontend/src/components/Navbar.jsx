import { Menu, Search, Bell, Wallet, User, LogOut, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '../context/WalletContext';

export default function Navbar({ onMenuToggle }) {
  const { address, isDemo, isConnecting, connect, disconnect, hasMetaMask } = useWallet();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    if (isDemo || !address) {
      await connect();
    } else {
      setShowMenu(!showMenu);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 md:left-20 h-16 bg-card border-b border-white/5 flex items-center justify-between px-6 z-30 transition-all duration-300">
      {/* Left side: Hamburger and Logo info */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 md:hidden transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile-only logo display when sidebar is hidden */}
        <div className="flex items-center gap-2 md:hidden">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-bold text-sm tracking-wider text-text">CROSS-CHAIN</span>
        </div>

        {/* Search Bar (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center gap-2 bg-background/50 border border-white/5 rounded-lg px-3 py-1.5 w-64 text-gray-400 focus-within:border-primary/50 transition-colors">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Search wallet, token, tx..."
            className="bg-transparent border-none outline-none text-xs w-full text-text placeholder-gray-500"
            disabled
          />
        </div>
      </div>

      {/* Right side: Actions & Wallet & Profile */}
      <div className="flex items-center gap-4">
        {/* Search icon placeholder (Mobile) */}
        <button className="sm:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 relative transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card"></span>
        </button>

        {/* Wallet Button */}
        <div className="relative">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`flex items-center gap-2 text-text font-semibold text-sm px-4 py-2 rounded-lg shadow-md transition-all active:scale-95 ${
              isDemo
                ? 'bg-primary hover:bg-primary/95 shadow-primary/20'
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Wallet className="h-4 w-4" />
            {isConnecting ? (
              <span>Connecting...</span>
            ) : isDemo || !address ? (
              <span>Connect Wallet</span>
            ) : (
              <>
                <span className="hidden sm:inline font-mono text-xs">{shortAddress}</span>
                <span className={`h-2 w-2 rounded-full ${isDemo ? 'bg-yellow-400' : 'bg-success'}`} />
              </>
            )}
          </button>

          {/* Wallet dropdown */}
          {showMenu && !isDemo && address && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#111118] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-white/5">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Connected Wallet</p>
                <p className="text-xs font-mono text-text break-all">{address}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-text hover:bg-white/5 rounded-lg transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <button
                  onClick={() => { disconnect(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/5 rounded-lg transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:border-primary/50 cursor-pointer transition-colors">
          <User className="h-4 w-4" />
        </div>
      </div>

      {/* Click-outside handler for wallet dropdown */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
    </header>
  );
}
