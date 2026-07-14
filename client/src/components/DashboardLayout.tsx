import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Briefcase, 
  CalendarDays, 
  Flag, 
  CheckSquare, 
  Users, 
  FileText, 
  DollarSign, 
  FolderOpen, 
  Mail,
  Receipt,
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

const Logo = () => (
  <img 
    src="/logo.svg" 
    alt="INDO TECH" 
    style={{ 
      height: '28px', 
      width: 'auto', 
      objectFit: 'contain' 
    }} 
    onError={() => {
      console.warn("Logo image not found in public folder. Please save logo.svg to client/public/");
    }}
  />
);

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Planning',
    items: [
      { name: 'Projects', href: '/projects', icon: Briefcase },
      { name: 'Milestones', href: '/milestones', icon: Flag },
      { name: 'Gantt Chart', href: '/gantt', icon: CalendarDays },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Team', href: '/team', icon: Users },
      { name: 'DPR', href: '/dpr', icon: FileText },
      { name: 'Documents', href: '/documents', icon: FolderOpen },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Budget', href: '/budget', icon: DollarSign },
      { name: 'Billing', href: '/billing', icon: Receipt },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Mail },
    ],
  },
];

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname.toLowerCase() === '/dpr') return 'DPR';
  const slug = pathname.substring(1).replace('-', ' ');
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useLocalStorage('epms-sidebar-collapsed', false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="app-container">
        <aside style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          transition: 'width 0.2s ease',
        }}>
          <div style={{ height: 'var(--header-height)', display: 'flex', alignItems: 'center', padding: '0 var(--space-5)', borderBottom: '1px solid var(--color-border)' }} />
          <div style={{ flex: 1, padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '36px', borderRadius: 'var(--radius-sm)' }} />)}
          </div>
        </aside>
        <main className="main-content">
          <header style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-7)',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}>
            <div className="skeleton skeleton-text" style={{ width: '140px', height: '20px', margin: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </div>
          </header>
          <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '180px', height: '20px' }} />
          </div>
        </main>
      </div>
    );
  }

  const sidebarWidth = collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          {!collapsed && <Logo />}
          <button
            onClick={() => setCollapsed((prev: boolean) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-tertiary)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-subtle)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-tertiary)';
            }}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: collapsed ? 'var(--space-3) var(--space-2)' : 'var(--space-4) var(--space-3)',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <h2 
                  className="sidebar-group-label"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '0 var(--space-3)',
                    marginBottom: 'var(--space-2)',
                    marginTop: 0,
                  }}
                >
                  {group.label}
                </h2>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      title={collapsed ? item.name : undefined}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                          padding: collapsed ? 'var(--space-2)' : '0.5rem var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.875rem',
                          transition: 'all 0.15s ease',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                          }
                        }}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-active-indicator"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{
                            position: 'absolute',
                            left: collapsed ? 'auto' : '-12px',
                            top: collapsed ? 'auto' : '50%',
                            bottom: collapsed ? '-2px' : 'auto',
                            transform: collapsed ? 'none' : 'translateY(-50%)',
                            width: collapsed ? '20px' : '3px',
                            height: collapsed ? '3px' : '20px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--color-primary)',
                          }} />
                        )}
                        <item.icon size={collapsed ? 20 : 18} style={{ flexShrink: 0 }} />
                        {!collapsed && (
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: collapsed ? 'var(--space-3) var(--space-2)' : 'var(--space-3)',
          borderTop: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              color: 'var(--color-text-secondary)',
              padding: '0.5rem var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-danger-subtle)';
              e.currentTarget.style.color = 'var(--color-danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header style={{ 
          height: 'var(--header-height)', 
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-7)',
          flexShrink: 0,
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.01em',
          }}>
            {getPageTitle(location.pathname)}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-secondary)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-subtle)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                  {user?.email || 'User'}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-tertiary)' }}>
                  Project Manager
                </p>
              </div>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}>
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'UN'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="page-content"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
