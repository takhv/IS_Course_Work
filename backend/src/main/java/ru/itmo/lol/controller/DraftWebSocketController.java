package ru.itmo.lol.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import ru.itmo.lol.dto.draft.DraftActionRequest;
import ru.itmo.lol.dto.draft.DraftJoinRequest;
import ru.itmo.lol.dto.draft.DraftRoomStateResponse;
import ru.itmo.lol.entity.Draft;
import ru.itmo.lol.entity.DraftSession;
import ru.itmo.lol.service.DraftRoomService;

@Controller
@RequiredArgsConstructor
public class DraftWebSocketController {

    private final DraftRoomService draftRoomService;

    @MessageMapping("/draft/{matchId}/join")
    @SendTo("/topic/draft/{matchId}")
    public DraftRoomStateResponse joinDraft(@DestinationVariable Long matchId, DraftJoinRequest request) {
        try {
            draftRoomService.joinDraft(matchId, request.playerLogin());
            return draftRoomService.getDraftState(matchId);
        } catch (Exception e) {
            DraftRoomStateResponse error = new DraftRoomStateResponse();
            error.setMessage("error: " + e.getMessage());
            return error;
        }
    }

    @MessageMapping("/draft/{matchId}/action")
    @SendTo("/topic/draft/{matchId}")
    public DraftRoomStateResponse performAction(@DestinationVariable Long matchId, DraftActionRequest request) {
        try {
            Draft draft = draftRoomService.performDraftAction(
                matchId,
                request.playerLogin(),
                request.championName(),
                request.actionType()
            );

            DraftRoomStateResponse state = draftRoomService.getDraftState(matchId);
            state.setMessage("action performed: " + request.actionType() + " champion " + draft.getChampion().getName());
            return state;
        } catch (Exception e) {
            DraftRoomStateResponse error = draftRoomService.getDraftState(matchId);
            error.setMessage("error: " + e.getMessage());
            return error;
        }
    }
}

@RestController
@RequestMapping("/api/draft-room")
@RequiredArgsConstructor
class DraftRoomRestController {

    private final DraftRoomService draftRoomService;

    @GetMapping("/{matchId}/state")
    public DraftRoomStateResponse getDraftState(@PathVariable Long matchId) {
        return draftRoomService.getDraftState(matchId);
    }

    @GetMapping("/{matchId}/summary")
    public DraftRoomStateResponse getDraftSummary(@PathVariable Long matchId) {
        return draftRoomService.getDraftSummary(matchId);
    }

    @GetMapping("/{matchId}/available")
    public boolean isDraftAvailable(@PathVariable Long matchId) {
        return draftRoomService.isDraftAvailable(matchId);
    }

    @PostMapping("/{matchId}/create")
    public DraftSession createDraftSession(@PathVariable Long matchId) {
        return draftRoomService.getOrCreateDraftSession(matchId);
    }

    @GetMapping("/{matchId}/used-champions")
    public java.util.List<Long> getUsedChampionIds(@PathVariable Long matchId) {
        return draftRoomService.getUsedChampionIds(matchId);
    }
}
