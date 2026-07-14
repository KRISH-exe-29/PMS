import { useState } from 'react';
import { Send, Search, CheckCircle, XCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';

interface Notification {
  id: string;
  recipient: string;
  subject: string;
  sentDate: string;
  status: 'Sent' | 'Failed';
}

export default function EmailNotification() {
  const [history, setHistory] = useLocalStorage<Notification[]>('epms_notifications', [
    { id: '1', recipient: 'john.doe@example.com', subject: 'Project Alpha Started', sentDate: '2026-06-16 09:00 AM', status: 'Sent' },
    { id: '2', recipient: 'jane.smith@example.com', subject: 'Task Assigned: UI Design', sentDate: '2026-06-16 10:15 AM', status: 'Sent' },
    { id: '3', recipient: 'team@indotech.com', subject: 'Budget Update Alert', sentDate: '2026-06-15 04:30 PM', status: 'Failed' },
  ]);
  
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(h => 
    h.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !message) return;

    const newNotification: Notification = {
      id: Date.now().toString(),
      recipient: to,
      subject: subject,
      sentDate: new Date().toLocaleString(),
      status: 'Sent' // Mocking successful send
    };

    setHistory([newNotification, ...history]);
    setTo('');
    setSubject('');
    setMessage('');
    
    // In a real app, this would show a toast notification
    alert('Email sent successfully!');
  };

  const columns: Column<Notification>[] = [
    {
      key: 'recipient',
      header: 'Recipient',
      render: (n) => <span className="font-medium text-[var(--color-text-primary)]">{n.recipient}</span>
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (n) => <span className="font-medium text-[var(--color-text-secondary)]">{n.subject}</span>
    },
    {
      key: 'sentDate',
      header: 'Sent Date',
      render: (n) => <span className="text-[var(--color-text-tertiary)]">{n.sentDate}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (n) => n.status === 'Sent' ? (
        <StatusBadge variant="success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={14} /> Sent
          </div>
        </StatusBadge>
      ) : (
        <StatusBadge variant="danger">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <XCircle size={14} /> Failed
          </div>
        </StatusBadge>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Email Notifications" />

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        {/* Send Email Form */}
        <div className="card p-0" style={{ flex: '1', minWidth: '300px', height: 'fit-content' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Send size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Send Email</h2>
          </div>
          
          <form onSubmit={handleSend} style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">To (Recipient)</label>
              <input 
                required 
                type="email" 
                className="form-input" 
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="e.g. user@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input 
                required 
                type="text" 
                className="form-input" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea 
                required 
                className="form-input" 
                rows={8}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message here..."
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => { setTo(''); setSubject(''); setMessage(''); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Send size={16} />
                Send
              </button>
            </div>
          </form>
        </div>

        {/* History Table */}
        <div className="card p-0" style={{ flex: '2', minWidth: '400px' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Notification History</h2>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search history..."
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflow: 'hidden' }}>
            <DataTable
              columns={columns}
              data={filteredHistory}
              keyExtractor={(item) => item.id}
              emptyState={
                <EmptyState
                  icon={<Send size={48} />}
                  title="No history found"
                  description="Sent emails will appear here."
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}