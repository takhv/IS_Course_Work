package ru.itmo.lol.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddTeamMemberRequest {
    @NotBlank(message = "player login cannot be empty")
    @Size(min = 2, max = 64, message = "player login must be between 2 and 64 characters")
    private String playerLogin;

    @Size(max = 32, message = "role must be up to 32 characters")
    private String role;
}
