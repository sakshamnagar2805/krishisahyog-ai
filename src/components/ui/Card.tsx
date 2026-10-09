import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article';
}

export const Card: React.FC<CardProps> = ({ as: Tag = 'section', className = '', children, ...props }) => (
  <Tag className={`bg-white border border-line rounded-lg ${className}`} {...props}>
    {children}
  </Tag>
);

interface CardHeaderProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, description, icon, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4">
    <div className="flex items-start gap-3 min-w-0">
      {icon && (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-soft text-navy">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold leading-tight text-navy">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, description, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
    <div>
      <h2 className="font-display text-xl font-semibold text-navy">{title}</h2>
      {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
    </div>
    {action}
  </div>
);
