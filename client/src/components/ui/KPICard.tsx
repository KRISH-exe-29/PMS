import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subtitle?: ReactNode;
  trend?: ReactNode;
  className?: string;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  iconColor = 'var(--color-primary)',
  iconBg = 'var(--color-primary-subtle)',
  subtitle,
  trend,
  className = '',
}: KPICardProps) {
  return (
    <motion.div
      aria-label="KPI Card"
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        transition: 'box-shadow 0.15s ease',
      }}
      whileHover={{ boxShadow: 'var(--shadow-md)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}>
            {title}
          </p>
          <p style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            {value}
          </p>
          {subtitle && (
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--space-1)',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: iconBg,
          color: iconColor,
          flexShrink: 0,
        }}>
          <Icon size={20} />
        </div>
      </div>
      {trend && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          {trend}
        </div>
      )}
    </motion.div>
  );
}
