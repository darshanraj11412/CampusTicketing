import React from 'react';
import { X, Ticket, Calendar, MapPin, CheckCircle, ChevronRight, ShieldCheck } from 'lucide-react';

export const MyTicketsDrawer = ({
  isOpen,
  onClose,
  tickets = [],
  onSelectTicket
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          padding: '2rem',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Ticket size={22} color="#38bdf8" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
              My Event Passes ({tickets.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tickets List */}
        <div style={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.25rem' }}>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <Ticket size={40} color="#475569" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                No active passes found
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                You haven't registered for any events yet. Pick an event from the list and reserve your seat!
              </p>
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t._id || t.id}
                onClick={() => onSelectTicket(t)}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#38bdf8',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {t.ticketCode}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: t.checkedIn ? 'rgba(52, 211, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: t.checkedIn ? '#34d399' : '#93c5fd'
                    }}>
                      {t.checkedIn ? 'CHECKED IN' : 'CONFIRMED'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                    {t.eventTitle}
                  </h4>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.775rem', color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} color="#38bdf8" />
                      {t.eventDateTime}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} color="#f43f5e" />
                      {t.eventVenue}
                    </span>
                  </div>
                </div>

                <div style={{ color: '#64748b' }}>
                  <ChevronRight size={20} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
