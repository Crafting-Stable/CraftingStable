package ua.tqs.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayPalCaptureDTO {
    
    private String orderId;
    private String status;
    private String payerId;
    private String payerEmail;
    private BigDecimal amount;
    private String currency;
    private String captureId;
    private Long rentId;
}
