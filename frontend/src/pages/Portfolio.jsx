import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Coins,
  TrendingUp,
  Globe,
  Search,
  Download,
  RefreshCw,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronRight,
  AlertCircle,
  RotateCw,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardBody,
  Badge,
  ProgressBar,
  Table,
  TableRow,
  TableCell,
  EmptyState,
  CardSkeleton,
  TableSkeleton
} from '../components/ui';
import { Toast, useToast } from '../components/ui/Toast';
import usePortfolio from '../hooks/usePortfolio';
import { useWallet } from '../context/WalletContext';

const CHAIN_LABELS = {
  eth: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BNB Chain',
  arbitrum: 'Arbitrum',
  base: 'Base',
};

const CHAIN_COLORS = {
  eth: 'bg-primary',
  polygon: 'bg-pink-500',
  bsc: 'bg-yellow-500',
  arbitrum: 'bg-blue-400',
  base: 'bg-purple-500',
};

const DUST_THRESHOLD = 0.01; // $0.01

export default function Portfolio() {
  const { effectiveAddress } = useWallet();
  const { tokens, stats, totalValueUSD, loading, error, refresh, lastFetched } = usePortfolio(effectiveAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value-desc');
  const [hideDust, setHideDust] = useState(false);
  const [hideZero, setHideZero] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const handleRefresh = () => {
    refresh();
    showToast('Refreshing portfolio...', 'info');
  };

  const handleExport = () => {
    if (filteredHoldings.length === 0) {
      showToast('No data to export', 'error');
      return;
    }
    const headers = ['Token', 'Symbol', 'Chain', 'Amount', 'Value USD', 'Allocation %'];
    const rows = filteredHoldings.map((t) => [
      t.name || t.symbol,
      t.symbol,
      CHAIN_LABELS[t.chain] || t.chain,
      t.amount,
      (t.valueUSD || 0).toFixed(2),
      totalValueUSD > 0 ? ((t.valueUSD / totalValueUSD) * 100).toFixed(2) : '0.00'
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultsense-portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Portfolio exported as CSV', 'success');
  };

  // Filter token holdings
  const filteredHoldings = useMemo(() => {
    let result = tokens;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.symbol || '').toLowerCase().includes(q)
      );
    }

    // Chain filter
    if (chainFilter !== 'all') {
      result = result.filter((t) => (t.chain || '').toLowerCase() === chainFilter.toLowerCase());
    }

    // Hide dust
    if (hideDust) {
      result = result.filter((t) => (t.valueUSD || 0) >= DUST_THRESHOLD);
    }

    // Hide zero value
    if (hideZero) {
      result = result.filter((t) => (t.valueUSD || 0) > 0);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'value-desc': return (b.valueUSD || 0) - (a.valueUSD || 0);
        case 'value-asc': return (a.valueUSD || 0) - (b.valueUSD || 0);
        case 'name-asc': return (a.symbol || '').localeCompare(b.symbol || '');
        case 'name-desc': return (b.symbol || '').localeCompare(a.symbol || '');
        case 'chain': return (a.chain || '').localeCompare(b.chain || '');
        default: return 0;
      }
    });

    return result;
  }, [tokens, searchQuery, chainFilter, sortBy, hideDust, hideZero]);

  const getLogoBg = (symbol) => {
    switch (symbol?.toUpperCase()) {
      case 'ETH': return 'bg-primary/20 text-primary border-primary/20';
      case 'WBTC': case 'BTC': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'USDC': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'USDT': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SOL': return 'bg-success/15 text-success border-success/20';
      case 'ARB': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'MATIC': case 'POL': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'DAI': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'BNB': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  // ── Compute summary stats from live data ────────────────────────────────────
  const largestHolding = stats?.largestHolding;
  const chainCount = Object.keys(stats?.chainAllocations || {}).length;
  const stablecoinValue = stats?.stablecoinValue || 0;
  const stablecoinPct = totalValueUSD > 0 ? ((stablecoinValue / totalValueUSD) * 100).toFixed(1) : '0.0';

  // Diversification score (0-100): based on number of unique tokens and chain spread
  const diversificationScore = useMemo(() => {
    if (tokens.length === 0) return 0;
    const tokenScore = Math.min(tokens.length / 10, 1) * 40; // up to 40 pts for 10+ tokens
    const chainScore = Math.min(chainCount / 5, 1) * 30; // up to 30 pts for 5 chains
    // Concentration penalty: if top token > 50%, penalize
    const topPct = largestHolding ? (largestHolding.valueUSD / (totalValueUSD || 1)) : 1;
    const concScore = Math.max(0, (1 - topPct)) * 30; // up to 30 pts
    return Math.round(tokenScore + chainScore + concScore);
  }, [tokens, chainCount, largestHolding, totalValueUSD]);

  const portfolioSummaryStats = [
    {
      id: 'total-value',
      title: 'Total Portfolio',
      value: `$${totalValueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      supportingText: 'Across all chains',
      trendText: `${tokens.length} assets`,
      trendDirection: 'stable',
      icon: Wallet,
      color: 'text-primary'
    },
    {
      id: 'stablecoin-pct',
      title: 'Stablecoin %',
      value: `${stablecoinPct}%`,
      supportingText: `$${stablecoinValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trendText: stablecoinValue > 0 ? 'Buffered' : 'None',
      trendDirection: stablecoinValue > 0 ? 'up' : 'stable',
      icon: Coins,
      color: 'text-sky-400'
    },
    {
      id: 'diversification',
      title: 'Diversification',
      value: `${diversificationScore}/100`,
      supportingText: `${chainCount} chains, ${tokens.length} tokens`,
      trendText: diversificationScore >= 70 ? 'Well Diversified' : diversificationScore >= 40 ? 'Moderate' : 'Concentrated',
      trendDirection: diversificationScore >= 70 ? 'up' : diversificationScore >= 40 ? 'stable' : 'down',
      icon: TrendingUp,
      color: diversificationScore >= 70 ? 'text-success' : diversificationScore >= 40 ? 'text-amber-400' : 'text-danger'
    },
    {
      id: 'networks-connected',
      title: 'Networks Connected',
      value: `${chainCount} Chains`,
      supportingText: 'Multi-chain active',
      trendText: 'Healthy',
      trendDirection: 'up',
      icon: Globe,
      color: 'text-purple-400'
    }
  ];

  // ── Compute asset allocation from live data ─────────────────────────────────
  const assetAllocation = stats?.tokenAllocations?.slice(0, 8).map((t, idx) => {
    const colors = ['bg-primary', 'bg-yellow-500', 'bg-blue-400', 'bg-emerald-500', 'bg-success', 'bg-sky-500', 'bg-pink-500', 'bg-amber-500'];
    return {
      name: t.symbol,
      percentage: t.percentage,
      value: `$${(t.valueUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: colors[idx % colors.length],
    };
  }) || [];

  // ── Compute chain distribution ──────────────────────────────────────────────
  const networkDistribution = Object.entries(stats?.chainAllocations || {}).map(([chain, data]) => ({
    name: CHAIN_LABELS[chain] || chain,
    value: data.value,
    tokens: data.tokens,
    percentage: totalValueUSD > 0 ? parseFloat(((data.value / totalValueUSD) * 100).toFixed(1)) : 0,
    color: CHAIN_COLORS[chain] || 'bg-gray-500',
  })).sort((a, b) => b.value - a.value);

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error && !loading && tokens.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 pb-12">
        {ToastComponent}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-text">Portfolio</h1>
            <p className="text-sm text-gray-400">Manage and monitor your digital assets across multiple blockchain networks.</p>
          </div>
        </div>
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Portfolio"
          description={error}
          action={<Button variant="primary" leftIcon={RotateCw} onClick={handleRefresh}>Retry</Button>}
        />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 pb-12">
      {ToastComponent}

      {/* SECTION 1 — PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-text">Portfolio</h1>
          <p className="text-sm text-gray-400">Manage and monitor your digital assets across multiple blockchain networks.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" className="flex items-center gap-2 px-4 py-2.5 h-10 rounded-xl" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="p-2.5 h-10 w-10 flex items-center justify-center rounded-xl" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* SECTION 2 — SUMMARY CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {portfolioSummaryStats.map((card) => {
            const Icon = card.icon;
            const isUp = card.trendDirection === 'up';
            const isStable = card.trendDirection === 'stable';
            return (
              <Card key={card.id} hover className="border border-white/5 hover:border-primary/20 flex flex-col justify-between">
                <CardHeader className="flex items-center justify-between pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">{card.title}</CardTitle>
                  <div className={`p-2 rounded-xl border bg-white/5 border-white/5 ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardBody className="space-y-2.5">
                  <h3 className="text-2xl font-black tracking-tight text-text">{card.value}</h3>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">{card.supportingText}</span>
                    <span className={`font-bold flex items-center gap-0.5 ${isStable ? 'text-gray-400' : isUp ? 'text-success' : 'text-danger'}`}>
                      {!isStable && (isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
                      {card.trendText}
                    </span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Grid: 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* SECTION 3 — PORTFOLIO TABLE (8 columns) */}
        <div className="col-span-1 lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest self-start sm:self-center">Token Holdings</div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
              <div className="relative w-full sm:w-44">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111118] border border-white/5 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-primary/50 text-text placeholder-gray-500 transition-colors"
                />
              </div>
              <select
                value={chainFilter}
                onChange={(e) => setChainFilter(e.target.value)}
                className="bg-[#111118] border border-white/5 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 text-text cursor-pointer transition-colors"
              >
                <option value="all">All Networks</option>
                <option value="eth">Ethereum</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="base">Base</option>
                <option value="polygon">Polygon</option>
                <option value="bsc">BNB Chain</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#111118] border border-white/5 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 text-text cursor-pointer transition-colors"
              >
                <option value="value-desc">Value: High → Low</option>
                <option value="value-asc">Value: Low → High</option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name: Z → A</option>
                <option value="chain">Chain</option>
              </select>
            </div>
          </div>

          {/* Filter toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideDust}
                onChange={(e) => setHideDust(e.target.checked)}
                className="rounded border-white/10 bg-[#111118] text-primary focus:ring-primary/50"
              />
              Hide dust (&lt;$0.01)
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideZero}
                onChange={(e) => setHideZero(e.target.checked)}
                className="rounded border-white/10 bg-[#111118] text-primary focus:ring-primary/50"
              />
              Hide zero value
            </label>
            <span className="text-[11px] text-gray-600 ml-auto">
              Showing {filteredHoldings.length} of {tokens.length} tokens
            </span>
          </div>

          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <Table
              headers={['Token', 'Chain', 'Amount', 'Value', 'Allocation', 'Actions']}
              isEmpty={filteredHoldings.length === 0}
              emptyStateComponent={
                <EmptyState
                  icon={Coins}
                  title="No tokens found"
                  description={tokens.length === 0 ? "No wallet data available. Connect a wallet or check backend configuration." : "Adjust your search filters to view matching assets."}
                  action={
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setChainFilter('all'); setHideDust(false); setHideZero(false); }}>
                      Reset Filters
                    </Button>
                  }
                />
              }
            >
              {filteredHoldings.map((token, idx) => {
                const allocation = totalValueUSD > 0 ? ((token.valueUSD / totalValueUSD) * 100).toFixed(1) : '0.0';
                return (
                  <TableRow key={`${token.symbol}-${token.chain}-${idx}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${getLogoBg(token.symbol)}`}>
                          {token.symbol?.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-semibold text-text text-sm leading-none">{token.name || token.symbol}</p>
                          <p className="text-[10px] text-gray-500 mt-1 font-mono">{token.symbol}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info" className="text-[10px]">{CHAIN_LABELS[token.chain] || token.chain}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-300">
                      {token.amount} {token.symbol}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold text-text">
                      ${(token.valueUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-400">
                      {allocation}%
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="px-2 py-1 h-7 text-xs font-bold text-primary hover:text-primary/80" onClick={() => showToast(`Viewing ${token.symbol} details`, 'info')}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </Table>
          )}
        </div>

        {/* SECTION 7 — PORTFOLIO INSIGHTS (4 columns) */}
        <div className="col-span-1 lg:col-span-4">
          <Card hover className="h-full border border-white/5 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>Portfolio Insights</CardTitle>
                <CardSubtitle>Live analysis from your holdings</CardSubtitle>
              </div>
              <Info className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="space-y-4">
              {tokens.length > 0 ? (
                <>
                  {stablecoinValue > 0 && (
                    <div className="p-3.5 border rounded-2xl bg-success/5 border-success/10 hover:border-success/20 transition-all duration-200">
                      <div className="flex gap-3">
                        <ShieldCheck className="h-5 w-5 text-success shrink-0" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-text leading-tight">Stablecoin Buffer</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">${stablecoinValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in stablecoins ({stablecoinPct}%) provides downside protection.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {chainCount > 1 && (
                    <div className="p-3.5 border rounded-2xl bg-primary/5 border-primary/10 hover:border-primary/20 transition-all duration-200">
                      <div className="flex gap-3">
                        <Globe className="h-5 w-5 text-primary shrink-0" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-text leading-tight">Multi-Chain Diversification</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">Assets spread across {chainCount} networks reduces single-chain risk.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {largestHolding && ((largestHolding.valueUSD / (totalValueUSD || 1)) > 0.5) && (
                    <div className="p-3.5 border rounded-2xl bg-amber-400/5 border-amber-400/10 hover:border-amber-400/20 transition-all duration-200">
                      <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-text leading-tight">Concentration Risk</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{largestHolding.symbol} represents {((largestHolding.valueUSD / (totalValueUSD || 1)) * 100).toFixed(1)}% of portfolio. Consider diversifying.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Diversification score */}
                  <div className="p-3.5 border rounded-2xl bg-white/[0.02] border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-text">Diversification Score</p>
                      <span className={`text-sm font-bold ${diversificationScore >= 70 ? 'text-success' : diversificationScore >= 40 ? 'text-amber-400' : 'text-danger'}`}>
                        {diversificationScore}/100
                      </span>
                    </div>
                    <ProgressBar
                      value={diversificationScore}
                      variant={diversificationScore >= 70 ? 'success' : diversificationScore >= 40 ? 'warning' : 'danger'}
                      animated
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No insights available</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* SECTION 4 — ASSET ALLOCATION (6 columns) */}
        <div className="col-span-1 lg:col-span-6">
          <Card hover className="border border-white/5 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>Asset Allocation</CardTitle>
                <CardSubtitle>Proportional share of total portfolio weight</CardSubtitle>
              </div>
              <Layers className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="space-y-5">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-white/5 rounded-xl skeleton-pulse" />)}
                </div>
              ) : assetAllocation.length > 0 ? (
                assetAllocation.map((item) => (
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
                    <ProgressBar value={item.percentage} variant={item.percentage > 30 ? 'primary' : item.percentage > 15 ? 'success' : 'warning'} animated />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No allocation data</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* SECTION 5 — NETWORK DISTRIBUTION (6 columns) */}
        <div className="col-span-1 lg:col-span-6">
          <Card hover className="border border-white/5 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>Network Distribution</CardTitle>
                <CardSubtitle>Value breakdown by blockchain network</CardSubtitle>
              </div>
              <Globe className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardBody className="space-y-5">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-white/5 rounded-xl skeleton-pulse" />)}
                </div>
              ) : networkDistribution.length > 0 ? (
                networkDistribution.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                        <span className="font-semibold text-text">{item.name}</span>
                        <span className="text-[10px] text-gray-500">({item.tokens} tokens)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-semibold">{item.percentage}%</span>
                        <span className="text-xs font-mono text-gray-500">${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <ProgressBar value={item.percentage} variant={item.percentage > 30 ? 'primary' : item.percentage > 15 ? 'success' : 'warning'} animated />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No network data</p>
              )}
            </CardBody>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
