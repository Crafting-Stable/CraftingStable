// java
package ua.tqs.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;
import ua.tqs.dto.PayPalCaptureDTO;
import ua.tqs.dto.PayPalOrderDTO;
import ua.tqs.enums.RentStatus;
import ua.tqs.exception.PayPalApiException;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Rent;
import ua.tqs.repository.RentRepository;

@Service
@Slf4j
public class PayPalService {

    private static final String INTENT_CAPTURE = "CAPTURE";
    private static final String CURRENCY_CODE = "currency_code";

    // JSON field names
    private static final String FIELD_STATUS = "status";
    private static final String FIELD_PURCHASE_UNITS = "purchase_units";
    private static final String FIELD_AMOUNT = "amount";
    private static final String FIELD_VALUE = "value";

    @Value("${paypal.client-id}")
    private String clientId;

    @Value("${paypal.client-secret}")
    private String clientSecret;

    @Value("${paypal.base-url}")
    private String baseUrl;

    @Value("${paypal.return-url}")
    private String returnUrl;

    @Value("${paypal.cancel-url}")
    private String cancelUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final RentRepository rentRepository;

    public PayPalService(RentRepository rentRepository) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.rentRepository = rentRepository;
    }

    public PayPalOrderDTO createOrder(Long rentId, BigDecimal amount, String currency, String description) {
        log.info("Creating PayPal order for rent ID: {}, amount: {} {}", rentId, amount, currency);

        if (rentId != null && rentId > 0) {
            Rent rent = rentRepository.findById(rentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Rent not found with ID: " + rentId));

            if (rent.getStatus() != RentStatus.APPROVED) {
                throw new IllegalArgumentException("Only approved rentals can be paid. Current status: " + rent.getStatus());
            }
        }

        String accessToken = getAccessToken();
        String requestBody = buildOrderRequestBody(amount, currency, description);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);
        headers.set("PayPal-Request-Id", UUID.randomUUID().toString());

        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/v2/checkout/orders",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            JsonNode responseBody = objectMapper.readTree(response.getBody());

            String orderId = responseBody.get("id").asText();
            String status = responseBody.get(FIELD_STATUS).asText();
            String approvalUrl = extractApprovalUrl(responseBody);

            log.info("PayPal order created successfully. Order ID: {}, Status: {}", orderId, status);

            return PayPalOrderDTO.builder()
                    .rentId(rentId)
                    .orderId(orderId)
                    .status(status)
                    .amount(amount)
                    .currency(currency)
                    .description(description)
                    .approvalUrl(approvalUrl)
                    .build();

        } catch (RestClientException e) {
            log.error("PayPal API error while creating order", e);
            throw new PayPalApiException("Failed to create PayPal order: PayPal API error", e);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse PayPal create order response", e);
            throw new PayPalApiException("Failed to parse PayPal create order response", e);
        } catch (Exception e) {
            log.error("Unexpected error while creating PayPal order", e);
            throw new PayPalApiException("Unexpected error while creating PayPal order", e);
        }
    }

    public PayPalCaptureDTO captureOrder(String orderId, Long rentId) {
        log.info("Capturing PayPal order: {} for rent ID: {}", orderId, rentId);

        String accessToken = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        HttpEntity<String> entity = new HttpEntity<>("{}", headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/v2/checkout/orders/" + orderId + "/capture",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            JsonNode responseBody = objectMapper.readTree(response.getBody());

            String status = responseBody.get(FIELD_STATUS).asText();

            PayPalCaptureDTO captureDTO = PayPalCaptureDTO.builder()
                    .orderId(orderId)
                    .status(status)
                    .rentId(rentId)
                    .build();

            if (responseBody.has("payer")) {
                JsonNode payer = responseBody.get("payer");
                if (payer.has("payer_id")) {
                    captureDTO.setPayerId(payer.get("payer_id").asText());
                }
                if (payer.has("email_address")) {
                    captureDTO.setPayerEmail(payer.get("email_address").asText());
                }
            }

            if (responseBody.has(FIELD_PURCHASE_UNITS)) {
                JsonNode purchaseUnits = responseBody.get(FIELD_PURCHASE_UNITS);
                if (purchaseUnits.isArray() && purchaseUnits.size() > 0) {
                    JsonNode captures = purchaseUnits.get(0).path("payments").path("captures");
                    if (captures.isArray() && captures.size() > 0) {
                        JsonNode capture = captures.get(0);
                        captureDTO.setCaptureId(capture.get("id").asText());
                        JsonNode captureAmount = capture.get(FIELD_AMOUNT);
                        captureDTO.setAmount(new BigDecimal(captureAmount.get(FIELD_VALUE).asText()));
                        captureDTO.setCurrency(captureAmount.get(CURRENCY_CODE).asText());
                    }
                }
            }

            if ("COMPLETED".equals(status)) {
                updateRentStatusAfterPayment(rentId);
            }

            log.info("PayPal order captured successfully. Status: {}", status);
            return captureDTO;

        } catch (RestClientException e) {
            log.error("PayPal API error while capturing order", e);
            throw new PayPalApiException("Failed to capture PayPal order: PayPal API error", e);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse PayPal capture response", e);
            throw new PayPalApiException("Failed to parse PayPal capture response", e);
        } catch (Exception e) {
            log.error("Unexpected error while capturing PayPal order", e);
            throw new PayPalApiException("Unexpected error while capturing PayPal order", e);
        }
    }

    public PayPalOrderDTO getOrderDetails(String orderId) {
        log.info("Getting PayPal order details for: {}", orderId);

        String accessToken = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/v2/checkout/orders/" + orderId,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            JsonNode responseBody = objectMapper.readTree(response.getBody());

            PayPalOrderDTO orderDTO = PayPalOrderDTO.builder()
                    .orderId(responseBody.get("id").asText())
                    .status(responseBody.get(FIELD_STATUS).asText())
                    .build();

            if (responseBody.has(FIELD_PURCHASE_UNITS)) {
                JsonNode purchaseUnits = responseBody.get(FIELD_PURCHASE_UNITS);
                if (purchaseUnits.isArray() && purchaseUnits.size() > 0) {
                    JsonNode amount = purchaseUnits.get(0).path(FIELD_AMOUNT);
                    orderDTO.setAmount(new BigDecimal(amount.get(FIELD_VALUE).asText()));
                    orderDTO.setCurrency(amount.get(CURRENCY_CODE).asText());
                }
            }

            return orderDTO;

        } catch (RestClientException e) {
            log.error("PayPal API error while getting order details", e);
            throw new PayPalApiException("Failed to get PayPal order details: PayPal API error", e);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse PayPal order details response", e);
            throw new PayPalApiException("Failed to parse PayPal order details response", e);
        } catch (Exception e) {
            log.error("Unexpected error while getting PayPal order details", e);
            throw new PayPalApiException("Unexpected error while getting PayPal order details", e);
        }
    }

    private String getAccessToken() {
        String auth = clientId + ":" + clientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + encodedAuth);

        HttpEntity<String> entity = new HttpEntity<>("grant_type=client_credentials", headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/v1/oauth2/token",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            JsonNode responseBody = objectMapper.readTree(response.getBody());
            return responseBody.get("access_token").asText();

        } catch (RestClientException e) {
            log.error("PayPal API error while obtaining access token", e);
            throw new PayPalApiException("Failed to authenticate with PayPal: API error", e);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse access token response", e);
            throw new PayPalApiException("Failed to parse PayPal access token response", e);
        } catch (Exception e) {
            log.error("Unexpected error while obtaining PayPal access token", e);
            throw new PayPalApiException("Failed to authenticate with PayPal: API error", e);
        }
    }

    private String buildOrderRequestBody(BigDecimal amount, String currency, String description) {
        try {
            Map<String, Object> orderRequest = new LinkedHashMap<>();
            orderRequest.put("intent", INTENT_CAPTURE);

            List<Map<String, Object>> purchaseUnits = new ArrayList<>();
            Map<String, Object> purchaseUnit = new LinkedHashMap<>();

            Map<String, String> amountMap = new LinkedHashMap<>();
            amountMap.put(CURRENCY_CODE, currency);
            amountMap.put(FIELD_VALUE, amount.setScale(2).toPlainString());

            purchaseUnit.put(FIELD_AMOUNT, amountMap);
            purchaseUnit.put("description", description);
            purchaseUnits.add(purchaseUnit);

            orderRequest.put(FIELD_PURCHASE_UNITS, purchaseUnits);

            Map<String, Object> applicationContext = new LinkedHashMap<>();
            applicationContext.put("return_url", returnUrl);
            applicationContext.put("cancel_url", cancelUrl);
            applicationContext.put("brand_name", "CraftingStable");
            applicationContext.put("user_action", "PAY_NOW");
            applicationContext.put("shipping_preference", "NO_SHIPPING");

            orderRequest.put("application_context", applicationContext);

            return objectMapper.writeValueAsString(orderRequest);

        } catch (JsonProcessingException e) {
            log.error("Failed to build/serialize order request body", e);
            throw new PayPalApiException("Failed to build PayPal order request body", e);
        } catch (Exception e) {
            log.error("Unexpected error while building order request body", e);
            throw new PayPalApiException("Unexpected error while building PayPal order request body", e);
        }
    }

    private String extractApprovalUrl(JsonNode responseBody) {
        if (responseBody.has("links")) {
            for (JsonNode link : responseBody.get("links")) {
                if ("approve".equals(link.get("rel").asText())) {
                    return link.get("href").asText();
                }
            }
        }
        return null;
    }

    private void updateRentStatusAfterPayment(Long rentId) {
        if (rentId == null || rentId <= 0) {
            log.info("Skipping rent status update - rentId is {} (pay-first flow)", rentId);
            return;
        }
        rentRepository.findById(rentId).ifPresent(rent -> {
            rent.setStatus(RentStatus.ACTIVE);
            rentRepository.save(rent);
            log.info("Rent {} status updated to ACTIVE after payment", rentId);
        });
    }
}
