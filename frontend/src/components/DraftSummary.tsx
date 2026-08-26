import React, { useEffect, useState } from 'react';
import { jsonFetch, API_BASE_URL } from '../lib/api';

interface DraftActionInfo {
  side: string;
  actionType: string;
  championId: number;
  championName: string;
  orderNumber: number;
}

interface TeamInfo {
  teamId: number;
  teamName: string;
  joined: boolean;
  captainLogin: string;
}

interface DraftSummaryData {
  sessionId: number;
  matchId: number;
  status: string;
  teamA: TeamInfo;
  teamB: TeamInfo;
  currentTurn: string;
  currentPhase: string;
  phaseNumber: number;
  actions: DraftActionInfo[];
  startedAt?: string;
  message?: string;
}

interface Props {
  matchId: number;
  onClose: () => void;
}

export const DraftSummary: React.FC<Props> = ({ matchId, onClose }) => {
  const [draftData, setDraftData] = useState<DraftSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDraftSummary();
  }, [matchId]);

  const loadDraftSummary = async () => {
    try {
      setLoading(true);
      const data = await jsonFetch(`${API_BASE_URL}/api/draft-room/${matchId}/summary`);
      setDraftData(data);
      setError(null);
    } catch (err: any) {
      setError('Failed to load draft summary: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading draft results...</h2>
        <p>Please wait...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
        <h2>Error</h2>
        <p style={{ color: '#ff6b6b' }}>{error}</p>
        <button
          onClick={onClose}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#0a66c2',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Close
        </button>
      </div>
    );
  }

  if (!draftData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No draft data available</h2>
        <button
          onClick={onClose}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#0a66c2',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Close
        </button>
      </div>
    );
  }

  const teamAActions = draftData.actions.filter(a => a.side === 'A');
  const teamBActions = draftData.actions.filter(a => a.side === 'B');
  const teamAPicks = teamAActions.filter(a => a.actionType === 'PICK');
  const teamABans = teamAActions.filter(a => a.actionType === 'BAN');
  const teamBPicks = teamBActions.filter(a => a.actionType === 'PICK');
  const teamBBans = teamBActions.filter(a => a.actionType === 'BAN');

  return (
    <div
      style={{
        minHeight: '600px',
        backgroundColor: '#0a1428',
        padding: '20px',
        borderRadius: '8px',
        border: '2px solid #0a0e27',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2>Draft Results - Match #{draftData.matchId}</h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Close
        </button>
      </div>

      {draftData.message && (
        <div style={{ color: '#10b981', marginBottom: '15px', padding: '10px', backgroundColor: '#064e3b', borderRadius: '4px' }}>
          {draftData.message}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#0b1120',
            padding: '15px',
            borderRadius: '8px',
            borderLeft: '4px solid #0ea5e9',
          }}
        >
          <h3 style={{ color: '#0ea5e9', margin: '0 0 15px 0' }}>
            {draftData.teamA.teamName}
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#9ca3af', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px' }}>
              Bans ({teamABans.length}/3)
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              {teamABans.map((action) => (
                <div
                  key={action.orderNumber}
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    padding: '10px',
                    textAlign: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ color: '#6366f1', fontWeight: 'bold' }}>#{action.orderNumber}</div>
                  <div style={{ color: '#e5e7eb', marginTop: '5px' }}>ban {action.championName}</div>
                </div>
              ))}
              {teamABans.length < 3 &&
                Array.from({ length: 3 - teamABans.length }).map((_, i) => (
                  <div
                    key={`empty-ban-a-${i}`}
                    style={{
                      backgroundColor: '#0a0e27',
                      border: '1px dashed #374151',
                      borderRadius: '4px',
                      padding: '10px',
                      textAlign: 'center',
                      color: '#6b7280',
                    }}
                  >
                    -
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: '#9ca3af', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px' }}>
              Picks ({teamAPicks.length}/5)
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
              }}
            >
              {teamAPicks.map((action) => (
                <div
                  key={action.orderNumber}
                  style={{
                    backgroundColor: '#111827',
                    border: '2px solid #0ea5e9',
                    borderRadius: '4px',
                    padding: '10px',
                    textAlign: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ color: '#0ea5e9', fontWeight: 'bold' }}>#{action.orderNumber}</div>
                  <div style={{ color: '#e5e7eb', marginTop: '5px' }}>pick {action.championName}</div>
                </div>
              ))}
              {teamAPicks.length < 5 &&
                Array.from({ length: 5 - teamAPicks.length }).map((_, i) => (
                  <div
                    key={`empty-pick-a-${i}`}
                    style={{
                      backgroundColor: '#0a0e27',
                      border: '1px dashed #374151',
                      borderRadius: '4px',
                      padding: '10px',
                      textAlign: 'center',
                      color: '#6b7280',
                    }}
                  >
                    -
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0b1120',
            padding: '15px',
            borderRadius: '8px',
            borderLeft: '4px solid #dc2626',
          }}
        >
          <h3 style={{ color: '#dc2626', margin: '0 0 15px 0' }}>
            {draftData.teamB.teamName}
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#9ca3af', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px' }}>
              Bans ({teamBBans.length}/3)
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              {teamBBans.map((action) => (
                <div
                  key={action.orderNumber}
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    padding: '10px',
                    textAlign: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ color: '#6366f1', fontWeight: 'bold' }}>#{action.orderNumber}</div>
                  <div style={{ color: '#e5e7eb', marginTop: '5px' }}>ban {action.championName}</div>
                </div>
              ))}
              {teamBBans.length < 3 &&
                Array.from({ length: 3 - teamBBans.length }).map((_, i) => (
                  <div
                    key={`empty-ban-b-${i}`}
                    style={{
                      backgroundColor: '#0a0e27',
                      border: '1px dashed #374151',
                      borderRadius: '4px',
                      padding: '10px',
                      textAlign: 'center',
                      color: '#6b7280',
                    }}
                  >
                    -
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: '#9ca3af', margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px' }}>
              Picks ({teamBPicks.length}/5)
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
              }}
            >
              {teamBPicks.map((action) => (
                <div
                  key={action.orderNumber}
                  style={{
                    backgroundColor: '#111827',
                    border: '2px solid #dc2626',
                    borderRadius: '4px',
                    padding: '10px',
                    textAlign: 'center',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ color: '#dc2626', fontWeight: 'bold' }}>#{action.orderNumber}</div>
                  <div style={{ color: '#e5e7eb', marginTop: '5px' }}>pick {action.championName}</div>
                </div>
              ))}
              {teamBPicks.length < 5 &&
                Array.from({ length: 5 - teamBPicks.length }).map((_, i) => (
                  <div
                    key={`empty-pick-b-${i}`}
                    style={{
                      backgroundColor: '#0a0e27',
                      border: '1px dashed #374151',
                      borderRadius: '4px',
                      padding: '10px',
                      textAlign: 'center',
                      color: '#6b7280',
                    }}
                  >
                    -
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#111827',
          padding: '15px',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      >
        <p style={{ margin: '5px 0' }}>
          <strong>Status:</strong> {draftData.status}
        </p>
        {draftData.startedAt && (
          <p style={{ margin: '5px 0' }}>
            <strong>Started:</strong> {new Date(draftData.startedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};
