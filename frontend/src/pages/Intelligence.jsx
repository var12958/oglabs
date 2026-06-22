import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Activity,
  Flame,
  Search,
  RefreshCw,
  FileText,
  CheckCircle2,
  Zap,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Database,
  Server,
  Clock,
  ArrowRight,
  Lock,
  Upload,
  Info,
  Download,
  AlertCircle,
  RotateCw,
  Trash2
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardBody,
  Badge,
  Table,
  TableRow,
  TableCell,
  EmptyState,
  Input,
  Select,
  PageHeader,
  Section,
  CardSkeleton,
  TableSkeleton
} from '../components/ui';
import { Toast, useToast } from '../components/ui/Toast';
import useIntelligence from '../hooks/useIntelligence';
import { useWallet } from '../context/WalletContext';

// ─── Animated Counter Component ──────────────────────────────────────────────

function AnimatedCounter({ value, duration = 1000, decimals = 0, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseFloat(value);
    if (isNaN(end)) { setCount(0); return; }
    let start = 0;
    const totalMiliseconds = duration;
    const incrementTime = 30;
    const totalSteps = totalMiliseconds / incrementTime;
    const stepValue = (end - start) / totalSteps;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      start += stepValue;
      if (currentStep >= totalSteps) { clearInterval(timer); setCount(end); }
      else { setCount(start); }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span className="font-mono font-bold">
      {count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Intelligence() {
  const { effectiveAddress } = useWallet();
  const {
    history, totalReports, aiReport, stats,
    loading, generating, storing, error,
    generate, store, refresh
  } = useIntelligence();

  const { showToast, ToastComponent } = useToast();
  const [selectedReport, setSelectedReport] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  const [genStep, setGenStep] = useState(0);
  const [genProgress, setGenProgress] = useState(0);
  const [generatedReportDetails, setGeneratedReportDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [localReports, setLocalReports] = useState([]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Hash copied to clipboard', 'success');
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleRefresh = () => {
    refresh();
    showToast('Syncing 0G storage status...', 'info');
  };

  // Load local reports on mount
  useEffect(() => {
    try {
      setLocalReports(JSON.parse(localStorage.getItem('vaultsense_local_reports') || '[]'));
    } catch { /* ignore */ }
  }, []);

  // ── Generate Report (calls AI + stores on 0G) ──────────────────────────────
  const handleGenerateReport = async () => {
    setGenStep(0);
    setGenProgress(0);
    setGeneratedReportDetails(null);

    // Step 0: Compiling
    setGenStep(0);
    await new Promise((r) => setTimeout(r, 800));

    // Step 1: AI Analysis
    setGenStep(1);
    const progressTimer = setInterval(() => {
      setGenProgress((prev) => {
        if (prev >= 100) { clearInterval(progressTimer); return 100; }
        return prev + 10;
      });
    }, 100);

    const aiResult = await generate(null, null);
    clearInterval(progressTimer);
    setGenProgress(100);

    if (!aiResult) {
      showToast('AI analysis failed. Check backend configuration.', 'error');
      setGenStep(0);
      return;
    }

    // Step 2: Hashing
    setGenStep(2);
    await new Promise((r) => setTimeout(r, 600));

    // Step 3: Store on 0G
    setGenStep(3);
    const storeResult = await store('ai-analysis', effectiveAddress, {
      aiReport: aiResult,
      generatedAt: new Date().toISOString(),
    });

    setGenStep(4);

    if (storeResult) {
      setGeneratedReportDetails({
        name: `AI Intelligence Report`,
        hash: storeResult.rootHash,
        txHash: storeResult.txHash,
        explorerUrl: storeResult.explorerUrl,
        created: new Date().toLocaleString(),
      });
      showToast('Report stored on 0G successfully!', 'success');
    } else {
      // 0G failover — save locally
      const localReport = {
        id: Date.now().toString(),
        name: `AI Intelligence Report (Local)`,
        category: 'AI Analysis',
        hash: 'N/A — 0G storage unavailable',
        created: new Date().toISOString(),
        data: aiResult,
        isLocal: true,
      };
      const updated = [localReport, ...localReports];
      setLocalReports(updated);
      localStorage.setItem('vaultsense_local_reports', JSON.stringify(updated));

      setGeneratedReportDetails({
        name: `AI Intelligence Report (Local)`,
        hash: 'N/A — 0G storage unavailable',
        created: new Date().toLocaleString(),
      });
      showToast('0G Network temporarily unavailable. Report stored locally.', 'warning');
    }
  };

  const closeGenModal = () => {
    setGenStep(0);
    setGenProgress(0);
    setGeneratedReportDetails(null);
  };

  // Delete local report
  const handleDeleteLocal = (id) => {
    const updated = localReports.filter((r) => r.id !== id);
    setLocalReports(updated);
    localStorage.setItem('vaultsense_local_reports', JSON.stringify(updated));
    showToast('Local report deleted', 'info');
  };

  // Download report as JSON
  const handleDownloadReport = (report) => {
    const data = report.data || report;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaultsense-report-${report.id || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded', 'success');
  };

  // ── Filter reports (combine 0G history + local) ────────────────────────────
  const allReports = [
    ...history.map((r) => ({
      id: r.rootHash || r.txHash,
      name: `${formatReportType(r.reportType)} Report`,
      category: mapReportCategory(r.reportType),
      created: r.timestamp ? new Date(r.timestamp).toLocaleString() : 'Unknown',
      hash: r.rootHash || '-',
      txHash: r.txHash || '-',
      walletAddress: r.walletAddress || '-',
      isLocal: false,
    })),
    ...localReports.map((r) => ({
      ...r,
      created: r.created ? new Date(r.created).toLocaleString() : 'Unknown',
    })),
  ];

  const filteredReports = allReports.filter((r) => {
    const matchesSearch = !searchQuery ||
      (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.hash || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ||
      (r.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // ── Derived stats ───────────────────────────────────────────────────────────
  const statistics = stats?.statistics || [
    { id: 'stored', title: 'Reports Stored', value: totalReports + localReports.length, suffix: '', subtext: `${totalReports} on 0G, ${localReports.length} local` },
    { id: 'ai', title: 'AI Analysis', value: aiReport ? 'Active' : 'Ready', suffix: '', subtext: 'Gemini 2.5 Flash' },
    { id: 'network', title: 'Network', value: '0G', suffix: ' Testnet', subtext: 'Newton decentralized storage' },
    { id: 'status', title: 'Status', value: 'Online', suffix: '', subtext: 'All systems operational' },
  ];

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error && !loading && history.length === 0 && localReports.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-7xl mx-auto pb-12 relative">
        {ToastComponent}
        <PageHeader title="Intelligence Center" subtitle="AI-powered blockchain intelligence secured with decentralized storage." />
        <EmptyState icon={AlertCircle} title="Failed to Load Intelligence Data" description={error} action={<Button variant="primary" leftIcon={RotateCw} onClick={handleRefresh}>Retry</Button>} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      {ToastComponent}

      {/* Page Header */}
      <PageHeader
        title="Intelligence Center"
        subtitle="AI-powered blockchain intelligence secured with decentralized storage."
        action={
          <>
            <Button variant="primary" size="sm" leftIcon={Zap} onClick={handleGenerateReport} disabled={generating || loading}>
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
            <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={handleRefresh} disabled={loading || generating}>
              Refresh
            </Button>
          </>
        }
      />

      {/* 0G Overview Banner */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-[#111118] to-success/5 border border-white/5 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-success/5 rounded-full blur-3xl pointer-events-none" />
        <CardBody className="p-6 md:p-8 space-y-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
            <div>
              <Badge variant="primary" className="text-[10px] px-2.5 py-1 mb-2 font-bold tracking-wider uppercase">Powered by 0G</Badge>
              <h2 className="text-2xl font-extrabold tracking-tight text-text">Decentralized Intelligence Storage</h2>
              <p className="text-sm text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
                AI-generated audit, risk, and swap route optimization reports are compiled, hashed, and uploaded directly to the 0G decentralized storage network.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 md:self-center">
              <div className="bg-black/30 border border-white/5 px-4 py-3 rounded-xl min-w-[120px] text-left">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Reports Stored</span>
                <span className="text-xl font-bold font-mono text-text">{totalReports + localReports.length}</span>
              </div>
              <div className="bg-black/30 border border-white/5 px-4 py-3 rounded-xl min-w-[120px] text-left">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Storage Status</span>
                <span className="text-xl font-bold text-success flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  Healthy
                </span>
              </div>
              <div className="bg-black/30 border border-white/5 px-4 py-3 rounded-xl min-w-[120px] text-left">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Last Sync</span>
                <span className="text-sm font-semibold text-gray-300 block mt-1">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Statistics Counters */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statistics.map((stat) => (
            <Card key={stat.id} className="bg-[#111118]/80 border border-white/5 p-5">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">{stat.title}</span>
                <div className="text-2xl font-bold text-text">
                  {typeof stat.value === 'number' ? (
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  ) : (
                    <span className="font-mono font-bold">{stat.value}{stat.suffix}</span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 block mt-0.5">{stat.subtext}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* AI Report Display */}
      {aiReport && (
        <Card className="bg-[#111118]/80 border border-primary/20 shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary"><Zap className="h-4 w-4" /></div>
              <div>
                <CardTitle className="text-sm">Latest AI Analysis</CardTitle>
                <CardSubtitle>Generated by Gemini 2.5 Flash</CardSubtitle>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {aiReport.analysis && (
              <div className="p-4 bg-[#0E0E14] rounded-xl border border-white/5 text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                {aiReport.analysis}
              </div>
            )}
            {aiReport.summary && (
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs text-gray-300">
                <span className="text-primary font-bold">Summary:</span> {aiReport.summary}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Search & Filters */}
          <Card className="bg-[#111118]/80 border border-white/5 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <input type="text" placeholder="Search stored reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0E0E14] border border-white/5 text-xs rounded-xl pl-4 pr-4 py-2.5 outline-none focus:border-primary/50 text-text placeholder-gray-500 transition-colors" />
              </div>
              <div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-[#111118] border border-white/5 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 text-text cursor-pointer transition-colors">
                  <option value="all">All Categories</option>
                  <option value="security">Security</option>
                  <option value="ai">AI Analysis</option>
                  <option value="threat">Threats</option>
                </select>
              </div>
              <div>
                <select className="w-full bg-[#111118] border border-white/5 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 text-text cursor-pointer transition-colors">
                  <option value="all">All Statuses</option>
                  <option value="stored">Stored on 0G</option>
                  <option value="local">Stored Locally</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Recent Intelligence Reports */}
          <Card className="bg-[#111118]/80 border border-white/5 shadow-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <div>
                <CardTitle className="text-base">Recent Intelligence Reports</CardTitle>
                <CardSubtitle>Historical reports archived on the 0G storage blockchain</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <div className="p-4"><TableSkeleton rows={4} cols={4} /></div>
              ) : (
                <Table
                  headers={['Report Name', 'Category', 'Created', 'Storage', 'Actions']}
                  isEmpty={filteredReports.length === 0}
                  emptyStateComponent={
                    <EmptyState icon={FileText} title="No reports found" description={allReports.length === 0 ? "Generate your first AI intelligence report to see it stored here." : "No reports match your search filters."} action={allReports.length === 0 ? <Button variant="primary" size="sm" leftIcon={Zap} onClick={handleGenerateReport}>Generate First Report</Button> : <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>Reset Filters</Button>} />
                  }
                >
                  {filteredReports.map((report, idx) => (
                    <TableRow key={report.id || idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-semibold text-xs text-text">{report.name}</span>
                          {report.isLocal && <Badge variant="warning" className="text-[8px] px-1.5 py-0">Local</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary" className="text-[9px] py-0 px-2">{report.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">{report.created}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {report.isLocal ? (
                            <Badge variant="warning" className="text-[9px] py-0.5 px-2">Local</Badge>
                          ) : (
                            <>
                              <Badge variant="success" className="text-[9px] py-0.5 px-2 flex items-center gap-1">
                                <Check className="h-3 w-3" /> 0G
                              </Badge>
                              <span onClick={() => handleCopy(report.hash, report.id)} className="font-mono text-[10px] text-gray-500 hover:text-primary cursor-pointer transition-colors max-w-[80px] truncate" title="Click to copy">
                                {copiedId === report.id ? 'Copied' : (report.hash || '').substring(0, 10) + '...'}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setSelectedReport(report)} className="py-1 px-3 text-xs">View</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report)} className="py-1 px-2 text-xs" title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {report.isLocal && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteLocal(report.id)} className="py-1 px-2 text-xs text-danger hover:text-danger" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">

          {/* 0G Storage Status */}
          <Card className="bg-[#111118]/80 border border-white/5 shadow-xl backdrop-blur-md">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-success"><Database className="h-4 w-4" /></div>
                <div>
                  <CardTitle className="text-sm">0G Storage Status</CardTitle>
                  <CardSubtitle>Decentralized node health</CardSubtitle>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-2 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Network</span>
                <Badge variant="success" className="text-[9px]">0G Newton Testnet</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">0G Reports</span>
                <span className="font-mono font-bold text-text">{totalReports}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Local Reports</span>
                <span className="font-mono font-bold text-text">{localReports.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">AI Engine</span>
                <Badge variant="primary" className="text-[9px]">Gemini 2.5 Flash</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Status</span>
                <span className="flex items-center gap-1.5 text-success font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Online
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-[#111118]/80 border border-white/5 shadow-xl backdrop-blur-md">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary"><Zap className="h-4 w-4" /></div>
                <div>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                  <CardSubtitle>Intelligence operations</CardSubtitle>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-2 space-y-3">
              <Button variant="primary" size="sm" leftIcon={Zap} onClick={handleGenerateReport} disabled={generating} className="w-full justify-center">
                {generating ? 'Generating...' : 'Generate AI Report'}
              </Button>
              <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={handleRefresh} disabled={loading} className="w-full justify-center">
                Sync 0G Status
              </Button>
            </CardBody>
          </Card>
        </div>

      </div>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} onClick={() => setSelectedReport(null)} className="absolute inset-0 bg-black backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111118] border border-white/10 rounded-2xl p-6 max-w-lg w-full relative z-10 shadow-2xl overflow-hidden">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-text flex items-center gap-1.5"><FileText className="h-4.5 w-4.5 text-primary" /> {selectedReport.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Created: {selectedReport.created}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{selectedReport.category}</Badge>
                    {selectedReport.isLocal && <Badge variant="warning" className="text-[9px]">Local</Badge>}
                  </div>
                </div>
                <div className="space-y-3 text-xs">
                  {!selectedReport.isLocal && selectedReport.hash && selectedReport.hash !== '-' && (
                    <div className="bg-black/25 p-3 rounded-xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-semibold uppercase text-[10px]">0G Storage Hash</span>
                        <Badge variant="success" className="text-[9px]">Verified</Badge>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-primary bg-[#0E0E14] px-2.5 py-1.5 rounded-lg border border-white/5">
                        <span className="truncate max-w-[320px]">{selectedReport.hash}</span>
                        <button onClick={() => handleCopy(selectedReport.hash, 'modal')} className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-text cursor-pointer transition-colors" title="Copy hash">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedReport.txHash && selectedReport.txHash !== '-' && (
                    <div className="bg-[#0E0E14] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-500 font-semibold block mb-1">Transaction Hash</span>
                      <span className="font-mono text-[11px] text-primary">{selectedReport.txHash}</span>
                    </div>
                  )}
                  {selectedReport.isLocal && (
                    <div className="bg-amber-400/5 p-3 rounded-xl border border-amber-400/15">
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-semibold">0G Network temporarily unavailable. Report stored locally.</span>
                      </div>
                    </div>
                  )}
                  {selectedReport.data && (
                    <div className="bg-[#0E0E14] p-3 rounded-xl border border-white/5 max-h-48 overflow-y-auto">
                      <span className="text-[10px] text-gray-500 font-semibold block mb-2">Report Data</span>
                      <pre className="text-[11px] text-gray-300 whitespace-pre-wrap">{typeof selectedReport.data === 'string' ? selectedReport.data : JSON.stringify(selectedReport.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <Button variant="secondary" onClick={() => handleDownloadReport(selectedReport)} className="flex-1 text-xs py-2">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedReport(null)} className="flex-1 text-xs py-2">Close</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Generation Modal */}
      <AnimatePresence>
        {generating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111118] border border-white/10 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl overflow-hidden">
              <div className="space-y-5 text-center">
                <div>
                  <h3 className="text-lg font-bold text-text">0G Storage Intelligence Engine</h3>
                  <p className="text-xs text-gray-400 mt-1">Generating and storing AI analysis</p>
                </div>
                <div className="space-y-4 text-left py-2">
                  {['Compiling Wallet Payload Data', 'Running AI Analysis (Gemini 2.5 Flash)', 'Signing report & hashing payload', 'Broadcasting to 0G storage nodes'].map((label, idx) => {
                    const isDone = genStep > idx;
                    const isActive = genStep === idx;
                    return (
                      <div key={idx} className={`flex items-center justify-between text-xs p-3 rounded-xl ${isActive ? 'bg-primary/5 border border-primary/20' : 'bg-white/[0.01] border border-white/5'}`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-full ${isDone ? 'bg-success/20 text-success' : isActive ? 'bg-primary/20 text-primary animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                            {isDone ? <Check className="h-3.5 w-3.5" /> : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <div className="h-3.5 w-3.5 rounded-full bg-transparent" />}
                          </div>
                          <span className={`${isActive ? 'text-text font-bold' : isDone ? 'text-gray-400 font-medium' : 'text-gray-600'}`}>{idx + 1}. {label}</span>
                        </div>
                        {isDone && <span className="text-[10px] text-success font-semibold">Done</span>}
                      </div>
                    );
                  })}
                  {genStep === 1 && (
                    <div className="pl-8 pr-2">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${genProgress}%` }} className="h-full bg-primary" />
                      </div>
                      <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500 font-mono">
                        <span>Analyzing...</span>
                        <span>{genProgress}%</span>
                      </div>
                    </div>
                  )}
                </div>
                {generatedReportDetails && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-success/5 border border-success/20 rounded-xl space-y-2 text-center">
                    <div className="w-10 h-10 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="h-6 w-6" /></div>
                    <div>
                      <p className="text-sm font-bold text-success">
                        {generatedReportDetails.hash === 'N/A — 0G storage unavailable' ? 'Report Saved Locally!' : 'Report Archived on 0G!'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {generatedReportDetails.hash === 'N/A — 0G storage unavailable'
                          ? '0G Network temporarily unavailable. Report stored locally.'
                          : 'Stored on decentralized nodes.'
                        }
                      </p>
                    </div>
                    {generatedReportDetails.hash && generatedReportDetails.hash !== 'N/A — 0G storage unavailable' && (
                      <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg text-xs font-mono">
                        <span className="text-gray-500">Hash:</span>
                        <span className="text-primary truncate max-w-[150px]">{generatedReportDetails.hash}</span>
                      </div>
                    )}
                  </motion.div>
                )}
                <div className="pt-2">
                  <Button variant={generatedReportDetails ? 'success' : 'secondary'} disabled={!generatedReportDetails} onClick={closeGenModal} className="w-full font-bold py-2.5 rounded-xl text-sm">
                    {generatedReportDetails ? 'Close Wizard' : 'Processing...'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatReportType(type) {
  if (!type) return 'Unknown';
  return type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function mapReportCategory(type) {
  if (!type) return 'General';
  const lower = type.toLowerCase();
  if (lower.includes('security') || lower.includes('scan')) return 'Security';
  if (lower.includes('ai') || lower.includes('analysis')) return 'AI Analysis';
  if (lower.includes('threat')) return 'Threats';
  if (lower.includes('swap') || lower.includes('route')) return 'Swap';
  return 'General';
}
