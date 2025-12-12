package ua.tqs.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import ua.tqs.dto.PayPalCaptureDTO;
import ua.tqs.dto.PayPalOrderDTO;
import ua.tqs.enums.RentStatus;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Rent;
import ua.tqs.repository.RentRepository;

@ExtendWith(MockitoExtension.class)
class PayPalServiceTest {

    @Mock
    private RentRepository rentRepository;

    @Mock
    private RestTemplate restTemplate;

    private PayPalService payPalService;
    private ObjectMapper objectMapper;

    private static final String CLIENT_ID = "test-client-id";
    private static final String CLIENT_SECRET = "test-client-secret";
    private static final String BASE_URL = "https://api-m.sandbox.paypal.com";
    private static final String RETURN_URL = "http://localhost:5173/payment/success";
    private static final String CANCEL_URL = "http://localhost:5173/payment/cancel";

    @BeforeEach
    void setUp() {
        payPalService = new PayPalService(rentRepository);
        objectMapper = new ObjectMapper();
        
        // Inject RestTemplate mock
        ReflectionTestUtils.setField(payPalService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(payPalService, "clientId", CLIENT_ID);
        ReflectionTestUtils.setField(payPalService, "clientSecret", CLIENT_SECRET);
        ReflectionTestUtils.setField(payPalService, "baseUrl", BASE_URL);
        ReflectionTestUtils.setField(payPalService, "returnUrl", RETURN_URL);
        ReflectionTestUtils.setField(payPalService, "cancelUrl", CANCEL_URL);
    }

    @Test
    @DisplayName("createOrder should create order successfully when rent is approved")
    void createOrder_WhenRentApproved_ShouldCreateOrder() throws Exception {
        // Arrange
        Long rentId = 1L;
        BigDecimal amount = new BigDecimal("50.00");
        String currency = "EUR";
        String description = "Tool rental payment";

        Rent rent = Rent.builder()
                .id(rentId)
                .toolId(1L)
                .userId(1L)
                .status(RentStatus.APPROVED)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(3))
                .build();

        when(rentRepository.findById(rentId)).thenReturn(Optional.of(rent));

        // Mock OAuth token response
        String tokenResponse = "{\"access_token\": \"test-access-token\", \"token_type\": \"Bearer\"}";
        when(restTemplate.exchange(
                eq(BASE_URL + "/v1/oauth2/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(tokenResponse, HttpStatus.OK));

        // Mock order creation response
        String orderResponse = """
            {
                "id": "ORDER-123456",
                "status": "CREATED",
                "links": [
                    {"rel": "approve", "href": "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-123456"}
                ]
            }
            """;
        when(restTemplate.exchange(
                eq(BASE_URL + "/v2/checkout/orders"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(orderResponse, HttpStatus.CREATED));

        // Act
        PayPalOrderDTO result = payPalService.createOrder(rentId, amount, currency, description);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getOrderId()).isEqualTo("ORDER-123456");
        assertThat(result.getStatus()).isEqualTo("CREATED");
        assertThat(result.getRentId()).isEqualTo(rentId);
        assertThat(result.getAmount()).isEqualByComparingTo(amount);
        assertThat(result.getCurrency()).isEqualTo(currency);
        assertThat(result.getApprovalUrl()).contains("sandbox.paypal.com");

        verify(rentRepository).findById(rentId);
    }

    @Test
    @DisplayName("createOrder should throw exception when rent not found")
    void createOrder_WhenRentNotFound_ShouldThrowException() {
        // Arrange
        Long rentId = 999L;
        when(rentRepository.findById(rentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> 
            payPalService.createOrder(rentId, new BigDecimal("50.00"), "EUR", "Test")
        )
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Rent not found");

        verify(rentRepository).findById(rentId);
    }

    @Test
    @DisplayName("createOrder should throw exception when rent is not approved")
    void createOrder_WhenRentNotApproved_ShouldThrowException() {
        // Arrange
        Long rentId = 1L;
        Rent rent = Rent.builder()
                .id(rentId)
                .status(RentStatus.PENDING)
                .build();

        when(rentRepository.findById(rentId)).thenReturn(Optional.of(rent));

        // Act & Assert
        assertThatThrownBy(() -> 
            payPalService.createOrder(rentId, new BigDecimal("50.00"), "EUR", "Test")
        )
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Only approved rentals can be paid");

        verify(rentRepository).findById(rentId);
    }

    @Test
    @DisplayName("createOrder should create order successfully when rentId is 0 (pay-first flow)")
    void createOrder_WhenRentIdIsZero_ShouldCreateOrderWithoutRentValidation() throws Exception {
        // Arrange - rentId=0 means "pay first" flow, rent will be created after payment
        Long rentId = 0L;
        BigDecimal amount = new BigDecimal("75.00");
        String currency = "EUR";
        String description = "Tool rental payment - New rental";

        // Mock OAuth token response
        String tokenResponse = "{\"access_token\": \"test-access-token\", \"token_type\": \"Bearer\"}";
        when(restTemplate.exchange(
                eq(BASE_URL + "/v1/oauth2/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(tokenResponse, HttpStatus.OK));

        // Mock order creation response
        String orderResponse = """
            {
                "id": "ORDER-789012",
                "status": "CREATED",
                "links": [
                    {"rel": "approve", "href": "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-789012"}
                ]
            }
            """;
        when(restTemplate.exchange(
                eq(BASE_URL + "/v2/checkout/orders"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(orderResponse, HttpStatus.CREATED));

        // Act
        PayPalOrderDTO result = payPalService.createOrder(rentId, amount, currency, description);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getOrderId()).isEqualTo("ORDER-789012");
        assertThat(result.getStatus()).isEqualTo("CREATED");
        assertThat(result.getRentId()).isEqualTo(rentId);
        assertThat(result.getAmount()).isEqualByComparingTo(amount);
        assertThat(result.getCurrency()).isEqualTo(currency);
        assertThat(result.getApprovalUrl()).contains("sandbox.paypal.com");

        // Verify no rent lookup was performed
        verify(rentRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("captureOrder should capture order and update rent status")
    void captureOrder_WhenOrderApproved_ShouldCaptureAndUpdateRent() throws Exception {
        // Arrange
        String orderId = "ORDER-123456";
        Long rentId = 1L;

        Rent rent = Rent.builder()
                .id(rentId)
                .status(RentStatus.APPROVED)
                .build();

        when(rentRepository.findById(rentId)).thenReturn(Optional.of(rent));
        when(rentRepository.save(any(Rent.class))).thenReturn(rent);

        // Mock OAuth token response
        String tokenResponse = "{\"access_token\": \"test-access-token\", \"token_type\": \"Bearer\"}";
        when(restTemplate.exchange(
                eq(BASE_URL + "/v1/oauth2/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(tokenResponse, HttpStatus.OK));

        // Mock capture response
        String captureResponse = """
            {
                "id": "ORDER-123456",
                "status": "COMPLETED",
                "payer": {
                    "payer_id": "PAYER-123",
                    "email_address": "buyer@example.com"
                },
                "purchase_units": [{
                    "payments": {
                        "captures": [{
                            "id": "CAPTURE-789",
                            "amount": {
                                "currency_code": "EUR",
                                "value": "50.00"
                            }
                        }]
                    }
                }]
            }
            """;
        when(restTemplate.exchange(
                eq(BASE_URL + "/v2/checkout/orders/" + orderId + "/capture"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(captureResponse, HttpStatus.OK));

        // Act
        PayPalCaptureDTO result = payPalService.captureOrder(orderId, rentId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getOrderId()).isEqualTo(orderId);
        assertThat(result.getStatus()).isEqualTo("COMPLETED");
        assertThat(result.getPayerId()).isEqualTo("PAYER-123");
        assertThat(result.getPayerEmail()).isEqualTo("buyer@example.com");
        assertThat(result.getCaptureId()).isEqualTo("CAPTURE-789");
        assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(result.getCurrency()).isEqualTo("EUR");
        assertThat(result.getRentId()).isEqualTo(rentId);

        // Verify rent status was updated
        verify(rentRepository).findById(rentId);
        verify(rentRepository).save(argThat(r -> r.getStatus() == RentStatus.ACTIVE));
    }

    @Test
    @DisplayName("captureOrder should not update rent when payment not completed")
    void captureOrder_WhenPaymentPending_ShouldNotUpdateRent() throws Exception {
        // Arrange
        String orderId = "ORDER-123456";
        Long rentId = 1L;

        // Mock OAuth token response
        String tokenResponse = "{\"access_token\": \"test-access-token\", \"token_type\": \"Bearer\"}";
        when(restTemplate.exchange(
                eq(BASE_URL + "/v1/oauth2/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(tokenResponse, HttpStatus.OK));

        // Mock capture response with PENDING status
        String captureResponse = """
            {
                "id": "ORDER-123456",
                "status": "PENDING"
            }
            """;
        when(restTemplate.exchange(
                eq(BASE_URL + "/v2/checkout/orders/" + orderId + "/capture"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(captureResponse, HttpStatus.OK));

        // Act
        PayPalCaptureDTO result = payPalService.captureOrder(orderId, rentId);

        // Assert
        assertThat(result.getStatus()).isEqualTo("PENDING");
        
        // Rent should not be updated when payment is not completed
        verify(rentRepository, never()).findById(any());
        verify(rentRepository, never()).save(any());
    }

    @Test
    @DisplayName("getOrderDetails should return order information")
    void getOrderDetails_ShouldReturnOrderInfo() throws Exception {
        // Arrange
        String orderId = "ORDER-123456";

        // Mock OAuth token response
        String tokenResponse = "{\"access_token\": \"test-access-token\", \"token_type\": \"Bearer\"}";
        when(restTemplate.exchange(
                eq(BASE_URL + "/v1/oauth2/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(tokenResponse, HttpStatus.OK));

        // Mock order details response
        String orderResponse = """
            {
                "id": "ORDER-123456",
                "status": "APPROVED",
                "purchase_units": [{
                    "amount": {
                        "currency_code": "EUR",
                        "value": "75.00"
                    }
                }]
            }
            """;
        when(restTemplate.exchange(
                eq(BASE_URL + "/v2/checkout/orders/" + orderId),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(new ResponseEntity<>(orderResponse, HttpStatus.OK));

        // Act
        PayPalOrderDTO result = payPalService.getOrderDetails(orderId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getOrderId()).isEqualTo(orderId);
        assertThat(result.getStatus()).isEqualTo("APPROVED");
        assertThat(result.getAmount()).isEqualByComparingTo(new BigDecimal("75.00"));
        assertThat(result.getCurrency()).isEqualTo("EUR");
    }

    @Test
    @DisplayName("createOrder should throw exception when PayPal API fails")
    void createOrder_WhenPayPalApiFails_ShouldThrowException() {
        // Arrange
        Long rentId = 1L;
        Rent rent = Rent.builder()
                .id(rentId)
                .status(RentStatus.APPROVED)
                .build();

        when(rentRepository.findById(rentId)).thenReturn(Optional.of(rent));

        // Mock OAuth failure
        when(restTemplate.exchange(
                eq(BASE_URL + "/v1/oauth2/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenThrow(new RuntimeException("Network error"));

        // Act & Assert
        assertThatThrownBy(() -> 
            payPalService.createOrder(rentId, new BigDecimal("50.00"), "EUR", "Test")
        )
        .isInstanceOf(RuntimeException.class)
        .hasMessageContaining("Failed to authenticate with PayPal");
    }

    @Test
    @DisplayName("createOrder should work with rejected rent status throwing exception")
    void createOrder_WhenRentRejected_ShouldThrowException() {
        // Arrange
        Long rentId = 1L;
        Rent rent = Rent.builder()
                .id(rentId)
                .status(RentStatus.REJECTED)
                .build();

        when(rentRepository.findById(rentId)).thenReturn(Optional.of(rent));

        // Act & Assert
        assertThatThrownBy(() -> 
            payPalService.createOrder(rentId, new BigDecimal("50.00"), "EUR", "Test")
        )
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Only approved rentals can be paid");
    }

    @Test
    @DisplayName("createOrder should work with canceled rent status throwing exception")
    void createOrder_WhenRentCanceled_ShouldThrowException() {
        // Arrange
        Long rentId = 1L;
        Rent rent = Rent.builder()
                .id(rentId)
                .status(RentStatus.CANCELED)
                .build();

        when(rentRepository.findById(rentId)).thenReturn(Optional.of(rent));

        // Act & Assert
        assertThatThrownBy(() -> 
            payPalService.createOrder(rentId, new BigDecimal("50.00"), "EUR", "Test")
        )
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Only approved rentals can be paid");
    }
}
