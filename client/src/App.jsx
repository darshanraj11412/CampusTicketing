import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useSocket } from './context/SocketContext.jsx';
import { api } from './utils/api.js';

import { Navbar } from './components/Navbar.jsx';
import { HeroSection } from './components/HeroSection.jsx';
import { EventGrid } from './components/EventGrid.jsx';
import { RegistrationModal } from './components/RegistrationModal.jsx';
import { TicketPassModal } from './components/TicketPassModal.jsx';
import { MyTicketsDrawer } from './components/MyTicketsDrawer.jsx';
import { OrganizerDashboard } from './components/OrganizerDashboard.jsx';
import { CreateEventModal } from './components/CreateEventModal.jsx';
import { EditEventModal } from './components/EditEventModal.jsx';
import { DoorScannerModal } from './components/DoorScannerModal.jsx';
import { AttendeesModal } from './components/AttendeesModal.jsx';
import { AdminAnalytics } from './components/AdminAnalytics.jsx';
import { ConcurrencySimulatorModal } from './components/ConcurrencySimulatorModal.jsx';
import { LiveActivityFeed } from './components/LiveActivityFeed.jsx';
import { AuthModal } from './components/AuthModal.jsx';

export function App() {
  const { user, isAuthenticated } = useAuth();
  const { latestSeatUpdate, latestCheckIn } = useSocket();

  // Navigation & Views
  const [activeView, setActiveView] = useState('events'); // 'events' | 'organizer' | 'admin'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Data
  const [events, setEvents] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Modals
  const [selectedEventForReg, setSelectedEventForReg] = useState(null);
  const [activeTicketPass, setActiveTicketPass] = useState(null);
  const [confirmationTimeMs, setConfirmationTimeMs] = useState(null);
  const [isMyTicketsOpen, setIsMyTicketsOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);
  const [attendeesModalEvent, setAttendeesModalEvent] = useState(null);

  // Load initial events
  const loadEvents = async () => {
    try {
      const data = await api.getEvents({ category: activeCategory, search: searchTerm });
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeCategory, searchTerm]);

  // Load user registrations whenever authenticated user changes
  const loadMyTickets = async () => {
    if (isAuthenticated) {
      try {
        const list = await api.getMyTickets();
        setUserRegistrations(list);
      } catch (err) {
        console.error('Failed to load user registrations:', err);
      }
    } else {
      setUserRegistrations([]);
    }
  };

  useEffect(() => {
    loadMyTickets();
  }, [user, isAuthenticated]);

  // Real-Time WebSocket Seat Updates (Slide 6 & 12)
  useEffect(() => {
    if (latestSeatUpdate) {
      setEvents((prev) =>
        prev.map((e) => {
          if ((e._id || e.id) === latestSeatUpdate.eventId) {
            return {
              ...e,
              seatsLeft: latestSeatUpdate.seatsLeft,
              seatCap: latestSeatUpdate.seatCap ?? e.seatCap,
              status: latestSeatUpdate.status ?? e.status
            };
          }
          return e;
        })
      );
    }
  }, [latestSeatUpdate]);

  // Real-Time Check-In Updates
  useEffect(() => {
    if (latestCheckIn) {
      // If student has this ticket open, mark it checked-in
      setUserRegistrations((prev) =>
        prev.map((r) =>
          (r._id === latestCheckIn.registrationId || r.id === latestCheckIn.registrationId)
            ? { ...r, checkedIn: true, checkedInAt: latestCheckIn.checkedInAt }
            : r
        )
      );

      if (activeTicketPass && (activeTicketPass._id === latestCheckIn.registrationId || activeTicketPass.id === latestCheckIn.registrationId)) {
        setActiveTicketPass((prev) => ({ ...prev, checkedIn: true, checkedInAt: latestCheckIn.checkedInAt }));
      }
    }
  }, [latestCheckIn]);

  // Handlers
  const handleRegisterClick = (event) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedEventForReg(event);
  };

  const handleWaitlistClick = async (event) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await api.joinWaitlist(event._id || event.id);
      alert(res.message || 'Added to waitlist!');
    } catch (e) {
      alert(e.message || 'Waitlist failed');
    }
  };

  const handleSuccessRegistration = (registration, durationMs) => {
    setSelectedEventForReg(null);
    setConfirmationTimeMs(durationMs);
    setActiveTicketPass(registration);
    setUserRegistrations((prev) => [registration, ...prev]);
  };

  const handleTicketCancelled = (regId) => {
    setUserRegistrations((prev) => prev.filter((r) => r._id !== regId && r.id !== regId));
    loadEvents();
  };

  const handleViewTicketFromCard = (event) => {
    const reg = userRegistrations.find((r) => r.eventId === (event._id || event.id));
    if (reg) {
      setConfirmationTimeMs(null);
      setActiveTicketPass(reg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        openMyTickets={() => setIsMyTicketsOpen(true)}
        ticketCount={userRegistrations.length}
        openAuthModal={() => setIsAuthModalOpen(true)}
        openConcurrencyModal={() => setIsConcurrencyModalOpen(true)}
        openScannerModal={() => setIsScannerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="container" style={{ flexGrow: 1, paddingTop: '1rem' }}>
        {activeView === 'events' && (
          <>
            <HeroSection
              events={events}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              totalRegistrations={userRegistrations.length}
              totalCheckedIn={userRegistrations.filter((r) => r.checkedIn).length}
            />

            <EventGrid
              events={events}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onRegisterClick={handleRegisterClick}
              onWaitlistClick={handleWaitlistClick}
              userRegistrations={userRegistrations}
              onViewTicketClick={handleViewTicketFromCard}
            />
          </>
        )}

        {activeView === 'organizer' && (
          <OrganizerDashboard
            events={events}
            onOpenCreateEvent={() => setIsCreateEventOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onViewAttendees={(ev) => setAttendeesModalEvent(ev)}
            onEditEvent={(ev) => setEditingEvent(ev)}
            onEventUpdated={(upd) => {
              setEvents((prev) => prev.map((e) => ((e._id || e.id) === (upd._id || upd.id) ? upd : e)));
            }}
            onEventDeleted={(delId) => {
              setEvents((prev) => prev.filter((e) => (e._id || e.id) !== delId));
            }}
          />
        )}

        {activeView === 'admin' && (
          <AdminAnalytics events={events} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0a0f1d',
        padding: '2rem 0',
        textAlign: 'center',
        fontSize: '0.825rem',
        color: '#64748b'
      }}>
        <div className="container">
          <p style={{ color: '#cbd5e1', fontWeight: 600, marginBottom: '0.25rem' }}>
            CS3301 Full Stack Development · Final Capstone Project
          </p>
          <p>
            Team 8: Arjun N (1RUA24SCS0012) · Darshan R (1RUA24SCS0029) · Dakshith Saraf (1RUA24SCS0028)
          </p>
          <p style={{ marginTop: '0.5rem', color: '#475569', fontSize: '0.75rem' }}>
            5th Semester · Section A · RV University
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {selectedEventForReg && (
        <RegistrationModal
          event={selectedEventForReg}
          onClose={() => setSelectedEventForReg(null)}
          onSuccessRegistration={handleSuccessRegistration}
        />
      )}

      {activeTicketPass && (
        <TicketPassModal
          registration={activeTicketPass}
          confirmationTimeMs={confirmationTimeMs}
          onClose={() => {
            setActiveTicketPass(null);
            setConfirmationTimeMs(null);
          }}
          onTicketCancelled={handleTicketCancelled}
        />
      )}

      {isMyTicketsOpen && (
        <MyTicketsDrawer
          isOpen={isMyTicketsOpen}
          onClose={() => setIsMyTicketsOpen(false)}
          tickets={userRegistrations}
          onSelectTicket={(t) => {
            setIsMyTicketsOpen(false);
            setConfirmationTimeMs(null);
            setActiveTicketPass(t);
          }}
        />
      )}

      {isCreateEventOpen && (
        <CreateEventModal
          onClose={() => setIsCreateEventOpen(false)}
          onEventCreated={(newEv) => {
            setEvents((prev) => [newEv, ...prev]);
          }}
        />
      )}

      {isScannerOpen && (
        <DoorScannerModal
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(reg) => {
            loadEvents();
            loadMyTickets();
          }}
        />
      )}

      {attendeesModalEvent && (
        <AttendeesModal
          event={attendeesModalEvent}
          onClose={() => setAttendeesModalEvent(null)}
          onCheckInToggle={() => {
            loadEvents();
          }}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {isConcurrencyModalOpen && (
        <ConcurrencySimulatorModal
          events={events}
          onClose={() => setIsConcurrencyModalOpen(false)}
          onTestComplete={() => {
            loadEvents();
            loadMyTickets();
          }}
        />
      )}

      {/* Floating Real-Time Activity Feed */}
      <LiveActivityFeed />
    </div>
  );
}

export default App;
