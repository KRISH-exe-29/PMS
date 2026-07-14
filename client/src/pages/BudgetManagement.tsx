import { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IndianRupee, Wallet, TrendingDown } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import FormModal from '../components/ui/FormModal';
import EmptyState from '../components/ui/EmptyState';
import KPICard from '../components/ui/KPICard';

export default function BudgetManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (projectsError) throw projectsError;

      const { data: billingsData, error: billingsError } = await supabase.from('billings').select('project_id, invoice_amount');
      if (billingsError) throw billingsError;

      // Group billings by project_id
      const billingSums: Record<string, number> = {};
      if (billingsData) {
        billingsData.forEach((b: any) => {
          if (b.project_id) {
            billingSums[b.project_id] = (billingSums[b.project_id] || 0) + (Number(b.invoice_amount) || 0);
          }
        });
      }
      
      const formattedProjects = projectsData?.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        budget: p.budget,
        actualCost: billingSums[p.id] || 0, // Force UI to use Billing sum
        endDate: p.end_date
      })) || [];
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching budget projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPlannedBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
  const actualCost = projects.reduce((sum, p) => sum + (Number(p.actualCost) || 0), 0);
  const remainingBudget = totalPlannedBudget - actualCost;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed': return <StatusBadge variant="success">{status}</StatusBadge>;
      case 'In Progress': return <StatusBadge variant="primary">{status}</StatusBadge>;
      case 'Started': return <StatusBadge variant="secondary">{status}</StatusBadge>;
      default: return <StatusBadge variant="secondary">{status}</StatusBadge>;
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Project Name',
      render: (p) => <span className="font-medium text-[var(--color-text-primary)]">{p.name}</span>,
    },
    {
      key: 'code',
      header: 'Project Code',
      render: (p) => p.code,
    },
    {
      key: 'budget',
      header: 'Planned Budget',
      align: 'right',
      render: (p) => `₹ ${(Number(p.budget) || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'actualCost',
      header: 'Actual Cost',
      align: 'right',
      render: (p) => `₹ ${(Number(p.actualCost) || 0).toLocaleString('en-IN')}`,
    },
    {
      key: 'balancedCost',
      header: 'Balanced Cost',
      align: 'right',
      render: (p) => (
        <span style={{ color: ((Number(p.budget) || 0) - (Number(p.actualCost) || 0)) < 0 ? 'var(--color-danger)' : 'inherit' }}>
          ₹ {((Number(p.budget) || 0) - (Number(p.actualCost) || 0)).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => getStatusBadge(p.status)
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button 
            className="action-btn action-btn-primary" 
            title="View"
            onClick={() => { setCurrentProject(p); setIsViewModalOpen(true); }}
          >
            <Eye size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        <KPICard 
          title="Total Planned Budget" 
          value={`₹ ${totalPlannedBudget.toLocaleString('en-IN')}`} 
          subtitle="Auto Calculated from Projects"
          icon={Wallet}
        />
        <KPICard 
          title="Actual Cost" 
          value={`₹ ${actualCost.toLocaleString('en-IN')}`} 
          iconColor="var(--color-warning)"
          iconBg="var(--color-warning-subtle)"
          subtitle="Auto Calculated"
          icon={TrendingDown}
        />
        <KPICard 
          title="Remaining Budget" 
          value={`₹ ${remainingBudget.toLocaleString('en-IN')}`} 
          iconColor="var(--color-success)"
          iconBg="var(--color-success-subtle)"
          subtitle="Auto Calculated"
          icon={IndianRupee}
        />
      </div>

      <PageHeader title="Budget Management">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search projects..."
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </PageHeader>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filteredProjects}
          keyExtractor={(p) => p.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<Wallet size={48} />}
              title="No projects found"
              description="Adjust your search or create a new project in the Projects screen."
            />
          }
        />
      </div>

      <FormModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Project Budget View"
        maxWidth="800px"
        footer={
          <button type="button" className="btn" style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-primary)' }} onClick={() => setIsViewModalOpen(false)}>
            Close Window
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{currentProject.name}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Budget & Financial Overview</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', borderBottom: '4px solid var(--color-primary)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Planned Budget</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹ {(Number(currentProject.budget) || 0).toLocaleString('en-IN')}</p>
            </div>
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', borderBottom: '4px solid var(--color-warning)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Actual Cost</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹ {(Number(currentProject.actualCost) || 0).toLocaleString('en-IN')}</p>
            </div>
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', borderBottom: '4px solid var(--color-success)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>Remaining Budget</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>₹ {Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Actual Cost', value: Number(currentProject.actualCost) || 0, color: 'var(--color-warning)' },
                      { name: 'Remaining Budget', value: Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)), color: 'var(--color-success)' }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                    stroke="none"
                  >
                    {[
                      { name: 'Actual Cost', value: Number(currentProject.actualCost) || 0, color: 'var(--color-warning)' },
                      { name: 'Remaining Budget', value: Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)), color: 'var(--color-success)' }
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: any) => `₹ ${Number(value).toLocaleString('en-IN')}`} 
                     contentStyle={{ borderRadius: 'var(--radius-lg)', border: 'none', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}