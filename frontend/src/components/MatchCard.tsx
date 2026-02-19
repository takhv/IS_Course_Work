import React, { useState, useEffect } from 'react';
import { API_BASE_URL, jsonFetch } from '../lib/api';

interface Match {
  matchId: number;
  tournament?: {
    tournamentId: number;
    name: string;
    creatorLogin?: string;
  };
  teamA: {
    teamId: number;
    name: string;
  };
  teamB?: {
    teamId: number;
    name: string;
  } | null;
  scheduledAt: string;
  stage?: string;
  bestOf: number;
}

interface MatchResult {
  matchResultId: number;
  winner: {
    teamId: number;
    name: string;
  };
  durationMinutes: number;
  teamAScore: number;
  teamBScore: number;
}

interface Props {
  match: Match;
  isUserCaptain: boolean;
  currentUserLogin: string;
  onStartDraft: (matchId: number) => void;
  onViewDraft: (matchId: number) => void;
  onRecordResult: (match: Match) => void;
}

export const MatchCard: React.FC<Props> = ({ 
  match,
  isUserCaptain,
  currentUserLogin,
  onStartDraft, 
  onViewDraft,
  onRecordResult 
}) => {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const isOrganizer = match.tournament?.creatorLogin === currentUserLogin;

  useEffect(() => {
    loadResult();
  }, [match.matchId]);

  const loadResult = async () => {
    setLoadingResult(true);
    try {
      const data = await jsonFetch(`${API_BASE_URL}/api/tournament/match/${match.matchId}/result`);
      setResult(data);
    } catch (err) {
      setResult(null);
    } finally {
      setLoadingResult(false);
    }
  };

  const isDraftAvailable = () => {
    const now = new Date();
    const scheduledTime = new Date(match.scheduledAt);
    const draftStartTime = new Date(scheduledTime.getTime() - 10 * 60 * 1000);
    return now >= draftStartTime && now < scheduledTime;
  };

  const isMatchStarted = () => {
    const now = new Date();
    const scheduledTime = new Date(match.scheduledAt);
    return now >= scheduledTime;
  };

  return (
    <div
      style={{
        backgroundColor: '#0a1428',
        border: result ? '2px solid #10b981' : '1px solid #0a0e27',
        padding: '15px',
        borderRadius: '4px',
      }}
    >
      <p>
        <strong>Match #{match.matchId}</strong>
        {result && <span style={{ color: '#10b981', marginLeft: '10px' }}>Завершён</span>}
      </p>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        margin: '15px 0',
        padding: '10px',
        backgroundColor: result ? '#10b98111' : '#0a0e27',
        borderRadius: '4px'
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ 
            fontWeight: 'bold', 
            color: result?.winner.teamId === match.teamA.teamId ? '#10b981' : '#ffc700',
            fontSize: result?.winner.teamId === match.teamA.teamId ? '1.1em' : '1em'
          }}>
            {match.teamA.name}
            {result?.winner.teamId === match.teamA.teamId}
          </div>
          {result && (
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginTop: '5px' }}>
              {result.teamAScore}
            </div>
          )}
        </div>
        <div style={{ padding: '0 10px', fontWeight: 'bold' }}>VS</div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {match.teamB ? (
            <>
              <div style={{ 
                fontWeight: 'bold', 
                color: result?.winner.teamId === match.teamB.teamId ? '#10b981' : '#ffc700',
                fontSize: result?.winner.teamId === match.teamB.teamId ? '1.1em' : '1em'
              }}>
                {match.teamB.name}
                {result?.winner.teamId === match.teamB.teamId}
              </div>
              {result && (
                <div style={{ fontSize: '1.5em', fontWeight: 'bold', marginTop: '5px' }}>
                  {result.teamBScore}
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              fontWeight: 'bold', 
              color: '#666',
              fontStyle: 'italic'
            }}>
              Ожидание
            </div>
          )}
        </div>
      </div>

      <p><strong>Stage:</strong> {match.stage || 'TBD'}</p>
      <p><strong>Best of:</strong> {match.bestOf}</p>
      <p><strong>Scheduled:</strong> {new Date(match.scheduledAt).toLocaleString()}</p>
      
      {result && (
        <p style={{ color: '#10b981', fontSize: '0.9em' }}>
          <strong>Duration:</strong> {result.durationMinutes} min
        </p>
      )}

      {isUserCaptain && !result && match.teamB && (
        <>
          {isDraftAvailable() ? (
            <button
              onClick={() => onStartDraft(match.matchId)}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#00aa00',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              Start Draft
            </button>
          ) : isMatchStarted() ? (
            <button
              onClick={() => onViewDraft(match.matchId)}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#0a66c2',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              Draft
            </button>
          ) : (
            <div style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#999'
            }}>
              Draft opens 10 min before match
            </div>
          )}
        </>
      )}

      {isOrganizer && !result && match.teamB && isMatchStarted() && (
        <button
          onClick={() => onRecordResult(match)}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          Зафиксировать результат
        </button>
      )}

      {!match.teamB && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#1a1a1a',
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#999'
        }}>
          Ожидание второго участника...
        </div>
      )}

      {isUserCaptain && result && match.teamB && (
        <button
          onClick={() => onViewDraft(match.matchId)}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '8px 16px',
            backgroundColor: '#0a66c2',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          View Draft
        </button>
      )}

      {!isUserCaptain && match.teamB && (
        <button
          onClick={() => onViewDraft(match.matchId)}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '8px 16px',
            backgroundColor: '#0a66c2',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          View Draft
        </button>
      )}
    </div>
  );
};
