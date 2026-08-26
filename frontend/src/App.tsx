import React, { useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { TeamsPage } from './pages/TeamsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { PlayersList } from './components/PlayersList';

const AppContent: React.FC = () => {
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const { isAuthenticated, nickname, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-root">
        <header className="app-header">
          <nav className="app-nav">
            <NavLink to="/players" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Игроки
            </NavLink>
            <NavLink to="/teams" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Команды
            </NavLink>
            <NavLink to="/tournaments" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Турниры
            </NavLink>
            <div className="nav-right">
              <span className="nav-username">{nickname}</span>
              <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Профиль
              </NavLink>
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="button secondary"
              >
                Выход
              </button>
            </div>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/players" element={<PlayersList onMessage={setGlobalMessage} />} />
            <Route path="/teams" element={<TeamsPage onMessage={setGlobalMessage} />} />
            <Route path="/tournaments" element={<TournamentsPage onMessage={setGlobalMessage} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/players" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

