import React, { useState } from 'react';
import { Radio, X, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';

export const LiveActivityFeed = () => {
  const { activityFeed, isConnected } = useSocket();
  const [collapsed, setCollapsed] = useState(false);

  if (!activityFeed || activityFeed.length === 0) return null;
  const recentActivities = activityFeed.slice(0, 4);

  return (
    <div className="live-activity-feed" style={{
      position: 'fixed',
      bottom: '1.25rem',
      right: '1.25rem',
      zIndex: 40,
      maxWidth: '380px',
      width: 'calc(100vw - 2.5rem)',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          backgroundColor: '#1e293b',
          cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            position: 'relative',
            display: 'flex',
            height: '8px',
            width: '8px'
          }}>
            <span style={{
              position: 'absolute',
              display: 'inline-flex',
              height: '100%',
              width: '100%',
              borderRadius: '9999px',
              backgroundColor: isConnected ? '#34d399' : '#f43f5e',
              opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
            <span style={{
              position: 'relative',
              display: 'inline-flex',
              borderRadius: '9999px',
              height: '8px',
              width: '8px',
              backgroundColor: isConnected ? '#10b981' : '#e11d48'
            }} />
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
            CAMPUS LIVE FEED
          </span>
        </div>

        <div style={{ color: '#94a3b8' }}>
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Activity List */}
      {!collapsed && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
          {recentActivities.map((act) => (
            <div 
              key={act.id} 
              style={{
                fontSize: '0.775rem',
                color: '#cbd5e1',
                padding: '0.4rem 0.6rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderLeft: `3px solid ${act.type === 'checkin' ? '#fbbf24' : act.type === 'registration' ? '#38bdf8' : '#34d399'}`
              }}
            >
              <div>{act.text}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
