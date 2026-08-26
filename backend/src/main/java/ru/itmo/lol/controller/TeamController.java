package ru.itmo.lol.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import ru.itmo.lol.dto.team.CreateTeamRequest;
import ru.itmo.lol.dto.team.AddTeamMemberRequest;
import ru.itmo.lol.dto.team.TeamResponse;
import ru.itmo.lol.dto.team.TeamMemberResponse;
import ru.itmo.lol.dto.team.UpdateTeamRequest;
import ru.itmo.lol.service.TeamService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    private String getCurrentLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new IllegalArgumentException("player not authenticated");
    }

    @PostMapping("/team")
    public ResponseEntity<Void> createTeam(@Valid @RequestBody CreateTeamRequest request) {
        String login = getCurrentLogin();
        teamService.createTeam(login, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/team")
    public TeamResponse getTeam() {
        String login = getCurrentLogin();
        return teamService.getTeam(login);
    }

    @PutMapping("/team")
    public TeamResponse updateTeam(@Valid @RequestBody UpdateTeamRequest request) {
        String login = getCurrentLogin();
        return teamService.updateTeam(login, request);
    }

    @DeleteMapping("/team")
    public ResponseEntity<Void> deleteTeam() {
        String login = getCurrentLogin();
        teamService.deleteTeam(login);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/teams")
    public List<TeamResponse> getAllTeams() {
        return teamService.listTeams();
    }

    @PostMapping("/team/members")
    public ResponseEntity<Void> addTeamMember(@Valid @RequestBody AddTeamMemberRequest request) {
        String login = getCurrentLogin();
        teamService.addPlayerToTeam(login, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/team/members")
    public List<TeamMemberResponse> getTeamMembers() {
        String login = getCurrentLogin();
        return teamService.getTeamMembers(login);
    }
    
    @GetMapping("/team/{teamId}/members")
    public List<TeamMemberResponse> getTeamMembersByTeamId(@PathVariable Long teamId) {
        return teamService.getTeamMembersByTeamId(teamId);
    }
}

