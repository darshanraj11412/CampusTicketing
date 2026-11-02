import React from 'react';
import { EventCard } from './EventCard.jsx';
import { Sparkles, Filter } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Events' },
  { id: 'fest', label: 'Tech Fest' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'talk', label: 'Guest Talks' },
  { id: 'sports', label: 'Sports' },
  { id: 'cultural', label: 'Cultural' }
];

export const EventGrid = ({
  events = [],
  activeCategory = 'all',
  setActiveCategory,
  onRegisterClick,
  onWaitlistClick,
  userRegistrations = [],
  onViewTicketClick
}) => {
  const registeredEventIds = new Set(userRegistrations.map((r) => r.eventId));

  return (
    <section style={{ paddingBottom: '4rem' }}>
      {/* Category Filter Chips Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '2.5rem'
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: '9999px',
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <Filter size={36} color="#64748b" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No events found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Try selecting a different category or clearing your search term.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {events.map((event) => (
            <EventCard
              key={event._id || event.id}
              event={event}
              onRegisterClick={onRegisterClick}
              onWaitlistClick={onWaitlistClick}
              isRegistered={registeredEventIds.has(event._id || event.id)}
              onViewTicketClick={onViewTicketClick}
            />
          ))}
        </div>
      )}
    </section>
  );
};
