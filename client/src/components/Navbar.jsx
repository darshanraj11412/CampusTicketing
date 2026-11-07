import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Ticket, 
  LayoutDashboard, 
  ShieldCheck,
  Zap, 
  LogOut, 
  LogIn, 
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
  const { user, isAuthenticated, logout } = useAuth();

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
      {/* Main Navbar */}
      <div className="container main-navbar" style={{
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
        <nav className="main-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

          <button
            onClick={openConcurrencyModal}
            className="btn btn-sm btn-outline"
            style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            title="Test atomic concurrency and race condition protection"
          >
            <Zap size={14} />
            Concurrency Lab
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
                onClick={() => {
                  logout();
                  openAuthModal();
                }}
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
