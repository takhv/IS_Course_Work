import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsonFetch, API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatisticsSection } from '../components/StatisticsSection';
import '../styles.css';

interface PlayerData {
  nickname: string;
  email: string;
}

export const ProfilePage: React.FC = () => {
  const { login, nickname, logout } = useAuth();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<PlayerData | null>(null);
  const [passwordMode, setPasswordMode] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!login) {
      navigate('/login');
      return;
    }

    loadProfile();
  }, [login, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const playerResponse = await jsonFetch(`${API_BASE_URL}/api/player`);
      setPlayerData(playerResponse);
      setEditData(playerResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!editData) return;
    try {
      await jsonFetch(`${API_BASE_URL}/api/player`, {
        method: 'PUT',
        body: editData,
      });
      setPlayerData(editData);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения изменений');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Все поля должны быть заполнены');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Новый пароль должен быть не менее 6 символов');
      return;
    }

    try {
      await jsonFetch(`${API_BASE_URL}/api/player/change-password`, {
        method: 'POST',
        body: passwordData,
      });
      setPasswordMode(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      alert('Пароль успешно изменен!');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Ошибка изменения пароля');
    }
  };

  if (loading) {
    return <div className="loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Загрузка профиля...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Профиль</h1>
        <button onClick={handleLogout} className="button danger">
          Выход
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="profile-card">
        <h2>Информация об аккаунте</h2>
        {editMode ? (
          <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
            <label>
              <strong>Имя призывателя</strong>
              <input
                type="text"
                value={editData?.nickname || ''}
                onChange={(e) =>
                  setEditData({
                    ...editData!,
                    nickname: e.target.value,
                  })
                }
              />
            </label>
            <label>
              <strong>Email</strong>
              <input
                type="email"
                value={editData?.email || ''}
                onChange={(e) =>
                  setEditData({
                    ...editData!,
                    email: e.target.value,
                  })
                }
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                Сохранить
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setEditMode(false);
                  setEditData(playerData);
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <p>
              <strong>Логин:</strong> {login}
            </p>
            <p>
              <strong>Имя призывателя:</strong> {playerData?.nickname}
            </p>
            <p>
              <strong>Email:</strong> {playerData?.email}
            </p>
            <div className="profile-actions">
              <button
                onClick={() => setEditMode(true)}
                className="button"
              >
                Редактировать профиль
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="profile-card">
        <h2>Безопасность</h2>
        {!passwordMode ? (
          <button
            onClick={() => setPasswordMode(true)}
            className="button"
          >
            Изменить пароль
          </button>
        ) : (
          <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
            <label>
              <strong>Старый пароль</strong>
              <input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, oldPassword: e.target.value })
                }
              />
            </label>
            <label>
              <strong>Новый пароль</strong>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
              />
            </label>
            <label>
              <strong>Подтвердить пароль</strong>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
              />
            </label>
            {passwordError && <div className="error">{passwordError}</div>}
            <div className="form-actions">
              <button type="submit" className="button">
                Изменить пароль
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setPasswordMode(false);
                  setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="profile-card">
        <h2>История турниров</h2>
        <p>История участия в турнирах будет отображаться здесь</p>
      </div>

      <div>
        <StatisticsSection onMessage={setMessage} fixedLogin={login} />
      </div>

      {message && (
        <div className={`profile-message ${message.includes('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};
