package ru.itmo.lol.dto.team;

import lombok.Data;

@Data
public class TeamMemberResponse {
    private Long membershipId;
    private String playerLogin;
    private String playerNickname;
    private Boolean isCaptain;
    private String role;
    private String joinedAt;
}
