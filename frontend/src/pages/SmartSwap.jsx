import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  Shuffle,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronRight,
  Info,
  RefreshCw,
  History,
  Check,
  Loader2,
  CheckCircle2,
  DollarSign,
  Flame,
  Zap,
  ArrowUpDown,
  ExternalLink,
  HelpCircle,
  Copy,
  AlertTriangle,
  AlertCircle,
  RotateCw,
  Clock,
  Gauge
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardBody,
  CardFooter,
  Badge,
  ProgressBar,
  Table,
  TableRow,
  TableCell,
  EmptyState,
  Input,
  Select,
  PageHeader,
  Section,
  CardSkeleton
} from '../components/ui';
import { Toast, useToast } from '../components/ui/Toast';
import useSmartSwap from '../hooks/useSmartSwap';

// ─── Chain & Token Config (static reference — not mock data, these are UI selectors) ──────

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'base', name: 'Base', symbol: 'ETH' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
];

const TOKENS = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH'];

const SWAP_HISTORY_KEY = 'vaultsense_swap_history';

function loadSwapHistory() {
  try {
    return JSON.parse(localStorage.getItem(SWAP_HISTORY_KEY) || '[]');
  } catch { return []; }
}

function saveSwapToHistory(entry) {
  const history = loadSwapHistory();
  history.unshift(entry);
  if (history.length > 50) history.length = 50;
  localStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(history));
}

export default function SmartSwap() {
  const { swapStats, loading, error, findRoutes, clearRoutes } = useSmartSwap();
  const { showToast, ToastComponent } = useToast();

  const [sourceChain, setSourceChain] = useState('ethereum');
  const [sourceToken, setSourceToken] = useState('ETH');
  const [destChain, setDestChain] = useState('base');
  const [destToken, setDestToken] = useState('USDC');
  const [sourceAmount, setSourceAmount] = useState('1.0');
  const [selectedRouteChain, setSelectedRouteChain] = useState(null);
  const [rotation, setRotation] = useState(0);

  const [isSwapping, setIsSwapping] = useState(false);
  const [swapStep, setSwapStep] = useState(0);
  const [swapProgress, setSwapProgress] = useState(0);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [swapTxHash, setSwapTxHash] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [swapHistory, setSwapHistory] = useState([]);

  // Derived state from hook
  const routes = swapStats?.routeCards || [];
  const savings = swapStats?.savings;
  const activeRoute = routes.find((r) => r.id === selectedRouteChain) || routes[0] || null;

  // Load swap history on mount
  useEffect(() => {
    setSwapHistory(loadSwapHistory());
  }, []);

  // Auto-select best route when routes change
  useEffect(() => {
    if (routes.length > 0) {
      const best = routes.find((r) => r.badge === 'Best Route') || routes[0];
      setSelectedRouteChain(best.id);
    }
  }, [routes]);

  const handleFindRoutes = () => {
    // Validation: same token swap
    if (sourceToken === destToken) {
      showToast('Source and destination tokens are the same. Please select different tokens.', 'error');
      return;
    }
    if (!sourceAmount || isNaN(parseFloat(sourceAmount)) || parseFloat(sourceAmount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    findRoutes(sourceToken, destToken, sourceAmount);
    showToast('Finding optimal routes...', 'info');
  };

  const handleRefresh = () => {
    if (sourceToken === destToken) {
      showToast('Source and destination tokens are the same', 'error');
      return;
    }
    findRoutes(sourceToken, destToken, sourceAmount);
    showToast('Refreshing routes...', 'info');
  };

  const handleSwapDirection = () => {
    setRotation((prev) => prev + 180);
    const tempChain = sourceChain;
    const tempToken = sourceToken;
    setSourceChain(destChain);
    setSourceToken(destToken);
    setDestChain(tempChain);
    setDestToken(tempToken);
    clearRoutes();
  };

  const handleExecuteSwap = () => {
    if (!activeRoute) return;
    setIsSwapping(true);
    setSwapStep(0);
    setSwapProgress(0);
    setSwapSuccess(false);

    const intervals = [1200, 1500, 2000, 1200];
    setTimeout(() => setSwapStep(1), intervals[0]);
    setTimeout(() => {
      setSwapStep(2);
      const progressTimer = setInterval(() => {
        setSwapProgress((prev) => {
          if (prev >= 100) { clearInterval(progressTimer); return 100; }
          return prev + 10;
        });
      }, 180);
    }, intervals[0] + intervals[1]);
    setTimeout(() => setSwapStep(3), intervals[0] + intervals[1] + intervals[2]);
    setTimeout(() => {
      setSwapStep(4);
      setSwapSuccess(true);
      const txHash = '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6);
      setSwapTxHash(txHash);

      // Save to local history
      const entry = {
        id: Date.now().toString(),
        fromToken: sourceToken,
        toToken: destToken,
        fromChain: sourceChain,
        toChain: activeRoute.name,
        amount: sourceAmount,
        output: activeOutput.toFixed(4),
        totalFee: activeRoute.totalFee,
        route: activeRoute.name,
        txHash,
        timestamp: new Date().toISOString(),
      };
      saveSwapToHistory(entry);
      setSwapHistory(loadSwapHistory());
    }, intervals[0] + intervals[1] + intervals[2] + intervals[3]);
  };

  const closeSwapModal = () => {
    setIsSwapping(false);
    setSwapSuccess(false);
    setSwapStep(0);
    setSwapProgress(0);
  };

  // Parse active route's numeric values for display
  const activeOutput = activeRoute ? parseFloat(activeRoute.outputAmount || activeRoute.outputValue || 0) : 0;
  const activeGasFee = activeRoute ? parseFloat((activeRoute.gasFee || '$0').replace('$', '')) : 0;
  const activeBridgeFee = activeRoute ? parseFloat((activeRoute.bridgeFee || '$0').replace('$', '')) : 0;
  const activePlatformFee = activeRoute ? parseFloat((activeRoute.platformFee || '$0').replace('$', '')) : 0;
  const activeTotalFee = activeRoute ? parseFloat((activeRoute.totalFee || '$0').replace('$', '')) : 0;

  // Savings computation
  const maxFee = routes.length > 0 ? Math.max(...routes.map((r) => parseFloat((r.totalFee || '$0').replace('$', '')))) : 0;
  const feeSavings = maxFee - activeTotalFee;

  // Find cheapest and fastest routes
  const cheapestRoute = routes.length > 0 ? [...routes].sort((a, b) => {
    const feeA = parseFloat((a.totalFee || '$0').replace('$', ''));
    const feeB = parseFloat((b.totalFee || '$0').replace('$', ''));
    return feeA - feeB;
  })[0] : null;

  const fastestRoute = routes.length > 0 ? [...routes].sort((a, b) => {
    const timeA = a.estimatedTime || '999s';
    const timeB = b.estimatedTime || '999s';
    return parseInt(timeA) - parseInt(timeB);
  })[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-7xl mx-auto pb-12 relative"
    >
      {ToastComponent}

      {/* Page Header */}
      <PageHeader
        title="Smart Swap"
        subtitle="Find the best cross-chain route with the lowest fees and highest output."
        action={
          <>
            <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={handleRefresh} disabled={loading}>
              Refresh Routes
            </Button>
            <Button variant="outline" size="sm" leftIcon={History} onClick={() => setIsHistoryOpen(true)}>
              History {swapHistory.length > 0 && `(${swapHistory.length})`}
            </Button>
          </>
        }
      />

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/20 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
          <span className="text-sm text-gray-300">{error}</span>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto text-xs">Retry</Button>
        </div>
      )}

      {/* Main Grid: 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column - Swap Card & Review (5 columns) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Swap Panel Card */}
          <Card className="relative overflow-hidden bg-[#111118]/80 border border-white/5 shadow-2xl backdrop-blur-md">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle>Swap Assets</CardTitle>
                  <CardSubtitle>Multi-network intelligent execution</CardSubtitle>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">

              {/* Source Token Panel */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-gray-400">You Pay</span>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={sourceChain} onChange={(e) => setSourceChain(e.target.value)} id="src-chain-select">
                    {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Select value={sourceToken} onChange={(e) => setSourceToken(e.target.value)} id="src-token-select">
                    {TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div className="relative">
                  <Input type="number" placeholder="0.00" value={sourceAmount} onChange={(e) => setSourceAmount(e.target.value)} className="pr-16 font-mono text-base" id="src-amount-input" />
                  <button type="button" onClick={() => { setSourceAmount('1.0'); }} className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary hover:text-text rounded text-xs font-semibold uppercase cursor-pointer transition-colors">Max</button>
                </div>
              </div>

              {/* Swap Direction Toggle */}
              <div className="flex justify-center -my-2 relative z-10">
                <motion.button type="button" onClick={handleSwapDirection} animate={{ rotate: rotation }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-primary hover:text-text cursor-pointer flex items-center justify-center transition-colors active:scale-95 shadow-md" id="swap-direction-btn">
                  <ArrowUpDown className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Destination Token Panel */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-gray-400">You Receive (Estimated)</span>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={destChain} onChange={(e) => setDestChain(e.target.value)} id="dest-chain-select">
                    {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Select value={destToken} onChange={(e) => setDestToken(e.target.value)} id="dest-token-select">
                    {TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div className="bg-[#0E0E14] border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-gray-400 flex items-center justify-between">
                  <span>
                    {loading ? (
                      <span className="flex items-center gap-1 text-xs"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Calculating...</span>
                    ) : activeRoute ? (
                      activeOutput.toFixed(4)
                    ) : '0.0000'}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 uppercase">{destToken}</span>
                </div>
              </div>

              {/* Same token warning */}
              {sourceToken === destToken && (
                <div className="flex items-center gap-2 p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-xs text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Source and destination tokens are the same. Select different tokens to swap.</span>
                </div>
              )}

              {/* Find Routes Button */}
              <Button variant="primary" onClick={handleFindRoutes} loading={loading} disabled={sourceToken === destToken} className="w-full py-3 text-sm rounded-xl mt-2 font-bold" id="find-routes-btn">
                {sourceToken === destToken ? 'Select Different Tokens' : 'Find Best Route'}
              </Button>
            </CardBody>
          </Card>

          {/* Gas & Fee Summary */}
          {activeRoute && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-[#111118]/80 border border-white/5 backdrop-blur-md">
                <CardHeader className="pb-2 border-b-0">
                  <CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-amber-500" /> Gas & Fee Summary</CardTitle>
                </CardHeader>
                <CardBody className="pt-2 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gas Fee</span>
                    <span className="font-mono text-text">${activeGasFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bridge Fee</span>
                    <span className="font-mono text-text">${activeBridgeFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform Service Fee</span>
                    <span className="font-mono text-text">${activePlatformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between font-semibold">
                    <span className="text-text">Total Fees</span>
                    <span className="font-mono text-primary">${activeTotalFee.toFixed(2)}</span>
                  </div>
                  {feeSavings > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-success/10 border border-success/20 text-success text-[11px] font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /><span>Optimized Routing Selected</span></div>
                      <span>Save ${feeSavings.toFixed(2)}</span>
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* Swap Preview */}
          {activeRoute && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border border-primary/20 bg-gradient-to-b from-[#111118] to-[#161320] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                <CardHeader className="pb-2 border-b-0">
                  <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Swap Preview</CardTitle>
                </CardHeader>
                <CardBody className="pt-1 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Pay Details</span>
                    <p className="text-sm text-text font-bold">{sourceAmount} {sourceToken} <span className="text-xs text-gray-400 font-medium">on {CHAINS.find((c) => c.id === sourceChain)?.name}</span></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Receive Details</span>
                    <p className="text-sm text-success font-bold">~{activeOutput.toFixed(4)} {destToken} <span className="text-xs text-gray-400 font-medium">on {activeRoute.name}</span></p>
                  </div>
                  <div className="border-t border-white/5 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exchange Rate</span>
                      <span className="font-mono text-gray-300">1 {sourceToken} = {sourceAmount > 0 ? (activeOutput / parseFloat(sourceAmount)).toFixed(4) : '0.0000'} {destToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price Impact</span>
                      <span className="text-success font-semibold">&lt; 0.05%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Minimum Received (0.5% Slippage)</span>
                      <span className="font-mono text-gray-300">{(activeOutput * 0.995).toFixed(4)} {destToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Arrival</span>
                      <span className="font-semibold text-primary">{activeRoute.estimatedTime || '~5s'}</span>
                    </div>
                  </div>
                  <Button variant="primary" onClick={handleExecuteSwap} className="w-full py-3 mt-3 text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.98]" id="execute-swap-btn">
                    Execute Smart Swap
                  </Button>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column - Best Routes (7 columns) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Best Route Comparison */}
          {loading ? (
            <div className="space-y-4">
              <CardSkeleton />
            </div>
          ) : routes.length > 0 ? (
            <Card className="bg-[#111118]/80 border border-white/5 shadow-xl backdrop-blur-md">
              <CardHeader className="pb-2 border-b-0">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <CardTitle className="text-base">Optimal Swap Routes</CardTitle>
                    <CardSubtitle>Compare transaction speeds and fee costs · {savings?.routesAnalyzed || routes.length} routes analyzed</CardSubtitle>
                  </div>
                  <Badge variant="primary" className="text-[10px] py-0.5 px-2">Cross-Chain Enabled</Badge>
                </div>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {routes.map((route) => {
                    const isSelected = selectedRouteChain === route.id;
                    const isBest = route.badge === 'Best Route';
                    const isCheapest = cheapestRoute && route.id === cheapestRoute.id && !isBest;
                    const isFastest = fastestRoute && route.id === fastestRoute.id && !isBest && !isCheapest;
                    return (
                      <motion.div key={route.id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} onClick={() => setSelectedRouteChain(route.id)} className={`relative cursor-pointer rounded-xl p-4 border text-left flex flex-col justify-between min-h-[170px] ${isSelected ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' : isBest ? 'border-success/30 bg-[#14121F] hover:border-success/50' : 'border-white/5 bg-white/[0.01] hover:border-white/10'} transition-all duration-200`} id={`route-card-${route.id}`}>
                        {isSelected && <div className="absolute inset-0 -z-10 rounded-xl bg-primary/5 shadow-[0_0_15px_rgba(124,58,237,0.15)] pointer-events-none" />}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-xs font-bold text-text truncate max-w-[95px]">{route.name}</span>
                            <div className="flex gap-1 shrink-0">
                              {route.badge && <Badge variant={isBest ? 'success' : 'primary'} className="text-[9px] px-1.5 py-0.2 uppercase font-extrabold tracking-wider whitespace-nowrap">{route.badge}</Badge>}
                              {isCheapest && <Badge variant="warning" className="text-[9px] px-1.5 py-0.2 uppercase font-extrabold tracking-wider whitespace-nowrap flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" /> Cheap</Badge>}
                              {isFastest && <Badge variant="info" className="text-[9px] px-1.5 py-0.2 uppercase font-extrabold tracking-wider whitespace-nowrap flex items-center gap-0.5"><Zap className="h-2.5 w-2.5" /> Fast</Badge>}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-500 block leading-tight">via Li.Fi Aggregator</span>
                        </div>
                        <div className="my-3 space-y-1">
                          <span className="text-[10px] text-gray-400 block font-medium">Est. Output</span>
                          <span className="text-sm font-mono font-bold text-text truncate block">{route.outputAmount} <span className="text-xs font-medium font-sans text-gray-400">{destToken}</span></span>
                        </div>
                        <div className="border-t border-white/5 pt-2.5 space-y-1.5 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total Fee:</span>
                            <span className="font-semibold font-mono text-gray-300">{route.totalFee}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Duration:</span>
                            <span className="font-semibold text-gray-300">{route.estimatedTime}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Safety:</span>
                            <span className={`font-bold ${isBest ? 'text-success' : 'text-primary'}`}>{route.safetyScore}/100</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {savings && savings.estimatedSavingsUSD > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-success/5 border border-success/15 text-xs text-success font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><span>Best route saves ~{savings.gainPercent?.toFixed(2)}% vs alternatives</span></div>
                    <span>~${savings.estimatedSavingsUSD?.toFixed(2)} saved</span>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <EmptyState icon={HelpCircle} title="No Swap Routes Found" description="Enter a transaction quantity and click 'Find Best Route' to calculate optimal pathways." className="py-12" />
          )}
        </div>

      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 bg-black z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0D0D14] border-l border-white/5 shadow-2xl z-50 p-6 flex flex-col">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-text flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Swap History</h3>
                  <p className="text-xs text-gray-400">{swapHistory.length} recent swap operations</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(false)} className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-text font-bold">Close</Button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {swapHistory.length === 0 ? (
                  <EmptyState icon={History} title="No Recent Swaps" description="Execute a swap to see your transaction history here." />
                ) : (
                  swapHistory.map((entry) => (
                    <Card key={entry.id} className="bg-white/[0.02] border border-white/5">
                      <CardBody className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text">{entry.amount} {entry.fromToken} → {entry.output} {entry.toToken}</span>
                          <Badge variant="success" className="text-[9px]">Done</Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>{entry.route} · {entry.totalFee}</span>
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        {entry.txHash && (
                          <p className="text-[10px] font-mono text-gray-600 truncate">Tx: {entry.txHash}</p>
                        )}
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Swap Execution Modal */}
      <AnimatePresence>
        {isSwapping && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black backdrop-blur-sm" onClick={closeSwapModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111118] border border-white/10 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl overflow-hidden">
              <div className="space-y-5 text-center">
                <div>
                  <h3 className="text-lg font-bold text-text">{swapSuccess ? 'Swap Complete!' : 'Executing Cross-Chain Swap'}</h3>
                  <p className="text-xs text-gray-400 mt-1">{swapSuccess ? 'Assets have been delivered to destination.' : 'Smart Swap routing protocol sequence'}</p>
                </div>

                {!swapSuccess ? (
                  <div className="space-y-4 text-left py-2">
                    {['Awaiting Wallet Approval', `Swapping ${sourceToken} on ${CHAINS.find((c) => c.id === sourceChain)?.name}`, `Bridging to ${CHAINS.find((c) => c.id === destChain)?.name}`, 'Confirming on Destination'].map((stepLabel, idx) => {
                      const isDone = swapStep > idx;
                      const isActive = swapStep === idx;
                      return (
                        <div key={idx} className={`flex items-center justify-between text-xs p-3 rounded-xl ${isActive ? 'bg-primary/5 border border-primary/20' : 'bg-white/[0.01] border border-white/5'}`}>
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-full ${isDone ? 'bg-success/20 text-success' : isActive ? 'bg-primary/20 text-primary animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                              {isDone ? <Check className="h-3.5 w-3.5" /> : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <div className="h-3.5 w-3.5 rounded-full bg-transparent" />}
                            </div>
                            <span className={`${isActive ? 'text-text font-bold' : isDone ? 'text-gray-400 font-medium' : 'text-gray-600'}`}>{idx + 1}. {stepLabel}</span>
                          </div>
                          {isDone && <span className="text-[10px] text-success font-semibold">{idx === 0 ? 'Approved' : idx === 1 ? 'Submitted' : idx === 2 ? 'Bridged' : 'Verified'}</span>}
                        </div>
                      );
                    })}
                    {swapStep === 2 && (
                      <div className="pl-2">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${swapProgress}%` }} className="h-full bg-primary" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 text-center">{swapProgress}% bridged</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="flex justify-center"><CheckCircle2 className="h-12 w-12 text-success" /></div>
                    <p className="text-xs text-gray-400 font-mono break-all">Tx: {swapTxHash}</p>
                    <Button variant="outline" onClick={closeSwapModal} className="w-full">Close</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
