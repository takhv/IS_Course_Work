package ru.itmo.lol.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.lol.entity.Champion;
import ru.itmo.lol.repository.ChampionRepository;

import java.util.List;

@RestController
@RequestMapping("/api/champions")
@RequiredArgsConstructor
public class ChampionController {

    private final ChampionRepository championRepository;

    @GetMapping
    public ResponseEntity<List<Champion>> getAllChampions() {
        return ResponseEntity.ok(championRepository.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Champion>> searchChampions(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(championRepository.findAll());
        }
        
        List<Champion> champions = championRepository.findAll()
                .stream()
                .filter(c -> c.getName().toLowerCase().contains(query.toLowerCase()))
                .toList();
        return ResponseEntity.ok(champions);
    }
}
