import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Small text above the title, e.g. the parent section */
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, eyebrow, actions }) => (
  <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && <p className="text-sm text-muted">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-semibold text-navy tracking-tight mt-0.5">{title}</h1>
      {description && <p className="text-[15px] text-muted mt-1.5 max-w-3xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
  </header>
);
