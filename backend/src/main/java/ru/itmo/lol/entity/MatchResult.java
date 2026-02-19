package ru.itmo.lol.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "match_result")
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long matchResultId;

    @OneToOne
    @JoinColumn(name = "match_id", nullable = false, unique = true)
    private Match match;

    @ManyToOne
    @JoinColumn(name = "winner_team_id", nullable = false)
    private Team winner;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "team_a_score", nullable = false)
    private Integer teamAScore;

    @Column(name = "team_b_score", nullable = false)
    private Integer teamBScore;
}

