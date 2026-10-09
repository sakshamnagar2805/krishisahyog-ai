import React, { useEffect, useRef, useState } from 'react';
import { Mic, Bell, Check, ChevronDown, Menu, Sprout, Languages, LogOut, UserRound } from 'lucide-react';
import { User, LanguageCode, UserRole, Notification } from '../../types';
import { DIALECT_OPTIONS } from '../../utils/constants';

interface HeaderProps {
  currentUser: User;
  onRoleChange?: (role: UserRole) => void;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onOpenVoiceGuide: () => void;
  notifications: Notification[];
  onNavigate: (route: string) => void;
  onMarkNotificationRead?: (notificationId: string) => void;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

type OpenMenu = 'language' | 'notifications' | 'user' | null;

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: 'Farmer',
  pacs: 'PACS operator',
  officer: 'Agriculture officer',
  admin: 'Administrator',
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleChange,
  currentLanguage,
  onLanguageChange,
  onOpenVoiceGuide,
  notifications,
  onNavigate,
  onMarkNotificationRead,
  onLogout,
  onToggleMobileMenu,
}) => {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const headerRef = useRef<HTMLElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeLanguage = DIALECT_OPTIONS.find((d) => d.code === currentLanguage) || DIALECT_OPTIONS[2];

  const toggle = (menu: OpenMenu) => setOpenMenu((current) => (current === menu ? null : menu));

  useEffect(() => {
    if (!openMenu) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [openMenu]);

  const menuPanel = 'absolute right-0 mt-2 bg-white text-ink border border-line rounded-lg shadow-lg z-50 overflow-hidden';

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 h-16 bg-navy text-white shadow-[inset_0_-3px_0_var(--color-brand)]"
    >
      <div className="h-full px-3 sm:px-5 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 -ml-1 rounded-md hover:bg-white/10"
              aria-label="Toggle navigation menu"
              id="header-mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 min-w-0 rounded-md text-left"
            id="header-brand-logo"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-dark">
              <Sprout className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold leading-none tracking-tight">KrishiSahyog</span>
              <span className="hidden sm:block text-xs text-white/65 leading-none mt-1 truncate">
                Farmer services assistant
              </span>
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          {/* Language */}
          <div className="relative">
            <button
              onClick={() => toggle('language')}
              className="flex items-center gap-1.5 h-10 px-2 sm:px-2.5 rounded-md text-sm font-medium hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'language'}
              title="Change language"
            >
              <Languages className="w-4 h-4 text-white/70" aria-hidden="true" />
              <span className="hidden sm:inline">{activeLanguage.name}</span>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-white/60" aria-hidden="true" />
            </button>
            {openMenu === 'language' && (
              <div className={`${menuPanel} w-56 py-1`} role="menu">
                {DIALECT_OPTIONS.map((d) => (
                  <button
                    key={d.code}
                    role="menuitemradio"
                    aria-checked={currentLanguage === d.code}
                    onClick={() => {
                      onLanguageChange(d.code as LanguageCode);
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-offwhite"
                  >
                    <span>
                      {d.name} <span className="text-muted">· {d.label.split(' (')[0]}</span>
                    </span>
                    {currentLanguage === d.code && <Check className="w-4 h-4 text-brand-dark" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice assistant */}
          <button
            onClick={onOpenVoiceGuide}
            className="flex items-center gap-2 h-10 px-3 rounded-md bg-brand-dark hover:bg-brand-dark/90 text-sm font-semibold"
            title="Start Interactive Rural Voice Assistant"
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">Ask by voice</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => toggle('notifications')}
              className="relative flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10"
              aria-haspopup="dialog"
              aria-expanded={openMenu === 'notifications'}
              title="Civic Alerts & Notifications"
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-danger text-[11px] font-semibold leading-4 text-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {openMenu === 'notifications' && (
              <div className={`${menuPanel} max-sm:fixed max-sm:inset-x-3 max-sm:top-16 sm:w-[22rem]`}>
                <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                  <span className="font-semibold text-navy">Notifications</span>
                  <span className="text-sm text-muted">{unreadCount} unread</span>
                </div>
                <ul className="max-h-80 overflow-y-auto divide-y divide-line">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => {
                          if (!n.read) onMarkNotificationRead?.(n.id);
                          if (n.actionRoute) onNavigate(n.actionRoute);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-offwhite flex gap-3 ${!n.read ? 'bg-blue-soft/60' : ''}`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.read ? 'bg-line' : n.isUrgent ? 'bg-danger' : 'bg-brand'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-ink leading-snug">{n.title}</span>
                          <span className="block text-[13px] text-muted mt-0.5">{n.timestamp}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-line bg-offwhite">
                  <button
                    onClick={() => {
                      onNavigate('notifications');
                      setOpenMenu(null);
                    }}
                    className="text-sm font-semibold text-brand-dark hover:underline underline-offset-4"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account */}
          <div className="relative">
            <button
              onClick={() => toggle('user')}
              className="flex items-center gap-2 h-10 pl-1 pr-2 rounded-md hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'user'}
              title="Citizen Profile and Session Options"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy text-sm font-semibold">
                {initials(currentUser.name)}
              </span>
              <span className="hidden xl:block text-left leading-tight">
                <span className="block text-sm font-medium max-w-[160px] truncate">{currentUser.name}</span>
                <span className="block text-xs text-white/65">{ROLE_LABELS[currentUser.role]}</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/60" aria-hidden="true" />
            </button>
            {openMenu === 'user' && (
              <div className={`${menuPanel} w-72`} role="menu">
                <div className="px-4 py-3 border-b border-line">
                  <div className="font-semibold text-navy">{currentUser.name}</div>
                  <div className="text-sm text-muted">{currentUser.location || currentUser.jurisdiction}</div>
                  <div className="text-[13px] text-muted mt-0.5">ID {currentUser.badgeId}</div>
                </div>

                <button
                  role="menuitem"
                  onClick={() => {
                    onNavigate('profile');
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-offwhite"
                >
                  <UserRound className="w-4 h-4 text-muted" aria-hidden="true" /> Profile and settings
                </button>

                {onLogout && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 border-t border-line"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
