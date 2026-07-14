import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, File, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import FormModal from '../components/ui/FormModal';
import EmptyState from '../components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'individual' | 'team';
type TaskStatus = 'Started' | 'In Progress' | 'Blocked' | 'Completed';

interface Task {
  id: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  milestoneId?: string;
  milestoneName?: string;
  title: string;
  startDate: string;
  endDate: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  plannedCost?: number;
  actualCost?: number;
  progress?: number;
  status: TaskStatus;
  type: 'Individual' | 'Team';
  assignedTo?: string; // Employee or Team Name
  role?: string;     // If individual
  documentUrl?: string;
  documentFile?: File;
  documentSize?: number;
  remarks?: string;
}

export default function TaskManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchMilestones();
    fetchTasks();

    const subscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name');
    if (data) setProjects(data);
  };

  const fetchMilestones = async () => {
    const { data } = await supabase.from('milestones').select('id, project_id, name, start_date, end_date');
    if (data) setMilestones(data);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('tasks').select('*, projects(name, code), milestones(name)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(t => ({
        id: t.id,
        projectId: t.project_id,
        projectName: t.projects?.name || 'Unknown',
        projectCode: t.projects?.code || '-',
        milestoneId: t.milestone_id,
        milestoneName: t.milestones?.name || 'None',
        title: t.title,
        startDate: t.start_date,
        endDate: t.end_date,
        plannedStartDate: t.planned_start_date,
        actualStartDate: t.actual_start_date,
        plannedEndDate: t.planned_end_date,
        actualEndDate: t.actual_end_date,
        plannedCost: t.planned_cost,
        actualCost: t.actual_cost,
        progress: t.progress,
        status: t.status,
        type: t.type,
        assignedTo: t.assigned_to,
        role: t.role,
        documentUrl: t.document_url,
        remarks: t.remarks
      })) || [];
      
      setTasks(formatted);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<Tab>('individual');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({ type: 'Individual', status: 'Started' });

  const filteredTasks = tasks.filter(t => 
    (activeTab === 'individual' ? t.type === 'Individual' : t.type === 'Team') &&
    (t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.projectName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: TaskStatus, id?: string) => {
    if (!id) {
       return <StatusBadge variant={status === 'Completed' ? 'success' : status === 'In Progress' ? 'primary' : status === 'Blocked' ? 'danger' : 'secondary'}>{status}</StatusBadge>;
    }
    return (
      <select 
        value={status || 'Not Started'}
        onChange={(e) => handleStatusChange(id, e.target.value as TaskStatus)}
        className={`badge ${status === 'Completed' ? 'badge-success' : status === 'In Progress' ? 'badge-primary' : status === 'Blocked' ? 'badge-destructive' : 'badge-secondary'}`}
        style={{ border: 'none', outline: 'none', cursor: 'pointer' }}
      >
        <option value="Not Started" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>Not Started</option>
        <option value="Started" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>Started</option>
        <option value="In Progress" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>In Progress</option>
        <option value="On Hold" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>On Hold</option>
        <option value="Completed" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>Completed</option>
        <option value="Blocked" style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface)' }}>Blocked</option>
      </select>
    );
  };

  const columns: Column<Task>[] = [
    {
      key: 'projectCode',
      header: 'Project Code',
      render: (t) => <span className="font-medium text-[var(--color-text-primary)]">{t.projectCode}</span>,
    },
    {
      key: 'projectName',
      header: 'Project Name',
      render: (t) => t.projectName,
    },
    {
      key: 'milestoneName',
      header: 'Milestone',
      render: (t) => t.milestoneName,
    },
    {
      key: 'type',
      header: 'Type',
      render: (t) => <span className="badge badge-secondary" style={{ backgroundColor: 'var(--color-bg-subtle)' }}>{t.type === 'Individual' ? 'Internal Team' : 'External Team'}</span>,
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (t) => t.assignedTo,
    },
    {
      key: 'title',
      header: 'Task Title',
      render: (t) => <span className="font-medium text-[var(--color-text-primary)]">{t.title}</span>,
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (t) => t.startDate,
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (t) => t.endDate,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => getStatusBadge(t.status, t.id)
    },
    {
      key: 'document',
      header: 'Document',
      render: (t) => {
        if (!t.documentUrl) return <span style={{ color: 'var(--color-text-tertiary)' }}>-</span>;
        return (
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-primary)', cursor: 'pointer', maxWidth: '150px' }} 
            title={t.documentUrl} 
            onClick={() => {
              let urlToOpen = t.documentUrl;
              if (urlToOpen && !urlToOpen.startsWith('http')) {
                const { data } = supabase.storage.from('PRM document files').getPublicUrl(`public/${urlToOpen}`);
                urlToOpen = data.publicUrl;
              }
              if (urlToOpen) window.open(urlToOpen, '_blank');
            }}
          >
            <File size={16} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.documentUrl.startsWith('http') ? decodeURIComponent(t.documentUrl.split('/').pop()?.split('_').slice(1).join('_') || t.documentUrl) : t.documentUrl}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (t) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button 
            className="action-btn action-btn-primary" 
            title="View"
            onClick={() => { setCurrentTask(t); setIsViewModalOpen(true); }}
          >
            <Eye size={16} />
          </button>
          <button 
            className="action-btn action-btn-warning" 
            title="Edit"
            onClick={() => { setCurrentTask(t); setIsModalOpen(true); }}
          >
            <Edit size={16} />
          </button>
          <button 
            className="action-btn action-btn-danger" 
            title="Delete"
            onClick={() => handleDelete(t)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbTask = {
      project_id: currentTask.projectId,
      milestone_id: currentTask.milestoneId || null,
      title: currentTask.title,
      start_date: currentTask.startDate,
      end_date: currentTask.endDate,
      planned_start_date: currentTask.plannedStartDate || currentTask.startDate,
      planned_end_date: currentTask.plannedEndDate || currentTask.endDate,
      actual_start_date: currentTask.actualStartDate || null,
      actual_end_date: currentTask.actualEndDate || null,
      planned_cost: currentTask.plannedCost || 0,
      actual_cost: currentTask.actualCost || 0,
      progress: currentTask.progress || 0,
      status: currentTask.status || 'Not Started',
      type: currentTask.type,
      assigned_to: currentTask.assignedTo,
      role: currentTask.role,
      document_url: currentTask.documentUrl,
      remarks: currentTask.remarks
    };

    if (dbTask.status !== 'Blocked') {
      if (dbTask.progress === 0) dbTask.status = 'Started';
      else if (dbTask.progress === 100) dbTask.status = 'Completed';
      else dbTask.status = 'In Progress';
    }

    try {
      if (currentTask.documentFile) {
        const filePath = `public/${Date.now()}_${currentTask.documentFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('PRM document files')
          .upload(filePath, currentTask.documentFile);
          
        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // Fallback or handle error if needed, but throwing is better
          throw uploadError;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('PRM document files')
          .getPublicUrl(filePath);
          
        dbTask.document_url = publicUrlData.publicUrl;
      }

      if (currentTask.id) {
        const { error } = await supabase.from('tasks').update(dbTask).eq('id', currentTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tasks').insert([dbTask]);
        if (error) throw error;
      }
      
      // Automatic Document Sync
      if (currentTask.documentFile && currentTask.projectId) {
        const sizeMB = ((currentTask.documentSize || 0) / (1024 * 1024)).toFixed(2) + ' MB';
        const dbDoc = {
          project_id: currentTask.projectId,
          milestone_id: currentTask.milestoneId || null,
          remarks: currentTask.remarks || `Attached to task: ${currentTask.title}`,
          file_name: currentTask.documentFile.name,
          file_url: dbTask.document_url,
          size_str: sizeMB
        };
        // Insert into documents table
        await supabase.from('documents').insert([dbDoc]);
      }

      // Cascade Progress
      await cascadeProgress(currentTask.milestoneId || '', currentTask.projectId || '');

      setIsModalOpen(false);
      setCurrentTask({});
      fetchTasks();
    } catch (error: any) {
      console.error('Error saving task:', error);
      alert('Failed to save task: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (task: Task) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', task.id);
        if (error) throw error;
        
        // Cascade Progress after delete
        await cascadeProgress(task.milestoneId || '', task.projectId || '');
        
        fetchTasks();
      } catch (error: any) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  const cascadeProgress = async (milestoneId: string, projectId: string) => {
    try {
      if (milestoneId) {
        const { data: mData } = await supabase.from('milestones').select('is_manual_progress, status').eq('id', milestoneId).single();
        if (mData && !mData.is_manual_progress) {
          const { data: tasks } = await supabase.from('tasks').select('progress').eq('milestone_id', milestoneId);
          const count = tasks?.length || 0;
          const sumP = tasks?.reduce((acc, t) => acc + (t.progress || 0), 0) || 0;
          const newP = count > 0 ? Math.round(sumP / count) : 0;
          let newS = mData.status;
          if (newS !== 'Blocked') {
             newS = newP === 0 ? 'Not Started' : newP === 100 ? 'Completed' : 'In Progress';
          }
          await supabase.from('milestones').update({ progress: newP, status: newS }).eq('id', milestoneId);
        }
      }
      
      if (projectId) {
        const { data: pData } = await supabase.from('projects').select('is_manual_progress, status').eq('id', projectId).single();
        if (pData && !pData.is_manual_progress) {
          const { data: milestones } = await supabase.from('milestones').select('progress').eq('project_id', projectId);
          const count = milestones?.length || 0;
          const sumP = milestones?.reduce((acc, m) => acc + (m.progress || 0), 0) || 0;
          const newP = count > 0 ? Math.round(sumP / count) : 0;
          let newS = pData.status;
          if (newS !== 'Blocked') {
             newS = newP === 0 ? 'Started' : newP === 100 ? 'Completed' : 'In Progress';
          }
          await supabase.from('projects').update({ progress: newP, status: newS }).eq('id', projectId);
        }
      }
    } catch(e) { console.error('Cascading progress failed:', e); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Task Management">
        <div style={{ display: 'flex', padding: '0.25rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
          {([
            { id: 'individual', label: 'Internal Team' },
            { id: 'team', label: 'External Team' }
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                style={{
                  position: 'relative',
                  padding: '0.375rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  zIndex: 1
                }}
                onClick={() => setActiveTab(tab.id as Tab)}
              >
                {isActive && (
                  <motion.div
                    layoutId="tasks-active-tab"
                    style={{
                      position: 'absolute', inset: 0,
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-sm)',
                      zIndex: -1
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search tasks..."
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { 
            setCurrentTask({ type: activeTab === 'individual' ? 'Individual' : 'Team', status: 'Started' }); 
            setIsModalOpen(true); 
          }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Task
        </button>
      </PageHeader>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <DataTable
              columns={columns}
              data={filteredTasks}
              keyExtractor={(t) => t.id}
              loading={loading}
              emptyState={
                <EmptyState
                  icon={<ClipboardList size={48} />}
                  title={`No ${activeTab === 'individual' ? 'Internal' : 'External'} Team tasks`}
                  description="Adjust your search or create a new task to get started."
                />
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentTask.id ? 'Edit Task' : `Add ${activeTab === 'individual' ? 'Internal Team' : 'External Team'} Task`}
        maxWidth="700px"
        footer={
          <>
            <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--color-text-secondary)' }} onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="task-form" className="btn btn-primary">
              Save Task
            </button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <select 
              required
              className="form-input"
              value={currentTask.projectId || ''}
              onChange={e => {
                const proj = projects.find(p => p.id === e.target.value);
                setCurrentTask({...currentTask, projectId: e.target.value, projectName: proj?.name, milestoneId: ''});
              }}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {currentTask.projectId && (
            <div className="form-group">
              <label className="form-label">Milestone</label>
              <select
                required
                className="form-input"
                value={currentTask.milestoneId || ''}
                onChange={e => {
                  const ms = milestones.find(m => m.id === e.target.value);
                  setCurrentTask({
                    ...currentTask, 
                    milestoneId: e.target.value,
                    startDate: (ms as any)?.start_date || (ms as any)?.startDate || currentTask.startDate,
                    endDate: (ms as any)?.end_date || (ms as any)?.endDate || currentTask.endDate
                  });
                }}
              >
                <option value="">Select Milestone</option>
                {milestones.filter(m => m.project_id === currentTask.projectId).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{activeTab === 'individual' ? 'Employee Name' : 'Team Name'}</label>
            <input 
              required 
              type="text" 
              className="form-input" 
              value={currentTask.assignedTo || ''} 
              onChange={e => setCurrentTask({...currentTask, assignedTo: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input 
              required 
              type="text" 
              className="form-input" 
              value={currentTask.title || ''} 
              onChange={e => setCurrentTask({...currentTask, title: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date</label>
              <input 
                required 
                type="date" 
                className="form-input" 
                value={currentTask.startDate || ''} 
                onChange={e => setCurrentTask({...currentTask, startDate: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Date</label>
              <input 
                required 
                type="date" 
                className="form-input" 
                value={currentTask.endDate || ''} 
                onChange={e => setCurrentTask({...currentTask, endDate: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Actual Start Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={currentTask.actualStartDate || ''} 
                onChange={e => setCurrentTask({...currentTask, actualStartDate: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Actual End Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={currentTask.actualEndDate || ''} 
                onChange={e => setCurrentTask({...currentTask, actualEndDate: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Upload Document</label>
              <input 
                type="file" 
                className="form-input" 
                style={{ padding: '0.375rem 0.5rem', height: 'auto' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCurrentTask({...currentTask, documentUrl: file.name, documentSize: file.size, documentFile: file}); 
                  }
                }} 
              />
              {currentTask.documentUrl && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', wordBreak: 'break-all' }}>Current file: {currentTask.documentUrl}</div>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Remarks</label>
              <textarea 
                className="form-input" 
                rows={2}
                placeholder="Enter remarks..."
                value={currentTask.remarks || ''} 
                onChange={e => setCurrentTask({...currentTask, remarks: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Progress (%)</label>
              <input 
                required 
                type="number" 
                min="0"
                max="100"
                className="form-input" 
                value={currentTask.progress || 0} 
                onChange={e => setCurrentTask({...currentTask, progress: parseInt(e.target.value) || 0})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select 
                className="form-input"
                value={currentTask.status}
                onChange={e => setCurrentTask({...currentTask, status: e.target.value as TaskStatus})}
              >
                <option value="Started">Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </form>
      </FormModal>

      <FormModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Task Details"
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
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Task Title</p>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {currentTask.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Project</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                {currentTask.projectName}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Type</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {currentTask.type === 'Individual' ? 'Internal Team' : 'External Team'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Assigned To</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{currentTask.assignedTo}</span>
                {currentTask.role && <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-bg-subtle)', padding: '0.125rem 0.5rem', borderRadius: '9999px', color: 'var(--color-text-secondary)' }}>{currentTask.role}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Progress & Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{currentTask.progress || 0}%</span>
                <div style={{ height: '20px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                <StatusBadge variant={currentTask.status === 'Completed' ? 'success' : currentTask.status === 'In Progress' ? 'primary' : currentTask.status === 'Blocked' ? 'danger' : 'secondary'}>
                  {currentTask.status}
                </StatusBadge>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Timeline</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{currentTask.startDate}</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{currentTask.endDate}</span>
              </div>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}