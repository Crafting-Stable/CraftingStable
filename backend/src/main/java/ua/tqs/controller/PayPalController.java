package ua.tqs.controller;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ua.tqs.dto.PayPalCaptureDTO;
import ua.tqs.dto.PayPalOrderDTO;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.service.PayPalService;

@RestController
@RequestMapping("/api/paypal")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "PayPal", description = "PayPal payment integration endpoints")
public class PayPalController {

    private final PayPalService payPalService;

    @PostMapping("/orders")
    @Operation(summary = "Create a PayPal order", description = "Creates a new PayPal order for rental payment")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
            @ApiResponse(responseCode = "404", description = "Rent not found"),
            @ApiResponse(responseCode = "500", description = "PayPal API error")
    })
    public ResponseEntity<PayPalOrderDTO> createOrder(
            @Parameter(description = "Rent ID") @RequestParam Long rentId,
            @Parameter(description = "Payment amount") @RequestParam BigDecimal amount,
            @Parameter(description = "Currency code (e.g., EUR, USD)") @RequestParam(defaultValue = "EUR") String currency,
            @Parameter(description = "Payment description") @RequestParam(required = false) String description) {
        
        log.info("Creating PayPal order - rentId: {}, amount: {} {}", rentId, amount, currency);
        
        String desc = description != null ? description : "Tool rental payment - Rent #" + rentId;
        PayPalOrderDTO order = payPalService.createOrder(rentId, amount, currency, desc);
        
        return ResponseEntity.ok(order);
    }

    @PostMapping("/orders/{orderId}/capture")
    @Operation(summary = "Capture a PayPal order", description = "Captures payment for an approved PayPal order")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment captured successfully"),
            @ApiResponse(responseCode = "400", description = "Order cannot be captured"),
            @ApiResponse(responseCode = "404", description = "Order not found"),
            @ApiResponse(responseCode = "500", description = "PayPal API error")
    })
    public ResponseEntity<PayPalCaptureDTO> captureOrder(
            @Parameter(description = "PayPal order ID") @PathVariable String orderId,
            @Parameter(description = "Rent ID") @RequestParam Long rentId) {
        
        log.info("Capturing PayPal order: {} for rentId: {}", orderId, rentId);
        
        PayPalCaptureDTO capture = payPalService.captureOrder(orderId, rentId);
        
        return ResponseEntity.ok(capture);
    }

    @GetMapping("/orders/{orderId}")
    @Operation(summary = "Get order details", description = "Retrieves details of a PayPal order")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order details retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Order not found"),
            @ApiResponse(responseCode = "500", description = "PayPal API error")
    })
    public ResponseEntity<PayPalOrderDTO> getOrderDetails(
            @Parameter(description = "PayPal order ID") @PathVariable String orderId) {
        
        log.info("Getting PayPal order details: {}", orderId);
        
        PayPalOrderDTO order = payPalService.getOrderDetails(orderId);
        
        return ResponseEntity.ok(order);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }
}
