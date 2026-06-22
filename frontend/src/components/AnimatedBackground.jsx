import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function AnimatedBackground() {
  // Screen/Window dimensions state
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse coordinates tracking
  const mouseX = useMotionValue(windowSize.width / 2);
  const mouseY = useMotionValue(windowSize.height / 2);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Smooth spring physics for lag-free parallax movement
  const springX = useSpring(mouseX, { damping: 70, stiffness: 120 });
  const springY = useSpring(mouseY, { damping: 70, stiffness: 120 });

  // Transforms to shift layers in opposition to the mouse (parallax displacement)
  const xOffset = useTransform(springX, [0, windowSize.width], [12, -12]);
  const yOffset = useTransform(springY, [0, windowSize.height], [12, -12]);

  const gridX = useTransform(xOffset, x => x * 0.25);
  const gridY = useTransform(yOffset, y => y * 0.20);

  const graphsX = useTransform(xOffset, x => x * 0.6);
  const graphsY = useTransform(yOffset, y => y * 0.4);

  const particlesX = useTransform(xOffset, x => x * 1.0);
  const particlesY = useTransform(yOffset, y => y * 0.8);

  // Aurora glow follows cursor softly (glow position)
  const auroraX = useTransform(springX, x => x - 300);
  const auroraY = useTransform(springY, y => y - 300);

  // Jagged Zig-Zag coordinates to match the stock market screenshot
  const pointsPurple = [360, 220, 480, 260, 380, 180, 500, 360]; // Graph 1 (Purple - bottom)
  const pointsCyan = [440, 540, 320, 480, 370, 560, 340, 440];   // Graph 2 (Cyan - middle)
  const pointsEmerald = [180, 280, 120, 220, 260, 150, 200, 180]; // Graph 3 (Emerald - top)

  // Generates double-length looping Zig-Zag path
  const generateZigZagPath = (points) => {
    const n = points.length;
    const dx = 1200 / (n - 1);
    
    let d = `M 0 ${points[0]}`;
    // Cycle 1 (0 to 1200)
    for (let i = 1; i < n; i++) {
      d += ` L ${i * dx} ${points[i]}`;
    }
    // Cycle 2 (1200 to 2400)
    for (let i = 0; i < n; i++) {
      d += ` L ${1200 + i * dx} ${points[i]}`;
    }
    return d;
  };

  const pathPurple = generateZigZagPath(pointsPurple);
  const pathCyan = generateZigZagPath(pointsCyan);
  const pathEmerald = generateZigZagPath(pointsEmerald);

  // Render nodes (circles) at purple graph joint coordinates
  const renderPurpleNodes = () => {
    const n = pointsPurple.length;
    const dx = 1200 / (n - 1);
    const nodes = [];
    for (let cycle = 0; cycle < 2; cycle++) {
      const offsetX = cycle * 1200;
      pointsPurple.forEach((y, idx) => {
        if (cycle === 1 && idx === 0) return; // avoid duplicate boundary node
        nodes.push(
          <circle
            key={`purp-node-${cycle}-${idx}`}
            cx={offsetX + idx * dx}
            cy={y}
            r="4.5"
            fill="#C084FC"
            stroke="#FFF"
            strokeWidth="1.5"
            filter="drop-shadow(0 0 5px #7C3AED)"
          />
        );
      });
    }
    return nodes;
  };

  // Render nodes (circles) at cyan graph joint coordinates
  const renderCyanNodes = () => {
    const n = pointsCyan.length;
    const dx = 1200 / (n - 1);
    const nodes = [];
    for (let cycle = 0; cycle < 2; cycle++) {
      const offsetX = cycle * 1200;
      pointsCyan.forEach((y, idx) => {
        if (cycle === 1 && idx === 0) return; // avoid duplicate boundary node
        nodes.push(
          <circle
            key={`cyan-node-${cycle}-${idx}`}
            cx={offsetX + idx * dx}
            cy={y}
            r="4"
            fill="#22D3EE"
            stroke="#FFF"
            strokeWidth="1"
            filter="drop-shadow(0 0 4px #22D3EE)"
          />
        );
      });
    }
    return nodes;
  };

  // Generate Candlestick volume bars to render under graphs (2400px width total)
  const renderCandlesticks = () => {
    const candles = [];
    const count = 75;
    const dx = 2400 / count;
    for (let i = 0; i < count; i++) {
      const x = i * dx + 15;
      // Group heights using sine/cos frequencies
      const height = 40 + Math.sin(i * 0.15) * 35 + Math.cos(i * 0.08) * 15;
      const bodyHeight = 15 + Math.cos(i * 0.2) * 20;
      const wickHeight = height + 10 + Math.sin(i * 1.5) * 6;
      
      const yCenter = 550 - height; // baseline around Y=550
      const yTop = yCenter - bodyHeight / 2;
      const yWickTop = yCenter - wickHeight / 2;
      const yWickBottom = yCenter + wickHeight / 2;
      
      candlesticks.push(
        <g key={i} opacity="0.10">
          {/* Wick */}
          <line x1={x} y1={yWickTop} x2={x} y2={yWickBottom} stroke="#38BDF8" strokeWidth="1" />
          {/* Body */}
          <rect x={x - 2.5} y={yTop} width="5" height={bodyHeight} fill="#0284C7" rx="0.5" />
        </g>
      );
    }
    return candles;
  };
  
  const candlesticks = [];
  renderCandlesticks();

  // Floating star flares at the bottom
  const starFlares = [
    { x: 230, y: 710, delay: 0 },
    { x: 480, y: 740, delay: 1.2 },
    { x: 820, y: 720, delay: 0.6 }
  ];

  // Floating telemetry numbers
  const telemetryData = ['44.291', '63.772', '26.417', '44.870', '20.556', '12.002', '16.381'];

  return (
    <>
      {/* Deep Space Background Container */}
      <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden pointer-events-none select-none bg-gradient-to-b from-[#020204] via-[#060912] to-[#030307]">
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
      </div>

      {/* Aurora Bloom follows cursor */}
      <motion.div
        className="fixed w-[600px] h-[600px] rounded-full bg-radial from-blue-500/2.5 to-transparent blur-[120px] pointer-events-none -z-40"
        style={{ left: auroraX, top: auroraY }}
      />

      {/* 2D Grid Layer (Fills screen, shifts with gridX/Y) */}
      <motion.div
        className="fixed inset-0 -z-30 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(34, 211, 238, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 211, 238, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          x: gridX,
          y: gridY
        }}
      />

      {/* Scrolling & Floating Scene Container */}
      <div className="fixed inset-0 w-full h-full -z-25 overflow-hidden pointer-events-none select-none">
        
        {/* Animated Market Graphs & Candlesticks */}
        <motion.svg 
          className="absolute inset-0 w-[200%] h-full opacity-100" 
          viewBox="0 0 2400 800" 
          preserveAspectRatio="none"
          style={{ x: graphsX, y: graphsY }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="purple-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="cyan-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="emerald-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            <linearGradient id="purple-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cyan-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="emerald-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Underlay Candlestick layer (scrolls along with the curves) */}
          <motion.g
            animate={{ x: [-1200, 0] }}
            transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
          >
            {candlesticks}
          </motion.g>

          {/* Graph 1 (Purple - Bottom, Floating) */}
          <motion.g 
            style={{ opacity: 0.15 }}
            animate={{ y: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
          >
            <motion.path
              d={`${pathPurple} L 2400 800 L 0 800 Z`}
              fill="url(#purple-area)"
              animate={{ x: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 80, ease: 'linear' }}
            />
            <motion.path
              d={pathPurple}
              fill="none"
              stroke="url(#purple-glow)"
              strokeWidth="3.5"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              filter="drop-shadow(0 0 5px rgba(124, 58, 237, 0.5))"
              animate={{ x: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 80, ease: 'linear' }}
            />
            {/* Joint dots */}
            <motion.g
              animate={{ x: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 80, ease: 'linear' }}
            >
              {renderPurpleNodes()}
            </motion.g>
          </motion.g>

          {/* Graph 2 (Cyan - Middle, Floating) */}
          <motion.g 
            style={{ opacity: 0.10 }}
            animate={{ y: [0, -6, 6, 0] }}
            transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
          >
            <motion.path
              d={`${pathCyan} L 2400 800 L 0 800 Z`}
              fill="url(#cyan-area)"
              animate={{ x: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 55, ease: 'linear' }}
            />
            <motion.path
              d={pathCyan}
              fill="none"
              stroke="url(#cyan-glow)"
              strokeWidth="2.5"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              filter="drop-shadow(0 0 4px rgba(34, 211, 238, 0.45))"
              animate={{ x: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 55, ease: 'linear' }}
            />
            {/* Joint dots */}
            <motion.g
              animate={{ x: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 55, ease: 'linear' }}
            >
              {renderCyanNodes()}
            </motion.g>
          </motion.g>

          {/* Graph 3 (Emerald/Green - Top, Floating) */}
          <motion.g 
            style={{ opacity: 0.10 }}
            animate={{ y: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          >
            <motion.path
              d={`${pathEmerald} L 2400 800 L 0 800 Z`}
              fill="url(#emerald-area)"
              animate={{ x: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 35, ease: 'linear' }}
            />
            <motion.path
              d={pathEmerald}
              fill="none"
              stroke="url(#emerald-glow)"
              strokeWidth="2.5"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              filter="drop-shadow(0 0 6px rgba(16, 185, 129, 0.55))"
              animate={{ x: [-1200, 0] }}
              transition={{ repeat: Infinity, duration: 35, ease: 'linear' }}
            />
          </motion.g>

          {/* Floating Star Flares */}
          {starFlares.map((f, idx) => (
            <g key={idx} className="opacity-55">
              <motion.circle
                cx={f.x}
                cy={f.y}
                r="10"
                fill="#22D3EE"
                opacity="0.15"
                filter="blur(4px)"
                animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.45, 0.15] }}
                transition={{ repeat: Infinity, duration: 3.5, delay: f.delay, ease: 'easeInOut' }}
              />
              <circle cx={f.x} cy={f.y} r="1.5" fill="#FFF" />
              <line x1={f.x - 8} y1={f.y} x2={f.x + 8} y2={f.y} stroke="#FFF" strokeWidth="0.5" opacity="0.8" />
              <line x1={f.x} y1={f.y - 8} x2={f.x} y2={f.y + 8} stroke="#FFF" strokeWidth="0.5" opacity="0.8" />
            </g>
          ))}
        </motion.svg>

        {/* Telemetry numbers floating and shifting */}
        <div className="absolute inset-0">
          {telemetryData.map((val, idx) => {
            const x = 70 + (idx * 250) % 1000;
            const y = 140 + (idx * 130) % 400;
            const color = idx % 2 === 0 ? 'text-emerald-400/20' : 'text-cyan-400/20';
            return (
              <motion.div
                key={idx}
                className={`absolute font-mono text-[10px] ${color} pointer-events-none select-none font-semibold`}
                style={{ left: x, top: y }}
                animate={{
                  opacity: [0, 0.4, 0.4, 0],
                  y: [0, -35],
                  x: [0, Math.sin(idx) * 10]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 9,
                  delay: idx * 2,
                  ease: 'easeInOut'
                }}
              >
                {val}
              </motion.div>
            );
          })}
        </div>

        {/* Rising Particles */}
        <motion.div 
          className="absolute inset-0" 
          style={{ x: particlesX, y: particlesY }}
        >
          {Array.from({ length: 12 }).map((_, idx) => {
            const size = 1.2 + (idx % 3) * 0.8;
            const left = (idx * 9) % 95;
            const delay = idx * 1.5;
            const duration = 12 + (idx % 4) * 4;
            
            return (
              <motion.div
                key={idx}
                className="absolute bg-cyan-400/15 rounded-full pointer-events-none"
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`,
                  bottom: '-10px',
                }}
                animate={{
                  y: [0, -windowSize.height - 40],
                  opacity: [0, 0.45, 0.45, 0]
                }}
                transition={{
                  repeat: Infinity,
                  duration: duration,
                  delay: delay,
                  ease: 'linear'
                }}
              />
            );
          })}
        </motion.div>

        {/* Live volume bars at the very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-between px-6 pointer-events-none opacity-20">
          {Array.from({ length: 28 }).map((_, idx) => {
            const baseHeight = 10 + Math.cos(idx) * 25;
            const duration = 1.2 + Math.sin(idx) * 0.4;
            const delay = idx * 0.15;

            return (
              <motion.div
                key={idx}
                className="w-[2px] bg-gradient-to-t from-cyan-500/10 via-cyan-500/40 to-blue-500/60 rounded-full shrink-0"
                style={{ height: baseHeight }}
                animate={{
                  height: [baseHeight, baseHeight * 2.4, baseHeight * 0.5, baseHeight]
                }}
                transition={{
                  repeat: Infinity,
                  duration: duration,
                  delay: delay,
                  ease: 'easeInOut'
                }}
              />
            );
          })}
        </div>

      </div>

      {/* Subtle cursor glassy reflection */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-30 opacity-15"
        style={{
          background: `radial-gradient(550px circle at ${springX}px ${springY}px, rgba(255, 255, 255, 0.015), rgba(124, 58, 237, 0.005) 50%, transparent 100%)`
        }}
      />
    </>
  );
}
