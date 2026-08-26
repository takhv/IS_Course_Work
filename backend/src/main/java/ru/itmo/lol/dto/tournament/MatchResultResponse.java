package ru.itmo.lol.dto.tournament;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchResultResponse {
    private Long matchResultId;
    private Long matchId;
    private Long winnerTeamId;
    private Integer durationMinutes;
    private Integer teamAScore;
    private Integer teamBScore;
    
    private Long nextMatchId;
    
    private Long championTeamId;
    
    private String tournamentStatus;
}
