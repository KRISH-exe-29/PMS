import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import FormModal from '../components/ui/FormModal';
import EmptyState from '../components/ui/EmptyState';

type ProjectStatus = 'Started' | 'In Progress' | 'Completed';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  budget: number;
  plannedBudget?: number;
  actualCost?: number;
  progress?: number;
  isManualProgress?: boolean;
  status: ProjectStatus;
  type?: 'Internal project' | 'External project';
  managerName?: string;
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Internal project' | 'External project'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});

  useEffect(() => {
    fetchProjects();

    const subscription = supabase
      .channel('projects_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      // Transform data from snake_case to camelCase for the frontend
      const formattedProjects = data?.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        startDate: p.start_date,
        endDate: p.end_date,
        plannedStartDate: p.planned_start_date,
        actualStartDate: p.actual_start_date,
        plannedEndDate: p.planned_end_date,
        actualEndDate: p.actual_end_date,
        budget: p.budget,
        plannedBudget: p.planned_budget,
        actualCost: p.actual_cost,
        status: p.status,
        type: p.type,
        progress: p.progress || 0,
        isManualProgress: p.is_manual_progress || false,
        managerName: p.manager_name
      })) || [];
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to load projects from backend');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    (typeFilter === 'All' || p.type === typeFilter || (typeFilter === 'Internal project' && !p.type)) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbProject = {
      name: currentProject.name,
      code: currentProject.code,
      description: currentProject.description,
      start_date: currentProject.startDate,
      end_date: currentProject.endDate,
      planned_start_date: currentProject.plannedStartDate || currentProject.startDate,
      planned_end_date: currentProject.plannedEndDate || currentProject.endDate,
      actual_start_date: currentProject.actualStartDate || null,
      actual_end_date: currentProject.actualEndDate || null,
      budget: currentProject.budget,
      progress: currentProject.progress || 0,
      is_manual_progress: currentProject.isManualProgress || false,
      status: currentProject.status || 'Started',
      type: currentProject.type || 'Internal project'
    };

    if (dbProject.progress === 0) dbProject.status = 'Started';
    else if (dbProject.progress === 100) dbProject.status = 'Completed';
    else dbProject.status = 'In Progress';

    try {
      if (currentProject.id) {
        // Update existing
        const { error } = await supabase.from('projects').update(dbProject).eq('id', currentProject.id);
        if (error) throw error;
        
        // Cascade constraints to milestones
        const { data: milestones } = await supabase.from('milestones').select('*').eq('project_id', currentProject.id);
        if (milestones && milestones.length > 0) {
           for (const m of milestones) {
              let updated = false;
              let mStart = m.start_date;
              let mEnd = m.end_date;
              
              if (new Date(mStart as string) < new Date(dbProject.start_date as string) || new Date(mStart as string) > new Date(dbProject.end_date as string)) {
                 mStart = dbProject.start_date as string;
                 updated = true;
              }
              if (new Date(mEnd as string) > new Date(dbProject.end_date as string) || new Date(mEnd as string) < new Date(dbProject.start_date as string)) {
                 mEnd = dbProject.end_date as string;
                 updated = true;
              }
              
              if (new Date(mStart as string) > new Date(mEnd as string)) {
                 mEnd = mStart;
                 updated = true;
              }
              
              if (updated) {
                 await supabase.from('milestones').update({ start_date: mStart, end_date: mEnd, planned_start_date: mStart, planned_end_date: mEnd }).eq('id', m.id);
                 
                 // Also cascade from milestone to tasks
                 const { data: tasks } = await supabase.from('tasks').select('*').eq('milestone_id', m.id);
                 if (tasks && tasks.length > 0) {
                    for (const t of tasks) {
                       let tUpdated = false;
                       let tStart = t.start_date;
                       let tEnd = t.end_date;
                       if (new Date(tStart as string) < new Date(mStart as string) || new Date(tStart as string) > new Date(mEnd as string)) { tStart = mStart as string; tUpdated = true; }
                       if (new Date(tEnd as string) > new Date(mEnd as string) || new Date(tEnd as string) < new Date(mStart as string)) { tEnd = mEnd as string; tUpdated = true; }
                       if (new Date(tStart as string) > new Date(tEnd as string)) { tEnd = tStart; tUpdated = true; }
                       if (tUpdated) {
                          await supabase.from('tasks').update({ start_date: tStart, end_date: tEnd, planned_start_date: tStart, planned_end_date: tEnd }).eq('id', t.id);
                       }
                    }
                 }
              }
           }
        }
         
         // Re-apply the manually entered budget to override the database trigger
         if (currentProject.budget !== undefined) {
            await supabase.from('projects').update({ budget: Number(currentProject.budget) }).eq('id', currentProject.id);
         }
      } else {
        // Insert new
        const { data: newProject, error } = await supabase.from('projects').insert([dbProject]).select().single();
        if (error) throw error;
        
        if (newProject) {
          // Re-apply the manually entered budget to override the database trigger
          if (currentProject.budget !== undefined) {
            await supabase.from('projects').update({ budget: Number(currentProject.budget) }).eq('id', newProject.id);
          }
        }
      }
      
      setIsModalOpen(false);
      setCurrentProject({});
      fetchProjects(); // Refresh list
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert('Failed to save project to backend: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
        fetchProjects(); // Refresh list
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProjectStatus) => {
    try {
      const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchProjects();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'code',
      header: 'Project Code',
      render: (p) => <span className="font-medium text-[var(--color-text-primary)]">{p.code}</span>,
    },
    {
      key: 'name',
      header: 'Project Name',
      render: (p) => <span className="font-semibold text-[var(--color-text-primary)]">{p.name}</span>,
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (p) => `₹ ${p.budget?.toLocaleString('en-IN') || 0}`,
    },
    {
      key: 'type',
      header: 'Type',
      render: (p) => (
        <StatusBadge variant={p.type === 'External project' ? 'secondary' : 'primary'}>
          {p.type || 'Internal project'}
        </StatusBadge>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (p) => p.startDate,
    },
    {
      key: 'manager',
      header: 'Manager',
      render: (p) => p.managerName || '-',
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', minWidth: '60px' }}>
            <div style={{ height: '100%', width: `${p.progress || 0}%`, backgroundColor: (p.progress || 0) === 100 ? 'var(--color-success)' : 'var(--color-primary)' }} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{p.progress || 0}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <select 
          value={p.status || 'Started'}
          onChange={(e) => handleStatusChange(p.id, e.target.value as ProjectStatus)}
          className={`badge ${p.status === 'Completed' ? 'badge-success' : p.status === 'In Progress' ? 'badge-primary' : 'badge-secondary'}`}
          style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
        >
          <option value="Started" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>Started</option>
          <option value="In Progress" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>In Progress</option>
          <option value="Completed" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>Completed</option>
        </select>
      )
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
          <button 
            className="action-btn action-btn-warning" 
            title="Edit"
            onClick={() => { setCurrentProject(p); setIsModalOpen(true); }}
          >
            <Edit size={16} />
          </button>
          <button 
            className="action-btn action-btn-danger" 
            title="Delete"
            onClick={() => handleDelete(p.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Project Management">
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
        <select 
          className="form-input" 
          style={{ width: '200px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
        >
          <option value="All">All Projects</option>
          <option value="Internal project">Internal Projects</option>
          <option value="External project">External Projects</option>
        </select>
        <button 
          className="btn btn-primary"
          onClick={() => { setCurrentProject({ status: 'Started' }); setIsModalOpen(true); }}
        >
          <Plus size={18} style={{ marginRight: 'var(--space-2)' }} />
          Add Project
        </button>
      </PageHeader>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filteredProjects}
          keyExtractor={(p) => p.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<Briefcase size={48} />}
              title="No projects found"
              description="Adjust your search or create a new project to get started."
            />
          }
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentProject.id ? 'Edit Project' : 'Add Project'}
        maxWidth="700px"
        footer={
          <>
            <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--color-text-secondary)' }} onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="project-form" className="btn btn-primary">
              Save Project
            </button>
          </>
        }
      >
        <form id="project-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input 
              required 
              type="text" 
              className="form-input" 
              value={currentProject.name || ''} 
              onChange={e => setCurrentProject({...currentProject, name: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Project Code</label>
              <input 
                required 
                type="text" 
                className="form-input" 
                value={currentProject.code || ''} 
                onChange={e => setCurrentProject({...currentProject, code: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Project Type</label>
              <select 
                className="form-input"
                value={currentProject.type || 'Internal project'}
                onChange={e => setCurrentProject({...currentProject, type: e.target.value as any})}
              >
                <option value="Internal project">Internal project</option>
                <option value="External project">External project</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              rows={3}
              value={currentProject.description || ''} 
              onChange={e => setCurrentProject({...currentProject, description: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date</label>
              <input 
                required 
                type="date" 
                className="form-input" 
                value={currentProject.startDate || ''} 
                onChange={e => setCurrentProject({...currentProject, startDate: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Date</label>
              <input 
                required 
                type="date" 
                className="form-input" 
                value={currentProject.endDate || ''} 
                onChange={e => setCurrentProject({...currentProject, endDate: e.target.value})} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Budget (₹)</label>
              <input 
                required 
                type="text" 
                className="form-input" 
                value={currentProject.budget !== undefined ? currentProject.budget : ''} 
                onChange={e => {
                  const val = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                  setCurrentProject({...currentProject, budget: val ? Number(val) : 0});
                }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <label className="form-label" style={{ margin: 0 }}>Progress (%)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={currentProject.isManualProgress || false}
                    onChange={e => setCurrentProject({...currentProject, isManualProgress: e.target.checked})}
                  />
                  Override Auto-Calculation
                </label>
              </div>
              <input 
                type="number"
                min="0"
                max="100" 
                className="form-input" 
                value={currentProject.progress || 0} 
                disabled={!currentProject.isManualProgress}
                onChange={e => setCurrentProject({...currentProject, progress: parseInt(e.target.value) || 0})} 
                style={{ backgroundColor: !currentProject.isManualProgress ? 'var(--color-bg-subtle)' : 'var(--color-surface)' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select 
                className="form-input"
                value={currentProject.status || 'Started'}
                onChange={e => setCurrentProject({...currentProject, status: e.target.value as ProjectStatus})}
              >
                <option value="Started">Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </form>
      </FormModal>

      <FormModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Project Details"
        maxWidth="600px"
        footer={
          <button type="button" className="btn" style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-primary)' }} onClick={() => setIsViewModalOpen(false)}>
            Close Window
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Project Name</p>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {currentProject.name}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Project Code</p>
              <div style={{ display: 'inline-block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-subtle)', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                {currentProject.code}
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Project Type</p>
            <StatusBadge variant={currentProject.type === 'External project' ? 'secondary' : 'primary'}>
              {currentProject.type || 'Internal project'}
            </StatusBadge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Progress & Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{currentProject.progress || 0}% {currentProject.isManualProgress && '(Manual)'}</span>
                <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                <StatusBadge variant={currentProject.status === 'Completed' ? 'success' : currentProject.status === 'In Progress' ? 'primary' : 'secondary'}>
                  {currentProject.status}
                </StatusBadge>
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Timeline</p>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{currentProject.startDate}</span>
              <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{currentProject.endDate}</span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Budget</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)' }}>₹ {currentProject.budget?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}