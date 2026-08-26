import React, { useEffect, useState } from 'react';
import { API_BASE_URL, jsonFetch } from '../lib/api';

interface Props {
  onMessage(message: string | null): void;
  fixedLogin?: string | null;
}

interface Statistics {
  playerLogin: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  averageKDA: number;
}

export const StatisticsSection: React.FC<Props> = ({ onMessage, fixedLogin }) => {
  const [login, setLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);

  const fetchStats = async (targetLogin: string, silent?: boolean) => {
    if (!targetLogin) {
      setError('Логин не указан');
      return;
    }

    setLoading(true);
    setError(null);
    if (!silent) {
      onMessage(null);
    }

    try {
      const data = await jsonFetch(
        `${API_BASE_URL}/api/statistics/player?login=${encodeURIComponent(targetLogin)}`,
        { method: 'GET' }
      );
      setStats(data as Statistics);
      if (!silent) {
        onMessage('✓ Статистика игрока загружена');
      }
    } catch (err: any) {
      setError(String(err.message || err));
      setStats(null);
      if (!silent) {
        onMessage('✗ Ошибка при загрузке статистики игрока');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fixedLogin) {
      setLogin(fixedLogin);
      fetchStats(fixedLogin, true);
    }
  }, [fixedLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchStats(fixedLogin || login);
  };

  const calculateKDA = (k: number, d: number, a: number) => {
    if (d === 0) return (k + a).toFixed(2);
    return ((k + a) / d).toFixed(2);
  };

  return (
    <section className="card">
      <h2>📊 Статистика игрока</h2>

      <form className="form" onSubmit={handleSubmit}>
        {fixedLogin ? (
          <div>
            <strong>Логин игрока:</strong> {fixedLogin}
          </div>
        ) : (
          <label>
            <strong>Логин игрока</strong>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="captain_ash"
              required
            />
          </label>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Загрузка...' : fixedLogin ? 'Обновить статистику' : 'Показать статистику'}
          </button>
        </div>
      </form>

      {error && <div className="error">⚠️ {error}</div>}

      {loading && <div className="loading">Загрузка статистики...</div>}

      {stats && (
        <div style={{
          background: '#0b1120',
          border: '1px solid #1f2937',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <h3 style={{ marginTop: 0, color: '#6366f1' }}>Статистика: {stats.playerLogin}</h3>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">Сыграно игр</div>
              <div className="value">{stats.gamesPlayed === 0 ? '0' : stats.gamesPlayed}</div>
            </div>
            <div className="stat-card">
              <div className="label">Побед</div>
              <div style={{ color: '#10b981', fontSize: '1.8rem', fontWeight: 700 }}>
                {stats.gamesWon === 0 ? '0' : stats.gamesWon}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Проигрышей</div>
              <div style={{ color: '#ef4444', fontSize: '1.8rem', fontWeight: 700 }}>
                {stats.gamesLost === 0 ? '0' : stats.gamesLost}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Винрейт</div>
              <div className="value">{(stats.winRate).toFixed(1)}%</div>
            </div>
          </div>

          <h3 style={{ marginTop: '1.5rem', color: '#6366f1' }}>Боевая статистика</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">Убийства</div>
              <div className="value">{stats.totalKills === 0 ? '0' : stats.totalKills}</div>
            </div>
            <div className="stat-card">
              <div className="label">Смерти</div>
              <div className="value">{stats.totalDeaths === 0 ? '0' : stats.totalDeaths}</div>
            </div>
            <div className="stat-card">
              <div className="label">Ассисты</div>
              <div className="value">{stats.totalAssists === 0 ? '0' : stats.totalAssists}</div>
            </div>
            <div className="stat-card">
              <div className="label">KDA</div>
              <div className="value">
                {calculateKDA(stats.totalKills, stats.totalDeaths, stats.totalAssists)}
              </div>
            </div>
          </div>

          <div className="stats-grid" style={{ marginTop: '1rem' }}>
            <div className="stat-card">
              <div className="label">Среднее K/D/A</div>
              <div className="value">
                {(stats.totalKills / (stats.gamesPlayed || 1)).toFixed(1)} / 
                {(stats.totalDeaths / (stats.gamesPlayed || 1)).toFixed(1)} / 
                {(stats.totalAssists / (stats.gamesPlayed || 1)).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

