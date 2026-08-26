import React, { useEffect, useState } from 'react';
import { API_BASE_URL, jsonFetch } from '../lib/api';

interface Props {
  onMessage(message: string | null): void;
}

interface PlayerDto {
  playerId: number;
  login: string;
  nickname: string;
  email: string;
}

interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  averageKDA: number;
}

export const PlayersList: React.FC<Props> = ({}) => {
  const [players, setPlayers] = useState<PlayerDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDto | null>(null);
  const [playerStatsByLogin, setPlayerStatsByLogin] = useState<Record<string, PlayerStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  const loadPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jsonFetch(`${API_BASE_URL}/api/players`, { method: 'GET' });
      setPlayers(data as PlayerDto[]);
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleEditClick = (player: PlayerDto) => {
    setSelectedPlayer(player);
    setShowModal(true);
    setStatsLoading(true);
    
    jsonFetch(`${API_BASE_URL}/api/statistics/player?login=${encodeURIComponent(player.login)}`)
      .then((data: any) => {
        if (!data || typeof data !== 'object') {
          setPlayerStatsByLogin((prev) => {
            const next = { ...prev };
            delete next[player.login];
            return next;
          });
          return;
        }

        const stat = data as Record<string, number>;
        setPlayerStatsByLogin((prev) => ({
          ...prev,
          [player.login]: {
            totalGames: stat.gamesPlayed || 0,
            wins: stat.gamesWon || 0,
            losses: stat.gamesLost || 0,
            winRate: stat.winRate || 0,
            totalKills: stat.totalKills || 0,
            totalDeaths: stat.totalDeaths || 0,
            totalAssists: stat.totalAssists || 0,
            averageKDA: stat.averageKDA || 0,
          },
        }));
      })
      .catch((err) => {
        console.error('Failed to load stats:', err);
        setPlayerStatsByLogin((prev) => {
          const next = { ...prev };
          delete next[player.login];
          return next;
        });
      })
      .finally(() => {
        setStatsLoading(false);
      });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPlayer(null);
  };

  const selectedPlayerStats = selectedPlayer ? playerStatsByLogin[selectedPlayer.login] : null;

  const handleRefresh = async () => {
    await loadPlayers();
  };

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Список всех игроков</h2>
        <button onClick={handleRefresh} disabled={loading}>
          {loading ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Загрузка данных...</div>
      ) : players.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Нет зарегистрированных игроков</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Имя призывателя</th>
                <th>Средний K/D/A</th>
                <th>Винрейт</th>
                <th>Подробнее</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.playerId}>
                  <td>{p.nickname}</td>
                  <td>{playerStatsByLogin[p.login] ? playerStatsByLogin[p.login].averageKDA.toFixed(2) : '—'}</td>
                  <td>{playerStatsByLogin[p.login] ? `${playerStatsByLogin[p.login].winRate.toFixed(1)}%` : '—'}</td>
                  <td className="actions">
                    <button onClick={() => handleEditClick(p)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                      Показать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedPlayer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Статистика игрока {selectedPlayer.nickname}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              
                {statsLoading ? (
                  <p style={{ color: '#9ca3af' }}>Загрузка статистики...</p>
                ) : selectedPlayerStats ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Всего матчей</label>
                        <p style={{ margin: '0.25rem 0 0' }}>{selectedPlayerStats.totalGames}</p>
                      </div>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Побед</label>
                        <p style={{ margin: '0.25rem 0 0', color: '#10b981' }}>{selectedPlayerStats.wins}</p>
                      </div>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Поражений</label>
                        <p style={{ margin: '0.25rem 0 0', color: '#ef4444' }}>{selectedPlayerStats.losses}</p>
                      </div>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Винрейт</label>
                        <p style={{ margin: '0.25rem 0 0', color: '#fbbf24' }}>
                          {selectedPlayerStats.winRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <h4 style={{ margin: '1rem 0 0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Боевая статистика</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Убийства</label>
                        <p style={{ margin: '0.25rem 0 0' }}>{selectedPlayerStats.totalKills}</p>
                      </div>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Смерти</label>
                        <p style={{ margin: '0.25rem 0 0' }}>{selectedPlayerStats.totalDeaths}</p>
                      </div>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Ассисты</label>
                        <p style={{ margin: '0.25rem 0 0' }}>{selectedPlayerStats.totalAssists}</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Среднее K/D/A</label>
                        <p style={{ margin: '0.25rem 0 0' }}>
                          {(selectedPlayerStats.totalKills / (selectedPlayerStats.totalGames || 1)).toFixed(1)} / 
                          {(selectedPlayerStats.totalDeaths / (selectedPlayerStats.totalGames || 1)).toFixed(1)} / 
                          {(selectedPlayerStats.totalAssists / (selectedPlayerStats.totalGames || 1)).toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <label style={{ color: '#9ca3af', fontSize: '0.85rem' }}>KDA</label>
                        <p style={{ margin: '0.25rem 0 0', color: '#fbbf24', fontWeight: 'bold' }}>
                          {selectedPlayerStats.averageKDA.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#9ca3af' }}>Статистика недоступна</p>
                )}

              <button onClick={handleCloseModal} className="secondary">Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

