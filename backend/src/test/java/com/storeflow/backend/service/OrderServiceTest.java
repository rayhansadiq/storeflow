package com.storeflow.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.storeflow.backend.dto.CreateOrderRequest;
import com.storeflow.backend.dto.OrderItemRequest;
import com.storeflow.backend.exception.InsufficientStockException;
import com.storeflow.backend.model.Order;
import com.storeflow.backend.model.Product;
import com.storeflow.backend.repository.OrderRepository;
import com.storeflow.backend.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrderServiceTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void resetDatabase() {
        orderRepository.deleteAll();
        productRepository.deleteAll();
    }

    private Product product(String name, String price, int stock) {
        return productRepository.save(new Product(name, "Electronics", new BigDecimal(price), stock));
    }

    @Test
    void rejectsAnOrderForMoreUnitsThanAreInStock() {
        Product keyboard = product("Mechanical Keyboard", "89.99", 3);

        CreateOrderRequest tooMany = new CreateOrderRequest(
                List.of(new OrderItemRequest(keyboard.getId(), 4)));

        assertThatThrownBy(() -> orderService.placeOrder(tooMany))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Only 3 units");

        assertThat(productRepository.findById(keyboard.getId()).orElseThrow().getStockQuantity())
                .as("a rejected order must not touch stock")
                .isEqualTo(3);
        assertThat(orderRepository.count()).isZero();
    }

    @Test
    void appliesOntarioHstAcrossAMultiItemOrder() {
        Product keyboard = product("Mechanical Keyboard", "89.99", 10);
        Product bottle = product("Water Bottle", "19.99", 10);

        Order order = orderService.placeOrder(new CreateOrderRequest(List.of(
                new OrderItemRequest(keyboard.getId(), 2),
                new OrderItemRequest(bottle.getId(), 1))));

        // 89.99 x 2 + 19.99 = 199.97, HST 25.9961 rounds half-up to 26.00
        assertThat(order.getSubtotal()).isEqualByComparingTo("199.97");
        assertThat(order.getTaxAmount()).isEqualByComparingTo("26.00");
        assertThat(order.getTotal()).isEqualByComparingTo("225.97");
    }

    @Test
    void decrementsStockForEveryLineInTheOrder() {
        Product keyboard = product("Mechanical Keyboard", "89.99", 10);
        Product bottle = product("Water Bottle", "19.99", 30);

        orderService.placeOrder(new CreateOrderRequest(List.of(
                new OrderItemRequest(keyboard.getId(), 2),
                new OrderItemRequest(bottle.getId(), 5))));

        assertThat(productRepository.findById(keyboard.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(8);
        assertThat(productRepository.findById(bottle.getId()).orElseThrow().getStockQuantity())
                .isEqualTo(25);
    }

    @Test
    void rollsBackEarlierLinesWhenALaterLineFails() {
        Product available = product("Wireless Mouse", "24.99", 8);
        Product scarce = product("Mechanical Keyboard", "89.99", 1);

        CreateOrderRequest partiallyImpossible = new CreateOrderRequest(List.of(
                new OrderItemRequest(available.getId(), 1),
                new OrderItemRequest(scarce.getId(), 99)));

        assertThatThrownBy(() -> orderService.placeOrder(partiallyImpossible))
                .isInstanceOf(InsufficientStockException.class);

        assertThat(productRepository.findById(available.getId()).orElseThrow().getStockQuantity())
                .as("the first line was decremented in memory, but the rollback must undo it")
                .isEqualTo(8);
        assertThat(orderRepository.count())
                .as("no partial order should survive")
                .isZero();
    }
}
