import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Store,
  Users,
  Landmark,
  Wallet,
  Sprout,
  FolderOpen,
  MessageSquareWarning,
  Bell,
  Mic,
  UserRound,
  Settings2,
  Phone,
  LucideIcon,
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  unreadNotifications?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

const ALL: UserRole[] = ['farmer', 'pacs', 'officer', 'admin'];

const NAV_GROUPS: { title?: string; items: NavItem[] }[] = [
  {
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL }],
  },
  {
    title: 'Services',
    items: [
      { id: 'pmfby-crop-insurance', label: 'Crop insurance (PMFBY)', icon: ShieldCheck, roles: ['farmer', 'officer', 'admin'] },
      { id: 'pacs-services', label: 'PACS services', icon: Store, roles: ['farmer', 'pacs', 'admin'] },
      { id: 'government-schemes', label: 'Government schemes', icon: Landmark, roles: ['farmer', 'officer', 'admin'] },
      { id: 'farmer-policies', label: 'Farmer policies & notices', icon: Bell, roles: ALL },
      { id: 'cooperative-schemes', label: 'Cooperative schemes', icon: Users, roles: ['farmer', 'pacs', 'admin'] },
      { id: 'credit-and-financial-assistance', label: 'Credit and KCC loans', icon: Wallet, roles: ['farmer', 'admin'] },
      { id: 'agriculture-support', label: 'Agriculture support', icon: Sprout, roles: ['farmer', 'officer', 'admin'] },
    ],
  },
  {
    title: 'My records',
    items: [
      { id: 'document-locker', label: 'Documents', icon: FolderOpen, roles: ['farmer', 'pacs', 'admin'] },
      { id: 'grievance-redressal', label: 'Grievances', icon: MessageSquareWarning, roles: ALL },
      { id: 'notifications', label: 'Notifications', icon: Bell, roles: ALL },
    ],
  },
  {
    title: 'Help',
    items: [
      { id: 'ai-and-voice-assistant', label: 'Voice and AI assistant', icon: Mic, roles: ALL },
      { id: 'profile', label: 'Profile', icon: UserRound, roles: ALL },
    ],
  },
  {
    title: 'Administration',
    items: [{ id: 'admin-governance', label: 'Admin and governance', icon: Settings2, roles: ['admin'] }],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  mobileOpen = false,
  onCloseMobile,
  unreadNotifications = 0,
}) => {
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(userRole)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {mobileOpen && (
        <div onClick={onCloseMobile} className="fixed inset-0 bg-navy/40 z-30 lg:hidden" aria-hidden="true" />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 w-72 bg-white border-r border-line z-30 flex flex-col overflow-y-auto transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Main navigation"
      >
        <nav className="flex-1 px-3 py-4 space-y-5">
          {groups.map((group, index) => (
            <div key={group.title ?? index}>
              {group.title && (
                <div className="px-3 pb-1.5 text-[13px] font-medium text-muted">{group.title}</div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'ai-and-voice-assistant' && activeTab === 'voice-assistant') ||
                    (item.id === 'document-locker' && activeTab === 'documents');
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile?.();
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`relative w-full flex items-center gap-3 min-h-11 px-3 rounded-md text-[15px] text-left transition-colors ${
                          isActive
                            ? 'bg-brand-light text-navy font-semibold'
                            : 'text-ink hover:bg-offwhite'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand-dark" aria-hidden="true" />
                        )}
                        <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-brand-dark' : 'text-muted'}`} aria-hidden="true" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.id === 'notifications' && unreadNotifications > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-navy text-white text-xs font-semibold leading-5 text-center">
                            {unreadNotifications}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="m-3 p-4 rounded-lg bg-offwhite border border-line">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Phone className="w-4 h-4 text-brand-dark" aria-hidden="true" /> Kisan Call Centre
          </div>
          <a href="tel:18001801551" className="block mt-1 text-base font-semibold text-ink tabular-nums hover:underline">
            1800-180-1551
          </a>
          <p className="text-[13px] text-muted mt-0.5">Toll-free helpline for farmers</p>
        </div>
      </aside>
    </>
  );
};
