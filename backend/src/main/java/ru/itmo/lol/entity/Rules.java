package ru.itmo.lol.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "tournament_rules")
public class Rules {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rulesId;

    @OneToOne
    @JoinColumn(name = "tournament_id", nullable = false, unique = true)
    private Tournament tournament;

    @Column(name = "min_players_per_team", nullable = false)
    private Integer minPlayersPerTeam;

    @Column(name = "max_players_per_team", nullable = false)
    private Integer maxPlayersPerTeam;

    @Column(name = "max_teams")
    private Integer maxTeams;

    @Column(name = "draft_type", nullable = false, length = 32)
    private String draftType;

    @Column(name = "additional_rules")
    private String additionalRules;
}
