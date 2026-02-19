package ru.itmo.lol.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.itmo.lol.entity.TournamentRegistration;

@Repository
public interface TournamentRegistrationRepository
        extends JpaRepository<TournamentRegistration, Long> {
}
