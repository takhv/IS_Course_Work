package ru.itmo.lol.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import ru.itmo.lol.dto.tournament.MatchResultRequest;
import ru.itmo.lol.dto.tournament.MatchResultResponse;
import ru.itmo.lol.entity.Match;
import ru.itmo.lol.entity.MatchResult;
import ru.itmo.lol.entity.Tournament;
import ru.itmo.lol.service.TournamentService;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    @GetMapping("/tournaments")
    public List<Tournament> getAllTournaments() {
        return tournamentService.getAllTournaments();
    }

    @PostMapping("/tournament")
    public Tournament createTournament(@RequestParam String name,
                                       @RequestParam(required = false) String description,
                                       @RequestParam String format,
                                       @RequestParam String status,
                                       @RequestParam Integer minPlayersPerTeam,
                                       @RequestParam Integer maxPlayersPerTeam,
                                       @RequestParam(required = false) Integer maxTeams,
                                       @RequestParam String draftType,
                                       @RequestParam(required = false) String additionalRules,
                                       @RequestParam(required = false) 
                                       @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) 
                                       OffsetDateTime startDate) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String creatorLogin = authentication != null && authentication.isAuthenticated() ? authentication.getName() : "anon";
        
        if (startDate == null) {
            startDate = OffsetDateTime.now();
        }
        
        return tournamentService.createTournament(
                name,
                description,
                format,
                status,
                minPlayersPerTeam,
                maxPlayersPerTeam,
                maxTeams,
                draftType,
                additionalRules,
                creatorLogin,
                startDate
        );
    }

    @PostMapping("/tournament/{tournamentId}/register/{teamId}")
    public ResponseEntity<Long> registerTeam(@PathVariable Long tournamentId, @PathVariable Long teamId) {
        Long registrationId = tournamentService.registerTeamForTournament(tournamentId, teamId);
        return ResponseEntity.ok(registrationId);
    }

    @PostMapping("/tournament/{tournamentId}/match")
    public Match createMatch(@PathVariable Long tournamentId,
                             @RequestParam Long teamAId,
                             @RequestParam Long teamBId,
                             @RequestParam
                             @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                             OffsetDateTime scheduledAt,
                             @RequestParam(required = false) String stage,
                             @RequestParam(required = false, defaultValue = "1") Integer bestOf) {
        return tournamentService.createMatch(
            tournamentId,
            teamAId,
            teamBId,
            scheduledAt,
            stage,
            bestOf
        );
    }

    @PostMapping("/tournament/match/{matchId}/result")
    public MatchResultResponse recordResult(@PathVariable Long matchId,
                                    @RequestBody MatchResultRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserLogin = authentication != null && authentication.isAuthenticated() ? authentication.getName() : null;
        
        if (currentUserLogin == null) {
            throw new RuntimeException("authentication required");
        }
        
        return tournamentService.recordMatchResult(
            matchId,
            request.getWinnerTeamId(),
            request.getDurationMinutes(),
            request.getTeamAScore(),
            request.getTeamBScore(),
            request.getPlayerStats(),
            currentUserLogin
        );
    }

    @PostMapping("/tournament/{tournamentId}/activate")
    public ResponseEntity<Integer> activateTournament(@PathVariable Long tournamentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserLogin = authentication != null && authentication.isAuthenticated() ? authentication.getName() : null;
        
        if (currentUserLogin == null) {
            return ResponseEntity.status(401).build();
        }
        
        Integer matchCount = tournamentService.activateTournament(tournamentId, currentUserLogin);
        return ResponseEntity.ok(matchCount);
    }

    @PutMapping("/tournament/{tournamentId}")
    public ResponseEntity<Tournament> updateTournament(@PathVariable Long tournamentId,
                                                       @RequestParam(required = false) String name,
                                                       @RequestParam(required = false) String description,
                                                       @RequestParam(required = false) String status) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserLogin = authentication != null && authentication.isAuthenticated() ? authentication.getName() : null;
        
        if (currentUserLogin == null) {
            return ResponseEntity.status(401).build();
        }
        
        Tournament updated = tournamentService.updateTournament(
            tournamentId, 
            name, 
            description, 
            status, 
            currentUserLogin
        );
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/tournament/{tournamentId}/matches")
    public List<Match> getTournamentMatches(@PathVariable Long tournamentId) {
        return tournamentService.getTournamentMatches(tournamentId);
    }

    @GetMapping("/tournament/match/{matchId}/result")
    public ResponseEntity<MatchResult> getMatchResult(@PathVariable Long matchId) {
        MatchResult result = tournamentService.getMatchResult(matchId);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}

