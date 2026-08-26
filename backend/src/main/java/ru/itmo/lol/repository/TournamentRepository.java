package ru.itmo.lol.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.itmo.lol.entity.Tournament;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
}

