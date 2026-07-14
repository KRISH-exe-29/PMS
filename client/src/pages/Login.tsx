import { useState } from 'react';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BlackHole from '../components/ui/BlackHole';

const Logo = () => (
  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
    <img 
      src="/logo.svg" 
      alt="INDO TECH" 
      style={{ 
        height: '48px', 
        width: 'auto', 
        objectFit: 'contain',
        margin: '0 auto'
      }} 
      onError={() => {
        console.warn("Logo image not found in public folder. Please save logo.svg to client/public/");
      }}
    />
  </div>
);

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Email address is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    
    try {
      setIsLoading(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        setIsExiting(true);
        setTimeout(() => navigate('/'), 300);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setIsLoading(false);
    }
  };

  return (
    <div 
      data-theme="dark"
      style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: 'var(--color-navy-950)', // Base fallback
      fontFamily: 'var(--font-sans)',
      padding: 'var(--space-8)'
    }}>
      {/* Background Blackhole */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <BlackHole />
      </div>

      {/* Top Static Header Content */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', textAlign: 'center', paddingTop: '6vh', marginBottom: 'auto' }}>
        <Logo />
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          color: 'var(--color-text-primary)', 
          marginTop: '1.5rem',
          letterSpacing: '-0.02em'
        }}>
          Project Management System
        </h1>
        <p style={{ 
          fontSize: '0.9375rem', 
          color: 'var(--color-text-secondary)', 
          marginTop: '0.5rem' 
        }}>
          Log in to access your projects, teams, and operations.
        </p>
      </div>

      {/* Centered Form/Button Wrapper */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px', margin: '0 auto', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '16vh' }}>

        {/* Two-Stage Glass Tile / Button */}
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.button
              key="stage1"
              layoutId="login-glass"
              onClick={() => setShowForm(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              style={{
                width: 'auto',
                padding: '0.875rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                background: 'var(--color-glass-card-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 1px 1px 0px rgba(255, 255, 255, 0.15), 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              }}
            >
              Click to sign in
            </motion.button>
          ) : (
            <motion.div 
              key="stage2"
              layoutId="login-glass"
              initial={{ opacity: 0, borderRadius: '9999px' }}
              animate={isExiting ? { opacity: 0, scale: 0.95, y: -20, borderRadius: 'var(--radius-lg)' } : { opacity: 1, scale: 1, y: 0, borderRadius: 'var(--radius-lg)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                padding: 'var(--space-8) var(--space-7)',
                background: 'var(--color-glass-card-bg)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 1px 1px 0px rgba(255, 255, 255, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                overflow: 'hidden'
              }}
            >
              <motion.form 
                onSubmit={handleLogin} 
                style={{ width: '100%' }}
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ 
                backgroundColor: 'var(--color-danger-subtle)', 
                color: 'var(--color-danger)', 
                fontSize: '0.875rem', 
                fontWeight: 500,
                padding: '0.75rem', 
                borderRadius: 'var(--radius-sm)', 
                marginBottom: '1.5rem', 
                textAlign: 'center',
                border: '1px solid rgba(227, 30, 36, 0.2)'
              }}
            >
              {error}
            </motion.div>
          )}
          
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="username" className="form-label">
              Email Address
            </label>
            <input
              id="username"
              type="email"
              className="form-input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="name@company.com"
              style={{ 
                padding: '0.75rem 1rem', 
                fontSize: '0.9375rem',
                backgroundColor: 'var(--color-input-bg)', // Solid background for legibility over blur
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem', position: 'relative' }}>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                style={{ 
                  padding: '0.75rem 2.5rem 0.75rem 1rem', 
                  fontSize: '0.9375rem',
                  backgroundColor: 'var(--color-input-bg)', // Solid background for legibility over blur
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button 
            type="submit" 
            disabled={isLoading || isExiting}
            whileTap={{ scale: 0.97 }}
            className="btn w-full btn-primary"
            style={{ 
              padding: '0.875rem', 
              fontSize: '0.9375rem', 
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(36, 81, 214, 0.25)',
              opacity: (isLoading || isExiting) ? 0.7 : 1,
              gap: '0.5rem',
            }}
          >
            <AnimatePresence mode="wait">
              {isLoading || isExiting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Loader2 className="animate-spin" size={20} />
                  <span>Signing in...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <LogIn size={20} />
                  <span>Sign in to Dashboard</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
