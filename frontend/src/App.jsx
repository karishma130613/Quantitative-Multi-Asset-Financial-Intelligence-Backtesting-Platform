import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import VideoBackground from './components/layout/VideoBackground';
import CursorEffects from './components/layout/CursorEffects';
import DisclaimerBanner from './components/layout/DisclaimerBanner';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import MarketExplorer from './pages/MarketExplorer/MarketExplorer';
import CorrelationLab from './pages/CorrelationLab/CorrelationLab';
import StrategyLab from './pages/StrategyLab/StrategyLab';
import VisualBuilder from './pages/VisualBuilder/VisualBuilder';
import StrategyDetective from './pages/StrategyDetective/StrategyDetective';
import MarketWeather from './pages/MarketWeather/MarketWeather';
import StressTest from './pages/StressTest/StressTest';
import AIAssistant from './pages/AIAssistant/AIAssistant';
import Experiments from './pages/Experiments/Experiments';
import Profile from './pages/Profile/Profile';

// Auth Pages
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  const getPathFromHash = () => {
    const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim();
    return raw || 'login';
  };

  const [currentPath, setCurrentPath] = useState(getPathFromHash);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Cross-page state payloads
  const [activeAsset, setActiveAsset] = useState('BTC-USD');
  const [activeBacktestResult, setActiveBacktestResult] = useState(null);
  const [resetToken, setResetToken] = useState('');

  const navigate = (path) => {
    window.location.hash = `#/${path}`;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synchronize on hash change (e.g. browser back/forward/refresh)
  React.useEffect(() => {
    const onHashChange = () => {
      const p = getPathFromHash();
      if (p) setCurrentPath(p);
    };
    window.addEventListener('hashchange', onHashChange);
    // Initial hash sync if empty
    if (!window.location.hash) {
      window.location.hash = '#/login';
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Protected routes check — ALL internal pages require auth except login/signup/forgot/reset
  React.useEffect(() => {
    if (isLoading) return;
    const authPages = ['login', 'signup', 'forgot-password', 'reset-password'];

    if (!isAuthenticated && !authPages.includes(currentPath)) {
      navigate('login');
    } else if (isAuthenticated && (currentPath === 'login' || currentPath === 'signup')) {
      navigate('dashboard');
    }
  }, [currentPath, isAuthenticated, isLoading]);

  const renderCurrentPage = () => {
    switch (currentPath) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={navigate}
            onSelectAsset={(sym) => { setActiveAsset(sym); }}
          />
        );
      case 'market-explorer':
        return (
          <MarketExplorer
            defaultAsset={activeAsset}
            onNavigate={navigate}
            onLaunchBacktest={(sym) => { setActiveAsset(sym); }}
          />
        );
      case 'correlation-lab':
        return <CorrelationLab />;
      case 'strategy-lab':
        return (
          <StrategyLab
            initialAsset={activeAsset}
            onNavigate={navigate}
            onOpenDetective={(res) => { setActiveBacktestResult(res); }}
          />
        );
      case 'visual-builder':
        return (
          <VisualBuilder
            onNavigate={navigate}
            onOpenDetective={(res) => { setActiveBacktestResult(res); }}
          />
        );
      case 'strategy-detective':
        return (
          <StrategyDetective
            backtestPayload={activeBacktestResult}
            onNavigate={navigate}
          />
        );
      case 'market-weather':
        return (
          <MarketWeather
            defaultAsset={activeAsset}
            onNavigate={navigate}
          />
        );
      case 'stress-test':
        return <StressTest onNavigate={navigate} />;
      case 'ai-assistant':
        return (
          <AIAssistant
            activeBacktestMetrics={activeBacktestResult?.metrics}
          />
        );
      case 'experiments':
        return (
          <Experiments
            onNavigate={navigate}
            onRerun={(exp) => {
              setActiveAsset(exp.asset);
              navigate('strategy-lab');
            }}
          />
        );
      case 'profile':
        return <Profile onNavigate={navigate} />;
      case 'login':
        return <Login onNavigate={navigate} />;
      case 'signup':
        return <SignUp onNavigate={navigate} />;
      case 'forgot-password':
        return (
          <ForgotPassword
            onNavigate={navigate}
            setResetTokenProp={(token) => setResetToken(token)}
          />
        );
      case 'reset-password':
        return (
          <ResetPassword
            onNavigate={navigate}
            initialToken={resetToken}
          />
        );
      default:
        return isAuthenticated ? (
          <Dashboard
            onNavigate={navigate}
            onSelectAsset={(sym) => { setActiveAsset(sym); }}
          />
        ) : (
          <Login onNavigate={navigate} />
        );
    }
  };

  const isAuthPage = ['login', 'signup', 'forgot-password', 'reset-password'].includes(currentPath);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <VideoBackground />
      <CursorEffects />

      {/* Top Navigation */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => {
          if (window.innerWidth <= 768) {
            setMobileSidebarOpen(!mobileSidebarOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        onOpenAI={() => navigate('ai-assistant')}
      />

      {/* Main Content Body */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', zIndex: 2 }}>
        {!isAuthPage && (
          <Sidebar
            currentPath={currentPath}
            onNavigate={navigate}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        )}

        <main style={{ flex: 1, minWidth: 0, minHeight: 'calc(100vh - 64px)', position: 'relative', zIndex: 2 }}>
          {renderCurrentPage()}
        </main>
      </div>

      {/* Financial Compliance Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
