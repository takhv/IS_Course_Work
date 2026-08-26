package ru.itmo.lol.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "login cannot be empty")
    private String login;
    
    @NotBlank(message = "password cannot be empty")
    private String password;
}
