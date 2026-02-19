package ru.itmo.lol.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import ru.itmo.lol.dto.team.CreateTeamRequest;
import ru.itmo.lol.dto.team.AddTeamMemberRequest;
import ru.itmo.lol.dto.team.TeamResponse;
import ru.itmo.lol.dto.team.TeamMemberResponse;
import ru.itmo.lol.dto.team.UpdateTeamRequest;
import ru.itmo.lol.entity.Player;
import ru.itmo.lol.entity.Team;
import ru.itmo.lol.entity.TeamMember;
import ru.itmo.lol.repository.PlayerRepository;
import ru.itmo.lol.repository.TeamMemberRepository;
import ru.itmo.lol.repository.TeamRepository;

import java.util.ArrayList;
import java.util.List;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional
    public void createTeam(String login, CreateTeamRequest request) {
        Player player = player(login);

        TeamMember existingMembership = teamMemberRepository.findByPlayerAndLeftAtIsNull(player);
        if (existingMembership != null && Boolean.TRUE.equals(existingMembership.getTeam().getIsActive())) {
            throw new IllegalArgumentException("you are already in an active team");
        }

        if (teamRepository.existsByTagAndIsActiveTrue(request.getTag())) {
            throw new IllegalArgumentException("active team already exists with this tag");
        }
        if (teamRepository.existsByNameAndIsActiveTrue(request.getName())) {
            throw new IllegalArgumentException("active team already exists with this name");
        }

        Team team = new Team();
        team.setName(request.getName());
        team.setTag(request.getTag());
        team.setCreatedAt(OffsetDateTime.now());
        team.setIsActive(true);
        teamRepository.save(team);

        TeamMember teamMember = new TeamMember();
        teamMember.setPlayer(player);
        teamMember.setTeam(team);
        teamMember.setCaptain(true);
        teamMember.setRole(request.getCaptainRole());
        teamMember.setJoinedAt(OffsetDateTime.now());
        teamMemberRepository.save(teamMember);
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeam(String login) {
        Player player = player(login);

        TeamMember teamMember = teamMemberRepository.findByPlayerAndLeftAtIsNull(player);
        if (teamMember == null) {
            throw new IllegalArgumentException("team not found for this player");
        }
        Team team = teamMember.getTeam();
        if (!Boolean.TRUE.equals(team.getIsActive())) {
            throw new IllegalArgumentException("team is no longer active");
        }
        return toResponse(team);
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> listTeams() {
        List<Team> teams = teamRepository.findAll().stream()
                .filter(team -> Boolean.TRUE.equals(team.getIsActive()))
                .toList();
        List<TeamResponse> responses = new ArrayList<>(teams.size());
        for (Team team : teams) {
            responses.add(toResponse(team));
        }
        return responses;
    }

    @Transactional
    public TeamResponse updateTeam(String login, UpdateTeamRequest request) {
        Player player = player(login);
        TeamMember teamMember = teamMemberRepository.findByPlayerAndLeftAtIsNull(player);
        if (teamMember == null || !Boolean.TRUE.equals(teamMember.getCaptain())) {
            throw new IllegalArgumentException("only captain can update the team");
        }

        Team team = teamMember.getTeam();
        
        if (!Boolean.TRUE.equals(team.getIsActive())) {
            throw new IllegalArgumentException("cannot update inactive team");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            if (!request.getName().equals(team.getName()) && 
                teamRepository.existsByNameAndIsActiveTrue(request.getName())) {
                throw new IllegalArgumentException("active team already exists with this name");
            }
            team.setName(request.getName());
        }
        if (request.getTag() != null && !request.getTag().isBlank()) {
            if (!request.getTag().equals(team.getTag()) && 
                teamRepository.existsByTagAndIsActiveTrue(request.getTag())) {
                throw new IllegalArgumentException("active team already exists with this tag");
            }
            team.setTag(request.getTag());
        }

        teamRepository.save(team);
        return toResponse(team);
    }

    @Transactional
    public void deleteTeam(String login) {
        Player player = player(login);
        TeamMember teamMember = teamMemberRepository.findByPlayerAndLeftAtIsNull(player);
        if (teamMember == null || !Boolean.TRUE.equals(teamMember.getCaptain())) {
            throw new IllegalArgumentException("only captain can delete the team");
        }
        Team team = teamMember.getTeam();
        OffsetDateTime now = OffsetDateTime.now();

        team.setIsActive(false);
        teamRepository.save(team);

        List<TeamMember> activeMembers = teamMemberRepository.findAll().stream()
                .filter(m -> m.getTeam().getTeamId().equals(team.getTeamId()) && m.getLeftAt() == null)
                .toList();
        
        for (TeamMember member : activeMembers) {
            member.setLeftAt(now);
            teamMemberRepository.save(member);
        }
    }

    @Transactional
    public void addPlayerToTeam(String captainLogin, AddTeamMemberRequest request) {
        Player captain = player(captainLogin);
        TeamMember captainMembership = teamMemberRepository.findByPlayerAndCaptainTrueAndLeftAtIsNull(captain);
        if (captainMembership == null) {
            throw new IllegalArgumentException("only captain can add players to the team");
        }

        Player newPlayer = player(request.getPlayerLogin());
        Team team = captainMembership.getTeam();
        
        if (!Boolean.TRUE.equals(team.getIsActive())) {
            throw new IllegalArgumentException("cannot add players to inactive team");
        }

        if (teamMemberRepository.existsByTeamAndPlayerAndLeftAtIsNull(team, newPlayer)) {
            throw new IllegalArgumentException("player is already in this team");
        }
        if (teamMemberRepository.findByPlayerAndLeftAtIsNull(newPlayer) != null) {
            throw new IllegalArgumentException("player already belongs to another team");
        }

        TeamMember teamMember = new TeamMember();
        teamMember.setPlayer(newPlayer);
        teamMember.setTeam(team);
        teamMember.setCaptain(false);
        teamMember.setRole(request.getRole());
        teamMember.setJoinedAt(OffsetDateTime.now());
        teamMemberRepository.save(teamMember);
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(String login) {
        Player player = player(login);
        TeamMember playerMembership = teamMemberRepository.findByPlayerAndLeftAtIsNull(player);
        
        if (playerMembership == null) {
            throw new IllegalArgumentException("you are not in any team");
        }
        
        Team team = playerMembership.getTeam();
        
        if (!Boolean.TRUE.equals(team.getIsActive())) {
            throw new IllegalArgumentException("team is no longer active");
        }
        
        List<TeamMember> members = teamMemberRepository.findAll().stream()
                .filter(m -> m.getTeam().getTeamId().equals(team.getTeamId()) && m.getLeftAt() == null)
                .toList();
        
        List<TeamMemberResponse> responses = new ArrayList<>();
        for (TeamMember member : members) {
            TeamMemberResponse response = new TeamMemberResponse();
            response.setMembershipId(member.getMembershipId());
            response.setPlayerLogin(member.getPlayer().getLogin());
            response.setPlayerNickname(member.getPlayer().getNickname());
            response.setIsCaptain(member.getCaptain());
            response.setRole(member.getRole());
            response.setJoinedAt(member.getJoinedAt().toString());
            responses.add(response);
        }
        
        return responses;
    }
    
    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembersByTeamId(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("team not found"));
        
        List<TeamMember> members = teamMemberRepository.findByTeamAndLeftAtIsNull(team);
        
        List<TeamMemberResponse> responses = new ArrayList<>();
        for (TeamMember member : members) {
            TeamMemberResponse response = new TeamMemberResponse();
            response.setMembershipId(member.getMembershipId());
            response.setPlayerLogin(member.getPlayer().getLogin());
            response.setPlayerNickname(member.getPlayer().getNickname());
            response.setIsCaptain(member.getCaptain());
            response.setRole(member.getRole());
            response.setJoinedAt(member.getJoinedAt().toString());
            responses.add(response);
        }
        
        return responses;
    }

    private Player player(String login) {
        return playerRepository.findByLogin(login)
                .orElseThrow(() -> new IllegalArgumentException("player not found"));
    }

    private TeamResponse toResponse(Team team) {
        TeamMember captainMembership = teamMemberRepository.findByTeamAndCaptainTrue(team);
        TeamResponse response = new TeamResponse();
        response.setTeamId(team.getTeamId());
        response.setName(team.getName());
        response.setTag(team.getTag());
        if (captainMembership != null && captainMembership.getPlayer() != null) {
            response.setCaptainLogin(captainMembership.getPlayer().getLogin());
            response.setCaptainNickname(captainMembership.getPlayer().getNickname());
        }
        return response;
    }
}
