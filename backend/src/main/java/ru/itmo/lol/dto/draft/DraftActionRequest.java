package ru.itmo.lol.dto.draft;

public record DraftActionRequest(
        Long matchId,
        String playerLogin,
        String championName,
        String actionType
) {}
