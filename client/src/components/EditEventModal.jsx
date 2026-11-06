import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Tag, AlertCircle, Edit3 } from 'lucide-react';
import { api } from '../utils/api.js';

export const EditEventModal = ({ event, onClose, onEventUpdated }) => {
  if (!event) return null;

  const bookedSeats = (event.seatCap || 0) - (event.seatsLeft || 0);

  const [formData, setFormData] = useState({
    title: event.title || '',
    category: event.category || 'fest',
    dateTime: event.dateTime || '',
    venue: event.venue || '',
    seatCap: event.seatCap || 50,
    desc: event.desc || '',
    department: event.department || 'School of CSE',
    status: event.status || 'open',
    bannerUrl: event.bannerUrl || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newCap = parseInt(formData.seatCap, 10);
    if (isNaN(newCap) || newCap < 1) {
      setError('Seat capacity must be a positive integer.');
      setLoading(false);
      return;
    }

    if (newCap < bookedSeats) {
      setError(`Cannot reduce capacity to ${newCap}. There are already ${bookedSeats} students registered for this event.`);
      setLoading(false);
      return;
    }

    try {
      const updated = await api.updateEvent(event._id || event.id, {
        ...formData,
        seatCap: newCap
      });
      onEventUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ padding: '2rem', maxWidth: '600px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Edit3 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                ORGANIZER PORTAL
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
                Edit Event Listing
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(244,63,94,0.15)',
            border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: '8px',
            color: '#fda4af',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              required
              className="input"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Category *
              </label>
              <select
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="fest">Tech Fest</option>
                <option value="workshop">Workshop</option>
                <option value="talk">Guest Talk</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Seat Capacity * ({bookedSeats} currently booked)
              </label>
              <input
                type="number"
                name="seatCap"
                min={bookedSeats || 1}
                required
                className="input"
                value={formData.seatCap}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Date & Time String *
              </label>
              <input
                type="text"
                name="dateTime"
                required
                className="input"
                value={formData.dateTime}
                onChange={handleChange}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Venue *
              </label>
              <input
                type="text"
                name="venue"
                required
                className="input"
                value={formData.venue}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Hosting Department / Club
              </label>
              <input
                type="text"
                name="department"
                className="input"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
                Registration Status
              </label>
              <select
                name="status"
                className="input"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="open">Registration Open</option>
                <option value="closed">Registration Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
              Description & Agenda *
            </label>
            <textarea
              name="desc"
              rows="3"
              required
              className="input"
              value={formData.desc}
              onChange={handleChange}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '0.35rem' }}>
              Banner Image URL
            </label>
            <input
              type="url"
              name="bannerUrl"
              className="input"
              value={formData.bannerUrl}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
              {loading ? 'Saving Changes...' : 'Save & Publish Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
