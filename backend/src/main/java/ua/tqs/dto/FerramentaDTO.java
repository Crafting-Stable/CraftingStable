// java
package ua.tqs.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.Ferramenta;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FerramentaDTO {

    private Long id;

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "Tipo é obrigatório")
    private String tipo;

    @NotNull(message = "Preço diário é obrigatório")
    @DecimalMin(value = "0.0", inclusive = false, message = "Preço diário deve ser maior que 0")
    private BigDecimal precoDiario;

    @NotNull(message = "Valor do depósito é obrigatório")
    @DecimalMin(value = "0.0", inclusive = true, message = "Valor do depósito deve ser >= 0")
    private BigDecimal valorDeposito;

    private String descricao;

    private String localizacao;

    @NotNull
    private Boolean disponivel;

    private String imagemUrl;

    private Long ownerId;

    public static FerramentaDTO fromModel(Ferramenta f) {
        if (f == null) return null;
        return FerramentaDTO.builder()
                .id(f.getId())
                .nome(f.getNome())
                .tipo(f.getTipo())
                .precoDiario(f.getPrecoDiario())
                .valorDeposito(f.getValorDeposito())
                .descricao(f.getDescricao())
                .localizacao(f.getLocalizacao())
                .disponivel(f.getDisponivel())
                .imagemUrl(f.getImagemUrl())
                .ownerId(f.getOwnerId())
                .build();
    }

    public Ferramenta toModel() {
        return Ferramenta.builder()
                .id(this.id)
                .nome(this.nome)
                .tipo(this.tipo)
                .precoDiario(this.precoDiario)
                .valorDeposito(this.valorDeposito)
                .descricao(this.descricao)
                .localizacao(this.localizacao)
                .disponivel(this.disponivel != null ? this.disponivel : Boolean.TRUE)
                .imagemUrl(this.imagemUrl)
                .ownerId(this.ownerId)
                .build();
    }
}
