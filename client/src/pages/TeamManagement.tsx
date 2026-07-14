import { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import FormModal from '../components/ui/FormModal';
import EmptyState from '../components/ui/EmptyState';

type UserStatus = 'Active' | 'Inactive' | 'On Leave';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: UserStatus;
}

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember>>({ status: 'Active' });
  
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setMembers(data.map(m => ({
          id: m.id,
          name: m.username || m.email?.split('@')[0] || 'Unknown User',
          role: m.role || 'Member',
          status: m.status || 'Active',
          email: m.email || '',
          joinDate: new Date(m.created_at).toLocaleDateString()
        })));
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    const subscription = supabase
      .channel('users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'Active': return <StatusBadge variant="success">{status}</StatusBadge>;
      case 'On Leave': return <StatusBadge variant="primary">{status}</StatusBadge>;
      case 'Inactive': return <StatusBadge variant="secondary">{status}</StatusBadge>;
      default: return <StatusBadge variant="secondary">{status}</StatusBadge>;
    }
  };

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Member Name',
      render: (m) => <span className="font-medium text-[var(--color-text-primary)]">{m.name}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (m) => m.role,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => getStatusBadge(m.status)
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
            onClick={() => { setCurrentMember(m); setIsViewModalOpen(true); }}
          >
            <Eye size={16} />
          </button>
          <button 
            className="action-btn action-btn-warning" 
            title="Edit"
            onClick={() => { setCurrentMember(m); setIsModalOpen(true); }}
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
    
    const dbUser = {
      username: currentMember.name,
      email: currentMember.email,
      role: currentMember.role || 'Team Member',
      status: currentMember.status || 'Active'
    };

    try {
      if (currentMember.id) {
        const { error } = await supabase.from('users').update(dbUser).eq('id', currentMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('users').insert([dbUser]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setCurrentMember({});
      fetchMembers();
    } catch (error: any) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        fetchMembers();
      } catch (error: any) {
        console.error('Error deleting team member:', error);
        alert('Failed to delete team member: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Team Management">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search team members..."
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { setCurrentMember({ status: 'Active' }); setIsModalOpen(true); }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Member
        </button>
      </PageHeader>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filteredMembers}
          keyExtractor={(m) => m.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<Users size={48} />}
              title="No team members found"
              description="Adjust your search or add a new team member."
            />
          }
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentMember.id ? 'Edit Member' : 'Add Member'}
        maxWidth="500px"
        footer={
          <>
            <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--color-text-secondary)' }} onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="member-form" className="btn btn-primary">
              Save Member
            </button>
          </>
        }
      >
        <form id="member-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Member Name</label>
            <input 
              required 
              type="text" 
              className="form-input" 
              value={currentMember.name || ''} 
              onChange={e => setCurrentMember({...currentMember, name: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select 
              className="form-input"
              value={currentMember.role || 'Frontend Developer'}
              onChange={e => setCurrentMember({...currentMember, role: e.target.value})}
            >
              <option>Frontend Developer</option>
              <option>Backend Developer</option>
              <option>UI/UX Designer</option>
              <option>Project Manager</option>
              <option>QA / Testing Engineer</option>
              <option>Team Member</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select 
              className="form-input"
              value={currentMember.status}
              onChange={e => setCurrentMember({...currentMember, status: e.target.value as UserStatus})}
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </FormModal>

      <FormModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Team Member Profile"
        maxWidth="500px"
        footer={
          <button type="button" className="btn" style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-primary)' }} onClick={() => setIsViewModalOpen(false)}>
            Close Window
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Member Name</p>
              <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {currentMember.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Role</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-lg)', display: 'inline-block' }}>
                {currentMember.role}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Status</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {getStatusBadge(currentMember.status as UserStatus)}
              </div>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}