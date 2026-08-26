package ru.itmo.lol.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.itmo.lol.entity.Draft;

import java.util.List;

@Repository
public interface DraftRepository extends JpaRepository<Draft, Long> {
    List<Draft> findByMatch_MatchIdOrderByOrderNumber(Long matchId);

    @Query("SELECT COUNT(d) > 0 FROM Draft d WHERE d.match.matchId = :matchId AND d.champion.championId = :championId")
    boolean isChampionAlreadyUsed(@Param("matchId") Long matchId, @Param("championId") Long championId);

    @Query("SELECT d.champion.championId FROM Draft d WHERE d.match.matchId = :matchId")
    List<Long> getUsedChampionIds(@Param("matchId") Long matchId);
}
