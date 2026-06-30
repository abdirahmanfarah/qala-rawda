'use client';

import { useEffect, useState } from 'react';

// Inline script to prevent flash of wrong theme
export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('qr_theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()`,
      }}
    />
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('qr_theme') || 'light';
    setTheme(saved);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('qr_theme', next);
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  return (
    <button className="theme-toggle" onClick={toggle} title="Day / Night">
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  );
}
