import { Crop, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'blue';

const THEMES: { id: Theme; label: string; icon: string; bg: string; active: string }[] = [
  { id: 'light', label: 'Light', icon: '☀️', bg: 'bg-amber-50 border-amber-200', active: 'bg-amber-400 text-white border-amber-400' },
  { id: 'dark',  label: 'Dark',  icon: '🌙', bg: 'bg-slate-100 border-slate-300', active: 'bg-slate-700 text-white border-slate-700' },
  { id: 'blue',  label: 'Blue',  icon: '💎', bg: 'bg-blue-50 border-blue-200',   active: 'bg-blue-500 text-white border-blue-500' },
];

export function AppHeader() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('app-theme') as Theme) || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-blue');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    <header className="flex h-[52px] items-center justify-between border-b border-border bg-card/90 backdrop-blur-sm px-4 sticky top-0 z-50 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
          <Crop className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
            Image Crop &amp; Resize
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
            Browser-native · No uploads
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Privacy badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-privacy/10 px-3 py-1.5 text-[11px] font-medium text-privacy border border-privacy/20">
          <Shield className="h-3 w-3" />
          <span className="hidden sm:inline">Privacy-first · 100% client-side</span>
          <span className="sm:hidden">Private</span>
        </div>

        {/* Theme switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
                border transition-all duration-200
                ${theme === t.id
                  ? t.active
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              <span style={{ fontSize: '12px' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
