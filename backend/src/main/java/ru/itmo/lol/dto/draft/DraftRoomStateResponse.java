package ru.itmo.lol.dto.draft;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DraftRoomStateResponse {
    private Long sessionId;
    private Long matchId;
    private String status;
    private TeamInfo teamA;
    private TeamInfo teamB;
    private String currentTurn;
    private String currentPhase;
    private Integer phaseNumber;
    private List<DraftActionInfo> actions;
    private OffsetDateTime startedAt;
    private String message;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamInfo {
        private Long teamId;
        private String teamName;
        private Boolean joined;
        private String captainLogin;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DraftActionInfo {
        private String side;
        private String actionType;
        private Long championId;
        private String championName;
        private Integer orderNumber;
    }
}
