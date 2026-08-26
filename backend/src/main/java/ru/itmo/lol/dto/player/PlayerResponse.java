package ru.itmo.lol.dto.player;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerResponse {
    private Long id;
    private String login;
    private String nickname;
    private String email;
}
