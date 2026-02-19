package ru.itmo.lol.dto.tournament;

import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTournamentRequest {
    @NotBlank(message = "tournament name cannot be empty")
    @Size(min = 2, max = 128, message = "tournament name must be between 2 and 128 characters")
    private String name;

    private String description;
    private String status;
}
