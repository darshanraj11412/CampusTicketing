import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode, Camera, CheckCircle2, AlertTriangle, AlertCircle, Volume2, Sparkles } from 'lucide-react';
import { api } from '../utils/api.js';

// Synthesize pleasant sound chimes using Web Audio API (no external mp3 files needed)
const playAudioFeedback = (type = 'success') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }
  } catch (e) {
    // AudioContext might be restricted until user gesture
  }
};

export const DoorScannerModal = ({ onClose, onScanSuccess }) => {
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'camera'
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { status: 'success' | 'duplicate' | 'error', message, data }
  const scannerRef = useRef(null);

  // Quick test demo ticket codes for easy demonstration
  const quickTestCodes = ['VEN-7429', 'VEN-1001', 'VEN-9999'];

  const handleVerify = async (codeToVerify) => {
    const code = (codeToVerify || inputCode).trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await api.verifyTicket(code);

      if (data.success && !data.alreadyCheckedIn) {
        playAudioFeedback('success');
        setResult({
          status: 'success',
          message: data.message,
          attendee: data.registration
        });
        if (onScanSuccess) onScanSuccess(data.registration);
      } else if (data.alreadyCheckedIn) {
        playAudioFeedback('warning');
        setResult({
          status: 'duplicate',
          message: data.message,
          attendee: data.registration
        });
      }
    } catch (err) {
      playAudioFeedback('error');
      setResult({
        status: 'error',
        message: err.message || 'Invalid ticket code'
      });
    } finally {
      setLoading(false);
      setInputCode('');
    }
  };

  // Initialize Html5QrcodeScanner when camera tab is selected
  useEffect(() => {
    let html5QrcodeScanner = null;

    if (activeTab === 'camera') {
      try {
        html5QrcodeScanner = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            handleVerify(decodedText);
          },
          (errorMessage) => {
            // Ignore ongoing frame decode errors
          }
        );

        scannerRef.current = html5QrcodeScanner;
      } catch (e) {
        console.error('Camera init error:', e);
      }
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, [activeTab]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '520px', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
                Door Check-In Desk
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Verify student entry passes in real time
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switchers */}
        <div style={{
          display: 'flex',
          backgroundColor: '#1e293b',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '1.5rem',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('code')}
            style={{
              flex: 1,
              padding: '0.55rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'code' ? '#3b82f6' : 'transparent',
              color: activeTab === 'code' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s ease'
            }}
          >
            Manual Ticket Code
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            style={{
              flex: 1,
              padding: '0.55rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === 'camera' ? '#3b82f6' : 'transparent',
              color: activeTab === 'camera' ? '#fff' : '#94a3b8',
              transition: 'all 0.2s ease'
            }}
          >
            Camera QR Scanner
          </button>
        </div>

        {/* Mode A: Code input */}
        {activeTab === 'code' ? (
          <div>
            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Enter Ticket Code e.g. VEN-7429"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.05rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !inputCode.trim()}
                className="btn btn-primary"
                style={{ padding: '0 1.25rem' }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            {/* Quick Demo Test Buttons */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>
                QUICK VIVA DEMO CODES:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {quickTestCodes.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleVerify(code)}
                    className="btn btn-sm btn-outline"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                  >
                    Test {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Mode B: Camera Viewfinder */
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div id="qr-reader" style={{ borderRadius: '12px', overflow: 'hidden' }} />
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Point camera at the attendee's digital pass QR code
            </div>
          </div>
        )}

        {/* Verification Result Banner */}
        {result && (
          <div style={{
            padding: '1.25rem',
            borderRadius: '12px',
            animation: 'fadeIn 0.2s ease-out',
            border: `1px solid ${
              result.status === 'success'
                ? '#10b981'
                : result.status === 'duplicate'
                ? '#f59e0b'
                : '#f43f5e'
            }`,
            backgroundColor: `${
              result.status === 'success'
                ? 'rgba(16, 185, 129, 0.12)'
                : result.status === 'duplicate'
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(244, 63, 94, 0.12)'
            }`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              {result.status === 'success' && <CheckCircle2 size={24} color="#34d399" />}
              {result.status === 'duplicate' && <AlertTriangle size={24} color="#fbbf24" />}
              {result.status === 'error' && <AlertCircle size={24} color="#fb7185" />}

              <div>
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: result.status === 'success' ? '#34d399' : result.status === 'duplicate' ? '#fbbf24' : '#fb7185'
                }}>
                  {result.status === 'success' && 'ENTRY APPROVED ✅'}
                  {result.status === 'duplicate' && 'DUPLICATE SCAN DETECTED ⚠️'}
                  {result.status === 'error' && 'ENTRY DENIED ❌'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {result.message}
                </div>
              </div>
            </div>

            {/* Attendee details card */}
            {result.attendee && (
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                fontSize: '0.8rem'
              }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Student: </span>
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{result.attendee.userName}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>USN: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 600 }}>
                    {result.attendee.userUsn}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#94a3b8' }}>Event: </span>
                  <span style={{ color: '#e2e8f0' }}>{result.attendee.eventTitle}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
