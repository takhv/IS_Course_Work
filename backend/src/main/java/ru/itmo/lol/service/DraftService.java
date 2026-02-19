package ru.itmo.lol.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.itmo.lol.entity.Champion;
import ru.itmo.lol.entity.Draft;
import ru.itmo.lol.entity.Match;
import ru.itmo.lol.entity.Team;
import ru.itmo.lol.repository.ChampionRepository;
import ru.itmo.lol.repository.DraftRepository;
import ru.itmo.lol.repository.MatchRepository;
import ru.itmo.lol.repository.TeamRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DraftService {

    private final DraftRepository draftRepository;
    private final MatchRepository matchRepository;
    private final TeamRepository teamRepository;
    private final ChampionRepository championRepository;

    @Transactional
    public void performDraft(Long matchId, List<DraftStep> steps) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("match not found"));

        for (DraftStep step : steps) {
            Team team = teamRepository.findById(step.teamId())
                    .orElseThrow(() -> new RuntimeException("team not found: " + step.teamId()));
            Champion champion = championRepository.findById(step.championId())
                    .orElseThrow(() -> new RuntimeException("champion not found: " + step.championId()));

            Draft draft = new Draft();
            draft.setMatch(match);
            draft.setTeam(team);
            draft.setChampion(champion);
            draft.setActionType(step.actionType());
            draft.setSide(step.side());
            draft.setOrderNumber(step.orderNumber());

            draftRepository.save(draft);
        }
    }

    @Transactional
    public Draft addDraftStep(Long matchId, Long teamId, Long championId, String actionType, String side, Integer orderNumber) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("match not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("team not found"));
        Champion champion = championRepository.findById(championId)
                .orElseThrow(() -> new RuntimeException("champion not found"));

        Draft draft = new Draft();
        draft.setMatch(match);
        draft.setTeam(team);
        draft.setChampion(champion);
        draft.setActionType(actionType);
        draft.setSide(side);
        draft.setOrderNumber(orderNumber);

        return draftRepository.save(draft);
    }

    @Transactional
    public Draft addDraftStepByChampionName(Long matchId, Long teamId, String championName, 
                                            String actionType, String side, Integer orderNumber) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("match not found"));
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("team not found"));
        Champion champion = championRepository.findByName(championName)
                .orElseThrow(() -> new RuntimeException("champion '" + championName + "' not found"));

        Draft draft = new Draft();
        draft.setMatch(match);
        draft.setTeam(team);
        draft.setChampion(champion);
        draft.setActionType(actionType);
        draft.setSide(side);
        draft.setOrderNumber(orderNumber);

        return draftRepository.save(draft);
    }

    public record DraftStep(Long teamId, Long championId, String actionType, String side, Integer orderNumber) {}

}
