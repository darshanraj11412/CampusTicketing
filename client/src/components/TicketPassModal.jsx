import React, { useState } from 'react';
import { X, Printer, Trash2, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { api } from '../utils/api.js';

export const TicketPassModal = ({ 
  registration, 
  onClose, 
  onTicketCancelled,
  confirmationTimeMs = null
}) => {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  if (!registration) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel this ticket? The seat will immediately be released to other students.')) {
      return;
    }

    setCancelling(true);
    try {
      await api.cancelRegistration(registration._id || registration.id);
      if (onTicketCancelled) {
        onTicketCancelled(registration._id || registration.id);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel registration');
      setCancelling(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '480px', padding: '1.75rem', position: 'relative' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '1.25rem',
            top: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <X size={20} />
        </button>

        {/* Sub-second confirmation badge */}
        {confirmationTimeMs && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            color: '#34d399',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginBottom: '1rem'
          }}>
            <CheckCircle2 size={13} />
            Seat booked & confirmed in {confirmationTimeMs}ms (&lt;1s target)
          </div>
        )}

        {/* Printable Ticket Pass Container */}
        <div className="ticket-pass printable-pass">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
                RV UNIVERSITY · CAMPUS ENTRY PASS
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#f8fafc', marginTop: '0.15rem' }}>
                {registration.eventTitle}
              </div>
            </div>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: registration.checkedIn ? 'rgba(52, 211, 153, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              color: registration.checkedIn ? '#34d399' : '#93c5fd',
              border: `1px solid ${registration.checkedIn ? '#10b981' : '#3b82f6'}`
            }}>
              <ShieldCheck size={12} />
              {registration.checkedIn ? 'CHECKED-IN' : 'VALID PASS'}
            </span>
          </div>

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.85rem',
            fontSize: '0.8rem',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Date & Time</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>{registration.eventDateTime}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Venue</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>{registration.eventVenue}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Attendee</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>{registration.userName}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>College USN</div>
              <div style={{ color: '#38bdf8', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                {registration.userUsn}
              </div>
            </div>
          </div>

          {/* Perforated divider */}
          <div className="ticket-notch-divider" />

          {/* QR Code & Passcode Area */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.75rem'
          }}>
            {registration.qrData ? (
              <div style={{
                background: '#ffffff',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                display: 'inline-block'
              }}>
                <img 
                  src={registration.qrData} 
                  alt={`Ticket QR for ${registration.ticketCode}`}
                  style={{ width: '160px', height: '160px', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ padding: '2rem', background: '#334155', borderRadius: '12px' }}>
                <QrCode size={100} color="#94a3b8" />
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                TICKET CODE (DOOR ENTRY)
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.1em',
                marginTop: '0.2rem'
              }}>
                {registration.ticketCode}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Show this QR code at the door for volunteer scanning
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: '#f43f5e', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
            {error}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button 
            onClick={handlePrint}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <Printer size={15} />
            Print / Save Pass
          </button>

          {!registration.checkedIn && (
            <button
              onClick={handleCancelRegistration}
              className="btn btn-danger"
              disabled={cancelling}
              style={{ flex: 1 }}
            >
              <Trash2 size={15} />
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
