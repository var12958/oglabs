import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Search,
  Bell,
  Activity,
  Layers,
  Compass,
  Database,
  Lock,
  ChevronRight,
  Zap
} from 'lucide-react';

const Github = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Twitter = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardBody,
  CardFooter,
  Badge,
  ProgressBar
} from '../components/ui';
import { useWallet } from '../context/WalletContext';

export default function Landing() {
  const navigate = useNavigate();
  const { connect, hasMetaMask } = useWallet();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleConnect = async () => {
    await connect();
    navigate('/dashboard');
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Layers,
      title: 'Portfolio Aggregation',
      description: 'Track balances, DeFi positions, and NFTs across Ethereum, Solana, Base, and L2s in real-time.',
      color: 'text-primary bg-primary/10 border-primary/20'
    },
    {
      icon: ShieldCheck,
      title: 'AI Security Scanner',
      description: 'Instantly detect malicious smart contracts, allowance risks, and audit score drops on any address.',
      color: 'text-success bg-success/10 border-success/20'
    },
    {
      icon: RefreshCw,
      title: 'Cross-Chain Smart Swap',
      description: 'Compare liquidity routes from top DEX aggregators to swap assets with minimal slippage and fees.',
      color: 'text-sky-400 bg-sky-400/10 border-sky-400/20'
    },
    {
      icon: Compass,
      title: 'Wallet Intelligence',
      description: 'Visualize transaction histories, token distribution flows, and receive predictive risk alerts.',
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    },
    {
      icon: Database,
      title: '0G Decentralized Storage',
      description: 'Store wallet snapshots, security histories, and analytical profiles on highly secure 0G storage.',
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    },
    {
      icon: Lock,
      title: 'Multi-Wallet Support',
      description: 'Connect and monitor MetaMask, Phantom, WalletConnect, and hardware wallets in a unified screen.',
      color: 'text-danger bg-danger/10 border-danger/20'
    }
  ];

  const steps = [
    { num: '1', title: 'Connect Wallet', desc: 'Securely link your Web3 wallet in one click.' },
    { num: '2', title: 'Analyze Portfolio', desc: 'Scan holdings across 15+ blockchain networks.' },
    { num: '3', title: 'Detect Vulnerabilities', desc: 'Identify risky contract allowances and scam tokens.' },
    { num: '4', title: 'Swap & Optimize', desc: 'Execute swaps using secure routes at low gas costs.' }
  ];

  const stats = [
    { value: '$12.4M+', label: 'Assets Analyzed' },
    { value: '50K+', label: 'Wallet Scans' },
    { value: '99.8%', label: 'Detection Accuracy' },
    { value: '15+', label: 'Supported Networks' }
  ];

  const networks = [
    'Ethereum',
    'Base',
    'Arbitrum',
    'Polygon',
    'Optimism',
    'Solana',
    'Avalanche',
    'BNB Chain'
  ];

  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary/30 overflow-x-hidden relative">
      
      {/* Background Animated Blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-60 right-1/4 w-[450px] h-[450px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-success/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* 1. Sticky Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0A0A0F]/80 backdrop-blur-md border-b border-white/5 py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-extrabold text-lg tracking-wider text-text">CROSS-CHAIN</span>
          </Link>

          {/* Links - Desktop */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-text transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-text transition-colors">Statistics</a>
            <Link to="/dashboard" className="hover:text-text transition-colors">Dashboard Preview</Link>
          </div>

          {/* Connect Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              leftIcon={Github}
              onClick={() => window.open('https://github.com', '_blank')}
            >
              GitHub
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Wallet}
              onClick={handleConnect}
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold tracking-wider text-primary uppercase">v1.0 Live on 0G Storage</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
              One Dashboard.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-500">Every Blockchain.</span><br />
              Maximum Security.
            </h1>

            <p className="text-gray-400 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl">
              DeFi cross-chain analytics combined with contract security scores and smart route aggregation. Keep your assets secure and optimized in a single dashboard.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                rightIcon={ArrowRight}
                onClick={handleConnect}
              >
                Connect MetaMask
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleConnect}
              >
                Connect Phantom
              </Button>
            </div>
          </motion.div>

          {/* Hero Right Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 relative w-full h-[450px] xs:h-[500px] flex items-center justify-center lg:block"
          >
            {/* Wrapper to coordinate absolute items on desktop, standard stacked elements on small displays */}
            <div className="relative w-full max-w-lg h-full flex flex-col gap-4 lg:block">
              
              {/* Card 1: Connected Wallet Card */}
              <Card className="lg:absolute lg:top-4 lg:left-0 lg:w-[240px] shadow-2xl shadow-black/60 hover:-translate-y-1 transition-transform duration-300 border border-white/10">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-success rounded-full animate-ping" />
                    <CardTitle className="text-sm">Wallet Connected</CardTitle>
                  </div>
                  <Badge variant="primary" className="text-[10px] px-1.5 py-0">Ethereum</Badge>
                </CardHeader>
                <CardBody className="py-2.5 px-4">
                  <p className="text-xs text-gray-500 font-mono">0x71C...3A8e</p>
                  <h4 className="text-xl font-bold mt-1 text-text">32.45 ETH</h4>
                  <p className="text-[11px] text-gray-400">$84,370.00 USD</p>
                </CardBody>
              </Card>

              {/* Card 2: Security Score Card */}
              <Card className="lg:absolute lg:top-4 lg:right-4 lg:w-[200px] shadow-2xl shadow-black/60 hover:-translate-y-1 transition-transform duration-300 border border-white/10">
                <CardBody className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-400">Security Score</span>
                    <Badge variant="success" className="text-[10px]">Secure</Badge>
                  </div>
                  <div className="text-3xl font-extrabold text-success tracking-tight">94/100</div>
                  <ProgressBar value={94} variant="success" animated={false} />
                  <p className="text-[10px] text-gray-500">All allowances scan clear</p>
                </CardBody>
              </Card>

              {/* Card 3: Portfolio Value Card */}
              <Card className="lg:absolute lg:top-36 lg:left-1/4 lg:w-[270px] shadow-2xl shadow-black/80 hover:-translate-y-1 transition-transform duration-300 border border-white/10 z-10 bg-[#12121B]">
                <CardHeader className="py-3.5 px-5">
                  <div>
                    <CardTitle className="text-sm">Total Assets Value</CardTitle>
                    <CardSubtitle>Aggregated cross-chain</CardSubtitle>
                  </div>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardBody className="py-2 px-5">
                  <h3 className="text-2xl font-black text-text tracking-tight">$142,584.20</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-success font-semibold">+4.2%</span>
                    <span className="text-[10px] text-gray-500">last 24 hours</span>
                  </div>
                  {/* SVG mini chart representation */}
                  <div className="h-10 mt-3 flex items-end">
                    <svg className="w-full h-full text-primary" viewBox="0 0 100 30" fill="none">
                      <path
                        d="M0 25 C10 20, 20 10, 30 15 C40 20, 50 5, 60 8 C70 12, 80 2, 90 4 L100 0"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0 25 C10 20, 20 10, 30 15 C40 20, 50 5, 60 8 C70 12, 80 2, 90 4 L100 0 L100 30 L0 30 Z"
                        fill="currentColor"
                        fillOpacity="0.08"
                      />
                    </svg>
                  </div>
                </CardBody>
              </Card>

              {/* Card 4: Recent Activity List */}
              <Card className="lg:absolute lg:bottom-4 lg:right-0 lg:w-[280px] shadow-2xl shadow-black/60 hover:-translate-y-1 transition-transform duration-300 border border-white/10">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs uppercase tracking-wider text-gray-400">Live Scans</CardTitle>
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </CardHeader>
                <CardBody className="p-0">
                  <div className="divide-y divide-white/5">
                    <div className="p-3 px-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-text">Allowance Revoked</p>
                        <p className="text-[10px] text-gray-500">ERC-20 USDT Approval</p>
                      </div>
                      <Badge variant="success">Completed</Badge>
                    </div>
                    <div className="p-3 px-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-text">Contract Checked</p>
                        <p className="text-[10px] text-gray-500">Uniswap V4 Router</p>
                      </div>
                      <Badge variant="info">Secure</Badge>
                    </div>
                  </div>
                </CardBody>
              </Card>

            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. Feature Highlights Section */}
      <section id="features" className="py-24 bg-card/25 border-t border-b border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Features Built For Security</h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
              Decentralized analytics, scanner protocols, and portfolio routing engineered for Web3 power users.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} hover className="border border-white/5 hover:border-primary/20">
                  <CardBody className="space-y-4 p-6">
                    <div className={`p-3 rounded-xl border w-fit ${feat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-bold">{feat.title}</CardTitle>
                    <p className="text-sm text-gray-400 leading-relaxed">{feat.description}</p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-20">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">How It Works</h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Get comprehensive wallet analysis and execution insights in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center lg:items-start text-center lg:text-left">
              <Card className="w-full h-full border border-white/5 bg-card/60 p-6 relative">
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {step.num}
                </div>
                <CardBody className="p-0 pt-4 space-y-2">
                  <h4 className="font-bold text-text text-base">{step.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                </CardBody>
              </Card>

              {/* Connecting arrow/chevron on large desktop screens */}
              {idx < 3 && (
                <div className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 text-gray-600 z-10">
                  <ChevronRight className="h-6 w-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. Platform Statistics Section */}
      <section id="stats" className="py-24 bg-card/25 border-t border-b border-white/5 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border border-white/5 bg-card/40 text-center">
                <CardBody className="p-8 space-y-2">
                  <div className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {stat.label}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Supported Networks Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center space-y-3 mb-12">
          <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Multi-Chain Ecosystem</h3>
          <p className="text-sm text-gray-500">Aggregating intelligence and routes across leading layer-1 and layer-2 protocols.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
          {networks.map((net) => (
            <div
              key={net}
              className="bg-card border border-white/5 hover:border-primary/30 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 transition-colors select-none"
            >
              {net}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Call To Action Section */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <Card className="bg-gradient-to-br from-[#111118] via-[#16122d] to-[#111118] border border-primary/20 p-8 sm:p-12 text-center shadow-2xl shadow-primary/5">
          <CardBody className="space-y-6 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
              Ready to Secure Your Wallet?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Connect your decentralized Web3 credentials to start tracking asset distributions, allowance vulnerability risks, and cross-chain routes.
            </p>
            <div className="pt-4 flex justify-center">
              <Button
                variant="primary"
                size="lg"
                rightIcon={ArrowRight}
                className="w-full sm:w-auto px-8 py-4 shadow-xl shadow-primary/30 text-base font-bold transition-transform active:scale-95 hover:scale-[1.01]"
                onClick={() => navigate('/dashboard')}
              >
                Launch Dashboard
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* 8. Footer Section */}
      <footer className="border-t border-white/5 bg-card/10 py-12 text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-extrabold text-base tracking-wider text-text">CROSS-CHAIN</span>
            </div>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Decentralized multi-chain aggregation, smart route discovery, and real-time smart contract scanning powered by 0G.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-gray-300 uppercase text-xs tracking-wider">Resources</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-text transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-text transition-colors">How It Works</a></li>
              <li><Link to="/dashboard" className="hover:text-text transition-colors">Launch Dashboard</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-gray-300 uppercase text-xs tracking-wider">Community</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="https://github.com" target="_blank" className="hover:text-text transition-colors inline-flex items-center gap-1.5"><Github className="h-3 w-3" /> GitHub</a></li>
              <li><a href="https://twitter.com" target="_blank" className="hover:text-text transition-colors inline-flex items-center gap-1.5"><Twitter className="h-3 w-3" /> Twitter / X</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} Cross-Chain Wallet Intelligence Platform. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-text transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-text transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
