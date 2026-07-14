import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        {icon || <Inbox />}
      </div>
      <p className="empty-state-title">{title}</p>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && <div style={{ marginTop: 'var(--space-3)' }}>{action}</div>}
    </div>
  );
}
