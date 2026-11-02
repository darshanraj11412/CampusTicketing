import React, { useState } from 'react';
import { 
  Plus, 
  QrCode, 
  Users, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Download, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { api } from '../utils/api.js';

export const OrganizerDashboard = ({
  events = [],
  onOpenCreateEvent,
  onOpenScanner,
  onViewAttendees,
  onEventUpdated,
  onEventDeleted
}) => {
  const [actionLoading, setActionLoading] = useState(null);

  // Compute stats across all events
  const totalEvents = events.length;
  const totalCapacity = events.reduce((sum, e) => sum + (e.seatCap || 0), 0);
  const totalSeatsLeft = events.reduce((sum, e) => sum + (e.seatsLeft || 0), 0);
  const totalBooked = totalCapacity - totalSeatsLeft;

  const handleToggleStatus = async (ev) => {
    const newStatus = ev.status === 'open' ? 'closed' : 'open';
    setActionLoading(ev._id || ev.id);
    try {
      const updated = await api.updateEvent(ev._id || ev.id, { status: newStatus });
      if (onEventUpdated) onEventUpdated(updated);
    } catch (err) {
      alert(err.message || 'Failed to update event status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (ev) => {
    if (!window.confirm(`Are you sure you want to delete "${ev.title}"? This will cancel all attendee passes.`)) {
      return;
    }
    setActionLoading(ev._id || ev.id);
    try {
      await api.deleteEvent(ev._id || ev.id);
      if (onEventDeleted) onEventDeleted(ev._id || ev.id);
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ORGANIZER & CLUB LEAD DASHBOARD
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
            Live Event Operations
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Publish events, set seat caps, and monitor live door check-ins in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={onOpenScanner} className="btn btn-accent">
            <QrCode size={16} />
            Door Check-In Desk
          </button>
          <button onClick={onOpenCreateEvent} className="btn btn-primary">
            <Plus size={16} />
            Publish New Event
          </button>
        </div>
      </div>

      {/* Organizer Key Performance Indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Active Events</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc', margin: '0.25rem 0' }}>
            {totalEvents}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Across all departments</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Total Seat Capacity</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#cbd5e1', margin: '0.25rem 0' }}>
            {totalCapacity}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Room & ground caps</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Total Booked Seats</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#34d399', margin: '0.25rem 0' }}>
            {totalBooked}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
            {totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0}% platform capacity
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Remaining Seats</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fbbf24', margin: '0.25rem 0' }}>
            {totalSeatsLeft}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Available upfront</div>
        </div>
      </div>

      {/* Events Management Roster */}
      <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f8fafc' }}>
          Managed Campus Events
        </h3>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            No events published yet. Click "Publish New Event" to get started!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Event Title</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category & Venue</th>
                <th style={{ padding: '0.75rem 1rem' }}>Capacity & Fill Rate</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const booked = (ev.seatCap || 0) - (ev.seatsLeft || 0);
                const pct = ev.seatCap ? Math.min(100, Math.round((booked / ev.seatCap) * 100)) : 0;
                const isActionLoading = actionLoading === (ev._id || ev.id);

                return (
                  <tr 
                    key={ev._id || ev.id} 
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {ev.dateTime}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className={`badge badge-${ev.category}`} style={{ fontSize: '0.65rem' }}>
                        {ev.catLabel || ev.category}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {ev.venue}
                      </div>
                    </td>

                    <td style={{ padding: '1rem', minWidth: '180px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: '#cbd5e1' }}>{booked} / {ev.seatCap} filled</span>
                        <span style={{ fontWeight: 700, color: pct >= 90 ? '#fb7185' : '#34d399' }}>{pct}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${pct}%`, 
                            background: pct >= 90 ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' : 'linear-gradient(90deg, #3b82f6, #10b981)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: ev.status === 'open' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: ev.status === 'open' ? '#34d399' : '#fb7185',
                        border: `1px solid ${ev.status === 'open' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                      }}>
                        {ev.status === 'open' ? 'REGISTRATION OPEN' : 'CLOSED'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => onViewAttendees(ev)}
                          className="btn btn-sm btn-secondary"
                          title="View Registered Attendees Roster"
                        >
                          <Eye size={14} />
                          Roster
                        </button>

                        <button
                          onClick={() => handleToggleStatus(ev)}
                          disabled={isActionLoading}
                          className="btn btn-sm btn-outline"
                          title={ev.status === 'open' ? 'Close Registrations' : 'Open Registrations'}
                        >
                          {ev.status === 'open' ? <ToggleRight size={14} color="#34d399" /> : <ToggleLeft size={14} color="#94a3b8" />}
                        </button>

                        <button
                          onClick={() => handleDelete(ev)}
                          disabled={isActionLoading}
                          className="btn btn-sm btn-danger"
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
