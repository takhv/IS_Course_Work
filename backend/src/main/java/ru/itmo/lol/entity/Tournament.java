package ru.itmo.lol.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "tournament")
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tournamentId;

    @Column(nullable = false, length = 128)
    private String name;

    @Column
    private String description;

    @Column(name = "start_date", nullable = false)
    private OffsetDateTime startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false, length = 64)
    private String format;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "creator_login", nullable = false, length = 64)
    private String creatorLogin;
}
