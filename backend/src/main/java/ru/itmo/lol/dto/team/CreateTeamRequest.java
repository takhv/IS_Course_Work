package ru.itmo.lol.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTeamRequest {
    @NotBlank(message = "team name cannot be empty")
    @Size(min = 2, max = 128, message = "team name must be between 2 and 128 characters")
    private String name;
    
    @NotBlank(message = "team tag cannot be empty")
    @Size(min = 2, max = 16, message = "team tag must be between 2 and 16 characters")
    private String tag;
    
    @Size(max = 32, message = "role must be up to 32 characters")
    private String captainRole;
}
