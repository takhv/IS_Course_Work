package ru.itmo.lol.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.itmo.lol.dto.statistics.PlayerStatisticsResponse;
import ru.itmo.lol.entity.Player;
import ru.itmo.lol.entity.PlayerStatistics;
import ru.itmo.lol.repository.PlayerRepository;
import ru.itmo.lol.repository.PlayerStatisticsRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final PlayerRepository playerRepository;
    private final PlayerStatisticsRepository playerStatisticsRepository;

    @Transactional(readOnly = true)
    public List<PlayerStatistics> getPlayerStatistics(String login) {
        Player player = playerRepository.findByLogin(login)
                .orElseThrow(() -> new RuntimeException("player not found"));
        return playerStatisticsRepository.findByPlayer(player);
    }

    @Transactional(readOnly = true)
    public PlayerStatisticsResponse getAggregatedPlayerStatistics(String login) {
        Player player = playerRepository.findByLogin(login)
                .orElseThrow(() -> new RuntimeException("player not found"));

        List<PlayerStatistics> statsList = playerStatisticsRepository.findByPlayer(player);
        
        int totalGamesPlayed = 0;
        int totalWins = 0;
        int totalLoses = 0;
        int totalKills = 0;
        int totalDeaths = 0;
        int totalAssists = 0;

        for (PlayerStatistics stats : statsList) {
            totalGamesPlayed += stats.getGamesPlayed() != null ? stats.getGamesPlayed() : 0;
            totalWins += stats.getWins() != null ? stats.getWins() : 0;
            totalLoses += stats.getLoses() != null ? stats.getLoses() : 0;
            totalKills += stats.getKills() != null ? stats.getKills() : 0;
            totalDeaths += stats.getDeaths() != null ? stats.getDeaths() : 0;
            totalAssists += stats.getAssists() != null ? stats.getAssists() : 0;
        }

        double winRate = totalGamesPlayed > 0 ? (double) totalWins / totalGamesPlayed * 100 : 0.0;
        double averageKDA = totalDeaths > 0 ? (double) (totalKills + totalAssists) / totalDeaths : (double) (totalKills + totalAssists);

        return new PlayerStatisticsResponse(
            player.getLogin(),
            totalGamesPlayed,
            totalWins,
            totalLoses,
            winRate,
            totalKills,
            totalDeaths,
            totalAssists,
            averageKDA
        );
    }
}

