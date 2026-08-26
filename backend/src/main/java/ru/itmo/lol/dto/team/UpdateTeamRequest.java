package ru.itmo.lol.dto.team;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTeamRequest {
    @Size(min = 2, max = 128, message = "team name must be between 2 and 128 characters")
    private String name;
    
    @Size(min = 2, max = 16, message = "team tag must be between 2 and 16 characters")
    private String tag;
}
