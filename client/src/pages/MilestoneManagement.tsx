import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import FormModal from '../components/ui/FormModal';
import EmptyState from '../components/ui/EmptyState';

type MilestoneStatus = 'Not Started' | 'In Progress' | 'Completed';

interface Milestone {
  id: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  name: string;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  plannedBudget?: number;
  actualCost?: number;
  progress?: number;
  isManualProgress?: boolean;
  status: MilestoneStatus;
}

export default function MilestoneManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchMilestones();

    const subscription = supabase
      .channel('milestones_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, () => {
        fetchMilestones();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name, start_date, end_date');
    if (data) setProjects(data);
  };

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('milestones').select('*, projects(name, code)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(m => ({
        id: m.id,
        projectId: m.project_id,
        projectName: m.projects?.name || 'Unknown',
        projectCode: m.projects?.code || '-',
        name: m.name,
        startDate: m.start_date,
        endDate: m.end_date,
        plannedStartDate: m.planned_start_date,
        actualStartDate: m.actual_start_date,
        plannedEndDate: m.planned_end_date,
        actualEndDate: m.actual_end_date,
        plannedBudget: m.planned_budget,
        actualCost: m.actual_cost,
        progress: m.progress || 0,
        isManualProgress: m.is_manual_progress || false,
        status: m.status
      })) || [];
      
      setMilestones(formatted);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Partial<Milestone>>({ status: 'Not Started' });
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);

  const filteredMilestones = milestones.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (id: string, newStatus: MilestoneStatus) => {
    try {
      const { error } = await supabase.from('milestones').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchMilestones();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: MilestoneStatus, id?: string) => {
    if (!id) {
       return <StatusBadge variant={status === 'Completed' ? 'success' : status === 'In Progress' ? 'primary' : 'secondary'}>{status}</StatusBadge>;
    }
    return (
      <select 
        value={status || 'Not Started'}
        onChange={(e) => handleStatusChange(id, e.target.value as MilestoneStatus)}
        className={`badge ${status === 'Completed' ? 'badge-success' : status === 'In Progress' ? 'badge-primary' : 'badge-secondary'}`}
        style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
      >
        <option value="Not Started" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>Not Started</option>
        <option value="In Progress" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>In Progress</option>
        <option value="Completed" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>Completed</option>
      </select>
    );
  };

  const columns: Column<Milestone>[] = [
    {
      key: 'checkbox',
      header: (
        <input 
          type="checkbox" 
          checked={selectedMilestones.length > 0 && selectedMilestones.length === filteredMilestones.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedMilestones(filteredMilestones.map(m => m.id));
            } else {
              setSelectedMilestones([]);
            }
          }}
          style={{ cursor: 'pointer' }}
        />
      ),
      width: '40px',
      align: 'center',
      render: (m) => (
        <input 
          type="checkbox"
          checked={selectedMilestones.includes(m.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedMilestones([...selectedMilestones, m.id]);
            } else {
              setSelectedMilestones(selectedMilestones.filter(id => id !== m.id));
            }
          }}
          style={{ cursor: 'pointer' }}
        />
      )
    },
    {
      key: 'projectName',
      header: 'Project Name',
      render: (m) => m.projectName,
    },
    {
      key: 'projectCode',
      header: 'Project Code',
      render: (m) => m.projectCode,
    },
    {
      key: 'name',
      header: 'Milestone Name',
      render: (m) => <span className="font-medium text-[var(--color-text-primary)]">{m.name}</span>,
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (m) => m.startDate,
    },
    {
      key: 'endDate',
      header: 'Target Date',
      render: (m) => m.endDate,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => getStatusBadge(m.status, m.id)
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (m) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button 
            className="action-btn action-btn-primary" 
            title="View"
            onClick={() => { setCurrentMilestone(m); setIsViewModalOpen(true); }}
          >
            <Eye size={16} />
          </button>
          <button 
            className="action-btn action-btn-warning" 
            title="Edit"
            onClick={() => { setCurrentMilestone(m); setIsModalOpen(true); }}
          >
            <Edit size={16} />
          </button>
          <button 
            className="action-btn action-btn-danger" 
            title="Delete"
            onClick={() => handleDelete(m.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbMilestone = {
      project_id: currentMilestone.projectId,
      name: currentMilestone.name,
      start_date: currentMilestone.startDate,
      end_date: currentMilestone.endDate,
      planned_start_date: currentMilestone.plannedStartDate || currentMilestone.startDate,
      planned_end_date: currentMilestone.plannedEndDate || currentMilestone.endDate,
      actual_start_date: currentMilestone.actualStartDate || null,
      actual_end_date: currentMilestone.actualEndDate || null,
      progress: currentMilestone.progress || 0,
      is_manual_progress: currentMilestone.isManualProgress || false,
      status: currentMilestone.status || 'Not Started'
    };

    if (dbMilestone.progress === 0) dbMilestone.status = 'Not Started';
    else if (dbMilestone.progress === 100) dbMilestone.status = 'Completed';
    else dbMilestone.status = 'In Progress';

    try {
      if (currentMilestone.id) {
        const { error } = await supabase.from('milestones').update(dbMilestone).eq('id', currentMilestone.id);
        if (error) throw error;
        
        // Cascade constraint to tasks
        const { data: tasks } = await supabase.from('tasks').select('*').eq('milestone_id', currentMilestone.id);
        if (tasks && tasks.length > 0) {
           for (const t of tasks) {
              let updated = false;
              let tStart = t.start_date;
              let tEnd = t.end_date;
              if (new Date(tStart as string) < new Date(dbMilestone.start_date as string) || new Date(tStart as string) > new Date(dbMilestone.end_date as string)) {
                 tStart = dbMilestone.start_date as string;
                 updated = true;
              }
              if (new Date(tEnd as string) > new Date(dbMilestone.end_date as string) || new Date(tEnd as string) < new Date(dbMilestone.start_date as string)) {
                 tEnd = dbMilestone.end_date as string;
                 updated = true;
              }
              if (new Date(tStart as string) > new Date(tEnd as string)) {
                 tEnd = tStart;
                 updated = true;
              }
              if (updated) {
                 await supabase.from('tasks').update({ start_date: tStart, end_date: tEnd, planned_start_date: tStart, planned_end_date: tEnd }).eq('id', t.id);
              }
           }
        }
      } else {
        const { data: newMilestone, error } = await supabase.from('milestones').insert([dbMilestone]).select().single();
        if (error) throw error;
        
        if (newMilestone && newMilestone.name === 'Development') {
          const standardTasks = [
            'Frontend Setup',
            'Backend API Development',
            'Database Design',
            'Authentication Module',
            'Testing',
            'Bug Fixing'
          ].map((title) => ({
            project_id: newMilestone.project_id,
            milestone_id: newMilestone.id,
            title,
            start_date: newMilestone.start_date,
            end_date: newMilestone.end_date,
            planned_start_date: newMilestone.planned_start_date || newMilestone.start_date,
            planned_end_date: newMilestone.planned_end_date || newMilestone.end_date,
            status: 'Not Started',
            type: 'Team'
          }));
          
          const { error: taskError } = await supabase.from('tasks').insert(standardTasks);
          if (taskError) {
             console.error('Error auto-creating standard tasks for Development:', taskError);
          }
        }
      }

      // Cascade to Project
      if (currentMilestone.projectId) {
        const { data: pData } = await supabase.from('projects').select('is_manual_progress, status').eq('id', currentMilestone.projectId).single();
        if (pData && !pData.is_manual_progress) {
          const { data: milestonesData } = await supabase.from('milestones').select('progress').eq('project_id', currentMilestone.projectId);
          const count = milestonesData?.length || 0;
          const sumP = milestonesData?.reduce((acc, m) => acc + (m.progress || 0), 0) || 0;
          const newP = count > 0 ? Math.round(sumP / count) : 0;
          let newS = pData.status;
          if (newS !== 'Blocked') {
             newS = newP === 0 ? 'Started' : newP === 100 ? 'Completed' : 'In Progress';
          }
          await supabase.from('projects').update({ progress: newP, status: newS }).eq('id', currentMilestone.projectId);
        }
      }

      setIsModalOpen(false);
      setCurrentMilestone({});
      fetchMilestones();
    } catch (error: any) {
      console.error('Error saving milestone:', error);
      alert('Failed to save milestone: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      try {
        const { error } = await supabase.from('milestones').delete().eq('id', id);
        if (error) throw error;
        fetchMilestones();
      } catch (error: any) {
        console.error('Error deleting milestone:', error);
        alert('Failed to delete milestone: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedMilestones.length} milestone(s)?`)) {
      try {
        const { error } = await supabase.from('milestones').delete().in('id', selectedMilestones);
        if (error) throw error;
        setSelectedMilestones([]);
        fetchMilestones();
      } catch (error: any) {
        console.error('Error deleting milestones:', error);
        alert('Failed to delete selected milestones');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Milestone Management">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search milestones..."
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {selectedMilestones.length > 0 && (
          <button 
            className="btn btn-outline"
            style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '0.5rem 1rem' }}
            onClick={handleBulkDelete}
          >
            <Trash2 size={18} style={{ marginRight: '0.5rem' }} />
            Delete Selected ({selectedMilestones.length})
          </button>
        )}
        <button 
          className="btn btn-primary"
          onClick={() => { setCurrentMilestone({ status: 'Not Started' }); setIsModalOpen(true); }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Milestone
        </button>
      </PageHeader>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filteredMilestones}
          keyExtractor={(m) => m.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<MapPin size={48} />}
              title="No milestones found"
              description="Adjust your search or create a new milestone to get started."
            />
          }
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentMilestone.id ? 'Edit Milestone' : 'Add Milestone'}
        maxWidth="700px"
        footer={
          <>
            <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--color-text-secondary)' }} onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="milestone-form" className="btn btn-primary">
              Save Milestone
            </button>
          </>
        }
      >
        <form id="milestone-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Project</label>
            <select 
              required
              className="form-input"
              value={currentMilestone.projectId || ''}
              onChange={e => {
                const proj = projects.find(p => p.id === e.target.value);
                setCurrentMilestone({
                  ...currentMilestone, 
                  projectId: e.target.value, 
                  projectName: proj?.name,
                  startDate: currentMilestone.startDate || (proj as any)?.start_date,
                  endDate: currentMilestone.endDate || (proj as any)?.end_date
                });
              }}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Milestone Name</label>
            <input 
              required 
              type="text" 
              className="form-input" 
              value={currentMilestone.name || ''} 
              onChange={e => setCurrentMilestone({...currentMilestone, name: e.target.value})} 
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date</label>
              <input 
                required 
                type="date" 
                className="form-input" 
                value={currentMilestone.startDate || ''} 
                onChange={e => setCurrentMilestone({...currentMilestone, startDate: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Target Date</label>
              <input 
                required 
                type="date" 
                className="form-input" 
                value={currentMilestone.endDate || ''} 
                onChange={e => setCurrentMilestone({...currentMilestone, endDate: e.target.value})} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Actual Start Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={currentMilestone.actualStartDate || ''} 
                onChange={e => setCurrentMilestone({...currentMilestone, actualStartDate: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Actual End Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={currentMilestone.actualEndDate || ''} 
                onChange={e => setCurrentMilestone({...currentMilestone, actualEndDate: e.target.value})} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <label className="form-label" style={{ margin: 0 }}>Progress (%)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={currentMilestone.isManualProgress || false}
                    onChange={e => setCurrentMilestone({...currentMilestone, isManualProgress: e.target.checked})}
                  />
                  Override Auto-Calculation
                </label>
              </div>
              <input 
                type="number"
                min="0"
                max="100" 
                className="form-input" 
                value={currentMilestone.progress || 0} 
                disabled={!currentMilestone.isManualProgress}
                onChange={e => setCurrentMilestone({...currentMilestone, progress: parseInt(e.target.value) || 0})} 
                style={{ backgroundColor: !currentMilestone.isManualProgress ? 'var(--color-bg-subtle)' : 'var(--color-surface)' }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select 
                className="form-input"
                value={currentMilestone.status}
                onChange={e => setCurrentMilestone({...currentMilestone, status: e.target.value as MilestoneStatus})}
              >
                <option value="Not Started">Not Started</option>
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
        title="Milestone Details"
        maxWidth="600px"
        footer={
          <button type="button" className="btn" style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-primary)' }} onClick={() => setIsViewModalOpen(false)}>
            Close Window
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Milestone Name</p>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {currentMilestone.name}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Project Name</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                {currentMilestone.projectName}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Timeline</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{currentMilestone.startDate}</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{currentMilestone.endDate}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Progress & Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{currentMilestone.progress || 0}% {currentMilestone.isManualProgress && '(Manual)'}</span>
                <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                <StatusBadge variant={currentMilestone.status === 'Completed' ? 'success' : currentMilestone.status === 'In Progress' ? 'primary' : 'secondary'}>
                  {currentMilestone.status}
                </StatusBadge>
              </div>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}