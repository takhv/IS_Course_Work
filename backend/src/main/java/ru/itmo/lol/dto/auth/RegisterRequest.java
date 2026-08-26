package ru.itmo.lol.dto.auth;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "login cannot be empty")
    @Size(min = 3, max = 64, message = "login must be between 3 and 64 characters")
    private String login;
    
    @NotBlank(message = "password cannot be empty")
    @Size(min = 6, max = 255, message = "password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "nickname cannot be empty")
    @Size(min = 2, max = 64, message = "nickname must be between 2 and 64 characters")
    private String nickname;
    
    @NotBlank(message = "email cannot be empty")
    @Email(message = "email must be valid")
    @Size(max = 128, message = "email must not exceed 128 characters")
    private String email;
}
