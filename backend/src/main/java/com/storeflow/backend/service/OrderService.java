package com.storeflow.backend.service;

import com.storeflow.backend.dto.CreateOrderRequest;
import com.storeflow.backend.dto.OrderItemRequest;
import com.storeflow.backend.exception.InsufficientStockException;
import com.storeflow.backend.exception.OrderNotFoundException;
import com.storeflow.backend.exception.ProductNotFoundException;
import com.storeflow.backend.model.Order;
import com.storeflow.backend.model.OrderItem;
import com.storeflow.backend.model.Product;
import com.storeflow.backend.repository.OrderRepository;
import com.storeflow.backend.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    /** Ontario Harmonized Sales Tax. */
    private static final BigDecimal HST_RATE = new BigDecimal("0.13");
    private static final int MONEY_SCALE = 2;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Order> findAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
    }

    /**
     * Places an order as a single unit of work: every line is validated against
     * current stock, stock is decremented, and the order is written. If any line
     * fails, the exception rolls the whole transaction back and no stock changes.
     */
    @Transactional
    public Order placeOrder(CreateOrderRequest request) {
        Order order = new Order(Instant.now());
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItemRequest line : request.items()) {
            Product product = productRepository.findById(line.productId())
                    .orElseThrow(() -> new ProductNotFoundException(line.productId()));

            if (line.quantity() > product.getStockQuantity()) {
                throw new InsufficientStockException(product.getName(), product.getStockQuantity());
            }

            product.setStockQuantity(product.getStockQuantity() - line.quantity());

            OrderItem item = new OrderItem(product, line.quantity(), product.getPrice());
            order.addItem(item);

            subtotal = subtotal.add(item.getLineTotal());
        }

        BigDecimal roundedSubtotal = subtotal.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal tax = roundedSubtotal.multiply(HST_RATE).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        order.setSubtotal(roundedSubtotal);
        order.setTaxAmount(tax);
        order.setTotal(roundedSubtotal.add(tax));

        return orderRepository.save(order);
    }
}
