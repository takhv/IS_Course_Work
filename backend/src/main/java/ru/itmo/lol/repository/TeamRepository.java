package ru.itmo.lol.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.itmo.lol.entity.Team;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    boolean existsByTag(String tag);
    
    boolean existsByTagAndIsActiveTrue(String tag);
    
    boolean existsByNameAndIsActiveTrue(String name);
}
