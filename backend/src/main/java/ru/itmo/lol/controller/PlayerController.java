package ru.itmo.lol.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import ru.itmo.lol.dto.player.CreatePlayerRequest;
import ru.itmo.lol.dto.player.PlayerResponse;
import ru.itmo.lol.dto.player.UpdatePlayerRequest;
import ru.itmo.lol.dto.player.ChangePasswordRequest;
import ru.itmo.lol.service.PlayerService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    private String getCurrentLogin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new IllegalArgumentException("player not authenticated");
    }

    @PostMapping("/player")
    public ResponseEntity<Void> createPlayer(@RequestBody CreatePlayerRequest request) {
        String login = getCurrentLogin();
        playerService.createPlayer(login, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/player")
    public PlayerResponse getPlayer() {
        String login = getCurrentLogin();
        return playerService.getPlayer(login);
    }

    @PutMapping("/player")
    public PlayerResponse updatePlayer(@RequestBody @Valid UpdatePlayerRequest request) {
        String login = getCurrentLogin();
        return playerService.updatePlayer(login, request);
    }

    @DeleteMapping("/player")
    public ResponseEntity<Void> deletePlayer() {
        String login = getCurrentLogin();
        playerService.deletePlayer(login);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/player/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordRequest request) {
        String login = getCurrentLogin();
        playerService.changePassword(login, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/players")
    public List<PlayerResponse> getAllPlayers() {
        return playerService.getPlayers();
    }
}

