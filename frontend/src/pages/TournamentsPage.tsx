import React, { useState, useEffect } from 'react';
import { jsonFetch, API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LiveDraftRoom } from '../components/LiveDraftRoom';
import { DraftSummary } from '../components/DraftSummary';
import { MatchResultForm } from '../components/MatchResultForm';
import { MatchCard } from '../components/MatchCard';
import '../styles.css';

interface Tournament {
  tournamentId: number;
  name: string;
  description?: string;
  format: string;
  status: string;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  maxTeams?: number;
  draftType: string;
  startDate: string;
  creatorLogin?: string;
}

interface Team {
  teamId: number;
  name: string;
  captainLogin?: string;
}

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

export const TournamentsPage: React.FC<{ onMessage: (msg: string) => void }> = ({
  onMessage,
}) => {
  const { login } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showMatches, setShowMatches] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showDraftRoom, setShowDraftRoom] = useState(false);
  const [draftMatchId, setDraftMatchId] = useState<number | null>(null);
  const [showDraftSummary, setShowDraftSummary] = useState(false);
  const [draftSummaryMatchId, setDraftSummaryMatchId] = useState<number | null>(null);
  const [showMatchResultForm, setShowMatchResultForm] = useState(false);
  const [resultMatchData, setResultMatchData] = useState<Match | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: 'planned',
  });
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    description: '',
    format: 'single_elimination',
    status: 'planned',
    minPlayersPerTeam: 5,
    maxPlayersPerTeam: 7,
    maxTeams: 16,
    draftType: 'standard_lol',
    bestOf: 1,
    additionalRules: '',
    startDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tournamentsData = await jsonFetch(`${API_BASE_URL}/api/tournaments`);
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);

      const teamData = await jsonFetch(`${API_BASE_URL}/api/team`);
      setUserTeam(teamData);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async () => {
    if (!tournamentForm.name.trim()) {
      setError('Tournament name is required');
      return;
    }

    try {
      const params = new URLSearchParams();
      Object.entries(tournamentForm).forEach(([key, value]) => {
        if (key === 'startDate' && value) {
          const isoDateTime = new Date(String(value)).toISOString();
          params.set(key, isoDateTime);
        } else {
          params.set(key, String(value));
        }
      });

      await jsonFetch(`${API_BASE_URL}/api/tournament?${params.toString()}`, {
        method: 'POST',
      });

      setShowCreate(false);
      setTournamentForm({
        name: '',
        description: '',
        format: 'single_elimination',
        status: 'planned',
        minPlayersPerTeam: 5,
        maxPlayersPerTeam: 7,
        maxTeams: 16,
        draftType: 'standard_lol',
        bestOf: 1,
        additionalRules: '',
        startDate: '',
      });
      setError('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
    }
  };

  const handleRegisterTeam = async (tournamentId: number) => {
    if (!userTeam) {
      setError('You must have a team to register for tournaments');
      return;
    }

    try {
      await jsonFetch(
        `${API_BASE_URL}/api/tournament/${tournamentId}/register/${userTeam.teamId}`,
        { method: 'POST' }
      );
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register team');
    }
  };

  const handleActivateTournament = async (tournamentId: number) => {
    try {
      const matchCount = await jsonFetch(
        `${API_BASE_URL}/api/tournament/${tournamentId}/activate`,
        { method: 'POST' }
      );
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate tournament');
    }
  };

  const handleViewMatches = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    try {
      const matchesData = await jsonFetch(
        `${API_BASE_URL}/api/tournament/${tournament.tournamentId}/matches`
      );
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (err) {
      console.error('Failed to load matches:', err);
      setMatches([]);
    }
    setShowMatches(true);
  };

  const isUserCaptainInMatch = (match: Match): boolean => {
    if (!userTeam) return false;
    return match.teamA.teamId === userTeam.teamId || (match.teamB?.teamId === userTeam.teamId);
  };

  const handleStartDraft = (matchId: number) => {
    setDraftMatchId(matchId);
    setShowDraftRoom(true);
  };

  const handleCloseDraft = () => {
    setShowDraftRoom(false);
    setDraftMatchId(null);
  };

  const handleViewDraftSummary = (matchId: number) => {
    setDraftSummaryMatchId(matchId);
    setShowDraftSummary(true);
  };

  const handleCloseDraftSummary = () => {
    setShowDraftSummary(false);
    setDraftSummaryMatchId(null);
  };

  const handleRecordResult = (match: Match) => {
    setResultMatchData(match);
    setShowMatchResultForm(true);
  };

  const handleCloseResultForm = () => {
    setShowMatchResultForm(false);
    setResultMatchData(null);
  };

  const handleResultSuccess = () => {
    setShowMatchResultForm(false);
    setResultMatchData(null);
    if (showMatches && selectedTournament) {
      handleViewMatches(selectedTournament);
    }
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setEditForm({
      name: tournament.name,
      description: tournament.description || '',
      status: tournament.status,
    });
  };

  const handleUpdateTournament = async () => {
    if (!editingTournament) return;
    
    if (!editForm.name.trim()) {
      setError('Tournament name is required');
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set('name', editForm.name);
      params.set('description', editForm.description);
      params.set('status', editForm.status);

      await jsonFetch(
        `${API_BASE_URL}/api/tournament/${editingTournament.tournamentId}?${params.toString()}`,
        { method: 'PUT' }
      );

      setEditingTournament(null);
      setEditForm({
        name: '',
        description: '',
        status: 'planned',
      });
      setError('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tournament');
    }
  };

  if (loading) {
    return <div className="loading" style={{ height: '100vh' }}>Загрузка турниров...</div>;
  }

  if (showDraftRoom && draftMatchId) {
    return (
      <div className="page-container">
        <LiveDraftRoom 
          matchId={draftMatchId} 
          onClose={handleCloseDraft}
        />
      </div>
    );
  }

  if (showDraftSummary && draftSummaryMatchId) {
    return (
      <div className="page-container">
        <DraftSummary 
          matchId={draftSummaryMatchId} 
          onClose={handleCloseDraftSummary}
        />
      </div>
    );
  }

  if (showMatchResultForm && resultMatchData) {
    return (
      <>
        <MatchResultForm
          matchId={resultMatchData.matchId}
          teamA={resultMatchData.teamA}
          teamB={resultMatchData.teamB ?? null}
          onClose={handleCloseResultForm}
          onSuccess={handleResultSuccess}
        />
      </>
    );
  }

  return (
    <div className="page-container">
      {error && <div className="error">{error}</div>}

      {userTeam ? (
        <div className="team-banner">
          <h3>Ваша команда: {userTeam.name}</h3>
          <p>Капитан команды может регистрировать команду на турниры</p>
        </div>
      ) : null}

      {!showCreate ? (
        <button onClick={() => setShowCreate(true)} className="button">
          Создать турнир
        </button>
      ) : (
        <div className="card mb-6">
          <h3>Создание турнира</h3>
          <form className="form" onSubmit={(e) => { e.preventDefault(); handleCreateTournament(); }}>
            <label>
              <strong>Название турнира</strong>
              <input
                type="text"
                value={tournamentForm.name}
                onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                placeholder="LEC Spring 2026"
                required
              />
            </label>

            <label>
              <strong>Описание</strong>
              <textarea
                value={tournamentForm.description}
                onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                placeholder="Описание турнира..."
              />
            </label>

            <label>
              <strong>Дата начала</strong>
              <input
                type="datetime-local"
                value={tournamentForm.startDate}
                onChange={(e) => setTournamentForm({ ...tournamentForm, startDate: e.target.value })}
                required
              />
            </label>

            

            <div className="form-row">
              <label>
                <strong>Мин. игроков в команде</strong>
                <input
                  type="number"
                  value={tournamentForm.minPlayersPerTeam}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, minPlayersPerTeam: Number(e.target.value) })}
                  min={1}
                />
              </label>
              <label>
                <strong>Макс. игроков в команде</strong>
                <input
                  type="number"
                  value={tournamentForm.maxPlayersPerTeam}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, maxPlayersPerTeam: Number(e.target.value) })}
                  min={1}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                <strong>Макс. команд</strong>
                <input
                  type="number"
                  value={tournamentForm.maxTeams}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, maxTeams: Number(e.target.value) })}
                  min={2}
                />
              </label>
              
            </div>

            <label>
              <strong>Дополнительные правила</strong>
              <textarea
                value={tournamentForm.additionalRules}
                onChange={(e) => setTournamentForm({ ...tournamentForm, additionalRules: e.target.value })}
                placeholder="Правила и условия турнира..."
              />
            </label>

            <div className="form-actions">
              <button type="submit">
                Создать турнир
              </button>
              <button type="button" className="secondary" onClick={() => setShowCreate(false)}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {editingTournament && (
        <div
          style={{
            backgroundColor: '#0a1428',
            padding: '15px',
            borderRadius: '4px',
            border: '1px solid #ffc700',
            marginBottom: '20px',
          }}
        >
          <h3>Edit Tournament: {editingTournament.name}</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
              <strong>Name:</strong>
            </label>
            <input
              type="text"
              placeholder="Tournament name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#0a0e27',
                border: '1px solid #0a0e27',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
              <strong>Description:</strong>
            </label>
            <textarea
              placeholder="Description (optional)"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#0a0e27',
                border: '1px solid #0a0e27',
                color: '#fff',
                boxSizing: 'border-box',
                minHeight: '80px',
              }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
              <strong>Status:</strong>
            </label>
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#0a0e27',
                border: '1px solid #0a0e27',
                color: '#fff',
                boxSizing: 'border-box',
              }}
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={handleUpdateTournament}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditingTournament(null)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#666',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2>Tournaments ({tournaments.length})</h2>
      {showMatches && selectedTournament ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowMatches(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#666',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Back to Tournaments
            </button>
          </div>
          <h3>{selectedTournament.name} - Matches</h3>
          {matches.length === 0 ? (
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '4px',
              border: '1px solid #0a0e27'
            }}>
              <p>No matches created yet.</p>
              <p>To generate matches, activate the tournament using the <strong>"Activate"</strong> button on the tournament card</p>
            </div>
          ) : (
            <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '15px',
              }}
            >
              {matches.map((match) => (
                <MatchCard
                  key={match.matchId}
                  match={match}
                  isUserCaptain={isUserCaptainInMatch(match)}
                  currentUserLogin={login || ''}
                  onStartDraft={handleStartDraft}
                  onViewDraft={handleViewDraftSummary}
                  onRecordResult={handleRecordResult}
                />
              ))}
            </div>
            </>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px',
          }}
        >
          {tournaments.map((tournament) => (
            <div
              key={tournament.tournamentId}
              style={{
                backgroundColor: '#0a1428',
                border: '1px solid #0a0e27',
                padding: '15px',
                borderRadius: '4px',
              }}
            >
              <h3>{tournament.name}</h3>
              <p>
                <strong>Format:</strong> {tournament.format}
              </p>
              <p>
                <strong>Status:</strong> {tournament.status}
              </p>
              <p>
                <strong>Players per team:</strong> {tournament.minPlayersPerTeam}-
                {tournament.maxPlayersPerTeam}
              </p>
              {tournament.description && (
                <p>
                  <strong>Description:</strong> {tournament.description}
                </p>
              )}
              {tournament.startDate && (
                <p>
                  <strong>Start Date:</strong> {new Date(tournament.startDate).toLocaleString()}
                </p>
              )}
              {tournament.creatorLogin && (
                <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  <strong>Created by:</strong> {tournament.creatorLogin}
                </p>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                {tournament.creatorLogin === login && (
                  <button
                    onClick={() => handleEditTournament(tournament)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#6b7280',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                )}
                {userTeam && tournament.status === 'planned' && (
                  <button
                    onClick={() => handleRegisterTeam(tournament.tournamentId)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#0a66c2',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Register Team
                  </button>
                )}
                {tournament.status === 'planned' && tournament.creatorLogin === login && (
                  <button
                    onClick={() => handleActivateTournament(tournament.tournamentId)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Activate
                  </button>
                )}
                {tournament.status === 'active' && (
                  <button
                    onClick={() => handleViewMatches(tournament)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#ffc700',
                      color: '#000',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    View Matches
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tournaments.length === 0 && !showMatches && (
        <p style={{ textAlign: 'center', padding: '20px' }}>
          No tournaments available. Create the first one!
        </p>
      )}
    </div>
  );
};
