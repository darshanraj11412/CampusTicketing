import React from 'react';
import { Search, Calendar, Users, CheckCircle2, Ticket, Sparkles } from 'lucide-react';

export const HeroSection = ({ 
  events = [], 
  searchTerm = '', 
  setSearchTerm,
  totalRegistrations = 0,
  totalCheckedIn = 0 
}) => {
  const activeEventsCount = events.length;
  const totalSeatsAvailable = events.reduce((sum, e) => sum + (e.seatsLeft || 0), 0);

  return (
    <div style={{
      padding: '3rem 0 2rem',
      position: 'relative',
      textAlign: 'center'
    }}>
      {/* Decorative Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.85rem',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#60a5fa',
        marginBottom: '1.25rem'
      }}>
        <Sparkles size={14} />
        RV University Event Management Ecosystem
      </div>

      {/* Main Headline */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(2rem, 5vw, 3.25rem)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1.15,
        maxWidth: '820px',
        margin: '0 auto 1rem'
      }}>
        One Place to Discover & Register for{' '}
        <span style={{
          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          All Campus Events
        </span>
      </h1>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '1.05rem',
        maxWidth: '650px',
        margin: '0 auto 2.25rem',
        lineHeight: 1.6
      }}>
        No more scattered WhatsApp posters or manual headcount queues. 
        Browse live seat availability, register in one click, and scan your digital ticket at the door.
      </p>

      {/* Live Campus Stats Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        maxWidth: '900px',
        margin: '0 auto 2.5rem'
      }}>
        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#38bdf8', marginBottom: '0.25rem' }}>
            <Calendar size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Events</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
            {activeEventsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Active listings</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.25rem' }}>
            <Ticket size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Seats Left</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#34d399' }}>
            {totalSeatsAvailable}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Real-time available</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#818cf8', marginBottom: '0.25rem' }}>
            <Users size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registrations</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
            {totalRegistrations}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Passes issued</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#fbbf24', marginBottom: '0.25rem' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Door Scans</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fbbf24' }}>
            {totalCheckedIn}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Live check-ins</div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div style={{
        maxWidth: '560px',
        margin: '0 auto',
        position: 'relative'
      }}>
        <Search 
          size={18} 
          style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#64748b'
          }} 
        />
        <input
          type="text"
          className="input"
          placeholder="Search events by title, venue, or keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            paddingLeft: '2.75rem',
            paddingRight: '1rem',
            fontSize: '0.95rem',
            height: '48px',
            backgroundColor: 'rgba(19, 28, 49, 0.85)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
