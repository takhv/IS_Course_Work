package ru.itmo.lol.dto.draft;

public record DraftJoinRequest(
        Long matchId,
        String playerLogin
) {}
