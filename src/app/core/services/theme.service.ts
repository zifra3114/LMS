import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'lms-theme';

  readonly theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Apply theme to document on changes
    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
    });
  }

  toggleTheme(): void {
    this.theme.set(this.theme() === 'light' ? 'dark' : 'light');
    this.saveTheme(this.theme());
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.saveTheme(theme);
  }

  private getInitialTheme(): Theme {
    // Check localStorage first
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private saveTheme(theme: Theme): void {
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
