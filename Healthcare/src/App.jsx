import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import styles from './style';
import { About, Doctors, Services, Clients, CTA, Footer, Navbar, Hero, Chatbot, MentalHealthGames } from "./components";
import { Login } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import AdminLogin from "./components/Admin/AdminLogin";
import AdminDashboard from "./components/Admin/AdminDashboard";
import ReframeGame from './components/ReframeGame/ReframeGame';
import ReframeWorldTest from './components/ReframeGame/ReframeWorldTest';
import ThoughtBattleGame from './ThoughtBattleGame';
import LifeQuestGame from './components/LifeQuest/LifeQuestGame';
import EmotionQuestGame from './components/EmotionQuest/EmotionQuestGame';
import { authAPI } from './services/api';
import GrowingTreeGame from './components/GrowingTree/GrowingTreeGame';

// ProtectedRoute: redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const isAuth = authAPI.isAuthenticated();
  return isAuth ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Game Routes — all survive page reload */}
        <Route path="/games/thought-battle" element={<ProtectedRoute><ThoughtBattleGamePage /></ProtectedRoute>} />
        <Route path="/games/life-quest" element={<ProtectedRoute><LifeQuestGamePage /></ProtectedRoute>} />
        <Route path="/games/emotion-quest" element={<ProtectedRoute><EmotionQuestGamePage /></ProtectedRoute>} />
        <Route path="/games/reframe" element={<ProtectedRoute><ReframeGamePage /></ProtectedRoute>} />

        <Route path="/games/growing-tree" element={<ProtectedRoute><GrowingTreeGamePage /></ProtectedRoute>} />

        {/* Legacy reframe-game routes (kept for backwards compat) */}
        <Route path="/reframe-game" element={<ProtectedRoute><ReframeGamePage /></ProtectedRoute>} />
        <Route path="/reframe-game/world-test" element={<ReframeWorldTest />} />

        {/* Home / Landing */}
        <Route path="/" element={<MainLandingPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// ── Game Page Wrappers ────────────────────────────────────────────────────────
const ThoughtBattleGamePage = () => {
  const navigate = useNavigate();
  return <ThoughtBattleGame onExit={() => navigate('/dashboard')} />;
};

const LifeQuestGamePage = () => {
  const navigate = useNavigate();
  return <LifeQuestGame onExit={() => navigate('/dashboard')} />;
};

const EmotionQuestGamePage = () => {
  const navigate = useNavigate();
  return <EmotionQuestGame onExit={() => navigate('/dashboard')} />;
};

const ReframeGamePage = () => {
  const navigate = useNavigate();
  return <ReframeGame onExit={() => navigate('/dashboard')} />;
};

const GrowingTreeGamePage = () => {
  const navigate = useNavigate();
  return <GrowingTreeGame onExit={() => navigate('/dashboard')} />;
};

// ── Auth Page Wrappers ────────────────────────────────────────────────────────
// Login Page wrapper (redirects to /dashboard if already logged in)
const LoginPage = () => {
  const navigate = useNavigate();
  const isAuth = authAPI.isAuthenticated();

  if (isAuth) return <Navigate to="/dashboard" replace />;

  const handleLogin = (userData) => {
    navigate('/dashboard', { replace: true });
  };

  return <Login onLogin={handleLogin} />;
};

// Dashboard Page wrapper
const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = authAPI.getCurrentUser();
    if (savedUser) setUser(savedUser);
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    navigate('/', { replace: true });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <Dashboard
      user={user}
      onLogout={handleLogout}
      onBackToHome={handleBackToHome}
    />
  );
};

// Main Landing Page Component
const MainLandingPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authAPI.isAuthenticated());
  }, []);

  const handleGoToDashboard = () => {
    if (authAPI.isAuthenticated()) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

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