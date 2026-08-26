package ru.itmo.lol.dto.team;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeamResponse {
    private Long teamId;
    private String name;
    private String tag;
    private String captainLogin;
    private String captainNickname;
}
