import React from 'react';

export interface TabItem<T extends string> {
  id: T;
  /** Optional DOM id for the tab button */
  domId?: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}

/** Underlined section tabs, horizontally scrollable on small screens */
export const TabBar = <T extends string>({ tabs, activeId, onChange, ariaLabel }: TabBarProps<T>) => (
  <div className="border-b border-line overflow-x-auto" role="tablist" aria-label={ariaLabel}>
    <div className="flex gap-1 min-w-max">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            id={tab.domId}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-3 py-3 text-[15px] whitespace-nowrap transition-colors ${
              active ? 'text-navy font-semibold' : 'text-muted hover:text-ink'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`min-w-5 rounded-full px-1.5 text-xs leading-5 text-center ${
                  active ? 'bg-navy text-white' : 'bg-offwhite text-muted border border-line'
                }`}
              >
                {tab.count}
              </span>
            )}
            {active && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-brand-dark" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  </div>
);

interface ChipProps {
  id?: string;
  active?: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}

/** Filter chip for narrowing lists */
export const Chip: React.FC<ChipProps> = ({ id, active = false, count, onClick, children }) => (
  <button
    id={id}
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 min-h-11 rounded-full border px-4 text-sm whitespace-nowrap transition-colors ${
      active ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink hover:bg-offwhite'
    }`}
  >
    {children}
    {count !== undefined && <span className={active ? 'text-white/75' : 'text-muted'}>{count}</span>}
  </button>
);
