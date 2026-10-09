import React from 'react';

interface KeyValueGridProps {
  items: { label: string; value: React.ReactNode }[];
  columns?: 2 | 3 | 4;
}

const COLUMNS = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' };

/** Label/value facts separated by hairlines, as on the dashboard claim card */
export const KeyValueGrid: React.FC<KeyValueGridProps> = ({ items, columns = 2 }) => (
  <dl className={`grid grid-cols-1 ${COLUMNS[columns]} gap-px bg-line border-y border-line`}>
    {items.map(({ label, value }) => (
      <div key={label} className={`bg-white px-5 py-3 min-w-0 ${columns === 2 ? 'sm:last:odd:col-span-2' : ''}`}>
        <dt className="text-[13px] text-muted">{label}</dt>
        <dd className="mt-0.5 font-semibold text-navy break-words">{value}</dd>
      </div>
    ))}
  </dl>
);
