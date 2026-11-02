import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import { X, Calendar, MapPin, AlertCircle, CheckCircle, Zap } from 'lucide-react';

export const RegistrationModal = ({ event, onClose, onSuccessRegistration }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!event) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    const startTime = performance.now();
    try {
      const result = await api.registerForEvent(event._id || event.id);
      const elapsed = Math.round(performance.now() - startTime);

      // Trigger Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }

      onSuccessRegistration(result.registration, elapsed);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#38bdf8'
            }}>
              CONFIRM REGISTRATION
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#f8fafc',
              marginTop: '0.25rem'
            }}>
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Event Summary Details */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
            <Calendar size={15} color="#38bdf8" />
            <span>{event.dateTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
            <MapPin size={15} color="#f43f5e" />
            <span>{event.venue}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.825rem', fontWeight: 600 }}>
            <Zap size={14} />
            <span>{event.seatsLeft} of {event.seatCap} seats remaining upfront</span>
          </div>
        </div>

        {/* Student Verification Box */}
        <div style={{
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          background: 'rgba(59, 130, 246, 0.05)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            STUDENT IDENTIFIER (RV UNIVERSITY)
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#94a3b8' }}>Student Name:</span>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>{user?.name || 'Guest'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#94a3b8' }}>College USN:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {user?.usn || '1RUA24SCS0012'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: '#94a3b8' }}>Official Email:</span>
            <span style={{ color: '#cbd5e1' }}>{user?.email || 'student@rvu.edu.in'}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ flex: 1 }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={loading}
          >
            {loading ? (
              'Securing Seat with Atomic Lock...'
            ) : (
              'Confirm & Get Digital Pass'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
