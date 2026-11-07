import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, Mail, User, Hash, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const AuthModal = ({ onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('signin'); // 'signin' or 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [regData, setRegData] = useState({
    name: '',
    usn: '',
    email: '',
    password: '',
    department: 'School of CSE',
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(identifier, password);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(regData);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '440px', padding: '2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              RV UNIVERSITY SSO
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
              {tab === 'signin' ? 'Sign In to Campus Ticketing' : 'Register Student Account'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switchers */}
        <div style={{
          display: 'flex',
          backgroundColor: '#1e293b',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '1.25rem',
          gap: '4px'
        }}>
          <button
            onClick={() => setTab('signin')}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: tab === 'signin' ? '#3b82f6' : 'transparent',
              color: tab === 'signin' ? '#fff' : '#94a3b8'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: tab === 'signup' ? '#3b82f6' : 'transparent',
              color: tab === 'signup' ? '#fff' : '#94a3b8'
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.65rem 0.85rem',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            color: '#fda4af',
            fontSize: '0.8rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {tab === 'signin' ? (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                College USN or Email
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. 1RUA24SCS0012 or arjun@rvu.edu.in"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                maxLength={72}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="Arjun N"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>
                College USN
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="1RUA24SCS0012"
                value={regData.usn}
                onChange={(e) => setRegData({ ...regData, usn: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>
                University Email
              </label>
              <input
                type="email"
                required
                className="input"
                placeholder="student@rvu.edu.in"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.25rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                maxLength={72}
                className="input"
                placeholder="••••••••"
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
