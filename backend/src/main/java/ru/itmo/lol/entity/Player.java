package ru.itmo.lol.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.OffsetDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "player")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long playerId;

    @Column(nullable = false, unique = true, length = 64)
    private String login;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 64)
    private String nickname;

    @Column(nullable = false, unique = true, length = 128)
    private String email;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
