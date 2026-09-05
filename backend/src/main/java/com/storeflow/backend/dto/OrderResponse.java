package com.storeflow.backend.dto;

import com.storeflow.backend.model.Order;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        Instant createdAt,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        BigDecimal total,
        List<OrderItemResponse> items) {

    public static OrderResponse from(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(OrderItemResponse::from)
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getCreatedAt(),
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getTotal(),
                items);
    }
}
