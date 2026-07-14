import { useState, useRef, useEffect } from 'react';
import { Search, Upload, Download, Trash2, File, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import FormModal from '../components/ui/FormModal';
import EmptyState from '../components/ui/EmptyState';

interface Document {
  id: string;
  projectId: string;
  projectName: string;
  projectCode?: string;
  milestoneId?: string;
  milestoneName?: string;
  remarks?: string;
  fileName: string;
  file_url?: string;
  uploadDate: string;
  size: string;
}

export default function DocumentManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchProjects();
    fetchDocuments();

    const subscription = supabase
      .channel('documents_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchDocuments();
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

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('documents').select('*, projects(name, code), milestones(name)').order('upload_date', { ascending: false });
      if (error) throw error;

      const formatted = data?.map(d => ({
        id: d.id,
        projectId: d.project_id,
        projectName: d.projects?.name || 'Unknown',
        projectCode: d.projects?.code || '-',
        milestoneId: d.milestone_id,
        milestoneName: d.milestones?.name || '-',
        remarks: d.remarks || '-',
        fileName: d.file_name,
        file_url: d.file_url,
        uploadDate: new Date(d.upload_date).toLocaleString(),
        size: d.size_str
      })) || [];
      
      setDocuments(formatted);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'project' | 'billing'>('project');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBillingDoc = (d: Document) => d.remarks && d.remarks.toLowerCase().includes('billing attachment');

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'billing' ? isBillingDoc(d) : !isBillingDoc(d);
    return matchesSearch && matchesTab;
  });

  const groupedDocs = filteredDocuments.reduce((acc: any, doc) => {
    const pTitle = `${doc.projectCode} - ${doc.projectName}`;
    if (!acc[pTitle]) acc[pTitle] = {};
    const msName = doc.milestoneName || 'General';
    if (!acc[pTitle][msName]) acc[pTitle][msName] = [];
    acc[pTitle][msName].push(doc);
    return acc;
  }, {});

  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);

  const toggleProject = (pName: string) => {
    setExpandedProjects(prev => prev.includes(pName) ? prev.filter(p => p !== pName) : [...prev, pName]);
  };

  const toggleMilestone = (mName: string) => {
    setExpandedMilestones(prev => prev.includes(mName) ? prev.filter(m => m !== mName) : [...prev, mName]);
  };

  const handleUploadClick = () => {
    if (!selectedProjectId) {
      alert('Please select a project first before uploading.');
      return;
    }
    fileInputRef.current?.click();
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedProjectId) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!selectedProjectId) {
      alert('Please select a project first before uploading.');
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProjectId) {
      await processFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    try {
      // 1. Upload to Supabase Storage
      const filePath = `public/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('PRM document files')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('PRM document files')
        .getPublicUrl(filePath);

      // 3. Save to database
      const dbDoc = {
        project_id: selectedProjectId,
        milestone_id: selectedMilestoneId || null,
        remarks: remarks,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        size_str: sizeMB
      };

      const { error } = await supabase.from('documents').insert([dbDoc]);
      if (error) throw error;
      
      setIsModalOpen(false);
      setSelectedProjectId('');
      setSelectedMilestoneId('');
      setRemarks('');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error saving document:', error);
      alert('Failed to save document: ' + (error.message || JSON.stringify(error)));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
        fetchDocuments();
      } catch (error: any) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document: ' + (error.message || JSON.stringify(error)));
      }
    }
  };

  const columns: Column<Document>[] = [
    {
      key: 'fileName',
      header: 'File Name',
      render: (doc) => (
        <div 
          className="flex items-center gap-2"
          style={{ cursor: 'pointer', color: 'var(--color-primary)' }}
          onClick={() => {
            let urlToOpen = doc.file_url;
            if (!urlToOpen || urlToOpen === 'mock_url' || !urlToOpen.startsWith('http')) {
              const { data } = supabase.storage.from('PRM document files').getPublicUrl(`public/${doc.fileName}`);
              urlToOpen = data.publicUrl;
            }
            window.open(urlToOpen, '_blank');
          }}
        >
          <File size={16} />
          <span className="font-medium text-[var(--color-primary)]" style={{ textDecoration: 'underline' }}>{doc.fileName}</span>
        </div>
      )
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (doc) => <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.remarks}>{doc.remarks}</div>
    },
    {
      key: 'uploadDate',
      header: 'Upload Date',
      render: (doc) => <span className="text-[var(--color-text-tertiary)]">{doc.uploadDate}</span>
    },
    {
      key: 'size',
      header: 'Size',
      render: (doc) => <span className="text-[var(--color-text-tertiary)]">{doc.size}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (doc) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button 
            className="action-btn action-btn-primary" 
            title="Download"
            onClick={() => {
              let urlToOpen = doc.file_url;
              if (!urlToOpen || urlToOpen === 'mock_url' || !urlToOpen.startsWith('http')) {
                const { data } = supabase.storage.from('PRM document files').getPublicUrl(`public/${doc.fileName}`);
                urlToOpen = data.publicUrl;
              }
              window.open(urlToOpen, '_blank');
            }}
          >
            <Download size={16} />
          </button>
          <button 
            className="action-btn action-btn-danger" 
            title="Delete"
            onClick={() => handleDelete(doc.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Document Management">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1)' }}>
            <button
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'project' ? 600 : 500,
                background: activeTab === 'project' ? 'var(--color-bg-primary)' : 'transparent',
                color: activeTab === 'project' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                boxShadow: activeTab === 'project' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setActiveTab('project')}
            >
              Project Documents
            </button>
            <button
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: activeTab === 'billing' ? 600 : 500,
                background: activeTab === 'billing' ? 'var(--color-bg-primary)' : 'transparent',
                color: activeTab === 'billing' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                boxShadow: activeTab === 'billing' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setActiveTab('billing')}
            >
              Billing Documents
            </button>
          </div>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder={`Search ${activeTab} documents...`}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'project' && (
            <button 
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Upload size={18} style={{ marginRight: '0.5rem' }} />
              Upload Document
            </button>
          )}
        </div>
      </PageHeader>

      <div className="card p-0" style={{ padding: 'var(--space-4)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>Loading documents...</div>
        ) : Object.keys(groupedDocs).length === 0 ? (
          <EmptyState
            icon={<File size={48} />}
            title="No documents found"
            description="Adjust your search or upload a new document."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {Object.keys(groupedDocs).map(projectName => {
              const projectDocs = groupedDocs[projectName];
              const isProjectExpanded = expandedProjects.includes(projectName);
              
              return (
                <div key={projectName} className="card p-0" style={{ overflow: 'hidden' }}>
                  {/* Project Header */}
                  <div 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-4)', 
                      cursor: 'pointer', 
                      gap: 'var(--space-3)',
                      backgroundColor: isProjectExpanded ? 'var(--color-bg-subtle)' : 'transparent', 
                      borderBottom: isProjectExpanded ? '1px solid var(--color-border)' : 'none',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => toggleProject(projectName)}
                  >
                    {isProjectExpanded ? <ChevronDown size={20} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronRight size={20} style={{ color: 'var(--color-text-tertiary)' }} />}
                    {isProjectExpanded ? <FolderOpen size={22} style={{ color: 'var(--color-primary)' }} /> : <Folder size={22} style={{ color: 'var(--color-primary)' }} />}
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>{projectName}</h3>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--color-bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', color: 'var(--color-text-secondary)' }}>
                      {Object.values(projectDocs).flat().length} Files
                    </span>
                  </div>

                  {/* Project Content (Milestones) */}
                  {isProjectExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)', backgroundColor: 'var(--color-bg-subtle)' }}>
                      {Object.keys(projectDocs).map(milestoneName => {
                        const milestoneDocs = projectDocs[milestoneName];
                        const milestoneKey = `${projectName}-${milestoneName}`;
                        const isMilestoneExpanded = expandedMilestones.includes(milestoneKey);
                        
                        return (
                          <div key={milestoneKey} className="card p-0" style={{ overflow: 'hidden' }}>
                            {/* Milestone Header */}
                            <div 
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                padding: 'var(--space-3) var(--space-4)', 
                                cursor: 'pointer', 
                                gap: 'var(--space-3)',
                                borderBottom: isMilestoneExpanded ? '1px solid var(--color-border)' : 'none',
                                transition: 'background-color 0.2s'
                              }}
                              onClick={() => toggleMilestone(milestoneKey)}
                            >
                              {isMilestoneExpanded ? <ChevronDown size={18} style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronRight size={18} style={{ color: 'var(--color-text-tertiary)' }} />}
                              {isMilestoneExpanded ? <FolderOpen size={18} style={{ color: 'var(--color-warning)' }} /> : <Folder size={18} style={{ color: 'var(--color-warning)' }} />}
                              <h4 style={{ fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>{milestoneName}</h4>
                              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                                {milestoneDocs.length} {milestoneDocs.length === 1 ? 'File' : 'Files'}
                              </span>
                            </div>

                            {/* Milestone Content (Documents) */}
                            {isMilestoneExpanded && (
                              <div style={{ padding: 0 }}>
                                <DataTable
                                  columns={columns}
                                  data={milestoneDocs}
                                  keyExtractor={(doc) => doc.id}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Document"
        maxWidth="500px"
        footer={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Select Project</label>
            <select 
              className="form-input"
              value={selectedProjectId}
              onChange={e => {
                setSelectedProjectId(e.target.value);
                setSelectedMilestoneId('');
              }}
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedProjectId && (
            <div className="form-group">
              <label className="form-label">Select Milestone (Optional)</label>
              <select 
                className="form-input"
                value={selectedMilestoneId}
                onChange={e => setSelectedMilestoneId(e.target.value)}
              >
                <option value="">No Milestone</option>
                {milestones.filter(m => m.project_id === selectedProjectId).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Remarks / Description</label>
            <textarea 
              className="form-input"
              rows={2}
              placeholder="Enter remarks here..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

          <div 
            style={{ 
              border: '2px dashed var(--color-border)', 
              borderRadius: 'var(--radius-lg)', 
              padding: 'var(--space-8)', 
              textAlign: 'center',
              cursor: selectedProjectId ? 'pointer' : 'not-allowed',
              opacity: selectedProjectId ? 1 : 0.5,
              backgroundColor: isDragging ? 'var(--color-bg-subtle)' : 'transparent',
              transition: 'all 0.2s ease',
              marginTop: 'var(--space-2)'
            }}
            onClick={handleUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload size={32} style={{ margin: '0 auto', color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }} />
            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
              {isDragging ? 'Drop file here!' : 'Click to browse or drag and drop'}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>PDF, DOCX, PNG, JPG (Max 10MB)</p>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />
        </div>
      </FormModal>
    </div>
  );
}