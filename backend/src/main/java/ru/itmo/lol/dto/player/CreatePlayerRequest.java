package ru.itmo.lol.dto.player;

import lombok.Data;

@Data
public class CreatePlayerRequest {
    private String nickname;
    private String email;
}
