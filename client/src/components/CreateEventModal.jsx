import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Tag, Image, AlignLeft } from 'lucide-react';
import { api } from '../utils/api.js';

export const CreateEventModal = ({ onClose, onEventCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'fest',
    dateTime: '',
    venue: '',
    seatCap: 50,
    desc: '',
    department: 'School of CSE',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newEvent = await api.createEvent({
        ...formData,
        seatCap: Number(formData.seatCap)
      });
      onEventCreated(newEvent);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              CLUB & ORGANIZER PORTAL
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
              Publish New Campus Event
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: '#fda4af', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
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
              placeholder="e.g. CodeStorm 2026, AI Workshop"
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
                Total Seat Cap *
              </label>
              <input
                type="number"
                name="seatCap"
                min="1"
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
                placeholder="e.g. Fri, 15 Oct · 4:00 PM"
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
                placeholder="e.g. Auditorium B, Lab 3"
                value={formData.venue}
                onChange={handleChange}
              />
            </div>
          </div>

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
              Description *
            </label>
            <textarea
              name="desc"
              rows="3"
              required
              className="input"
              placeholder="Brief summary of agenda, rules, and prerequisites..."
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
              {loading ? 'Publishing Event...' : 'Publish to Live Grid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
