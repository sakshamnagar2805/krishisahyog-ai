import React from 'react';
import { Sprout } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  /** The language grid uses a wide card; the sign-in steps use a narrow one */
  width?: 'narrow' | 'wide';
}

/** Full-screen layout for the sign-in steps, shown before the app header and sidebar exist */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, width = 'narrow' }) => (
  <div className="min-h-screen bg-offwhite text-ink flex flex-col selection:bg-brand-light selection:text-navy">
    <header className="h-14 bg-navy text-white shadow-[inset_0_-3px_0_var(--color-brand)]">
      <div className="h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-dark">
          <Sprout className="w-5 h-5" aria-hidden="true" />
        </span>
        <span className="font-display text-lg font-semibold leading-none tracking-tight">KrishiSahyog</span>
      </div>
    </header>

    <main
      className={`flex-1 w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center ${
        width === 'wide' ? 'max-w-4xl' : 'max-w-md'
      }`}
    >
      {children}
    </main>

    <footer className="border-t border-line px-4 py-4 text-center text-[13px] text-muted">
      Prototype for Smart India Hackathon 2026 · Not a Government of India service
    </footer>
  </div>
);
