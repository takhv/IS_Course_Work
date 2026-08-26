package ru.itmo.lol.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ru.itmo.lol.dto.statistics.PlayerStatisticsResponse;
import ru.itmo.lol.service.StatisticsService;


@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/player")
    public PlayerStatisticsResponse getPlayerStatistics(@RequestParam String login) {
        return statisticsService.getAggregatedPlayerStatistics(login);
    }
}
