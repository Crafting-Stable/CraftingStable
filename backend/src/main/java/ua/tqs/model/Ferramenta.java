package ua.tqs.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "ferramentas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ferramenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    @Column(nullable = false)
    private String nome;

    @NotBlank(message = "Tipo é obrigatório")
    private String tipo; // "motosserra", "corta-relvas", etc.

    @NotNull(message = "Preço diário é obrigatório")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal precoDiario;

    @NotNull
    @DecimalMin(value = "0.0")
    private BigDecimal valorDeposito;

    private String descricao;

    private String localizacao;

    @Column(nullable = false)
    private Boolean disponivel = true;

    private String imagemUrl;

    // Owner ID virá depois quando implementares User
    private Long ownerId;
}