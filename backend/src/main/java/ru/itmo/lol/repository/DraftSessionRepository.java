package ru.itmo.lol.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.itmo.lol.entity.DraftSession;
import ru.itmo.lol.entity.Match;

import java.util.Optional;

@Repository
public interface DraftSessionRepository extends JpaRepository<DraftSession, Long> {
    Optional<DraftSession> findByMatch(Match match);
    Optional<DraftSession> findByMatch_MatchId(Long matchId);
}
