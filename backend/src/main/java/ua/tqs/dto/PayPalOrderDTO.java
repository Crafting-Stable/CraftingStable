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
public class PayPalOrderDTO {
    
    private Long rentId;
    private BigDecimal amount;
    private String currency;
    private String description;
    
    // Response fields
    private String orderId;
    private String status;
    private String approvalUrl;
}
