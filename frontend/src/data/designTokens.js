export const designTokens = {
  colors: {
    background: '#0A0A0F',
    card: '#111118',
    primary: '#7C3AED',
    success: '#10B981',
    danger: '#EF4444',
    text: '#F8FAFC',
  },
  
  borderRadius: {
    base: 'rounded-2xl', // 16px
    md: 'rounded-xl',
    sm: 'rounded-lg',
    full: 'rounded-full',
  },

  shadows: {
    base: 'shadow-lg shadow-black/20',
    primary: 'shadow-md shadow-primary/20',
    glow: 'shadow-[0_0_15px_rgba(124,58,237,0.15)]',
  },

  transitions: {
    default: 'transition-all duration-200 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
    fast: 'transition-all duration-150 ease-in-out',
  },

  spacing: {
    base: 'p-4 md:p-6',
    gap: 'gap-4',
    gapSm: 'gap-2',
    gapLg: 'gap-6',
  }
};
