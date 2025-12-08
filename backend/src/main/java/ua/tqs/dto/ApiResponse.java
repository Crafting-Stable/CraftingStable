package ua.tqs.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private T data;
    private NotificationDTO notification;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationDTO {
        private String type;
        private String message;
        private String title;
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
            .data(data)
            .notification(NotificationDTO.builder()
                .type("success")
                .message(message)
                .build())
            .build();
    }

    public static <T> ApiResponse<T> success(T data, String title, String message) {
        return ApiResponse.<T>builder()
            .data(data)
            .notification(NotificationDTO.builder()
                .type("success")
                .title(title)
                .message(message)
                .build())
            .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
            .notification(NotificationDTO.builder()
                .type("error")
                .message(message)
                .build())
            .build();
    }

    public static <T> ApiResponse<T> info(T data, String message) {
        return ApiResponse.<T>builder()
            .data(data)
            .notification(NotificationDTO.builder()
                .type("info")
                .message(message)
                .build())
            .build();
    }

    public static <T> ApiResponse<T> warning(T data, String message) {
        return ApiResponse.<T>builder()
            .data(data)
            .notification(NotificationDTO.builder()
                .type("warning")
                .message(message)
                .build())
            .build();
    }
}
