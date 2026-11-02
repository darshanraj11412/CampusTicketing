import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { 
  Ticket, 
  LayoutDashboard, 
  ShieldCheck, 
  Zap, 
  LogOut, 
  LogIn, 
  User, 
  Wifi, 
  WifiOff,
  Sparkles,
  QrCode
} from 'lucide-react';

export const Navbar = ({ 
  activeView, 
  setActiveView, 
  openMyTickets, 
  ticketCount = 0,
  openAuthModal,
  openConcurrencyModal,
  openScannerModal
}) => {
  const { user, isAuthenticated, logout, switchDemoUser } = useAuth();
  const { isConnected } = useSocket();
  const [switching, setSwitching] = useState(false);

  const handleDemoSwitch = async (id) => {
    setSwitching(true);
    try {
      await switchDemoUser(id);
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* Demo Switcher Ribbon (Slide 1 & Slide 7 helper for viva) */}
      <div style={{
        backgroundColor: '#0f172a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '0.35rem 1.5rem',
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.3rem',
            color: isConnected ? '#34d399' : '#f43f5e',
            fontWeight: 600
          }}>
            {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isConnected ? 'WebSocket Sync Active' : 'Connecting WebSocket...'}
          </span>
          <span>•</span>
          <span style={{ color: '#cbd5e1' }}>RV University CS3301 · Team 8</span>
        </div>

        {/* 1-Click Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>SWITCH ROLE:</span>
          
          <button 
            onClick={() => handleDemoSwitch('1RUA24SCS0012')} 
            disabled={switching}
            className={`btn btn-sm ${user?.usn === '1RUA24SCS0012' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
          >
            Student (Arjun)
          </button>

          <button 
            onClick={() => handleDemoSwitch('1RUA24SCS0029')} 
            disabled={switching}
            className={`btn btn-sm ${user?.usn === '1RUA24SCS0029' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
          >
            Student (Darshan)
          </button>

          <button 
            onClick={() => handleDemoSwitch('organizer@rvu.edu.in')} 
            disabled={switching}
            className={`btn btn-sm ${user?.role === 'organizer' ? 'btn-accent' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
          >
            Organizer (Club Lead)
          </button>

          <button 
            onClick={() => handleDemoSwitch('admin@rvu.edu.in')} 
            disabled={switching}
            className={`btn btn-sm ${user?.role === 'admin' ? 'btn-success' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
          >
            Admin (Dean)
          </button>

          <button
            onClick={openConcurrencyModal}
            className="btn btn-sm btn-outline"
            style={{ 
              padding: '0.2rem 0.5rem', 
              fontSize: '0.7rem',
              color: '#f59e0b',
              borderColor: 'rgba(245, 158, 11, 0.4)'
            }}
            title="Test atomic concurrency & race condition protection"
          >
            <Zap size={12} /> Concurrency Lab
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActiveView('events')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Ticket size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              Campus<span style={{ color: '#38bdf8' }}>Ticketing</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              RV University · Live Seat Engine
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveView('events')}
            className={`btn ${activeView === 'events' ? 'btn-secondary' : 'btn-outline'}`}
            style={{ border: 'none' }}
          >
            Events
          </button>

          {/* Student My Tickets */}
          <button
            onClick={openMyTickets}
            className="btn btn-outline"
            style={{ 
              position: 'relative',
              borderColor: ticketCount > 0 ? 'rgba(59, 130, 246, 0.4)' : '#334155'
            }}
          >
            <Ticket size={16} />
            My Tickets
            {ticketCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#3b82f6',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '9999px',
                padding: '2px 6px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.6)'
              }}>
                {ticketCount}
              </span>
            )}
          </button>

          {/* Organizer Link */}
          {(user?.role === 'organizer' || user?.role === 'admin') && (
            <button
              onClick={() => setActiveView('organizer')}
              className={`btn ${activeView === 'organizer' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <LayoutDashboard size={16} />
              Organizer Desk
            </button>
          )}

          {/* Quick Scanner Shortcut for Door Check-in */}
          {(user?.role === 'organizer' || user?.role === 'admin') && (
            <button
              onClick={openScannerModal}
              className="btn btn-accent"
              title="Open QR Scanner / Ticket Check-In"
            >
              <QrCode size={16} />
              Door Check-In
            </button>
          )}

          {/* Admin Link */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveView('admin')}
              className={`btn ${activeView === 'admin' ? 'btn-success' : 'btn-secondary'}`}
            >
              <ShieldCheck size={16} />
              Admin
            </button>
          )}
        </nav>

        {/* User Profile / Auth Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  {user?.usn} · <span style={{ textTransform: 'capitalize', color: '#38bdf8' }}>{user?.role}</span>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="btn btn-outline btn-sm"
                title="Log Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={openAuthModal} className="btn btn-primary">
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
