import { Briefcase, CalendarDays, CheckSquare, DollarSign, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../lib/theme';
import KPICard from '../components/ui/KPICard';
export default function Dashboard() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const subProjects = supabase.channel('dash_projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchDashboardData).subscribe();
    const subMilestones = supabase.channel('dash_milestones').on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, fetchDashboardData).subscribe();
    const subTasks = supabase.channel('dash_tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchDashboardData).subscribe();

    return () => {
      supabase.removeChannel(subProjects);
      supabase.removeChannel(subMilestones);
      supabase.removeChannel(subTasks);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (projectsError) throw projectsError;

      const { data: billingsData, error: billingsError } = await supabase.from('billings').select('project_id, invoice_amount');
      if (billingsError) throw billingsError;

      const billingSums: Record<string, number> = {};
      if (billingsData) {
        billingsData.forEach((b: any) => {
          if (b.project_id) {
            billingSums[b.project_id] = (billingSums[b.project_id] || 0) + (Number(b.invoice_amount) || 0);
          }
        });
      }

      const formattedProjects = projectsData?.map(p => ({
        ...p,
        actual_cost: billingSums[p.id] || 0
      })) || [];

      const [milestonesRes, tasksRes] = await Promise.all([
        supabase.from('milestones').select('*'),
        supabase.from('tasks').select('*')
      ]);

      setProjects(formattedProjects);
      setMilestones(milestonesRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPlannedBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
  const actualCost = projects.reduce((sum, p) => sum + (Number(p.actual_cost) || 0), 0);
  const remainingBudget = totalPlannedBudget - actualCost;
  
  const activeMilestones = milestones.filter(m => m.status === 'In Progress' || m.status === 'Not Started').length;
  const tasksInProgress = tasks.filter(t => t.status === 'In Progress').length;
  const tasksCompleted = tasks.filter(t => t.status === 'Completed').length;

  // Compute Upcoming Deadlines by looking at uncompleted tasks with end_dates close to today
  const upcomingDeadlines = [...tasks]
    .filter(t => t.status !== 'Completed' && t.end_date)
    .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
    .slice(0, 4);

  const getMonthStr = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('default', { month: 'short' }).toUpperCase();
    } catch { return '---'; }
  };
  
  const getDayStr = (dateStr: string) => {
    try {
      return new Date(dateStr).getDate().toString();
    } catch { return '-'; }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return { bg: 'var(--color-success-subtle)', text: 'var(--color-success)', bar: 'var(--color-success)', percent: '100%' };
      case 'In Progress': return { bg: 'var(--color-info-subtle)', text: 'var(--color-primary)', bar: 'var(--color-primary)', percent: '50%' };
      case 'Started': return { bg: 'var(--color-primary-subtle)', text: 'var(--color-navy-600)', bar: 'var(--color-navy-600)', percent: '20%' };
      case 'Blocked': return { bg: 'var(--color-danger-subtle)', text: 'var(--color-danger)', bar: 'var(--color-danger)', percent: '10%' };
      default: return { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-secondary)', bar: 'var(--color-slate-300)', percent: '0%' };
    }
  };

  // Chart colors — Navy-based palette
  const chartColors = {
    completed: '#10b981',
    inProgress: theme === 'dark' ? '#6085f5' : '#2451d6',
    started: theme === 'dark' ? '#93b0ff' : '#3b5fe0',
    blocked: '#e31e24',
    notStarted: theme === 'dark' ? '#475569' : '#cbd5e1',
    tooltip: theme === 'dark' ? '#1a2235' : '#ffffff',
    tooltipText: theme === 'dark' ? '#f1f5f9' : '#0f172a',
    grid: theme === 'dark' ? '#293548' : '#e2e8f0',
    axisText: theme === 'dark' ? '#94a3b8' : '#64748b',
  };

  const projectStatusData = [
    { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: chartColors.completed },
    { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, color: chartColors.inProgress },
    { name: 'Started', value: projects.filter(p => p.status === 'Started').length, color: chartColors.started },
    { name: 'Blocked', value: projects.filter(p => p.status === 'Blocked').length, color: chartColors.blocked },
    { name: 'Not Started', value: projects.filter(p => !p.status || p.status === 'Not Started').length, color: chartColors.notStarted }
  ].filter(d => d.value > 0);

  const taskStatusData = [
    { name: 'Completed', count: tasks.filter(t => t.status === 'Completed').length, fill: chartColors.completed },
    { name: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length, fill: chartColors.inProgress },
    { name: 'Not Started', count: tasks.filter(t => !t.status || t.status === 'Not Started').length, fill: chartColors.notStarted },
    { name: 'Blocked', count: tasks.filter(t => t.status === 'Blocked').length, fill: chartColors.blocked }
  ].filter(d => d.count > 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {[1,2].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '360px' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-2" aria-label="Dashboard View">
      {/* Metrics Row */}
      <motion.div 
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}
      >
        <KPICard
          title="Total Projects"
          value={projects.length}
          icon={Briefcase}
          iconColor="var(--color-primary)"
          iconBg="var(--color-primary-subtle)"
          subtitle={<span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs">+Active tracking</span>}
        />
        <KPICard
          title="Active Milestones"
          value={activeMilestones}
          icon={CalendarDays}
          iconColor="var(--color-warning)"
          iconBg="var(--color-warning-subtle)"
          subtitle={<span className="font-medium text-muted">Across all projects</span>}
        />
        <KPICard
          title="Total Tasks"
          value={tasks.length}
          icon={CheckSquare}
          iconColor="var(--color-success)"
          iconBg="var(--color-success-subtle)"
          subtitle={
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs">{tasksCompleted} completed</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-xs">{tasksInProgress} in progress</span>
            </div>
          }
        />
        <KPICard
          title="Remaining Budget"
          value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(remainingBudget)}
          icon={DollarSign}
          iconColor="var(--color-info)"
          iconBg="var(--color-info-subtle)"
          subtitle={<span className="font-medium text-muted">{actualCost > 0 ? `${Math.round((actualCost / totalPlannedBudget) * 100) || 0}% used of total` : 'No expenses yet'}</span>}
        />
      </motion.div>

      {/* Pictorial Representation (Charts) Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <PieChartIcon size={20} style={{ color: '#2563eb' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Project Status Distribution</h2>
          </div>
          <div style={{ height: '300px' }} className="w-full">
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: chartColors.tooltip, border: `1px solid ${chartColors.grid}`, borderRadius: 8, color: chartColors.tooltipText }} />
                  <Legend wrapperStyle={{ color: chartColors.axisText }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full p-0">
                <div className="empty-state-title">No project data available</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <BarChart2 size={20} style={{ color: '#10b981' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Tasks Progress Overview</h2>
          </div>
          <div style={{ height: '300px' }} className="w-full">
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: chartColors.axisText, fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: chartColors.axisText, fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: chartColors.tooltip, border: `1px solid ${chartColors.grid}`, borderRadius: 8, color: chartColors.tooltipText }} cursor={{ fill: chartColors.grid }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state h-full p-0">
                <div className="empty-state-title">No task data available</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        {/* Recent Projects Table */}
        <div className="card table-container" style={{ flex: '2', minWidth: '400px' }}>
          <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold text-slate-800">Recent Projects</h2>
            <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition-colors">View All</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Overall Progress</th>
                </tr>
              </thead>
              <motion.tbody
                initial="hidden" animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              >
                {projects.slice(0, 5).map(project => {
                  const colors = getStatusColor(project.status);
                  return (
                    <motion.tr variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} key={project.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div className="font-semibold" style={{ color: 'var(--foreground)' }}>{project.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{project.code}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span 
                          style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: colors.bg, color: colors.text }}
                        >
                          {project.status || 'Not Started'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div className="flex items-center gap-3">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: colors.percent, background: colors.bar }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '2rem', textAlign: 'right', color: colors.text }}>
                            {colors.percent}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">
                        <Briefcase className="empty-state-icon" />
                        <div className="empty-state-title">No projects active</div>
                        <div className="empty-state-description">Get started by creating a new project.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card" style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Upcoming Deadlines</h2>
          </div>
          
          <div className="flex flex-col gap-3">
            {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((task, i) => {
              // Cycle through some nice soft colors based on index
              const colors = [
                { bg: '#fee2e2', text: '#dc2626' }, // red
                { bg: '#fef9c3', text: '#ca8a04' }, // yellow
                { bg: '#dbeafe', text: '#2563eb' }, // blue
                { bg: '#cffafe', text: '#0891b2' }, // cyan
                { bg: '#fee2e2', text: '#dc2626' },
                { bg: '#fef9c3', text: '#ca8a04' },
                { bg: '#dbeafe', text: '#2563eb' },
                { bg: '#cffafe', text: '#0891b2' },
              ];
              const colorTheme = colors[i % colors.length];

              return (
                <div key={task.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: colorTheme.bg, color: colorTheme.text, textAlign: 'center', minWidth: '3rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{getMonthStr(task.end_date)}</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{getDayStr(task.end_date)}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>{task.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{task.projects?.name || 'Assigned to Project'}</p>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.875rem', backgroundColor: 'var(--secondary)', borderRadius: '0.5rem' }}>
                No upcoming deadlines.
              </div>
            )}
          </div>
          
          {upcomingDeadlines.length > 0 && (
            <button style={{ marginTop: 'auto', paddingTop: '1rem', width: '100%', fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary)', borderTop: '1px solid var(--border)', padding: '1rem 0 0 0' }}>
              View Full Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}