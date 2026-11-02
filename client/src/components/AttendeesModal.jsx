import React, { useEffect, useState } from 'react';
import { X, Download, CheckCircle, Clock, Search, UserCheck } from 'lucide-react';
import { api } from '../utils/api.js';

export const AttendeesModal = ({ event, onClose, onCheckInToggle }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const data = await api.getEventAttendees(event._id || event.id);
        setAttendees(data);
      } catch (err) {
        console.error('Error fetching attendees:', err);
      } finally {
        setLoading(false);
      }
    };
    if (event) fetchAttendees();
  }, [event]);

  if (!event) return null;

  const handleExportCSV = () => {
    if (attendees.length === 0) return;

    const headers = ['USN', 'Student Name', 'College Email', 'Ticket Code', 'Checked In', 'Check-In Timestamp'];
    const rows = attendees.map((a) => [
      `"${a.userUsn || ''}"`,
      `"${a.userName || ''}"`,
      `"${a.userEmail || ''}"`,
      `"${a.ticketCode || ''}"`,
      a.checkedIn ? 'YES' : 'NO',
      a.checkedInAt ? `"${new Date(a.checkedInAt).toLocaleString()}"` : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}_Attendees_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckInDirect = async (att) => {
    if (att.checkedIn) return;
    setVerifyingId(att._id);
    try {
      const res = await api.verifyTicket(att.ticketCode);
      if (res.success) {
        setAttendees((prev) =>
          prev.map((item) =>
            item._id === att._id ? { ...item, checkedIn: true, checkedInAt: new Date().toISOString() } : item
          )
        );
        if (onCheckInToggle) onCheckInToggle(event._id || event.id);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setVerifyingId(null);
    }
  };

  const filtered = attendees.filter((a) =>
    (a.userName && a.userName.toLowerCase().includes(search.toLowerCase())) ||
    (a.userUsn && a.userUsn.toLowerCase().includes(search.toLowerCase())) ||
    (a.ticketCode && a.ticketCode.toLowerCase().includes(search.toLowerCase()))
  );

  const checkedCount = attendees.filter((a) => a.checkedIn).length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '780px', padding: '2rem', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              ATTENDEES & DOOR HEADCOUNT ROSTER
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
              {event.title}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              {attendees.length} Registered · {checkedCount} Checked-In ({attendees.length > 0 ? Math.round((checkedCount / attendees.length) * 100) : 0}%)
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search by student name, USN, or ticket code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.85rem' }}
            />
          </div>

          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ height: '40px' }}>
            <Download size={15} />
            Export CSV
          </button>
        </div>

        {/* Attendees Table */}
        <div style={{ overflowY: 'auto', flexGrow: 1, border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading attendees roster...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No matching attendees found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: '#1e293b', color: '#cbd5e1' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Student / USN</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Ticket Code</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Door Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((att) => (
                  <tr key={att._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{att.userName}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{att.userUsn}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
                      {att.ticketCode}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {att.checkedIn ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#34d399', fontSize: '0.775rem', fontWeight: 600 }}>
                          <CheckCircle size={14} /> Checked In
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24', fontSize: '0.775rem' }}>
                          <Clock size={14} /> Not Scanned
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {att.checkedIn ? (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified</span>
                      ) : (
                        <button
                          onClick={() => handleCheckInDirect(att)}
                          disabled={verifyingId === att._id}
                          className="btn btn-sm btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          <UserCheck size={13} />
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
