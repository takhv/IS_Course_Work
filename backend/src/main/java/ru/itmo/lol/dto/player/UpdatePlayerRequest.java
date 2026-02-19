package ru.itmo.lol.dto.player;

import lombok.Data;

@Data
public class UpdatePlayerRequest {
    private String nickname;
    private String email;
}
