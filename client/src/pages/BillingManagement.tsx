import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Receipt, Upload, Eye, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import FormModal from '../components/ui/FormModal';
import EmptyState from '../components/ui/EmptyState';

interface Billing {
  id: string;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneName?: string;
  vendorName: string;
  invoiceNo: string;
  invoiceAmount: number;
  paymentStatus: string;
  attachmentUrl?: string;
  actualDate: string;
}

export default function BillingManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchBillings();

    const subscription = supabase
      .channel('billings_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billings' }, () => {
        fetchBillings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchProjects = async () => {
    const { data: pData } = await supabase.from('projects').select('id, name');
    if (pData) setProjects(pData);
    const { data: mData } = await supabase.from('milestones').select('id, project_id, name');
    if (mData) setMilestones(mData);
  };

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('billings').select('*, projects(name), milestones(name)').order('created_at', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(d => ({
        id: d.id,
        projectId: d.project_id,
        projectName: d.projects?.name || 'Unknown',
        milestoneId: d.milestone_id,
        milestoneName: d.milestones?.name || '-',
        vendorName: d.vendor_name,
        invoiceNo: d.invoice_no,
        invoiceAmount: d.invoice_amount,
        paymentStatus: d.payment_status,
        attachmentUrl: d.attachment_url,
        actualDate: d.actual_date,
      })) || [];
      
      setBillings(formatted);
    } catch (error) {
      console.error('Error fetching billings:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Not Paid');
  const [actualDate, setActualDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentBillingId, setCurrentBillingId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentBilling, setCurrentBilling] = useState<Partial<Billing>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBillings = billings.filter(b => 
    b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
    }
  };

  const resetForm = () => {
    setSelectedProjectId('');
    setSelectedMilestoneId('');
    setVendorName('');
    setInvoiceNo('');
    setInvoiceAmount('');
    setPaymentStatus('Not Paid');
    setActualDate('');
    setFileName('');
    setSelectedFile(null);
    setCurrentBillingId(null);
    setCurrentBilling({});
  };

  const handleEdit = (bill: Billing) => {
    setSelectedProjectId(bill.projectId);
    setSelectedMilestoneId(bill.milestoneId || '');
    setVendorName(bill.vendorName);
    setInvoiceNo(bill.invoiceNo);
    setInvoiceAmount(bill.invoiceAmount.toString());
    setPaymentStatus(bill.paymentStatus);
    setActualDate(bill.actualDate);
    setFileName(bill.attachmentUrl ? bill.attachmentUrl.split('/').pop() || '' : '');
    setSelectedFile(null);
    setCurrentBillingId(bill.id);
    setCurrentBilling(bill);
    setIsModalOpen(true);
  };

  const handleView = (bill: Billing) => {
    setCurrentBilling(bill);
    setIsViewModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProjectId || !vendorName || !invoiceNo || !invoiceAmount || !actualDate) {
      alert('Please fill in all required fields (Project, Vendor, Invoice No, Amount, Actual Date)');
      return;
    }

    try {
      let finalAttachmentUrl = currentBilling.attachmentUrl || null;

      if (selectedFile) {
        // Upload to bucket
        const filePath = `public/${Date.now()}_${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('PRM document files')
          .upload(filePath, selectedFile);
          
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('PRM document files')
          .getPublicUrl(filePath);

        finalAttachmentUrl = publicUrlData.publicUrl;

        // Automatically insert into Documents
        const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB';
        const dbDoc = {
          project_id: selectedProjectId,
          milestone_id: selectedMilestoneId || null,
          remarks: `Billing Attachment (Invoice: ${invoiceNo})`,
          file_name: selectedFile.name,
          file_url: finalAttachmentUrl,
          size_str: sizeMB
        };
        await supabase.from('documents').insert([dbDoc]);
      }

      const dbBilling = {
        project_id: selectedProjectId,
        milestone_id: selectedMilestoneId || null,
        vendor_name: vendorName,
        invoice_no: invoiceNo,
        invoice_amount: parseFloat(invoiceAmount),
        payment_status: paymentStatus,
        attachment_url: finalAttachmentUrl,
        actual_date: actualDate
      };

      if (currentBillingId) {
        const { error } = await supabase.from('billings').update(dbBilling).eq('id', currentBillingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('billings').insert([dbBilling]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving billing:', error);
      alert('Failed to save billing record: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this billing record?')) {
      try {
        const { error } = await supabase.from('billings').delete().eq('id', id);
        if (error) throw error;
      } catch (error: any) {
        console.error('Error deleting billing:', error);
        alert('Failed to delete billing: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  // Filter milestones dynamically based on selected project
  const filteredMilestones = milestones.filter(m => m.project_id === selectedProjectId);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Paid': return <StatusBadge variant="success">{status}</StatusBadge>;
      default: return <StatusBadge variant="danger">{status}</StatusBadge>;
    }
  };

  const columns: Column<Billing>[] = [
    {
      key: 'invoiceNo',
      header: 'Invoice No',
      render: (b) => <span className="font-medium text-[var(--color-text-primary)]">{b.invoiceNo}</span>,
    },
    {
      key: 'vendorName',
      header: 'Vendor Name',
      render: (b) => b.vendorName,
    },
    {
      key: 'projectName',
      header: 'Project',
      render: (b) => b.projectName,
    },
    {
      key: 'milestoneName',
      header: 'Milestone',
      render: (b) => b.milestoneName,
    },
    {
      key: 'invoiceAmount',
      header: 'Amount',
      render: (b) => (
        <span className="font-medium text-[var(--color-primary)]">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(b.invoiceAmount)}
        </span>
      ),
    },
    {
      key: 'actualDate',
      header: 'Invoice Date',
      render: (b) => new Date(b.actualDate).toLocaleDateString(),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (b) => getStatusBadge(b.paymentStatus)
    },
    {
      key: 'attachmentUrl',
      header: 'Attachment',
      render: (b) => b.attachmentUrl ? (
        <a 
          href={b.attachmentUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}
          title="View Document"
        >
          <Receipt size={16} />
          View
        </a>
      ) : '-'
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (b) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => handleView(b)}
            className="action-btn action-btn-primary" 
            title="View Bill"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => handleEdit(b)}
            className="action-btn action-btn-warning" 
            title="Edit Bill"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(b.id)}
            className="action-btn action-btn-danger" 
            title="Delete Bill"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Billing Management">
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search invoices, vendors..."
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => { resetForm(); setIsModalOpen(true); }}
        >
          <Plus size={18} style={{ marginRight: '0.5rem' }} />
          Add Bill
        </button>
      </PageHeader>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filteredBillings}
          keyExtractor={(b) => b.id}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<Receipt size={48} />}
              title="No bills found"
              description="Adjust your search or add a new bill."
            />
          }
        />
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentBillingId ? 'Edit Bill' : 'Add New Bill'}
        maxWidth="600px"
        footer={
          <>
            <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--color-text-secondary)' }} onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="billing-form" className="btn btn-primary">
              Save Bill
            </button>
          </>
        }
      >
        <form id="billing-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Project Name *</label>
            <select 
              className="form-input"
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedMilestoneId('');
              }}
              required
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Milestone</label>
            <select 
              className="form-input"
              value={selectedMilestoneId}
              onChange={(e) => setSelectedMilestoneId(e.target.value)}
              disabled={!selectedProjectId}
            >
              <option value="">Select Milestone</option>
              {filteredMilestones.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Vendor Name *</label>
            <input 
              type="text" 
              className="form-input"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Enter Vendor Name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Invoice No *</label>
            <input 
              type="text" 
              className="form-input"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="INV-XXXX"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Amount *</label>
            <input 
              type="text" 
              className="form-input"
              value={invoiceAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                setInvoiceAmount(val);
              }}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Date *</label>
            <input 
              type="date" 
              className="form-input"
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Status *</label>
            <select 
              className="form-input"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              required
            >
              <option value="Not Paid">Not Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Billing Attachment</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <button 
                type="button"
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} style={{ marginRight: '0.5rem' }} />
                Choose File
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
                {fileName || 'No file chosen'}
              </span>
            </div>
          </div>
        </form>
      </FormModal>

      <FormModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Billing Details"
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
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Project</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                {currentBilling.projectName || '-'}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Milestone</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                {currentBilling.milestoneName || '-'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Vendor Name</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {currentBilling.vendorName || '-'}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Invoice No</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                {currentBilling.invoiceNo || '-'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Invoice Amount</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-success)' }}>
                {currentBilling.invoiceAmount ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentBilling.invoiceAmount) : '-'}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Actual Date</p>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                {currentBilling.actualDate ? new Date(currentBilling.actualDate).toLocaleDateString() : '-'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-1)' }}>Status & Attachments</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                {getStatusBadge(currentBilling.paymentStatus || 'Not Paid')}
                {currentBilling.attachmentUrl && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-primary)', backgroundColor: 'var(--color-bg-subtle)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <Receipt size={14} />
                    Document Attached
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
