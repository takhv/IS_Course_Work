package ru.itmo.lol.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.RequiredArgsConstructor;
import ru.itmo.lol.dto.player.CreatePlayerRequest;
import ru.itmo.lol.dto.player.PlayerResponse;
import ru.itmo.lol.dto.player.UpdatePlayerRequest;
import ru.itmo.lol.dto.player.ChangePasswordRequest;
import ru.itmo.lol.entity.Player;
import ru.itmo.lol.repository.PlayerRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void createPlayer(String login, CreatePlayerRequest request) {
        if (login == null || login.isBlank()) {
            throw new IllegalArgumentException("login cannot be empty");
        }
        if (request.getNickname() == null || request.getNickname().isBlank()) {
            throw new IllegalArgumentException("nickname cannot be empty");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("email cannot be empty");
        }

        if (playerRepository.existsByLogin(login)) {
            throw new IllegalArgumentException("player already exists with this login: " + login);
        }

        Player player = new Player();
        player.setLogin(login);
        player.setPasswordHash("${app.jwt.secret}");
        player.setNickname(request.getNickname());
        player.setEmail(request.getEmail());
        player.setCreatedAt(OffsetDateTime.now());

        playerRepository.save(player);
    }

    @Transactional(readOnly = true)
    public PlayerResponse getPlayer(String login) {
        Player player = player(login);
        return toResponse(player);
    }

    @Transactional
    public PlayerResponse updatePlayer(String login, UpdatePlayerRequest request) {
        Player player = player(login);

        if (request.getNickname() != null && !request.getNickname().isBlank()) {
            player.setNickname(request.getNickname());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            player.setEmail(request.getEmail());
        }

        playerRepository.save(player);
        return toResponse(player);
    }

    @Transactional
    public void deletePlayer(String login) {
        Player player = player(login);
        playerRepository.delete(player);
    }

    @Transactional
    public void changePassword(String login, ChangePasswordRequest request) {
        if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
            throw new IllegalArgumentException("old password cannot be empty");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("new password cannot be empty");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("passwords do not match");
        }
        if (request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("password must be at least 6 characters");
        }

        Player player = player(login);

        if (!passwordEncoder.matches(request.getOldPassword(), player.getPasswordHash())) {
            throw new IllegalArgumentException("old password is incorrect");
        }

        player.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        playerRepository.save(player);
    }

    private Player player(String login) {
        return playerRepository.findByLogin(login)
                .orElseThrow(() -> new IllegalArgumentException("player not found with login: " + login));
    }

    private PlayerResponse toResponse(Player player) {
        PlayerResponse response = new PlayerResponse();
        response.setId(player.getPlayerId());
        response.setLogin(player.getLogin());
        response.setNickname(player.getNickname());
        response.setEmail(player.getEmail());
        return response;
    }

    @Transactional(readOnly = true)
    public List<PlayerResponse> getPlayers() {
        return playerRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
