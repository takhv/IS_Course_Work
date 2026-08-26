package ru.itmo.lol.dto.tournament;

import lombok.Data;
import java.util.Map;

@Data
public class MatchResultRequest {
    private Long winnerTeamId;
    private Integer durationMinutes;
    private Integer teamAScore;
    private Integer teamBScore;
    private Map<String, PlayerKdaData> playerStats;
    
    @Data
    public static class PlayerKdaData {
        private Integer kills;
        private Integer deaths;
        private Integer assists;
    }
}
