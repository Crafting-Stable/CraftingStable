package ua.tqs.functional;

import org.springframework.test.context.ActiveProfiles;

import com.github.tomakehurst.wiremock.WireMockServer;
import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.configureFor;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.urlMatching;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

import io.cucumber.java.After;
import io.cucumber.java.Before;

@ActiveProfiles("test")
public class PayPalMockServer {

    private static WireMockServer wireMockServer;
    private static boolean isServerStarted = false;

    @Before(order = 0)
    public void startMockServer() {
        if (!isServerStarted) {
            wireMockServer = new WireMockServer(WireMockConfiguration.options()
                    .port(8089)
                    .bindAddress("localhost"));
            
            wireMockServer.start();
            configureFor("localhost", 8089);
            setupPayPalMocks();
            isServerStarted = true;
            
            // Update PayPal base URL to point to mock server
            System.setProperty("paypal.base-url", "http://localhost:8089");
        }
    }

    @After(order = 0)
    public void stopMockServer() {
        // Keep server running for all scenarios
        // Will be stopped by JVM shutdown hook
    }

    private void setupPayPalMocks() {
        // Mock OAuth token endpoint
        stubFor(post(urlEqualTo("/v1/oauth2/token"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"access_token\":\"mock-access-token\",\"token_type\":\"Bearer\",\"expires_in\":32400}")));

        // Mock create order endpoint (returns dynamic response based on request)
        stubFor(post(urlEqualTo("/v2/checkout/orders"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{" +
                                "\"id\":\"MOCK-ORDER-ID-12345\"," +
                                "\"status\":\"CREATED\"," +
                                "\"links\":[" +
                                "{\"rel\":\"approve\",\"href\":\"http://localhost:8089/approve/MOCK-ORDER-ID-12345\"}," +
                                "{\"rel\":\"self\",\"href\":\"http://localhost:8089/v2/checkout/orders/MOCK-ORDER-ID-12345\"}" +
                                "]," +
                                "\"purchase_units\":[{\"amount\":{\"currency_code\":\"EUR\",\"value\":\"50.00\"}}]" +
                                "}")
                        .withTransformers("response-template")));

        // Mock capture order endpoint
        stubFor(post(urlMatching("/v2/checkout/orders/.*/capture"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{" +
                                "\"id\":\"MOCK-ORDER-ID-12345\"," +
                                "\"status\":\"COMPLETED\"," +
                                "\"purchase_units\":[{" +
                                "\"payments\":{" +
                                "\"captures\":[{" +
                                "\"id\":\"MOCK-CAPTURE-ID-67890\"," +
                                "\"status\":\"COMPLETED\"," +
                                "\"amount\":{\"currency_code\":\"EUR\",\"value\":\"50.00\"}" +
                                "}]" +
                                "}" +
                                "}]" +
                                "}")));

        // Mock get order details endpoint
        stubFor(get(urlMatching("/v2/checkout/orders/.*"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{" +
                                "\"id\":\"MOCK-ORDER-ID-12345\"," +
                                "\"status\":\"CREATED\"," +
                                "\"purchase_units\":[{\"amount\":{\"currency_code\":\"EUR\",\"value\":\"50.00\"}}]," +
                                "\"links\":[" +
                                "{\"rel\":\"approve\",\"href\":\"http://localhost:8089/approve/MOCK-ORDER-ID-12345\"}" +
                                "]" +
                                "}")));
    }

    public static void resetMocks() {
        if (wireMockServer != null) {
            wireMockServer.resetAll();
        }
    }

    static {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (wireMockServer != null && wireMockServer.isRunning()) {
                wireMockServer.stop();
            }
        }));
    }
}
