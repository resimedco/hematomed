import { useEffect, useState } from 'react';
import './App.css';
import { useTheme } from './hooks/useTheme';
import Flash from './screens/Flash';
import Home from './screens/Home';
import Profile from './screens/Profile';
import Quiz from './screens/Quiz';
import Tutor from './screens/Tutor';
import type { AppTab, Theme } from './types';

const tabs: Array<{ key: AppTab; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: 'ti-home-2' },
  { key: 'quiz', label: 'Quiz', icon: 'ti-help-circle' },
  { key: 'flash', label: 'Cards', icon: 'ti-cards' },
  { key: 'profile', label: 'Perfil', icon: 'ti-user' },
  { key: 'tutor', label: 'Tutor', icon: 'ti-robot' },
];

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const { theme, setTheme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem('hematomed-install-dismissed');
    if (dismissed === '1') {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    window.localStorage.setItem('hematomed-install-dismissed', '1');
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as AppTab);
  };

  return (
    <div className="app-shell">
      {showInstallBanner && (
        <div className="install-banner">
          <span>Instala Hematomed en tu celular</span>
          <div className="install-actions">
            {deferredPrompt && (
              <button type="button" onClick={handleInstall} className="install-action">
                Instalar
              </button>
            )}
            <button type="button" onClick={dismissInstallBanner} aria-label="Descartar banner de instalación" className="install-close">
              ×
            </button>
          </div>
        </div>
      )}

      {!showInstallBanner && deferredPrompt && (
        <div className="page-padding">
          <button type="button" onClick={handleInstall} className="primary-button" style={{ width: '100%' }}>
            <i className="ti ti-download" style={{ marginRight: 6 }} />Instalar Hematomed
          </button>
        </div>
      )}
      <header className="app-topbar">
        <div className="topbar-brand">
          <div className="brand-mark">
            <i className="ti ti-droplet-half-2" />
          </div>
          <div className="brand-copy">
            <div className="brand-title">Hematomed</div>
            <div className="brand-sub">Hematología clínica</div>
          </div>
        </div>

        <div className="theme-switcher" role="group" aria-label="Selector de tema">
          {(['day', 'night', 'exam'] as Theme[]).map((option) => (
            <button
              key={option}
              type="button"
              className={`theme-btn ${theme === option ? 'active' : ''}`}
              onClick={() => setTheme(option)}
              aria-label={`Modo ${option}`}
              title={`Modo ${option}`}
            >
              {option === 'day' ? '☀️' : option === 'night' ? '🌙' : '📋'}
            </button>
          ))}
        </div>
      </header>

      <main className="app-content">
        <div className="screen-scroll">
          {activeTab === 'home' ? (
            <div className="page-padding">
              <Home onNavigate={setActiveTab} />
            </div>
          ) : activeTab === 'quiz' ? (
            <div className="page-padding">
              <Quiz onNavigate={setActiveTab} />
            </div>
          ) : activeTab === 'flash' ? (
            <div className="page-padding">
              <Flash onNavigate={setActiveTab} />
            </div>
          ) : activeTab === 'profile' ? (
            <div className="page-padding">
              <Profile onNavigate={handleNavigate} />
            </div>
          ) : (
            <div className="page-padding">
              <Tutor onNavigate={setActiveTab} />
            </div>
          )}
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`nav-btn ${active ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={`ti ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
