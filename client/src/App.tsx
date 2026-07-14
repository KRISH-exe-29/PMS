import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { isSupabaseConfigured } from './lib/supabase';
import { ThemeProvider } from './lib/theme';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import GanttChart from './pages/GanttChart';
import MilestoneManagement from './pages/MilestoneManagement';
import TaskManagement from './pages/TaskManagement';
import TeamManagement from './pages/TeamManagement';
import DPR from './pages/DPR';
import BudgetManagement from './pages/BudgetManagement';
import DocumentManagement from './pages/DocumentManagement';
import EmailNotification from './pages/EmailNotification';
import BillingManagement from './pages/BillingManagement';
import MouseEffects from './components/ui/MouseEffects';
import { AlertCircle } from 'lucide-react';

function App() {
  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-7)', background: 'var(--color-bg)' }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto var(--space-5)' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>Missing Configuration</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' }}>
            The application cannot start because the Supabase environment variables are missing.
          </p>
          <div style={{ background: 'var(--color-bg-subtle)', padding: 'var(--space-4)', borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', border: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Required in client/.env:</p>
            <p style={{ color: 'var(--color-text-secondary)' }}>VITE_SUPABASE_URL=...</p>
            <p style={{ color: 'var(--color-text-secondary)' }}>VITE_SUPABASE_ANON_KEY=...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <MouseEffects showLabel={false} color="var(--color-primary)" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectManagement />} />
            <Route path="gantt" element={<GanttChart />} />
            <Route path="milestones" element={<MilestoneManagement />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="dpr" element={<DPR />} />
            <Route path="budget" element={<BudgetManagement />} />
            <Route path="billing" element={<BillingManagement />} />
            <Route path="documents" element={<DocumentManagement />} />
            <Route path="notifications" element={<EmailNotification />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
