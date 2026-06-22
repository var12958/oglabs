// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Wallet Context
// ═══════════════════════════════════════════════════════════════════════════════
// Shared wallet state across all pages. Connects via MetaMask/injected provider.
// Falls back to a demo address when no wallet is available.
// ═══════════════════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const WalletContext = createContext(null);

const DEMO_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [error, setError] = useState(null);

  // Check if MetaMask is available
  const hasMetaMask = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  // Connect wallet
  const connect = useCallback(async () => {
    if (!hasMetaMask) {
      // No wallet available — use demo mode
      setAddress(DEMO_ADDRESS);
      setIsDemo(true);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsDemo(false);

        // Get chain ID
        const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainHex, 16));
      } else {
        // User rejected — fall back to demo
        setAddress(DEMO_ADDRESS);
        setIsDemo(true);
      }
    } catch (err) {
      if (err.code === 4001) {
        // User rejected — fall back to demo
        setAddress(DEMO_ADDRESS);
        setIsDemo(true);
      } else {
        setError(err.message || 'Failed to connect wallet');
        setAddress(DEMO_ADDRESS);
        setIsDemo(true);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [hasMetaMask]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setIsDemo(true);
    setError(null);
  }, []);

  // Use demo mode (explicitly choose demo)
  const useDemo = useCallback(() => {
    setAddress(DEMO_ADDRESS);
    setIsDemo(true);
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!hasMetaMask) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setIsDemo(true);
      } else {
        setAddress(accounts[0]);
        setIsDemo(false);
      }
    };

    const handleChainChanged = (chainHex) => {
      setChainId(parseInt(chainHex, 16));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [hasMetaMask]);

  // Auto-connect on mount if MetaMask is available and previously connected
  useEffect(() => {
    if (hasMetaMask) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsDemo(false);
          window.ethereum.request({ method: 'eth_chainId' }).then((chainHex) => {
            setChainId(parseInt(chainHex, 16));
          });
        } else {
          // No previously connected account — use demo
          setAddress(DEMO_ADDRESS);
          setIsDemo(true);
        }
      }).catch(() => {
        setAddress(DEMO_ADDRESS);
        setIsDemo(true);
      });
    } else {
      // No MetaMask — use demo
      setAddress(DEMO_ADDRESS);
      setIsDemo(true);
    }
  }, [hasMetaMask]);

  const value = {
    address,
    chainId,
    isConnecting,
    isDemo,
    hasMetaMask,
    error,
    connect,
    disconnect,
    useDemo,
    // Convenience: the effective address to use for API calls
    effectiveAddress: address || DEMO_ADDRESS,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export default WalletContext;
