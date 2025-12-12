package ua.tqs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import ua.tqs.dto.PayPalCaptureDTO;
import ua.tqs.dto.PayPalOrderDTO;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.login.JwtAuthFilter;
import ua.tqs.login.JwtUtil;
import ua.tqs.service.PayPalService;
import ua.tqs.service.UserDetailsServiceImpl;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PayPalController.class)
@AutoConfigureMockMvc(addFilters = false)
class PayPalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PayPalService payPalService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    private PayPalOrderDTO sampleOrderDTO;
    private PayPalCaptureDTO sampleCaptureDTO;

    @BeforeEach
    void setUp() {
        sampleOrderDTO = PayPalOrderDTO.builder()
                .rentId(1L)
                .orderId("ORDER-123456")
                .status("CREATED")
                .amount(new BigDecimal("50.00"))
                .currency("EUR")
                .description("Tool rental payment - Rent #1")
                .approvalUrl("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-123456")
                .build();

        sampleCaptureDTO = PayPalCaptureDTO.builder()
                .orderId("ORDER-123456")
                .status("COMPLETED")
                .payerId("PAYER-123")
                .payerEmail("buyer@example.com")
                .amount(new BigDecimal("50.00"))
                .currency("EUR")
                .captureId("CAPTURE-789")
                .rentId(1L)
                .build();
    }

    @Test
    @DisplayName("POST /api/paypal/orders should create order successfully")
    @WithMockUser(username = "testuser")
    void createOrder_ShouldReturnCreatedOrder() throws Exception {
        // Arrange
        when(payPalService.createOrder(eq(1L), any(BigDecimal.class), eq("EUR"), anyString()))
                .thenReturn(sampleOrderDTO);

        // Act & Assert
        mockMvc.perform(post("/api/paypal/orders")
                        .with(csrf())
                        .param("rentId", "1")
                        .param("amount", "50.00")
                        .param("currency", "EUR")
                        .param("description", "Tool rental payment")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value("ORDER-123456"))
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andExpect(jsonPath("$.rentId").value(1))
                .andExpect(jsonPath("$.amount").value(50.00))
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.approvalUrl").exists());

        verify(payPalService).createOrder(eq(1L), any(BigDecimal.class), eq("EUR"), anyString());
    }

    @Test
    @DisplayName("POST /api/paypal/orders should use default currency when not provided")
    @WithMockUser(username = "testuser")
    void createOrder_WithDefaultCurrency_ShouldUseEUR() throws Exception {
        // Arrange
        when(payPalService.createOrder(eq(1L), any(BigDecimal.class), eq("EUR"), anyString()))
                .thenReturn(sampleOrderDTO);

        // Act & Assert
        mockMvc.perform(post("/api/paypal/orders")
                        .with(csrf())
                        .param("rentId", "1")
                        .param("amount", "50.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("EUR"));

        verify(payPalService).createOrder(eq(1L), any(BigDecimal.class), eq("EUR"), anyString());
    }

    @Test
    @DisplayName("POST /api/paypal/orders should return 404 when rent not found")
    @WithMockUser(username = "testuser")
    void createOrder_WhenRentNotFound_ShouldReturn404() throws Exception {
        // Arrange
        when(payPalService.createOrder(eq(999L), any(BigDecimal.class), anyString(), anyString()))
                .thenThrow(new ResourceNotFoundException("Rent not found"));

        // Act & Assert
        mockMvc.perform(post("/api/paypal/orders")
                        .with(csrf())
                        .param("rentId", "999")
                        .param("amount", "50.00")
                        .param("currency", "EUR")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/paypal/orders should return 400 when rent not approved")
    @WithMockUser(username = "testuser")
    void createOrder_WhenRentNotApproved_ShouldReturn400() throws Exception {
        // Arrange
        when(payPalService.createOrder(eq(1L), any(BigDecimal.class), anyString(), anyString()))
                .thenThrow(new IllegalArgumentException("Only approved rentals can be paid"));

        // Act & Assert
        mockMvc.perform(post("/api/paypal/orders")
                        .with(csrf())
                        .param("rentId", "1")
                        .param("amount", "50.00")
                        .param("currency", "EUR")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/paypal/orders/{orderId}/capture should capture order successfully")
    @WithMockUser(username = "testuser")
    void captureOrder_ShouldReturnCaptureDetails() throws Exception {
        // Arrange
        when(payPalService.captureOrder(eq("ORDER-123456"), eq(1L)))
                .thenReturn(sampleCaptureDTO);

        // Act & Assert
        mockMvc.perform(post("/api/paypal/orders/ORDER-123456/capture")
                        .with(csrf())
                        .param("rentId", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value("ORDER-123456"))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.payerId").value("PAYER-123"))
                .andExpect(jsonPath("$.payerEmail").value("buyer@example.com"))
                .andExpect(jsonPath("$.captureId").value("CAPTURE-789"))
                .andExpect(jsonPath("$.amount").value(50.00))
                .andExpect(jsonPath("$.rentId").value(1));

        verify(payPalService).captureOrder("ORDER-123456", 1L);
    }

    @Test
    @DisplayName("GET /api/paypal/orders/{orderId} should return order details")
    @WithMockUser(username = "testuser")
    void getOrderDetails_ShouldReturnOrderInfo() throws Exception {
        // Arrange
        PayPalOrderDTO orderDetails = PayPalOrderDTO.builder()
                .orderId("ORDER-123456")
                .status("APPROVED")
                .amount(new BigDecimal("75.00"))
                .currency("EUR")
                .build();

        when(payPalService.getOrderDetails("ORDER-123456"))
                .thenReturn(orderDetails);

        // Act & Assert
        mockMvc.perform(get("/api/paypal/orders/ORDER-123456")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value("ORDER-123456"))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.amount").value(75.00))
                .andExpect(jsonPath("$.currency").value("EUR"));

        verify(payPalService).getOrderDetails("ORDER-123456");
    }
    
    // Note: Authentication tests are covered by Cucumber integration tests
    // since @WebMvcTest with addFilters=false disables the security filter chain
}
