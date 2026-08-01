import { useState, useEffect } from "react";
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import socketService from '../../services/socket';
import styles from "../../style";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHome from "./DashboardHome";
import AppointmentBooking from "./AppointmentBooking";
import MedicationSection from "./MedicationSection";
import MentalHealthSection from "./MentalHealthSection";
import MyAppointments from "./MyAppointments";
import ProfileSection from "./ProfileSection";

// Sections that are valid hash targets (must match sidebar item ids)
const VALID_SECTIONS = [
  "home", "appointments", "my-appointments",
  "medications", "mental-health", "leaderboard", "profile"
];

// Read section from URL hash
const getSectionFromHash = () => {
  const hash = window.location.hash.replace("#", "");
  return VALID_SECTIONS.includes(hash) ? hash : "home";
};

const Dashboard = ({ user, onLogout, onBackToHome }) => {
  // Initialise from URL hash so reload restores the same section
  const [activeSection, setActiveSectionState] = useState(getSectionFromHash);
  const [showGame, setShowGame] = useState(false);

  // Keep URL hash in sync whenever section changes
  const setActiveSection = (section) => {
    setActiveSectionState(section);
    window.location.hash = section;
  };

  // Also listen for browser back/forward hash changes
  useEffect(() => {
    const onHashChange = () => {
      const section = getSectionFromHash();
      setActiveSectionState(section);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    socketService.connect();
    console.log('User Dashboard connected to WebSocket');

    // Listen for appointment updates
    socketService.on('appointment_updated', (data) => {
      console.log('🔔 User received appointment update:', data);
      toast.success(`Your appointment status: ${data.status}`, {
        icon: '📅',
        duration: 4000
      });
      
      // Trigger refresh of MyAppointments if it's mounted
      window.dispatchEvent(new CustomEvent('appointment_updated', { detail: data }));
    });

    // Listen for doctor status updates
    socketService.on('doctor_status_updated', (data) => {
      console.log('🔔 User received doctor status update:', data);
      if (!data.is_active) {
        toast(`Dr. ${data.name} is now offline`, {
          icon: '👨‍⚕️',
          duration: 3000
        });
      }
      
      // Trigger refresh of doctors list if AppointmentBooking is mounted
      window.dispatchEvent(new CustomEvent('doctor_status_updated', { detail: data }));
    });

    return () => {
      socketService.off('appointment_updated');
      socketService.off('doctor_status_updated');
    };
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "home":
        return <DashboardHome user={user} setActiveSection={setActiveSection} />;
      case "appointments":
        return <AppointmentBooking />;
      case "my-appointments":
        return <MyAppointments />;
      case "medications":
        return <MedicationSection />;
      case "mental-health":
        return <MentalHealthSection key="mental-health" showGame={showGame} setShowGame={setShowGame} />;
      case "leaderboard":
        return <MentalHealthSection key="leaderboard" showGame={showGame} setShowGame={setShowGame} defaultTab="leaderboard" />;
      case "profile":
        return <ProfileSection user={user} />;
      default:
        return <DashboardHome user={user} setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#581c87',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }} />
      <div className="flex">
        {/* Sidebar - Hide when game is active */}
        {!showGame && (
          <DashboardSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onLogout={onLogout}
            onBackToHome={onBackToHome}
            user={user}
          />
        )}

        {/* Main Content */}
        <div className={`flex-1 ${showGame ? '' : 'ml-0 md:ml-64'} min-h-screen`}>
          <div className={showGame ? '' : `${styles.paddingX} py-8`}>
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
