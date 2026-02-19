package ru.itmo.lol.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.lol.dto.draft.DraftRoomStateResponse;
import ru.itmo.lol.entity.*;
import ru.itmo.lol.repository.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DraftRoomService {

    private final DraftSessionRepository draftSessionRepository;
    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final DraftRepository draftRepository;
    private final ChampionRepository championRepository;

    @Transactional
    public DraftSession getOrCreateDraftSession(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("match not found"));

        return draftSessionRepository.findByMatch(match)
                .orElseGet(() -> {
                    DraftSession session = new DraftSession();
                    session.setMatch(match);
                    session.setStatus("WAITING");
                    session.setTeamAJoined(false);
                    session.setTeamBJoined(false);
                    session.setCurrentTurn("A");
                    session.setCurrentPhase("BAN");
                    session.setPhaseNumber(0);
                    session.setCreatedAt(OffsetDateTime.now());
                    return draftSessionRepository.save(session);
                });
    }

    public String getPlayerTeamSideInMatch(String playerLogin, Long matchId) {
        Player player = playerRepository.findByLogin(playerLogin)
                .orElseThrow(() -> new RuntimeException("player not found"));

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("match not found"));

        TeamMember teamAMembership = teamMemberRepository.findByPlayerAndTeamAndCaptainTrue(player, match.getTeamA());
        if (teamAMembership != null && teamAMembership.getLeftAt() == null) {
            return "A";
        }

        TeamMember teamBMembership = teamMemberRepository.findByPlayerAndTeamAndCaptainTrue(player, match.getTeamB());
        if (teamBMembership != null && teamBMembership.getLeftAt() == null) {
            return "B";
        }

        throw new RuntimeException("player is not a captain of either team in this match");
    }

    @Transactional
    public DraftSession joinDraft(Long matchId, String playerLogin) {
        DraftSession session = getOrCreateDraftSession(matchId);
        String side = getPlayerTeamSideInMatch(playerLogin, matchId);

        if ("A".equals(side)) {
            session.setTeamAJoined(true);
        } else if ("B".equals(side)) {
            session.setTeamBJoined(true);
        }

        if (Boolean.TRUE.equals(session.getTeamAJoined()) && Boolean.TRUE.equals(session.getTeamBJoined())) {
            if ("WAITING".equals(session.getStatus())) {
                session.setStatus("ACTIVE");
                session.setStartedAt(OffsetDateTime.now());
            }
        }

        return draftSessionRepository.save(session);
    }

    @Transactional
    public Draft performDraftAction(Long matchId, String playerLogin, String championName, String actionType) {
        DraftSession session = draftSessionRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new RuntimeException("draft session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new RuntimeException("draft is not active");
        }

        String side = getPlayerTeamSideInMatch(playerLogin, matchId);
        if (!side.equals(session.getCurrentTurn())) {
            throw new RuntimeException("not your turn");
        }

        Match match = session.getMatch();
        Champion champion = championRepository.findByName(championName)
                .orElseThrow(() -> new RuntimeException("champion '" + championName + "' not found"));

        if (draftRepository.isChampionAlreadyUsed(matchId, champion.getChampionId())) {
            throw new RuntimeException("champion '" + championName + "' has already been picked or banned in this match");
        }

        Team team = "A".equals(side) ? match.getTeamA() : match.getTeamB();

        Draft draft = new Draft();
        draft.setMatch(match);
        draft.setTeam(team);
        draft.setChampion(champion);
        draft.setActionType(actionType.toLowerCase());
        draft.setSide("A".equals(side) ? "blue" : "red");
        draft.setOrderNumber(session.getPhaseNumber() + 1);
        draftRepository.save(draft);

        advanceDraftPhase(session);

        return draft;
    }

    private void advanceDraftPhase(DraftSession session) {
        session.setPhaseNumber(session.getPhaseNumber() + 1);

        if ("A".equals(session.getCurrentTurn())) {
            session.setCurrentTurn("B");
        } else {
            session.setCurrentTurn("A");
        }

        if (session.getPhaseNumber() == 6) {
            session.setCurrentPhase("PICK");
        }

        if (session.getPhaseNumber() == 12) {
            session.setCurrentPhase("BAN_2");
        }

        if (session.getPhaseNumber() == 16) {
            session.setCurrentPhase("PICK_2");
        }

        if (session.getPhaseNumber() >= 20) {
            session.setStatus("COMPLETED");
            session.setCompletedAt(OffsetDateTime.now());
        }

        draftSessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public DraftRoomStateResponse getDraftState(Long matchId) {
        DraftSession session = draftSessionRepository.findByMatch_MatchId(matchId)
                .orElseThrow(() -> new RuntimeException("draft session not found"));

        Match match = session.getMatch();

        TeamMember captainA = teamMemberRepository.findByTeamAndCaptainTrue(match.getTeamA());
        TeamMember captainB = teamMemberRepository.findByTeamAndCaptainTrue(match.getTeamB());

        DraftRoomStateResponse response = new DraftRoomStateResponse();
        response.setSessionId(session.getSessionId());
        response.setMatchId(matchId);
        response.setStatus(session.getStatus());
        response.setCurrentTurn(session.getCurrentTurn());
        response.setCurrentPhase(session.getCurrentPhase());
        response.setPhaseNumber(session.getPhaseNumber());
        response.setStartedAt(session.getStartedAt());

        DraftRoomStateResponse.TeamInfo teamAInfo = new DraftRoomStateResponse.TeamInfo();
        teamAInfo.setTeamId(match.getTeamA().getTeamId());
        teamAInfo.setTeamName(match.getTeamA().getName());
        teamAInfo.setJoined(session.getTeamAJoined());
        teamAInfo.setCaptainLogin(captainA != null ? captainA.getPlayer().getLogin() : null);
        response.setTeamA(teamAInfo);

        DraftRoomStateResponse.TeamInfo teamBInfo = new DraftRoomStateResponse.TeamInfo();
        teamBInfo.setTeamId(match.getTeamB().getTeamId());
        teamBInfo.setTeamName(match.getTeamB().getName());
        teamBInfo.setJoined(session.getTeamBJoined());
        teamBInfo.setCaptainLogin(captainB != null ? captainB.getPlayer().getLogin() : null);
        response.setTeamB(teamBInfo);

        List<Draft> draftActions = draftRepository.findByMatch_MatchIdOrderByOrderNumber(matchId);
        List<DraftRoomStateResponse.DraftActionInfo> actions = new ArrayList<>();
        for (Draft d : draftActions) {
            DraftRoomStateResponse.DraftActionInfo action = new DraftRoomStateResponse.DraftActionInfo();
            action.setSide("blue".equals(d.getSide()) ? "A" : "B");
            action.setActionType(d.getActionType().toUpperCase());
            action.setChampionId(d.getChampion().getChampionId());
            action.setChampionName(d.getChampion().getName());
            action.setOrderNumber(d.getOrderNumber());
            actions.add(action);
        }
        response.setActions(actions);

        return response;
    }

    public List<Long> getUsedChampionIds(Long matchId) {
        return draftRepository.getUsedChampionIds(matchId);
    }

    public boolean isDraftAvailable(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("match not found"));

        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime draftStartTime = match.getScheduledAt().minusMinutes(10);
        OffsetDateTime matchStartTime = match.getScheduledAt();

        return now.isAfter(draftStartTime) && now.isBefore(matchStartTime);
    }

    public DraftRoomStateResponse getDraftSummary(Long matchId) {
        return getDraftState(matchId);
    }
}
