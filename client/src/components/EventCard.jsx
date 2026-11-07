import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, CheckCircle, ArrowRight, Clock, Building } from 'lucide-react';

export const EventCard = ({ 
  event, 
  onRegisterClick, 
  onWaitlistClick,
  isRegistered = false,
  onViewTicketClick
}) => {
  const [justUpdated, setJustUpdated] = useState(false);
  const fallbackBannerUrl = event.category === 'sports'
    ? '/images/football-banner-fallback.svg'
    : '/images/event-banner-fallback.svg';
  const [bannerSrc, setBannerSrc] = useState(event.bannerUrl || fallbackBannerUrl);

  // Flash animation when seats count changes
  useEffect(() => {
    setJustUpdated(true);
    const timer = setTimeout(() => setJustUpdated(false), 1200);
    return () => clearTimeout(timer);
  }, [event.seatsLeft]);

  useEffect(() => {
    setBannerSrc(event.bannerUrl || fallbackBannerUrl);
  }, [event.bannerUrl, fallbackBannerUrl]);

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'fest': return 'badge-fest';
      case 'workshop': return 'badge-workshop';
      case 'talk': return 'badge-talk';
      case 'sports': return 'badge-sports';
      case 'cultural': return 'badge-cultural';
      default: return 'badge-fest';
    }
  };

  const seatsLeft = Number(event.seatsLeft ?? 0);
  const seatCap = Number(event.seatCap ?? 0);
  const isFull = seatsLeft === 0;
  const isLow = seatsLeft > 0 && seatsLeft <= 5;

  return (
    <div 
      className="glass-card" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        height: '100%'
      }}
    >
      {/* Event Header Banner / Image */}
      {
        <div style={{
          height: '140px',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {bannerSrc ? (
            <img
              src={bannerSrc}
              alt={`${event.title} banner`}
              onError={() => {
                if (bannerSrc !== fallbackBannerUrl) setBannerSrc(fallbackBannerUrl);
                else setBannerSrc(null);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease'
              }}
              loading="lazy"
            />
          ) : (
            <div
              role="img"
              aria-label={`${event.title} banner unavailable`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                color: '#bae6fd',
                fontSize: '0.8rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #102a43, #0f172a)'
              }}
            >
              {event.catLabel || event.category} · {event.title}
            </div>
          )}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, transparent 80%)'
          }} />
        </div>
      }

      {/* Card Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Top Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.85rem'
        }}>
          <span className={`badge ${getCategoryBadgeClass(event.category)}`}>
            {event.catLabel || event.category}
          </span>

          <span 
            className={`seat-pill ${isFull ? 'is-full' : isLow ? 'is-low' : ''} ${justUpdated ? 'seat-updated-flash' : ''}`}
            title={`${seatsLeft} remaining out of ${seatCap} capacity`}
          >
            {isFull ? (
              'Full'
            ) : isLow ? (
              `⚡ ${seatsLeft} seats left`
            ) : (
              `${seatsLeft} of ${seatCap} seats left`
            )}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#f8fafc',
          marginBottom: '0.6rem',
          lineHeight: 1.3
        }}>
          {event.title}
        </h3>

        {/* Meta Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.85rem', fontSize: '0.825rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={14} color="#38bdf8" />
            <span>{event.dateTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={14} color="#f43f5e" />
            <span>{event.venue}</span>
          </div>
          {event.department && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b' }}>
              <Building size={14} />
              <span>{event.department}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '1.25rem',
          flexGrow: 1
        }}>
          {event.desc}
        </p>

        {/* Action Button */}
        <div style={{ marginTop: 'auto' }}>
          {isRegistered ? (
            <button
              onClick={() => onViewTicketClick(event)}
              className="btn btn-secondary"
              style={{ width: '100%', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}
            >
              <CheckCircle size={16} />
              Registered · View Pass
            </button>
          ) : isFull ? (
            <button
              onClick={() => onWaitlistClick(event)}
              className="btn btn-outline"
              style={{ width: '100%', borderColor: '#475569' }}
            >
              Join Waitlist
            </button>
          ) : (
            <button
              onClick={() => onRegisterClick(event)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Register Now <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
