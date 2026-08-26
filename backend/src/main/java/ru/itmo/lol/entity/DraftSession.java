package ru.itmo.lol.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "draft_session")
public class DraftSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sessionId;

    @ManyToOne
    @JoinColumn(name = "match_id", nullable = false, unique = true)
    private Match match;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "team_a_joined")
    private Boolean teamAJoined = false;

    @Column(name = "team_b_joined")
    private Boolean teamBJoined = false;

    @Column(name = "current_turn")
    private String currentTurn;

    @Column(name = "current_phase")
    private String currentPhase;

    @Column(name = "phase_number")
    private Integer phaseNumber = 0;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
