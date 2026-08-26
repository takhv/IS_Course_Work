package ru.itmo.lol.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.itmo.lol.entity.Rules;

@Repository
public interface RulesRepository extends JpaRepository<Rules, Long> {

}
