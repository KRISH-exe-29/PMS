import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`page-header ${className}`}>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        letterSpacing: '-0.02em',
      }}>
        {title}
      </h1>
      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
