import React, { useState, useEffect } from 'react';
import { API_BASE_URL, jsonFetch } from '../lib/api';

interface Team {
  teamId: number;
  name: string;
}

interface TeamMember {
  membershipId: number;
  playerLogin: string;
  playerNickname: string;
  isCaptain: boolean;
  role: string;
}

interface PlayerKDA {
  playerId: string;
  nickname: string;
  kills: number;
  deaths: number;
  assists: number;
}

interface Props {
  matchId: number;
  teamA: Team;
  teamB: Team | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MatchResultForm: React.FC<Props> = ({ matchId, teamA, teamB, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamAMembers, setTeamAMembers] = useState<TeamMember[]>([]);
  const [teamBMembers, setTeamBMembers] = useState<TeamMember[]>([]);
  const [formData, setFormData] = useState({
    winnerTeamId: teamA.teamId,
    durationMinutes: 30,
    teamAScore: 0,
    teamBScore: 0,
  });
  const [playerKDAs, setPlayerKDAs] = useState<Map<string, PlayerKDA>>(new Map());

  useEffect(() => {
    if (!teamB) {
      setError('Match does not have a second participant yet');
      return;
    }
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    if (!teamB) {
      setError('Match does not have a second participant yet');
      setLoadingTeams(false);
      return;
    }
    
    try {
      setLoadingTeams(true);
      const [membersA, membersB] = await Promise.all([
        jsonFetch(`${API_BASE_URL}/api/team/${teamA.teamId}/members`),
        jsonFetch(`${API_BASE_URL}/api/team/${teamB.teamId}/members`)
      ]);
      setTeamAMembers(membersA);
      setTeamBMembers(membersB);
      
      const initialKDAs = new Map<string, PlayerKDA>();
      [...membersA, ...membersB].forEach((member: TeamMember) => {
        initialKDAs.set(member.playerLogin, {
          playerId: member.playerLogin,
          nickname: member.playerNickname,
          kills: 0,
          deaths: 0,
          assists: 0
        });
      });
      setPlayerKDAs(initialKDAs);
    } catch (err) {
      setError('Failed to load team members');
    } finally {
      setLoadingTeams(false);
    }
  };

  const updatePlayerKDA = (login: string, field: 'kills' | 'deaths' | 'assists', value: number) => {
    setPlayerKDAs(prev => {
      const updated = new Map(prev);
      const player = updated.get(login);
      if (player) {
        updated.set(login, { ...player, [field]: value });
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const statsObject: Record<string, { kills: number; deaths: number; assists: number }> = {};
      playerKDAs.forEach((kda, login) => {
        statsObject[login] = {
          kills: kda.kills,
          deaths: kda.deaths,
          assists: kda.assists
        };
      });

      const requestBody = {
        winnerTeamId: formData.winnerTeamId,
        durationMinutes: formData.durationMinutes,
        teamAScore: formData.teamAScore,
        teamBScore: formData.teamBScore,
        playerStats: statsObject
      };

      const response = await jsonFetch(
        `${API_BASE_URL}/api/tournament/match/${matchId}/result`,
        { 
          method: 'POST',
          body: requestBody
        }
      );

      console.log('Match result recorded:', response);

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record match result');
    } finally {
      setLoading(false);
    }
  };

  if (!teamB) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: '#0a1428',
          padding: '24px',
          borderRadius: '8px',
          border: '2px solid #ffc700',
          maxWidth: '500px',
          width: '100%',
        }}>
          <h2 style={{ marginTop: 0 }}>Ошибка</h2>
          <p style={{ color: '#ff6b6b' }}>
            Невозможно зафиксировать результат: второй участник матча еще не определен.
          </p>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#666',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#0a1428',
        padding: '24px',
        borderRadius: '8px',
        border: '2px solid #ffc700',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}>
        <h2 style={{ marginTop: 0 }}>Зафиксировать результат матча #{matchId}</h2>
        
        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#ff6b6b22',
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#ff6b6b',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Победитель:
            </label>
            <select
              value={formData.winnerTeamId}
              onChange={(e) => setFormData({ ...formData, winnerTeamId: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#0a0e27',
                color: '#fff',
                border: '1px solid #ffc700',
                borderRadius: '4px',
                fontSize: '16px',
              }}
              required
            >
              <option value={teamA.teamId}>{teamA.name}</option>
              <option value={teamB.teamId}>{teamB.name}</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Длительность матча (минуты):
            </label>
            <input
              type="number"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
              min={1}
              max={120}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#0a0e27',
                color: '#fff',
                border: '1px solid #0a66c2',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Счёт {teamA.name}:
              </label>
              <input
                type="number"
                value={formData.teamAScore}
                onChange={(e) => setFormData({ ...formData, teamAScore: Number(e.target.value) })}
                min={0}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0a0e27',
                  color: '#fff',
                  border: '1px solid #0a66c2',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Счёт {teamB.name}:
              </label>
              <input
                type="number"
                value={formData.teamBScore}
                onChange={(e) => setFormData({ ...formData, teamBScore: Number(e.target.value) })}
                min={0}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0a0e27',
                  color: '#fff',
                  border: '1px solid #0a66c2',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          </div>

          {!loadingTeams && (
            <>
              <div style={{ 
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#0a0e27',
                borderRadius: '6px',
                border: '1px solid #ffc700',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px' }}>{teamA.name}</h3>
                {teamAMembers.map(member => (
                  <div key={member.playerLogin} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '12px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.playerNickname}
                    </div>
                    <input
                      type="number"
                      placeholder="K"
                      value={playerKDAs.get(member.playerLogin)?.kills || 0}
                      onChange={(e) => updatePlayerKDA(member.playerLogin, 'kills', Number(e.target.value))}
                      min={0}
                      style={{
                        width: '45px',
                        padding: '4px',
                        backgroundColor: '#0a1428',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '3px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="D"
                      value={playerKDAs.get(member.playerLogin)?.deaths || 0}
                      onChange={(e) => updatePlayerKDA(member.playerLogin, 'deaths', Number(e.target.value))}
                      min={0}
                      style={{
                        width: '45px',
                        padding: '4px',
                        backgroundColor: '#0a1428',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '3px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="A"
                      value={playerKDAs.get(member.playerLogin)?.assists || 0}
                      onChange={(e) => updatePlayerKDA(member.playerLogin, 'assists', Number(e.target.value))}
                      min={0}
                      style={{
                        width: '45px',
                        padding: '4px',
                        backgroundColor: '#0a1428',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '3px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ 
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: '#0a0e27',
                borderRadius: '6px',
                border: '1px solid #0a66c2',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px' }}>{teamB.name}</h3>
                {teamBMembers.map(member => (
                  <div key={member.playerLogin} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '12px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.playerNickname}
                    </div>
                    <input
                      type="number"
                      placeholder="K"
                      value={playerKDAs.get(member.playerLogin)?.kills || 0}
                      onChange={(e) => updatePlayerKDA(member.playerLogin, 'kills', Number(e.target.value))}
                      min={0}
                      style={{
                        width: '45px',
                        padding: '4px',
                        backgroundColor: '#0a1428',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '3px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="D"
                      value={playerKDAs.get(member.playerLogin)?.deaths || 0}
                      onChange={(e) => updatePlayerKDA(member.playerLogin, 'deaths', Number(e.target.value))}
                      min={0}
                      style={{
                        width: '45px',
                        padding: '4px',
                        backgroundColor: '#0a1428',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '3px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="A"
                      value={playerKDAs.get(member.playerLogin)?.assists || 0}
                      onChange={(e) => updatePlayerKDA(member.playerLogin, 'assists', Number(e.target.value))}
                      min={0}
                      style={{
                        width: '45px',
                        padding: '4px',
                        backgroundColor: '#0a1428',
                        color: '#fff',
                        border: '1px solid #666',
                        borderRadius: '3px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: loading ? '#666' : '#10b981',
                color: '#fff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              {loading ? 'Сохранение...' : 'Сохранить результат'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#666',
                color: '#fff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
