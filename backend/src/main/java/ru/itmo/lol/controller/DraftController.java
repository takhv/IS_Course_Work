package ru.itmo.lol.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import ru.itmo.lol.entity.Draft;
import ru.itmo.lol.service.DraftService;

import java.util.List;

@RestController
@RequestMapping("/api/draft")
@RequiredArgsConstructor
public class DraftController {

    private final DraftService draftService;

    @PostMapping("/{matchId}/steps")
    public ResponseEntity<Void> performDraft(@PathVariable Long matchId, @RequestBody List<DraftStepRequest> steps) {
        draftService.performDraft(
            matchId,
            steps.stream()
                .map(s -> new DraftService.DraftStep(
                    s.teamId(),
                    s.championId(),
                    s.actionType(),
                    s.side(),
                    s.orderNumber()))
                .toList()
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{matchId}/step")
    public Draft addDraftStep(@PathVariable Long matchId, @RequestBody DraftStepRequest step) {
        return draftService.addDraftStep(
            matchId,
            step.teamId(),
            step.championId(),
            step.actionType(),
            step.side(),
            step.orderNumber()
        );
    }

    @PostMapping("/{matchId}/step-by-name")
    public Draft addDraftStepByName(@PathVariable Long matchId, @RequestBody DraftStepByNameRequest step) {
        return draftService.addDraftStepByChampionName(
                matchId,
                step.teamId(),
                step.championName(),
                step.actionType(),
                step.side(),
                step.orderNumber()
        );
    }

    public record DraftStepRequest(Long teamId, Long championId, String actionType, String side, Integer orderNumber) {}

    public record DraftStepByNameRequest(Long teamId, String championName, String actionType, String side, Integer orderNumber) {}
}

