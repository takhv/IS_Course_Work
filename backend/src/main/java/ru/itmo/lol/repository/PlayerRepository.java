package ru.itmo.lol.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.itmo.lol.entity.Player;

import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    boolean existsByLogin(String login);

    boolean existsByEmail(String email);

    Optional<Player> findByLogin(String login);
}
