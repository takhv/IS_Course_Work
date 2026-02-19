package ru.itmo.lol.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStatisticsResponse {
    private String playerLogin;
    private Integer gamesPlayed;
    private Integer gamesWon;
    private Integer gamesLost;
    private Double winRate;
    private Integer totalKills;
    private Integer totalDeaths;
    private Integer totalAssists;
    private Double averageKDA;
}
