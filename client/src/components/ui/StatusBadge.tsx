import type { ReactNode } from 'react';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary' | 'neutral';

interface StatusBadgeProps {
  variant: StatusVariant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const variantMap: Record<StatusVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-destructive',
  info: 'badge-primary',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  neutral: 'badge-secondary',
};

export default function StatusBadge({
  variant,
  children,
  icon,
  className = '',
}: StatusBadgeProps) {
  return (
    <span className={`badge ${variantMap[variant]} ${className}`}>
      {icon && <span style={{ display: 'inline-flex', marginRight: 'var(--space-1)' }}>{icon}</span>}
      {children}
    </span>
  );
}

/** Helper: map common status strings to badge variants */
export function getStatusVariant(status: string): StatusVariant {
  const s = status?.toLowerCase().trim() || '';
  if (['completed', 'paid', 'active', 'sent'].includes(s)) return 'success';
  if (['in progress', 'started'].includes(s)) return 'info';
  if (['not started', 'inactive', 'not paid'].includes(s)) return 'secondary';
  if (['blocked', 'on hold', 'hold', 'failed', 'overdue'].includes(s)) return 'danger';
  if (['on leave', 'pending'].includes(s)) return 'warning';
  return 'neutral';
}

export type { StatusVariant };
