import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Column<T> {
  key: string;
  header: ReactNode;
  render: (item: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  skeletonRows?: number;
  emptyState?: ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
}

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  emptyState,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={`table-container ${className}`}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ textAlign: col.align || 'left', width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <div className="skeleton skeleton-text" style={{ margin: 0, width: '80%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={`table-container ${className}`}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ textAlign: col.align || 'left', width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: col.align || 'left', width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.04 }}
        >
          {data.map((item, index) => (
            <motion.tr
              key={keyExtractor(item, index)}
              variants={rowVariants}
              transition={{ duration: 0.2 }}
              onClick={() => onRowClick?.(item)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                  {col.render(item, index)}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

export type { Column, DataTableProps };
