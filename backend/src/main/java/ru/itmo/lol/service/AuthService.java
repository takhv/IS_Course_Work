package ru.itmo.lol.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.lol.dto.auth.AuthResponse;
import ru.itmo.lol.dto.auth.LoginRequest;
import ru.itmo.lol.dto.auth.RegisterRequest;
import ru.itmo.lol.entity.Player;
import ru.itmo.lol.repository.PlayerRepository;
import ru.itmo.lol.security.JwtTokenProvider;

import java.time.OffsetDateTime;


@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (playerRepository.existsByLogin(request.getLogin())) {
            throw new IllegalArgumentException("player already exists with this login");
        }

        if (playerRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("email already in use");
        }

        Player player = new Player();
        player.setLogin(request.getLogin());
        player.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        player.setNickname(request.getNickname());
        player.setEmail(request.getEmail());
        player.setCreatedAt(OffsetDateTime.now());

        playerRepository.save(player);

        String token = tokenProvider.generateToken(player.getLogin());

        return new AuthResponse(token, player.getLogin(), player.getNickname());
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getLogin(),
                    request.getPassword()
                )
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("invalid login or password");
        }

        Player player = playerRepository.findByLogin(request.getLogin())
                .orElseThrow(() -> new IllegalArgumentException("player not found"));
        String token = tokenProvider.generateToken(player.getLogin());

        return new AuthResponse(token, player.getLogin(), player.getNickname());
    }
}
