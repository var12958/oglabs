import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Coins,
  Shield,
  Layers,
  Compass,
  Database,
  Lock,
  ArrowRight,
  Activity,
  FileText,
  Globe,
  RefreshCw,
  Bell,
  Calendar,
  AlertTriangle,
  RotateCw,
  Zap,
  Clock,
  TrendingUp,
  CheckCircle2
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
  EmptyState,
  CardSkeleton
} from '../components/ui';
import { Toast, useToast } from '../components/ui/Toast';
import usePortfolio from '../hooks/usePortfolio';
import useSecurityScan from '../hooks/useSecurityScan';
import { useWallet } from '../context/WalletContext';
import { generateAIReport } from '../services/intelligenceService';

const CHAIN_COLORS = {
  eth: 'bg-primary',
  polygon: 'bg-pink-500',
  bsc: 'bg-yellow-500',
  arbitrum: 'bg-blue-400',
  base: 'bg-purple-500',
};

const CHAIN_LABELS = {
  eth: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BNB Chain',
  arbitrum: 'Arbitrum',
  base: 'Base',
};

const STABLECOIN_SYMBOLS = new Set(['USDC', 'USDT', 'DAI', 'BUSD']);

export default function Dashboard() {
  const { effectiveAddress, isDemo } = useWallet();
  const { tokens, stats, totalValueUSD, loading, error, refresh, lastFetched } = usePortfolio(effectiveAddress);
  const { stats: securityStats, loading: securityLoading } = useSecurityScan(effectiveAddress);
  const { showToast, ToastComponent } = useToast();

  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const autoRefreshRef = useRef(null);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (autoRefreshEnabled) {
      autoRefreshRef.current = setInterval(() => {
        refresh();
      }, 60000);
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [autoRefreshEnabled, refresh]);

  // Fetch AI insight on mount
  useEffect(() => {
    const fetchInsight = async () => {
      setAiLoading(true);
      try {
        const result = await generateAIReport(null, null);
        if (result?.success && result?.analysis) {
          setAiInsight(result.analysis);
        }
      } catch {
        // Non-critical — just don't show insight
      } finally {
        setAiLoading(false);
      }
    };
    fetchInsight();
  }, []);

  const handleRefresh = () => {
    refresh();
    showToast('Refreshing portfolio data...', 'info');
  };

  // ── Compute live data from API ──────────────────────────────────────────────
  const stablecoins = tokens.filter((t) => STABLECOIN_SYMBOLS.has(t.symbol?.toUpperCase()));
  const stablecoinValue = stablecoins.reduce((sum, t) => sum + (t.valueUSD || 0), 0);
  const chainGroups = {};
  tokens.forEach((t) => {
    const chain = t.chain || 'unknown';
    if (!chainGroups[chain]) chainGroups[chain] = 0;
    chainGroups[chain] += t.valueUSD || 0;
  });
  const chainAllocations = Object.entries(chainGroups)
    .map(([chain, value]) => ({
      name: CHAIN_LABELS[chain] || chain,
      percentage: totalValueUSD > 0 ? parseFloat(((value / totalValueUSD) * 100).toFixed(1)) : 0,
      value: `$${value.toFixed(2)}`,
      color: CHAIN_COLORS[chain] || 'bg-gray-500',
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Summary cards built from live data
  const summaryCardsData = [
    {
      id: 'portfolio',
      title: 'Portfolio Value',
      value: `$${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${tokens.length} assets across ${Object.keys(chainGroups).length} chains`,
      icon: Wallet,
      type: 'metric',
      color: 'text-primary'
    },
    {
      id: 'stablecoins',
      title: 'Stablecoins',
      value: `$${stablecoinValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Coins,
      type: 'breakdown',
      color: 'text-sky-400',
      breakdown: stablecoins.slice(0, 3).map((t) => ({
        name: t.symbol,
        value: `$${(t.valueUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }))
    },
    {
      id: 'security',
      title: 'Security Score',
      value: securityStats ? `${securityStats.healthScore}/100` : (securityLoading ? '...' : 'N/A'),
      subtitle: securityStats ? `Status: ${securityStats.overallStatus}` : 'Run a security scan',
      icon: Shield,
      type: 'metric',
      color: securityStats?.healthScore >= 70 ? 'text-success' : securityStats?.healthScore >= 50 ? 'text-amber-400' : 'text-danger'
    },
    {
      id: 'wallets',
      title: 'Assets Tracked',
      value: `${tokens.length} Tokens`,
      icon: Layers,
      type: 'metric',
      color: 'text-purple-400',
      subtitle: `Across ${Object.keys(chainGroups).length} networks`
    }
  ];

  // ── Error State ────────────────────────────────────────────────────────────
  if (error && !loading && tokens.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8 pb-12"
      >
        {ToastComponent}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-text">Dashboard</h1>
            <p className="text-sm text-gray-400">Monitor your assets, security, and activity across all connected wallets.</p>
          </div>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to Load Portfolio"
          description={error}
          action={
            <Button variant="primary" leftIcon={RotateCw} onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-12"
    >
      {ToastComponent}

      {/* SECTION 1: Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Dashboard</h1>
          <p className="text-sm text-gray-400">
            Monitor your assets, security, and activity across all connected wallets.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-semibold text-gray-400">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={`p-2.5 h-10 w-10 flex items-center justify-center rounded-xl ${autoRefreshEnabled ? 'border-primary/30 text-primary' : ''}`}
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            title={autoRefreshEnabled ? 'Auto-refresh ON (60s)' : 'Auto-refresh OFF'}
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="p-2.5 h-10 w-10 flex items-center justify-center rounded-xl"
            onClick={handleRefresh}
            title="Refresh Data"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* SECTION 2: Wallet Address Banner */}
      <Card className="bg-gradient-to-r from-[#111118] via-[#16122d] to-[#111118] border border-primary/20 shadow-xl shadow-primary/5">
        <CardBody className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-text">Welcome back 👋</h2>
              {isDemo && (
                <Badge variant="warning" className="text-[9px] uppercase tracking-wider">Demo Mode</Badge>
              )}
            </div>
            <p className="text-gray-400 text-sm max-w-xl">
              {isDemo
                ? 'Viewing demo data. Connect your wallet to see your real portfolio.'
                : 'Your wallets are healthy and ready to transact. Cross-chain analytics and contract scans are up to date.'
              }
            </p>
          </div>
          {/* Wallet Address Display */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-2xl max-w-md">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Wallet Address</p>
              <p className="text-xs font-mono text-text truncate">{effectiveAddress || 'Not connected'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-2xl">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Wallet className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Value</p>
                <p className="text-base font-extrabold text-text">${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-2xl">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Globe className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Chains</p>
                <p className="text-base font-extrabold text-text">{Object.keys(chainGroups).length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-3 rounded-2xl">
              <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <Layers className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Assets</p>
                <p className="text-base font-extrabold text-success">{tokens.length}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* SECTION 3: Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCardsData.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.id} hover className="border border-white/5 hover:border-primary/20 flex flex-col justify-between">
                <CardHeader className="flex items-center justify-between pb-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">{card.title}</CardTitle>
                  <div className={`p-2 rounded-xl border bg-white/5 border-white/5 ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight text-text">{card.value}</h3>
                  {card.type === 'metric' && card.subtitle && (
                    <p className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                      <span>{card.subtitle}</span>
                    </p>
                  )}
                  {card.type === 'breakdown' && card.breakdown && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                      {card.breakdown.map((item) => (
                        <div key={item.name} className="text-left">
                          <p className="text-[9px] text-gray-500 font-bold">{item.name}</p>
                          <p className="text-[11px] font-bold text-text mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* 12-Column Layout Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* SECTION 4: Portfolio Allocation (8 columns) */}
        <div className="col-span-1 lg:col-span-8">
          <Card hover className="h-full border border-white/5 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>Portfolio Allocation</CardTitle>
                <CardSubtitle>Distribution of assets across blockchain layers</CardSubtitle>
              </div>
              <Layers className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="space-y-5">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-white/5 rounded-xl skeleton-pulse" />)}
                </div>
              ) : chainAllocations.length > 0 ? (
                chainAllocations.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                        <span className="font-semibold text-text">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-semibold">{item.percentage}%</span>
                        <span className="text-xs font-mono text-gray-500">{item.value}</span>
                      </div>
                    </div>
                    <ProgressBar
                      value={item.percentage}
                      variant={item.percentage > 30 ? 'primary' : item.percentage > 15 ? 'success' : 'warning'}
                      animated
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No allocation data available</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* SECTION 7: Security Insights (4 columns) */}
        <div className="col-span-1 lg:col-span-4">
          <Card hover className="h-full border border-white/5 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>Security Insights</CardTitle>
                <CardSubtitle>Live scan results</CardSubtitle>
              </div>
              <Shield className="h-5 w-5 text-success" />
            </CardHeader>
            <CardBody className="space-y-5">
              {securityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-6 bg-white/5 rounded-xl skeleton-pulse" />)}
                </div>
              ) : securityStats ? (
                <>
                  <div className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                    securityStats.healthScore >= 70
                      ? 'bg-success/5 border-success/15'
                      : securityStats.healthScore >= 50
                      ? 'bg-amber-400/5 border-amber-400/15'
                      : 'bg-danger/5 border-danger/15'
                  }`}>
                    <Shield className={`h-5 w-5 shrink-0 ${
                      securityStats.healthScore >= 70 ? 'text-success' : securityStats.healthScore >= 50 ? 'text-amber-400' : 'text-danger'
                    }`} />
                    <div className="text-xs space-y-0.5">
                      <p className={`font-bold ${
                        securityStats.healthScore >= 70 ? 'text-success' : securityStats.healthScore >= 50 ? 'text-amber-400' : 'text-danger'
                      }`}>
                        Score: {securityStats.healthScore}/100 — {securityStats.overallStatus}
                      </p>
                      <p className="text-gray-400">{securityStats.totalRisks || 0} risks detected across {securityStats.scannedTokens || 0} tokens</p>
                    </div>
                  </div>
                  {(securityStats.recommendations || []).slice(0, 4).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm">
                      <div className="h-5 w-5 rounded-full bg-success/10 border border-success/10 flex items-center justify-center text-success shrink-0 mt-0.5 font-bold">
                        ✓
                      </div>
                      <span className="text-gray-300 font-medium leading-tight mt-0.5">{typeof rec === 'string' ? rec : rec.text || rec}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-gray-500">No scan data yet</p>
                  <p className="text-xs text-gray-600">Security scan runs automatically on page load</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* SECTION 5: Top Assets (8 columns) */}
        <div className="col-span-1 lg:col-span-8">
          <Card hover className="border border-white/5 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>Top Assets</CardTitle>
                <CardSubtitle>Your largest holdings by value</CardSubtitle>
              </div>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-white/5 rounded-xl skeleton-pulse" />)}
                </div>
              ) : tokens.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {tokens.slice(0, 5).map((token, idx) => (
                    <div
                      key={`${token.symbol}-${token.chain}-${idx}`}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                          {token.symbol?.slice(0, 3)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-text">{token.name || token.symbol}</p>
                          <p className="text-xs text-gray-400">{token.amount} {token.symbol} · {CHAIN_LABELS[token.chain] || token.chain}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-sm font-bold font-mono text-text">
                          ${(token.valueUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <Badge variant="info" className="text-[10px]">{CHAIN_LABELS[token.chain] || token.chain}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">No tokens found</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* SECTION 6: AI Insight (4 columns) */}
        <div className="col-span-1 lg:col-span-4">
          <Card hover className="h-full border border-white/5 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>AI Insight</CardTitle>
                <CardSubtitle>Powered by Gemini 2.5 Flash</CardSubtitle>
              </div>
              <Zap className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="space-y-4">
              {aiLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-6 bg-white/5 rounded-xl skeleton-pulse" />)}
                </div>
              ) : aiInsight ? (
                <div className="p-4 bg-[#0E0E14] rounded-xl border border-white/5 text-xs text-gray-300 leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
                  {aiInsight}
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <Zap className="h-8 w-8 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-500">AI insight unavailable</p>
                  <p className="text-xs text-gray-600">Check backend configuration</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Last fetched timestamp */}
      {lastFetched && (
        <div className="text-center">
          <p className="text-[11px] text-gray-600">
            Last updated: {lastFetched.toLocaleTimeString()} · Auto-refresh {autoRefreshEnabled ? 'ON (60s)' : 'OFF'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
