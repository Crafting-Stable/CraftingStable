package ua.tqs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private String role;

    @JsonProperty("id")
    private Long userId;

    private String name;
    private String email;
}