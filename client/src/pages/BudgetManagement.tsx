import { Search, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

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
      case 'Completed': return <span className="badge badge-success">{status}</span>;
      case 'In Progress': return <span className="badge badge-primary">{status}</span>;
      case 'Started': return <span className="badge badge-secondary">{status}</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <motion.div 
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="flex gap-6 mb-6"
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="card glass-elevated flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-muted text-sm font-medium">Total Planned Budget</p>
              <h3 className="text-2xl font-bold">₹ {totalPlannedBudget.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-muted mt-1">Auto Calculated from Projects</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="card glass-elevated flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-muted text-sm font-medium">Actual Cost</p>
              <h3 className="text-2xl font-bold text-warning">₹ {actualCost.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-muted mt-1">Auto Calculated</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="card glass-elevated flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-muted text-sm font-medium">Remaining Budget</p>
              <h3 className="text-2xl font-bold text-success">₹ {remainingBudget.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-muted mt-1">Auto Calculated</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="page-header">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search projects..."
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Project Code</th>
              <th style={{ textAlign: 'right' }}>Planned Budget</th>
              <th style={{ textAlign: 'right' }}>Actual Cost</th>
              <th style={{ textAlign: 'right' }}>Balanced Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {filteredProjects.map(project => (
              <motion.tr variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} key={project.id}>
                <td className="font-medium">{project.name}</td>
                <td>{project.code}</td>
                <td style={{ textAlign: 'right' }}>₹ {(Number(project.budget) || 0).toLocaleString('en-IN')}</td>
                <td style={{ textAlign: 'right' }}>₹ {(Number(project.actualCost) || 0).toLocaleString('en-IN')}</td>
                <td style={{ textAlign: 'right', color: ((Number(project.budget) || 0) - (Number(project.actualCost) || 0)) < 0 ? '#dc2626' : 'inherit' }}>
                  ₹ {((Number(project.budget) || 0) - (Number(project.actualCost) || 0)).toLocaleString('en-IN')}
                </td>
                <td>{getStatusBadge(project.status)}</td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      className="action-btn action-btn-primary" 
                      title="View"
                      onClick={() => { setCurrentProject(project); setIsViewModalOpen(true); }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-8">Loading projects from backend...</td>
              </tr>
            )}
            {!loading && filteredProjects.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-8">No projects found. Create one in the Projects screen.</td>
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>



      <AnimatePresence>
      {isViewModalOpen && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="modal-content glass-elevated" style={{ maxWidth: '800px', padding: 0, overflow: 'hidden' }}
          >
            <div className="view-modal-header">
              <svg width="120" height="32" viewBox="0 0 150 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="150" height="40" rx="4" fill="#e3282f" />
                <text x="75" y="27" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="1">INDO TECH</text>
              </svg>
              <h2 className="view-modal-header-title">Project Budget View</h2>
            </div>
            
            <div style={{ padding: '2rem', backgroundColor: 'var(--background)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{currentProject.name}</h3>
                <p className="text-sm text-slate-500">Budget & Financial Overview</p>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card glass-card" style={{ padding: '1.25rem' }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Planned Budget</p>
                  <p className="text-2xl font-bold text-slate-800">₹ {(Number(currentProject.budget) || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="card glass-card" style={{ padding: '1.25rem', borderBottom: '4px solid #facc15' }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Actual Cost</p>
                  <p className="text-2xl font-bold text-slate-800">₹ {(Number(currentProject.actualCost) || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="card glass-card" style={{ padding: '1.25rem', borderBottom: '4px solid #22c55e' }}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Remaining Budget</p>
                  <p className="text-2xl font-bold text-slate-800">₹ {Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Chart Section */}
              <div className="card glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ height: '300px' }} className="w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Actual Cost', value: Number(currentProject.actualCost) || 0, color: '#facc15' },
                          { name: 'Remaining Budget', value: Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)), color: '#22c55e' }
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
                      >
                        {[
                          { name: 'Actual Cost', value: Number(currentProject.actualCost) || 0, color: '#facc15' },
                          { name: 'Remaining Budget', value: Math.max(0, (Number(currentProject.budget) || 0) - (Number(currentProject.actualCost) || 0)), color: '#22c55e' }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                         formatter={(value: any) => `₹ ${Number(value).toLocaleString('en-IN')}`} 
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--card)' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsViewModalOpen(false)}>
                Close Window
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}