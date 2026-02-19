import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jsonFetch, API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import '../styles.css';

export const LoginPage: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await jsonFetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: { login, password },
      });

      const { token, login: userLogin, nickname } = response;
      setAuth(token, userLogin, nickname);
      navigate('/players');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Авторизация</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <strong>Логин</strong>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </label>
          <label>
            <strong>Пароль</strong>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="auth-footer">
          Не зарегистрированы? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};
