package ru.itmo.lol.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.itmo.lol.entity.Player;
import ru.itmo.lol.entity.Team;
import ru.itmo.lol.entity.TeamMember;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    TeamMember findByPlayer(Player player);

    TeamMember findByTeamAndCaptainTrue(Team team);

    TeamMember findByPlayerAndCaptainTrueAndLeftAtIsNull(Player player);

    TeamMember findByPlayerAndLeftAtIsNull(Player player);
    
    TeamMember findByPlayerAndTeamAndCaptainTrue(Player player, Team team);

    boolean existsByTeamAndPlayerAndLeftAtIsNull(Team team, Player player);
    
    List<TeamMember> findByTeamAndLeftAtIsNull(Team team);

}
