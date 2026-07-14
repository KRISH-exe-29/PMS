import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import FormModal from '../components/ui/FormModal';
import EmptyState from '../components/ui/EmptyState';

type DPRStatus = 'Started' | 'In Progress' | 'Completed' | 'Blocked';

interface DPRRecord {
  id: string;
  projectId: string;
  projectName: string;
  employeeName: string;
  reportDate: string;
  hoursWorked: number;
  taskName: string;
  progress: number;
  status: DPRStatus;
}

export default function DPR() {
  const [projects, setProjects] = useState<any[]>([]);
  const [records, setRecords] = useState<DPRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchRecords();

    const subscription = supabase
      .channel('dprs_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dprs' }, () => {
        fetchRecords();
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

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('dprs').select('*, projects(name)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(r => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.projects?.name || 'Unknown',
        employeeName: r.employee_name,
        reportDate: r.report_date,
        hoursWorked: r.hours_worked,
        taskName: r.task_name,
        progress: r.progress,
        status: r.status
      })) || [];
      
      setRecords(formatted);
    } catch (error) {
      console.error('Error fetching DPRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<DPRRecord>>({ status: 'In Progress', progress: 0 });

  const filteredRecords = records.filter(r => 
    r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.taskName && r.taskName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: DPRStatus) => {
    switch (status) {
      case 'Completed': return <StatusBadge variant="success">{status}</StatusBadge>;
      case 'In Progress': return <StatusBadge variant="primary">{status}</StatusBadge>;
      case 'Blocked': return <StatusBadge variant="danger">{status}</StatusBadge>;
      default: return <StatusBadge variant="secondary">{status}</StatusBadge>;
    }
  };

  const columns: Column<DPRRecord>[] = [
    {
      key: 'reportDate',
      header: 'Date',
      render: (r) => r.reportDate,
    },
    {
      key: 'employeeName',
      header: 'Employee Name',
      render: (r) => <span className="font-medium text-[var(--color-text-primary)]">{r.employeeName}</span>,
    },
    {
      key: 'projectName',
      header: 'Project',
      render: (r) => r.projectName,
    },
    {
      key: 'taskName',
      header: 'Task',
      render: (r) => r.taskName,
    },
    {
      key: 'hoursWorked',
      header: 'Hours',
      render: (r) => `${r.hoursWorked}h`,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ flex: 1, backgroundColor: 'var(--color-bg-subtle)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div 
              style={{ height: '100%', width: `${r.progress}%`, backgroundColor: r.progress === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}
            />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{r.progress}%</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => getStatusBadge(r.status)
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button 
            className="action-btn action-btn-primary" 
            title="View"
            onClick={() => { setCurrentRecord(r); setIsViewModalOpen(true); }}
          >
            <Eye size={16} />
          </button>
          <button 
            className="action-btn action-btn-warning" 
            title="Edit"
            onClick={() => { setCurrentRecord(r); setIsModalOpen(true); }}
          >
            <Edit size={16} />
          </button>
          <button 
            className="action-btn action-btn-danger" 
            title="Delete"
            onClick={() => handleDelete(r.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbRecord = {
      project_id: currentRecord.projectId,
      employee_name: currentRecord.employeeName,
      report_date: currentRecord.reportDate,
      hours_worked: currentRecord.hoursWorked,
      task_name: currentRecord.taskName,
      progress: currentRecord.progress,
      status: currentRecord.status || 'In Progress'
    };

    try {
      if (currentRecord.id) {
        const { error } = await supabase.from('dprs').update(dbRecord).eq('id', currentRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('dprs').insert([dbRecord]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setCurrentRecord({});
      fetchRecords();
    } catch (error: any) {
      console.error('Error saving DPR:', error);
      alert('Failed to save DPR: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        const { error } = await supabase.from('dprs').delete().eq('id', id);
        if (error) throw error;
        fetchRecords();
      } catch (error: any) {
        console.error('Error deleting DPR:', error);
        alert('Failed to delete DPR: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Daily Progress Report">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search reports..."
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { setCurrentRecord({ status: 'In Progress', progress: 0, reportDate: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Log Progress
        </button>
      </PageHeader>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filteredRecords}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<FileText size={48} />}
              title="No progress reports found"
              description="Adjust your search or log new progress."
            />
          }
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentRecord.id ? 'Edit Report' : 'Log Daily Progress'}
        maxWidth="600px"
        footer={
          <>
            <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--color-text-secondary)' }} onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="dpr-form" className="btn btn-primary">
              Save Report
            </button>
          </>
        }
      >
        <form id="dpr-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Employee Name</label>
              <input 
                required 
                type="text" 
                className="form-input" 
                value={currentRecord.employeeName || ''} 
                onChange={e => setCurrentRecord({...currentRecord, employeeName: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Report Date</label>
              <input 
                required 
                type="date" 
                className="form-input" 
                value={currentRecord.reportDate || ''} 
                onChange={e => setCurrentRecord({...currentRecord, reportDate: e.target.value})} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Project Name</label>
              <select 
                required
                className="form-input"
                value={currentRecord.projectId || ''}
                onChange={e => {
                  const proj = projects.find(p => p.id === e.target.value);
                  setCurrentRecord({...currentRecord, projectId: e.target.value, projectName: proj?.name});
                }}
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Hours Worked</label>
              <input 
                required 
                type="number" 
                step="0.5"
                className="form-input" 
                value={currentRecord.hoursWorked || ''} 
                onChange={e => setCurrentRecord({...currentRecord, hoursWorked: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Task Completed / Details</label>
            <textarea 
              required 
              className="form-input" 
              rows={3}
              value={currentRecord.taskName || ''} 
              onChange={e => setCurrentRecord({...currentRecord, taskName: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Overall Progress ({currentRecord.progress || 0}%)</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--color-primary)' }}
                value={currentRecord.progress || 0} 
                onChange={e => setCurrentRecord({...currentRecord, progress: Number(e.target.value)})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select 
                className="form-input"
                value={currentRecord.status}
                onChange={e => setCurrentRecord({...currentRecord, status: e.target.value as DPRStatus})}
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
        title="Daily Progress Report"
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
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Task / Details</p>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {currentRecord.taskName}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Employee Name</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {currentRecord.employeeName}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Report Date</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                {currentRecord.reportDate}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Project</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                {currentRecord.projectName}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Hours Worked</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                {currentRecord.hoursWorked}h
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Progress & Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Completion</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{currentRecord.progress}%</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-border)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${currentRecord.progress}%`, backgroundColor: currentRecord.progress === 100 ? 'var(--color-success)' : 'var(--color-primary)' }} />
                  </div>
                </div>
                <div style={{ height: '30px', width: '1px', backgroundColor: 'var(--color-border)' }}></div>
                <div>{getStatusBadge(currentRecord.status as DPRStatus)}</div>
              </div>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}