import React, { useEffect, useState } from 'react';
import { ShieldCheck, BarChart3, Users, Calendar, Award, Building2 } from 'lucide-react';
import { api } from '../utils/api.js';

export const AdminAnalytics = ({ events = [] }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        console.error('Admin stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Departmental breakdown computation
  const deptMap = {};
  events.forEach((e) => {
    const dept = e.department || 'General Campus';
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, capacity: 0, seatsLeft: 0 };
    }
    deptMap[dept].count += 1;
    deptMap[dept].capacity += Number(e.seatCap || 0);
    deptMap[dept].seatsLeft += Number(e.seatsLeft || 0);
  });

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          CAMPUS ADMINISTRATION CONSOLE
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
          University-Wide Event Oversight
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Aggregate statistics across clubs, schools, and academic departments.
        </p>
      </div>

      {/* Analytics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', marginBottom: '0.5rem' }}>
            <Calendar size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Listings</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
            {stats?.totalEvents ?? events.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Active on platform</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', marginBottom: '0.5rem' }}>
            <Users size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Registered Users</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
            {stats?.totalUsers ?? 5}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>Students & Club Leads</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.5rem' }}>
            <Award size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Registrations</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#34d399' }}>
            {stats?.totalRegistrations ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Unique digital passes issued</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', marginBottom: '0.5rem' }}>
            <BarChart3 size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Door Check-In Rate</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fbbf24' }}>
            {stats?.checkInRate ?? 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{stats?.totalCheckedIn ?? 0} confirmed arrivals</div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Building2 size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
            Department Capacity & Participation Distribution
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(deptMap).map(([deptName, data]) => {
            const booked = data.capacity - data.seatsLeft;
            const pct = data.capacity > 0 ? Math.round((booked / data.capacity) * 100) : 0;

            return (
              <div 
                key={deptName}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{deptName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                      ({data.count} event{data.count > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>
                    {booked} / {data.capacity} seats filled ({pct}%)
                  </div>
                </div>

                <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
