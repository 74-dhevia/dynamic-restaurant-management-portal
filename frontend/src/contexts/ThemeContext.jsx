import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext();

export const MOOD_THEMES = {
  classic: { id: 'classic', name: 'Classic Zestro', accent: '#e8542a', accent2: '#ffb703', icon: '🍊', desc: 'Warm Tangerine & Amber' },
  fresh: { id: 'fresh', name: 'Fresh Mint', accent: '#10b981', accent2: '#84cc16', icon: '🌿', desc: 'Crisp Mint & Lime' },
  ocean: { id: 'ocean', name: 'Ocean Breeze', accent: '#0284c7', accent2: '#38bdf8', icon: '🌊', desc: 'Deep Azure & Sky Blue' },
  sunset: { id: 'sunset', name: 'Sunset Glow', accent: '#f97316', accent2: '#fbbf24', icon: '🌅', desc: 'Coral Fire & Golden Hour' },
  midnight: { id: 'midnight', name: 'Midnight Royal', accent: '#8b5cf6', accent2: '#c084fc', icon: '🌌', desc: 'Electric Violet & Lavender' },
  forest: { id: 'forest', name: 'Forest Emerald', accent: '#059669', accent2: '#34d399', icon: '🌲', desc: 'Pine Evergreen & Jade' },
  berry: { id: 'berry', name: 'Ruby Berry', accent: '#e11d48', accent2: '#fb7185', icon: '🌸', desc: 'Crimson Passion & Rose' },
  cyber: { id: 'cyber', name: 'Cyber Neon', accent: '#06b6d4', accent2: '#ec4899', icon: '⚡', desc: 'Cyberpunk Cyan & Hot Pink' },
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('zestro_theme') || 'system');
  const [mood, setMoodState] = useState(() => localStorage.getItem('zestro_visualMood') || 'classic');
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('zestro_fontSize') || 'medium');
  const [fontFamily, setFontFamilyState] = useState(() => localStorage.getItem('zestro_fontFamily') || 'System Default');
  const [highContrast, setHighContrastState] = useState(() => localStorage.getItem('zestro_highContrast') === 'true');
  const [reducedMotion, setReducedMotionState] = useState(() => localStorage.getItem('zestro_reducedMotion') === 'true');

  const resolveDark = useCallback(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [theme]);

  const [isDarkEffective, setIsDarkEffective] = useState(resolveDark);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = resolveDark();
    setIsDarkEffective(isDark);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.setAttribute('data-mood', mood);
    root.setAttribute('data-font-size', fontSize);
    root.setAttribute('data-high-contrast', String(highContrast));
    root.setAttribute('data-reduced-motion', String(reducedMotion));
    root.style.setProperty('--font-family-user', fontFamily === 'System Default'
      ? 'system-ui, -apple-system, sans-serif' : `'${fontFamily}', system-ui, sans-serif`);
    const m = MOOD_THEMES[mood] || MOOD_THEMES.classic;
    root.style.setProperty('--accent', m.accent);
    root.style.setProperty('--accent2', m.accent2);
  }, [theme, mood, fontSize, fontFamily, highContrast, reducedMotion, resolveDark]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const isDark = mq.matches;
      setIsDarkEffective(isDark);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (v) => { setThemeState(v); localStorage.setItem('zestro_theme', v); };
  const setMood = (v) => { setMoodState(v); localStorage.setItem('zestro_visualMood', v); };
  const setFontSize = (v) => { setFontSizeState(v); localStorage.setItem('zestro_fontSize', v); };
  const setFontFamily = (v) => { setFontFamilyState(v); localStorage.setItem('zestro_fontFamily', v); };
  const setHighContrast = (v) => { setHighContrastState(v); localStorage.setItem('zestro_highContrast', String(v)); };
  const setReducedMotion = (v) => { setReducedMotionState(v); localStorage.setItem('zestro_reducedMotion', String(v)); };

  const toggleTheme = () => {
    const nextTheme = isDarkEffective ? 'light' : 'dark';
    setTheme(nextTheme);
    return nextTheme;
  };

  const value = useMemo(() => ({
    theme, setTheme, toggleTheme, isDark: isDarkEffective,
    mood, setMood, fontSize, setFontSize, fontFamily, setFontFamily,
    highContrast, setHighContrast, reducedMotion, setReducedMotion,
    moodOptions: Object.keys(MOOD_THEMES),
    moodThemes: MOOD_THEMES,
  }), [theme, isDarkEffective, mood, fontSize, fontFamily, highContrast, reducedMotion]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
