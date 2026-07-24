import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styles from './style';
import { About, Doctors, Services, Clients, CTA, Footer, Navbar, Hero, Chatbot, MentalHealthGames } from "./components";
import { Login } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import AdminLogin from "./components/Admin/AdminLogin";
import AdminDashboard from "./components/Admin/AdminDashboard";
import ReframeGame from './components/ReframeGame/ReframeGame';
import { authAPI } from './services/api';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  // Check for existing session on load
  useEffect(() => {
    const savedUser = authAPI.getCurrentUser();
    const isAuth = authAPI.isAuthenticated();
    if (savedUser && isAuth) {
      setUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowDashboard(true);
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
    setShowDashboard(false);
  };

  const handleGoToDashboard = () => {
    if (isAuthenticated) {
      setShowDashboard(true);
    } else {
      setShowDashboard(true); // Will show login
    }
  };

  const handleBackToHome = () => {
    setShowDashboard(false);
  };

  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* User Routes */}
        <Route path="/reframe-game" element={<ReframeGame onExit={() => window.location.href = '/'} />} />
        <Route path="/" element={
          showDashboard && !isAuthenticated ? (
            <Login onLogin={handleLogin} />
          ) : showDashboard && isAuthenticated ? (
            <Dashboard user={user} onLogout={handleLogout} onBackToHome={handleBackToHome} />
          ) : (
            <MainLandingPage 
              isAuthenticated={isAuthenticated}
              handleGoToDashboard={handleGoToDashboard}
            />
          )
        } />
      </Routes>
    </Router>
  );
};

// Main Landing Page Component
const MainLandingPage = ({ isAuthenticated, handleGoToDashboard }) => {
  return (
    <div className="bg-purple-700 w-full overflow-hidden">
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <nav className="w-full flex py-6 justify-between items-center navbar">
            <Navbar />
            {/* Dashboard/Login Button */}
            <button
              onClick={handleGoToDashboard}
              className="ml-4 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white font-medium hover:opacity-90 transition"
            >
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
            </button>
          </nav>
        </div>
      </div>

      <div className={`bg-purple-700 ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <Hero onGetStarted={handleGoToDashboard} />
        </div>
      </div>

      <div className={`bg-purple-600 ${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <div id="About">
            <About />
          </div>
          <div id="MentalHealth">
            <MentalHealthGames />
          </div>
          <div id="Doctors">
            <Doctors />
          </div>
          <div id="Services">
            <Services />
          </div>
          <div id="Clients">
            <Clients />
          </div>
          <CTA onGetStarted={handleGoToDashboard} />
          <Footer />
        </div>
      </div>

      {/* floating Chatbot */}
      <Chatbot />
    </div>
  );
};

export default App;