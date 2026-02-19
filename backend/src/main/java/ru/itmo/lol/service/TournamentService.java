package ru.itmo.lol.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import ru.itmo.lol.dto.tournament.MatchResultRequest.PlayerKdaData;
import ru.itmo.lol.dto.tournament.MatchResultResponse;
import ru.itmo.lol.entity.Match;
import ru.itmo.lol.entity.MatchResult;
import ru.itmo.lol.entity.Player;
import ru.itmo.lol.entity.PlayerStatistics;
import ru.itmo.lol.entity.Team;
import ru.itmo.lol.entity.TeamMember;
import ru.itmo.lol.entity.Tournament;
import ru.itmo.lol.entity.Rules;
import ru.itmo.lol.repository.MatchRepository;
import ru.itmo.lol.repository.MatchResultRepository;
import ru.itmo.lol.repository.PlayerRepository;
import ru.itmo.lol.repository.PlayerStatisticsRepository;
import ru.itmo.lol.repository.TeamMemberRepository;
import ru.itmo.lol.repository.TeamRepository;
import ru.itmo.lol.repository.TournamentRepository;
import ru.itmo.lol.repository.RulesRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final RulesRepository rulesRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;
    private final MatchResultRepository matchResultRepository;
    private final PlayerRepository playerRepository;
    private final PlayerStatisticsRepository playerStatisticsRepository;
    private final TeamMemberRepository teamMemberRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    @Transactional
    public Tournament createTournament(String name,
                                       String description,
                                       String format,
                                       String status,
                                       Integer minPlayersPerTeam,
                                       Integer maxPlayersPerTeam,
                                       Integer maxTeams,
                                       String draftType,
                                       String additionalRules,
                                       String creatorLogin,
                                       OffsetDateTime startDate) {
        Tournament tournament = new Tournament();
        tournament.setName(name);
        tournament.setDescription(description);
        tournament.setFormat(format);
        tournament.setStatus(status);
        tournament.setStartDate(startDate);
        tournament.setCreatorLogin(creatorLogin);
        tournamentRepository.save(tournament);

        Rules rules = new Rules();
        rules.setTournament(tournament);
        rules.setMinPlayersPerTeam(minPlayersPerTeam);
        rules.setMaxPlayersPerTeam(maxPlayersPerTeam);
        rules.setMaxTeams(maxTeams);
        rules.setDraftType(draftType);
        rules.setAdditionalRules(additionalRules);
        rulesRepository.save(rules);

        return tournament;
    }

    @Transactional
    public Long registerTeamForTournament(Long tournamentId, Long teamId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("tournament not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("team not found"));

        Long registrationId = (Long) entityManager
                .createNativeQuery("SELECT register_team_for_tournament(:tournament_id, :team_id)")
                .setParameter("tournament_id", tournament.getTournamentId())
                .setParameter("team_id", team.getTeamId())
                .getSingleResult();

        return registrationId;
    }

    @Transactional
    public Match createMatch(Long tournamentId,
                             Long teamAId,
                             Long teamBId,
                             OffsetDateTime scheduledAt,
                             String stage,
                             Integer bestOf) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("tournament not found"));
        Team teamA = teamRepository.findById(teamAId)
                .orElseThrow(() -> new RuntimeException("team A not found"));
        Team teamB = teamRepository.findById(teamBId)
                .orElseThrow(() -> new RuntimeException("team B not found"));

        Long matchId = (Long) entityManager
                .createNativeQuery(
                        "SELECT create_match_for_tournament(:tournament_id, :team_a_id, :team_b_id, :scheduled_at, :stage, :best_of)")
                .setParameter("tournament_id", tournament.getTournamentId())
                .setParameter("team_a_id", teamA.getTeamId())
                .setParameter("team_b_id", teamB.getTeamId())
                .setParameter("scheduled_at", scheduledAt)
                .setParameter("stage", stage)
                .setParameter("best_of", bestOf)
                .getSingleResult();

        return matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("created match not found"));
    }

    @Transactional
    public MatchResultResponse recordMatchResult(Long matchId,
                                         Long winnerTeamId,
                                         Integer durationMinutes,
                                         Integer teamAScore,
                                         Integer teamBScore,
                                         Map<String,PlayerKdaData> playerStats,
                                         String currentUserLogin) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("match not found"));
        Team winner = teamRepository.findById(winnerTeamId)
                .orElseThrow(() -> new RuntimeException("winner team not found"));
        
        Tournament tournament = match.getTournament();
        if (!tournament.getCreatorLogin().equals(currentUserLogin)) {
            throw new RuntimeException("only tournament organizer can record match results");
        }
        
        if (!"active".equalsIgnoreCase(tournament.getStatus())) {
            throw new RuntimeException("cannot record results for completed tournament");
        }

        MatchResult result = new MatchResult();
        result.setMatch(match);
        result.setWinner(winner);
        result.setDurationMinutes(durationMinutes);
        result.setTeamAScore(teamAScore);
        result.setTeamBScore(teamBScore);

        MatchResult savedResult = matchResultRepository.save(result);

        if (playerStats != null && !playerStats.isEmpty()) {
            for (Map.Entry<String, PlayerKdaData> entry : playerStats.entrySet()) {
                String playerLogin = entry.getKey();
                PlayerKdaData kda = entry.getValue();
                
                Player player = playerRepository.findByLogin(playerLogin)
                        .orElse(null);
                if (player == null) continue;
                
                PlayerStatistics stats = playerStatisticsRepository.findByPlayer(player).stream()
                        .filter(s -> s.getTournament().getTournamentId().equals(tournament.getTournamentId()))
                        .findFirst()
                        .orElse(null);
                
                if (stats == null) {
                    stats = new PlayerStatistics();
                    stats.setPlayer(player);
                    stats.setTournament(tournament);
                    stats.setGamesPlayed(0);
                    stats.setWins(0);
                    stats.setLoses(0);
                    stats.setKills(0);
                    stats.setDeaths(0);
                    stats.setAssists(0);
                }
                
                TeamMember membership = teamMemberRepository.findByPlayerAndLeftAtIsNull(player);
                boolean isWinner = false;
                if (membership != null) {
                    Long playerTeamId = membership.getTeam().getTeamId();
                    isWinner = playerTeamId.equals(winner.getTeamId());
                }
                
                stats.setGamesPlayed(stats.getGamesPlayed() + 1);
                if (isWinner) {
                    stats.setWins(stats.getWins() + 1);
                } else {
                    stats.setLoses(stats.getLoses() + 1);
                }
                stats.setKills(stats.getKills() + (kda.getKills() != null ? kda.getKills() : 0));
                stats.setDeaths(stats.getDeaths() + (kda.getDeaths() != null ? kda.getDeaths() : 0));
                stats.setAssists(stats.getAssists() + (kda.getAssists() != null ? kda.getAssists() : 0));
                
                playerStatisticsRepository.save(stats);
            }
        }

        Object[] result_row = (Object[]) entityManager
                .createNativeQuery(
                    "SELECT * FROM create_next_match_if_possible(:match_id, :winner_team_id)"
                )
                .setParameter("match_id", matchId)
                .setParameter("winner_team_id", winnerTeamId)
                .getSingleResult();

        Long nextMatchId = result_row[0] != null ? ((Number) result_row[0]).longValue() : null;
        Long championTeamId = result_row[1] != null ? ((Number) result_row[1]).longValue() : null;

        Tournament updatedTournament = tournamentRepository.findById(tournament.getTournamentId())
                .orElseThrow(() -> new RuntimeException("tournament not found after update"));

        return MatchResultResponse.builder()
                .matchResultId(savedResult.getMatchResultId())
                .matchId(matchId)
                .winnerTeamId(winnerTeamId)
                .durationMinutes(durationMinutes)
                .teamAScore(teamAScore)
                .teamBScore(teamBScore)
                .nextMatchId(nextMatchId)
                .championTeamId(championTeamId)
                .tournamentStatus(updatedTournament.getStatus())
                .build();
    }

    @Transactional
    public Tournament updateTournament(Long tournamentId, 
                                      String name, 
                                      String description, 
                                      String status,
                                      String currentUserLogin) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("tournament not found"));

        if (!tournament.getCreatorLogin().equals(currentUserLogin)) {
            throw new RuntimeException("only the tournament creator can update it");
        }

        if (name != null && !name.trim().isEmpty()) {
            tournament.setName(name);
        }
        if (description != null) {
            tournament.setDescription(description);
        }
        if (status != null && !status.trim().isEmpty()) {
            tournament.setStatus(status);
        }

        return tournamentRepository.save(tournament);
    }

    @Transactional
    public Integer activateTournament(Long tournamentId, String currentUserLogin) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("tournament not found"));

        if (!tournament.getCreatorLogin().equals(currentUserLogin)) {
            throw new RuntimeException("only the tournament creator can activate it");
        }

        if (!"planned".equalsIgnoreCase(tournament.getStatus())) {
            throw new RuntimeException("tournament must be in 'planned' status to activate");
        }

        Integer matchCount = (Integer) entityManager
                .createNativeQuery("SELECT generate_tournament_bracket(:tournament_id)")
                .setParameter("tournament_id", tournamentId)
                .getSingleResult();

        tournament.setStatus("active");
        tournamentRepository.save(tournament);

        return matchCount;
    }

    @Transactional(readOnly = true)
    public List<Match> getTournamentMatches(Long tournamentId) {
        tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("tournament not found"));
        
        return matchRepository.findByTournament_TournamentId(tournamentId);
    }
    @Transactional(readOnly = true)
    public MatchResult getMatchResult(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        
        return matchResultRepository.findByMatch(match)
                .orElse(null);
    }
}
