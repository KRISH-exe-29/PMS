import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Gantt, ViewMode, type Task } from 'gantt-task-react';
import { Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import 'gantt-task-react/dist/index.css';

type Tab = 'team' | 'individual';

const CustomTaskListHeader: React.FC<{ headerHeight: number; rowWidth: string; fontFamily: string; fontSize: string }> = ({ headerHeight, fontFamily, fontSize }) => {
  return (
    <div style={{ display: 'flex', height: headerHeight, fontFamily, fontSize, borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
      <div style={{ flex: 1, minWidth: '150px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>Name</div>
      <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>From</div>
      <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>To</div>
      <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>Status</div>
      <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>Duration</div>
    </div>
  );
};

const CustomTaskListTable: React.FC<{
  rowHeight: number; rowWidth: string; fontFamily: string; fontSize: string; locale: string; tasks: Task[]; selectedTaskId: string; setSelectedTask: (taskId: string) => void; onExpanderClick: (task: Task) => void;
}> = ({ rowHeight, fontFamily, tasks, selectedTaskId, setSelectedTask, onExpanderClick }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {tasks.map(t => {
        const durationMs = t.end.getTime() - t.start.getTime();
        const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
        let expander = null;
        if (t.id.startsWith('p-') || t.id.startsWith('m-')) {
          expander = (
            <span style={{ display: 'inline-block', width: '16px', fontSize: '10px', textAlign: 'center', cursor: 'pointer', marginRight: '4px' }} onClick={() => onExpanderClick(t)}>
              {t.hideChildren ? '▶' : '▼'}
            </span>
          );
        } else {
           expander = <span style={{ display: 'inline-block', width: '20px' }}></span>;
        }
        const paddingLeft = t.id.startsWith('p-') ? '10px' : t.id.startsWith('m-') ? '30px' : '50px';

        return (
          <div 
            key={t.id} 
            style={{ display: 'flex', height: rowHeight, fontFamily, borderBottom: '1px solid var(--color-border)', backgroundColor: t.id === selectedTaskId ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-primary)', transition: 'background-color 0.2s ease', cursor: 'pointer' }}
            onClick={() => setSelectedTask(t.id)}
            onMouseEnter={(e) => { if (t.id !== selectedTaskId) e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'; }}
            onMouseLeave={(e) => { if (t.id !== selectedTaskId) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
             <div style={{ flex: 1, minWidth: '150px', padding: '0 10px', paddingLeft, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
               {expander}
               <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: t.id.startsWith('t-') ? 400 : 600 }} title={t.name}>{t.name}</span>
             </div>
             <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>{t.start.toLocaleDateString('en-GB')}</div>
             <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>{t.end.toLocaleDateString('en-GB')}</div>
             <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>
               <span className={`badge ${(t as any).statusStr === 'Completed' ? 'badge-success' : (t as any).statusStr === 'In Progress' ? 'badge-primary' : 'badge-secondary'}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                 {(t as any).statusStr || '-'}
               </span>
             </div>
             <div style={{ width: '80px', padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>{durationDays} d</div>
          </div>
        );
      })}
    </div>
  );
};

const CustomTooltip: React.FC<{ task: Task; fontSize: string; fontFamily: string }> = ({ task, fontSize, fontFamily }) => {
  const durationMs = task.end.getTime() - task.start.getTime();
  const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
  return (
    <div className="card" style={{ padding: '12px', border: `2px solid ${task.styles?.backgroundColor || 'var(--color-border)'}`, fontFamily, fontSize }}>
      <b style={{ fontSize: '14px', display: 'block', marginBottom: '4px', color: task.styles?.backgroundColor || 'var(--color-text-primary)' }}>{task.name}</b>
      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Start: {task.start.toLocaleDateString('en-GB')}</div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>End: {task.end.toLocaleDateString('en-GB')}</div>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px', color: task.styles?.backgroundColor || 'var(--color-text-primary)' }}>
        Duration: {durationDays} Days
      </div>
    </div>
  );
};

export default function GanttChart() {
  const [activeTab, setActiveTab] = useState<Tab>('individual');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [searchQuery, setSearchQuery] = useState('');

  const getColor = (status: string) => {
    if (status === 'On Hold' || status === 'Hold') return 'var(--color-danger)';
    if (status === 'Completed') return 'var(--color-success)';
    if (status === 'Started' || status === 'In Progress') return 'var(--color-primary)';
    return 'var(--color-secondary)';
  };

  const getValidDate = (...dateStrs: (string | null | undefined)[]) => {
    for (const d of dateStrs) {
      if (d && d.trim() !== '') {
        const date = new Date(d);
        if (!isNaN(date.getTime())) return date;
      }
    }
    return new Date();
  };

  const getSafeDates = (actualStart: any, start: any, plannedStart: any, actualEnd: any, end: any, plannedEnd: any) => {
    let startDate = getValidDate(actualStart, start, plannedStart);
    let endDate = getValidDate(actualEnd, end, plannedEnd);
    
    // Ensure end is strictly after start for Gantt chart component to work properly
    if (endDate.getTime() <= startDate.getTime()) {
      endDate = new Date(startDate.getTime());
      endDate.setDate(endDate.getDate() + 1);
    }
    
    return { start: startDate, end: endDate };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, milestonesRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('*').order('start_date', { ascending: true }),
        supabase.from('milestones').select('*').order('start_date', { ascending: true }),
        supabase.from('tasks').select('*').order('start_date', { ascending: true })
      ]);

      const projects = projectsRes.data || [];
      const milestones = milestonesRes.data || [];
      const tasksData = tasksRes.data || [];

      let formattedTasks: Task[] = [];
      let individualTasks: Task[] = [];

      projects.forEach((p) => {
        const pTasks = tasksData.filter(t => t.project_id === p.id);
        
        const isExternalProject = p.type === 'External project';
        const isInternalProject = !isExternalProject;

        // const isProjectActual = !!(p.actual_start_date || p.actual_end_date);
        const { start: pStart, end: pEnd } = getSafeDates(
          p.actual_start_date, p.start_date, p.planned_start_date, 
          p.actual_end_date, p.end_date, p.planned_end_date
        );

        const projectTask: Task = {
          id: `p-${p.id}`,
          name: `${p.name} - ${p.progress || 0}%`,
          type: 'project',
          start: pStart,
          end: pEnd,
          progress: p.progress || 0,
          isDisabled: true,
          hideChildren: true,
          styles: { 
            progressColor: getColor(p.status), 
            progressSelectedColor: getColor(p.status),
            backgroundColor: getColor(p.status)
          },
          statusStr: p.status
        } as any;

        if (isExternalProject) formattedTasks.push(projectTask);
        if (isInternalProject) individualTasks.push(projectTask);

        const pMilestones = milestones.filter(m => m.project_id === p.id);
        pMilestones.forEach(m => {
          // const isMilestoneActual = !!(m.actual_start_date || m.actual_end_date);
          const { start: mStart, end: mEnd } = getSafeDates(
            m.actual_start_date, m.start_date, m.planned_start_date, 
            m.actual_end_date, m.end_date, m.planned_end_date
          );

          const milestoneTask: Task = {
             id: `m-${m.id}`,
             name: `${m.name} - ${m.progress || 0}%`,
             type: 'project',
             start: mStart,
             end: mEnd,
             progress: m.progress || 0,
             isDisabled: true,
             hideChildren: true,
             styles: { 
               progressColor: getColor(m.status), 
               progressSelectedColor: getColor(m.status),
               backgroundColor: getColor(m.status)
             },
             project: `p-${p.id}`,
             statusStr: m.status
          } as any;

          if (isExternalProject) formattedTasks.push(milestoneTask);
          if (isInternalProject) individualTasks.push(milestoneTask);
        });

        pTasks.forEach(t => {
          // const isTaskActual = !!(t.actual_start_date || t.actual_end_date);
          const { start: tStart, end: tEnd } = getSafeDates(
            t.actual_start_date, t.start_date, t.planned_start_date, 
            t.actual_end_date, t.end_date, t.planned_end_date
          );

          const taskObj: Task = {
             id: `t-${t.id}`,
             name: `${t.title} - ${t.progress || 0}%`,
             type: 'task',
             start: tStart,
             end: tEnd,
             progress: t.progress || 0,
             isDisabled: true,
             styles: { 
               progressColor: getColor(t.status), 
               progressSelectedColor: getColor(t.status),
               backgroundColor: getColor(t.status)
             },
             project: t.milestone_id ? `m-${t.milestone_id}` : `p-${p.id}`,
             statusStr: t.status
          } as any;
          
          if (isExternalProject) formattedTasks.push(taskObj);
          if (isInternalProject) individualTasks.push(taskObj);
        });
      });
      
      // Save all tasks in state, we'll filter them during render based on the active tab
      // Preserve existing expanded/collapsed state if the task is already loaded
      setTasks(prevTasks => {
         const newTasks = activeTab === 'team' ? formattedTasks : individualTasks;
         return newTasks.map(nt => {
            const prev = prevTasks.find(pt => pt.id === nt.id);
            if (prev && prev.hideChildren !== undefined) {
               return { ...nt, hideChildren: prev.hideChildren };
            }
            return nt;
         });
      });
      
    } catch (error) {
      console.error('Error fetching Gantt data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleDbChange = (payload: any, table: string) => {
      if (payload.eventType === 'DELETE') {
         setTasks(prev => prev.filter(t => t.id !== `${table.charAt(0)}-${payload.old.id}`));
         return;
      }
      setTasks(prevTasks => {
        const updated = payload.new;
        return prevTasks.map(t => {
          let prefix = table === 'projects' ? 'p-' : table === 'milestones' ? 'm-' : 't-';
          if (t.id === `${prefix}${updated.id}`) {
            const { start, end } = getSafeDates(updated.actual_start_date, updated.start_date, updated.planned_start_date, updated.actual_end_date, updated.end_date, updated.planned_end_date);
            const newName = `${updated.name || updated.title} - ${updated.progress || 0}%`;
            return {
               ...t,
               name: newName,
               start,
               end,
               progress: updated.progress || 0,
               statusStr: updated.status,
               styles: {
                 progressColor: getColor(updated.status),
                 progressSelectedColor: getColor(updated.status),
                 backgroundColor: getColor(updated.status)
               }
            };
          }
          return t;
        });
      });
    };

    const subProjects = supabase.channel('gantt_projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (p) => handleDbChange(p, 'projects')).subscribe();
    const subMilestones = supabase.channel('gantt_milestones').on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, (p) => handleDbChange(p, 'milestones')).subscribe();
    const subTasks = supabase.channel('gantt_tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (p) => handleDbChange(p, 'tasks')).subscribe();

    return () => {
      supabase.removeChannel(subProjects);
      supabase.removeChannel(subMilestones);
      supabase.removeChannel(subTasks);
    };
  }, [activeTab]);

  const handleExpanderClick = (task: Task) => {
    setTasks(tasks.map(t => (t.id === task.id ? task : t)));
  };

  const handleDateChange = async (task: Task) => {
    try {
      // task.id is 'p-uuid', 'm-uuid', or 't-uuid'
      const idPrefix = task.id.substring(0, 2);
      const uuid = task.id.substring(2);
      
      const startDateStr = task.start.toISOString().split('T')[0];
      const endDateStr = task.end.toISOString().split('T')[0];
      
      let table = '';
      if (idPrefix === 'p-') table = 'projects';
      else if (idPrefix === 'm-') table = 'milestones';
      else if (idPrefix === 't-') table = 'tasks';
      
      if (table) {
         // Optimistically update the UI
         setTasks(tasks.map(t => (t.id === task.id ? task : t)));
         
         const { error } = await supabase.from(table).update({
           start_date: startDateStr,
           end_date: endDateStr,
           planned_start_date: startDateStr,
           planned_end_date: endDateStr
         }).eq('id', uuid);
         
         if (error) {
            console.error('Error updating task in db:', error);
            fetchData(); // revert
         }
      }
    } catch (err) {
      console.error(err);
      fetchData(); // revert
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Gantt Chart">
        <div style={{ display: 'flex', gap: 'var(--space-2)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}>
          {([
            { id: 'individual', label: 'Internal Team' },
            { id: 'team', label: 'External Team' }
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className="btn btn-sm"
                style={{ 
                  position: 'relative',
                  background: 'transparent', 
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', 
                  border: 'none',
                  fontWeight: isActive ? 600 : 500,
                  zIndex: 1
                }}
                onClick={() => setActiveTab(tab.id as Tab)}
              >
                {isActive && (
                  <motion.div
                    layoutId="gantt-active-tab"
                    style={{
                      position: 'absolute', inset: 0,
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)',
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
      </PageHeader>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search projects..."
            style={{ paddingLeft: '2.5rem', width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', backgroundColor: 'var(--color-bg-subtle)', padding: 'var(--space-1)', borderRadius: 'var(--radius-md)' }}>
          {[
            { id: ViewMode.Day, label: 'Day' },
            { id: ViewMode.Week, label: 'Week' },
            { id: ViewMode.Month, label: 'Month' }
          ].map((mode) => {
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                className="btn btn-sm"
                style={{ 
                  position: 'relative',
                  background: 'transparent', 
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', 
                  border: 'none',
                  fontWeight: isActive ? 600 : 500,
                  zIndex: 1
                }}
                onClick={() => setViewMode(mode.id as ViewMode)}
              >
                {isActive && (
                  <motion.div
                    layoutId="gantt-viewmode-tab"
                    style={{
                      position: 'absolute', inset: 0,
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)',
                      zIndex: -1
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-0" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${viewMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {loading ? (
               <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading Professional Gantt Chart...</div>
            ) : tasks.length > 0 ? (() => {
              
              let filteredTasks = tasks;
              if (searchQuery.trim() !== '') {
                 const lowerQuery = searchQuery.toLowerCase();
                 const matchingProjectIds = new Set(tasks.filter(t => t.id.startsWith('p-') && t.name.toLowerCase().includes(lowerQuery)).map(t => t.id));
                 filteredTasks = tasks.filter(t => {
                     if (t.id.startsWith('p-')) return matchingProjectIds.has(t.id);
                     if (t.id.startsWith('m-')) return matchingProjectIds.has(t.project || '');
                     if (t.id.startsWith('t-')) {
                         if ((t.project || '').startsWith('p-')) return matchingProjectIds.has(t.project || '');
                         if ((t.project || '').startsWith('m-')) {
                             const parentMilestone = tasks.find(m => m.id === t.project);
                             return parentMilestone && matchingProjectIds.has(parentMilestone.project || '');
                         }
                     }
                     return false;
                 });
              }

              if (filteredTasks.length === 0) {
                 return <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No projects match your search.</div>;
              }

              return (
              <div style={{ overflowX: 'auto' }}>
                <Gantt 
                  tasks={filteredTasks} 
                  viewMode={viewMode}
                  onExpanderClick={handleExpanderClick}
                  onDateChange={handleDateChange}
                  listCellWidth="390px"
                  columnWidth={viewMode === ViewMode.Month ? 150 : viewMode === ViewMode.Week ? 100 : 60}
                  TaskListHeader={CustomTaskListHeader}
                  TaskListTable={CustomTaskListTable}
                  TooltipContent={CustomTooltip}
                />
              </div>
              );
            })() : (
               <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No data available to display in Gantt Chart. Add a project to get started.</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{ fontWeight: 600, marginRight: 'var(--space-2)' }}>Legend:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-secondary)', borderRadius: '2px' }}></span> Not Started</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-primary)', borderRadius: '2px' }}></span> In Progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-success)', borderRadius: '2px' }}></span> Completed</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-danger)', borderRadius: '2px' }}></span> Hold</div>
        </div>
      </div>
    </div>
  );
}