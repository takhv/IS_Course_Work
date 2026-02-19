import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DraftWebSocketService, DraftRoomState } from '../lib/draftWebSocket';
import { API_BASE_URL, jsonFetch } from '../lib/api';

interface Champion {
  championId: number;
  name: string;
}

interface Props {
  matchId: number;
  onClose: () => void;
}

export const LiveDraftRoom: React.FC<Props> = ({ matchId, onClose }) => {
  const { login } = useAuth();
  const [draftState, setDraftState] = useState<DraftRoomState | null>(null);
  const [wsService] = useState(() => new DraftWebSocketService());
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChampion, setSelectedChampion] = useState<string>('');
  const [champions, setChampions] = useState<Champion[]>([]);
  const [usedChampionIds, setUsedChampionIds] = useState<number[]>([]);
  const [filteredChampions, setFilteredChampions] = useState<Champion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [loadingChampions, setLoadingChampions] = useState(true);

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const data = await jsonFetch(`${API_BASE_URL}/api/champions`);
        setChampions(data);
        setFilteredChampions(data);
        setLoadingChampions(false);
      } catch (err) {
        console.error('Failed to load champions:', err);
        setLoadingChampions(false);
      }
    };
    fetchChampions();
  }, []);

  const loadUsedChampions = async () => {
    try {
      const data = await jsonFetch(`${API_BASE_URL}/api/draft-room/${matchId}/used-champions`);
      setUsedChampionIds(data || []);
    } catch (err) {
      console.error('Failed to load used champions:', err);
    }
  };

  useEffect(() => {
    if (!login) {
      setError('Not authenticated');
      return;
    }

    loadUsedChampions();

    wsService
      .connect(
        matchId,
        login,
        (state) => {
          setDraftState(state);
          loadUsedChampions();
        },
        (err) => {
          console.error('Draft connection error:', err);
          setError('Failed to connect: ' + (err.message || err));
        }
      )
      .then(() => {
        setConnected(true);
        setError(null);
      })
      .catch((err) => {
        console.error('Draft connection exception:', err);
        setError('Connection failed: ' + (err.message || err));
      });

    return () => {
      wsService.disconnect();
    };
  }, [matchId, login]);

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
    if (query.trim() === '') {
      const available = champions.filter(c => !usedChampionIds.includes(c.championId));
      setFilteredChampions(available);
    } else {
      const filtered = champions.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) &&
        !usedChampionIds.includes(c.championId)
      );
      setFilteredChampions(filtered);
    }
  };

  const handleSelectChampion = (champion: Champion) => {
    setSelectedChampion(champion.name);
    setSearchInput('');
    setShowDropdown(false);
    const available = champions.filter(c => !usedChampionIds.includes(c.championId));
    setFilteredChampions(available);
  };

  const handlePickBan = (actionType: 'PICK' | 'BAN') => {
    if (!login || !selectedChampion) {
      alert('Please select a champion');
      return;
    }

    try {
      wsService.performAction(login, selectedChampion, actionType);
      setSelectedChampion('');
      setSearchInput('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isMyTurn = () => {
    if (!draftState || !login) return false;

    if (draftState.currentTurn === 'A' && draftState.teamA.captainLogin === login) {
      return true;
    }
    if (draftState.currentTurn === 'B' && draftState.teamB.captainLogin === login) {
      return true;
    }
    return false;
  };

  const getMySide = () => {
    if (!draftState || !login) return null;
    if (draftState.teamA.captainLogin === login) return 'A';
    if (draftState.teamB.captainLogin === login) return 'B';
    return null;
  };

  const getPhaseDisplay = () => {
    if (!draftState) return '';
    const phase = draftState.currentPhase;
    const step = draftState.phaseNumber + 1;
    
    if (phase === 'BAN') {
      return `Ban Phase 1 - Step ${step}/6`;
    } else if (phase === 'PICK') {
      return `Pick Phase 1 - Step ${step}/12`;
    } else if (phase === 'BAN_2') {
      return `Ban Phase 2 - Step ${step}/16`;
    } else if (phase === 'PICK_2') {
      return `Pick Phase 2 - Step ${step}/20`;
    }
    return `${phase} - Step ${step}/20`;
  };

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
        <h2>Error</h2>
        <p style={{ color: '#ff6b6b' }}>{error}</p>
        <button onClick={onClose} style={{ marginTop: '10px', padding: '8px 16px' }}>
          Close
        </button>
      </div>
    );
  }

  if (!connected || !draftState || loadingChampions) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🔄 {loadingChampions ? 'Loading champions...' : 'Connecting to Draft Room...'}</h2>
        <p>Please wait...</p>
      </div>
    );
  }

  const myActions = draftState.actions.filter(a => a.side === getMySide());
  const enemyActions = draftState.actions.filter(a => a.side !== getMySide());
  const myPicks = myActions.filter(a => a.actionType === 'PICK');
  const myBans = myActions.filter(a => a.actionType === 'BAN');
  const enemyPicks = enemyActions.filter(a => a.actionType === 'PICK');
  const enemyBans = enemyActions.filter(a => a.actionType === 'BAN');

  const mySide = getMySide();
  const myTeam = mySide === 'A' ? draftState.teamA : draftState.teamB;
  const enemyTeam = mySide === 'A' ? draftState.teamB : draftState.teamA;

  return (
    <div style={{ 
      minHeight: '600px',
      backgroundColor: '#0a1428',
      padding: '20px',
      borderRadius: '8px',
      border: '2px solid #0a0e27'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Live Draft - Match #{matchId}</h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Back
        </button>
      </div>

      <div style={{ 
        padding: '15px',
        backgroundColor: '#1a1a1a',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <p><strong>Status:</strong> {draftState.status}</p>
        {draftState.status === 'WAITING' && (
          <div>
            <p>Waiting for both teams to join...</p>
            <p>
              {myTeam.teamName}: {myTeam.joined ? 'Joined' : 'Not joined'}
            </p>
            <p>
              {enemyTeam.teamName}: {enemyTeam.joined ? 'Joined' : 'Not joined'}
            </p>
          </div>
        )}
        {draftState.status === 'ACTIVE' && (
          <div>
            <p><strong>Phase:</strong> {getPhaseDisplay()}</p>
            <p><strong>Current Turn:</strong> {draftState.currentTurn === mySide ? 'YOUR TURN' : 'Opponent\'s Turn'}</p>
            {draftState.message && (
              <p style={{ color: '#ffc700', marginTop: '10px' }}>{draftState.message}</p>
            )}
          </div>
        )}
        {draftState.status === 'COMPLETED' && (
          <p style={{ color: '#00ff00', fontSize: '18px', fontWeight: 'bold' }}>
            Draft Completed!
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ 
          padding: '15px',
          backgroundColor: '#001529',
          borderRadius: '4px',
          border: '2px solid #0a66c2'
        }}>
          <h3 style={{ marginTop: 0, color: '#0a66c2' }}>🔵 {myTeam.teamName} (YOU)</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <h4>Picks:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '60px',
                    backgroundColor: '#0a0e27',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    textAlign: 'center',
                    padding: '4px'
                  }}
                >
                  {myPicks[i] ? myPicks[i].championName : '?'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4>Bans:</h4>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#0a0e27',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    textAlign: 'center',
                    padding: '2px'
                  }}
                >
                  {myBans[i] ? 'Х' : '?'}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '15px',
          backgroundColor: '#290a0a',
          borderRadius: '4px',
          border: '2px solid #c20a0a'
        }}>
          <h3 style={{ marginTop: 0, color: '#c20a0a' }}>{enemyTeam.teamName}</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <h4>Picks:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '60px',
                    backgroundColor: '#0a0e27',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    textAlign: 'center',
                    padding: '4px'
                  }}
                >
                  {enemyPicks[i] ? enemyPicks[i].championName : '?'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4>Bans:</h4>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#0a0e27',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    textAlign: 'center',
                    padding: '2px'
                  }}
                >
                  {enemyBans[i] ? 'Х' : '?'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {draftState.status === 'ACTIVE' && (
        <div style={{ 
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '4px',
          border: isMyTurn() ? '2px solid #00ff00' : '2px solid #666'
        }}>
          <h3>{isMyTurn() ? 'YOUR TURN - Choose a Champion' : 'Waiting for opponent...'}</h3>
          
          {isMyTurn() && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search champion..."
                  value={searchInput || selectedChampion}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  style={{
                    padding: '10px',
                    width: '100%',
                    backgroundColor: '#0a0e27',
                    color: '#fff',
                    border: '1px solid #0a66c2',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
                
                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#0a0e27',
                    border: '1px solid #0a66c2',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 10
                  }}>
                    {filteredChampions.length > 0 ? (
                      filteredChampions.map(champ => (
                        <div
                          key={champ.championId}
                          onClick={() => handleSelectChampion(champ)}
                          style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            backgroundColor: selectedChampion === champ.name ? '#0a66c2' : 'transparent',
                            color: '#fff',
                            borderBottom: '1px solid #1a1a1a',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedChampion !== champ.name) {
                              (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1a3a4a';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedChampion !== champ.name) {
                              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {champ.name}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px', color: '#999', textAlign: 'center', fontSize: '12px' }}>
                        {searchInput ? 'No champions found' : `All ${champions.length} available champions have been picked/banned`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {draftState.currentPhase?.includes('BAN') ? (
                <button
                  onClick={() => handlePickBan('BAN')}
                  disabled={!selectedChampion}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: selectedChampion ? '#c20a0a' : '#666',
                    color: '#fff',
                    border: 'none',
                    cursor: selectedChampion ? 'pointer' : 'not-allowed',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  BAN
                </button>
              ) : (
                <button
                  onClick={() => handlePickBan('PICK')}
                  disabled={!selectedChampion}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: selectedChampion ? '#0a66c2' : '#666',
                    color: '#fff',
                    border: 'none',
                    cursor: selectedChampion ? 'pointer' : 'not-allowed',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  PICK
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#1a1a1a',
        borderRadius: '4px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        <h4>Draft History</h4>
        {draftState.actions.length === 0 ? (
          <p style={{ color: '#666' }}>No actions yet...</p>
        ) : (
          <div>
            {draftState.actions.map((action, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: '#0a0e27',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span>
                  #{action.orderNumber} - Team {action.side}
                </span>
                <span style={{ color: action.actionType === 'BAN' ? '#c20a0a' : '#0a66c2' }}>
                  {action.actionType === 'BAN' ? 'Х' : 'pick'} {action.championName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
