import React, { useState, useEffect } from 'react';
import { jsonFetch, API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import '../styles.css';

interface Team {
  teamId: number;
  name: string;
  tag?: string;
  captainLogin?: string;
  captainNickname?: string;
  playerCount?: number;
}

interface TeamMember {
  membershipId: number;
  playerLogin: string;
  playerNickname: string;
  isCaptain: boolean;
  role?: string;
  joinedAt: string;
}

interface CreateTeamRequest {
  name: string;
  tag: string;
  captainRole?: string;
}

const ROLES = ['top', 'jungle', 'mid', 'adc', 'support'];

export const TeamsPage: React.FC<{ onMessage: (msg: string) => void }> = ({ onMessage }) => {
  const { login } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [captainRole, setCaptainRole] = useState('');
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showManagement, setShowManagement] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [error, setError] = useState('');
  const [memberLogin, setMemberLogin] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await jsonFetch(`${API_BASE_URL}/api/teams`);
      setTeams(data);
      
      try {
        const userTeamData = await jsonFetch(`${API_BASE_URL}/api/team`);
        setUserTeam(userTeamData);
        await loadTeamMembers();
      } catch (err) {
        setUserTeam(null);
        setTeamMembers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await jsonFetch(`${API_BASE_URL}/api/team/members`);
      setTeamMembers(data);
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Team name cannot be empty');
      return;
    }

    if (!teamTag.trim()) {
      setError('Team tag cannot be empty');
      return;
    }

    if (userTeam) {
      setError('You already have a team!');
      return;
    }

    try {
      const request: CreateTeamRequest = { 
        name: teamName, 
        tag: teamTag,
        captainRole: captainRole || undefined
      };
      await jsonFetch(`${API_BASE_URL}/api/team`, {
        method: 'POST',
        body: request,
      });
      
      onMessage('Team created successfully!');
      setTeamName('');
      setTeamTag('');
      setCaptainRole('');
      setShowCreate(false);
      setError('');
      loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete your team? This action cannot be undone.')) {
      return;
    }

    try {
      await jsonFetch(`${API_BASE_URL}/api/team`, {
        method: 'DELETE',
      });
      
      onMessage('Team deleted successfully!');
      setUserTeam(null);
      setTeamMembers([]);
      loadTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberRole) {
      setError('Role is required when adding a player');
      return;
    }
    
    try {
      await jsonFetch(`${API_BASE_URL}/api/team/members`, {
        method: 'POST',
        body: { playerLogin: memberLogin, role: memberRole },
      });
      
      setMemberLogin('');
      setMemberRole('');
      setShowAddMember(false);
      setError('');
      onMessage('Player added to team successfully!');
      await loadTeamMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    }
  };

  const isCaptain = userTeam?.captainLogin === login;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading teams...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        {userTeam ? (
          <div>
            <div
              style={{
                backgroundColor: '#0a1428',
                border: '2px solid #ffc700',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
              }}
            >
              <h3>Your Team: {userTeam.name}</h3>
              {userTeam.tag && <p><strong>Tag:</strong> {userTeam.tag}</p>}
              <p>
                <strong>Captain:</strong> {userTeam.captainNickname || userTeam.captainLogin}
              </p>
              
              {isCaptain && (
                <button
                  onClick={handleDeleteTeam}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  Delete Team
                </button>
              )}
            </div>

            <div
              style={{
                backgroundColor: '#0a1428',
                padding: '15px',
                borderRadius: '4px',
                border: '1px solid #0a0e27',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>Team Members ({teamMembers.length})</h3>
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#0a66c2',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  {showMembers ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showMembers && (
                <div>
                  {teamMembers.length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {teamMembers.map((member) => (
                        <div
                          key={member.membershipId}
                          style={{
                            backgroundColor: '#0a1428',
                            padding: '10px',
                            borderRadius: '4px',
                            border: member.isCaptain ? '1px solid #ffc700' : '1px solid #0a0e27',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ color: member.isCaptain ? '#ffc700' : '#fff' }}>
                                {member.playerNickname || member.playerLogin}
                                {member.isCaptain && ' 👑'}
                              </strong>
                              {member.role && (
                                <span style={{ marginLeft: '10px', color: '#888' }}>
                                  ({member.role})
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.85em', color: '#666' }}>
                              {member.playerLogin}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#888', margin: '10px 0' }}>No members yet</p>
                  )}
                  
                  {isCaptain && (
                    <div style={{ marginTop: '15px' }}>
                      {!showAddMember ? (
                        <button
                          onClick={() => setShowAddMember(true)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            width: '100%',
                          }}
                        >
                          Add Player
                        </button>
                      ) : (
                        <form onSubmit={handleAddMember} style={{
                          backgroundColor: '#0a1428',
                          padding: '15px',
                          borderRadius: '4px',
                          border: '1px solid #1f2937',
                        }}>
                          <h4 style={{ margin: '0 0 10px', color: '#9ca3af' }}>Add Player to Team</h4>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#9ca3af', fontSize: '0.85rem' }}>
                              Player Login *
                            </label>
                            <input
                              type="text"
                              value={memberLogin}
                              onChange={(e) => setMemberLogin(e.target.value)}
                              placeholder="player_login"
                              required
                              style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #0a0e27',
                                color: '#fff',
                                borderRadius: '4px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#9ca3af', fontSize: '0.85rem' }}>
                              Role *
                            </label>
                            <select
                              value={memberRole}
                              onChange={(e) => setMemberRole(e.target.value)}
                              required
                              style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #0a0e27',
                                color: '#fff',
                                borderRadius: '4px',
                                boxSizing: 'border-box',
                              }}
                            >
                              <option value="">Select role...</option>
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="submit"
                              style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: '#10b981',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                              }}
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddMember(false);
                                setMemberLogin('');
                                setMemberRole('');
                                setError('');
                              }}
                              style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: '#666',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          <>
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0a66c2',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                Create Team
              </button>
            ) : (
              <div
                style={{
                  backgroundColor: '#1a1a1a',
                  padding: '15px',
                  borderRadius: '4px',
                  border: '1px solid #0a0e27',
                }}
              >
                <h3 style={{ marginTop: 0 }}>Create New Team</h3>
                <input
                  type="text"
                  placeholder="Team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '10px',
                    backgroundColor: '#0a0e27',
                    border: '1px solid #0a0e27',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="text"
                  placeholder="Team tag (e.g., T1, G2, FNC)"
                  value={teamTag}
                  onChange={(e) => setTeamTag(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '10px',
                    backgroundColor: '#0a0e27',
                    border: '1px solid #0a0e27',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
                <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                  Your role (optional):
                </label>
                <select
                  value={captainRole}
                  onChange={(e) => setCaptainRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '10px',
                    backgroundColor: '#0a0e27',
                    border: '1px solid #0a0e27',
                    color: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select role...</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleCreateTeam}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#0a66c2',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setTeamName('');
                      setTeamTag('');
                      setCaptainRole('');
                      setError('');
                    }}
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
          </>
        )}
        {error && <div style={{ color: '#ff6b6b', marginTop: '10px' }}>{error}</div>}
      </div>

      <h2>All Teams ({teams.length})</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '15px',
        }}
      >
        {teams.map((team) => (
          <div
            key={team.teamId}
            style={{
              backgroundColor: '#0a1428',
              border: '1px solid #0a0e27',
              padding: '15px',
              borderRadius: '4px',
            }}
          >
            <h3>{team.name}</h3>
            {team.tag && <p><strong>Tag:</strong> {team.tag}</p>}
            <p>
              <strong>Captain:</strong> {team.captainNickname || team.captainLogin || '—'}
            </p>
            {team.playerCount !== undefined && <p>Players: {team.playerCount}</p>}
          </div>
        ))}
      </div>

      {teams.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No teams yet</p>}
    </div>
  );
};
