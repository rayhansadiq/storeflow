package com.storeflow.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.storeflow.backend.dto.CreateOrderRequest;
import com.storeflow.backend.dto.OrderItemRequest;
import com.storeflow.backend.exception.InsufficientStockException;
import com.storeflow.backend.model.Product;
import com.storeflow.backend.repository.OrderRepository;
import com.storeflow.backend.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
class OrderConcurrencyTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void resetDatabase() {
        orderRepository.deleteAll();
        productRepository.deleteAll();
    }

    /**
     * Proves the version column itself rejects a write based on stale data.
     * Deterministic: no threads, no timing luck involved.
     */
    @Test
    void aWriteCarryingAStaleVersionIsRejected() {
        Product stale = productRepository.save(
                new Product("Versioned Item", "Electronics", new BigDecimal("10.00"), 5));

        // Someone else updates the row, moving it past the version `stale` is holding.
        transactionTemplate.execute(status -> {
            Product current = productRepository.findById(stale.getId()).orElseThrow();
            current.setStockQuantity(4);
            return null;
        });

        // `stale` still carries the old version, so its UPDATE matches zero rows.
        stale.setStockQuantity(3);

        assertThatThrownBy(() -> transactionTemplate.execute(status -> productRepository.save(stale)))
                .isInstanceOf(ObjectOptimisticLockingFailureException.class);

        Product unchanged = productRepository.findById(stale.getId()).orElseThrow();
        assertThat(unchanged.getStockQuantity())
                .as("the losing write must not have been applied")
                .isEqualTo(4);
    }

    /**
     * Two orders race for the last unit. Whichever mechanism catches it, the
     * invariant is the same: one order, stock zero, never oversold.
     */
    @Test
    void onlyOneOfTwoConcurrentOrdersForTheLastUnitSucceeds() throws Exception {
        Product lastUnit = productRepository.save(
                new Product("Contested Item", "Electronics", new BigDecimal("50.00"), 1));

        CreateOrderRequest orderForTheLastUnit = new CreateOrderRequest(
                List.of(new OrderItemRequest(lastUnit.getId(), 1)));

        AtomicInteger optimisticLockFailures = new AtomicInteger();
        AtomicInteger insufficientStockFailures = new AtomicInteger();

        CountDownLatch startGate = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        Callable<Boolean> placeOrder = () -> {
            startGate.await();
            try {
                orderService.placeOrder(orderForTheLastUnit);
                return true;
            } catch (ObjectOptimisticLockingFailureException ex) {
                optimisticLockFailures.incrementAndGet();
                return false;
            } catch (InsufficientStockException ex) {
                insufficientStockFailures.incrementAndGet();
                return false;
            }
        };

        Future<Boolean> first = executor.submit(placeOrder);
        Future<Boolean> second = executor.submit(placeOrder);
        startGate.countDown();

        boolean firstSucceeded = first.get(10, TimeUnit.SECONDS);
        boolean secondSucceeded = second.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        int successes = (firstSucceeded ? 1 : 0) + (secondSucceeded ? 1 : 0);

        assertThat(successes)
                .as("exactly one order should win the race for the last unit")
                .isEqualTo(1);

        assertThat(optimisticLockFailures.get() + insufficientStockFailures.get())
                .as("the loser must have been rejected by one of the two guards")
                .isEqualTo(1);

        System.out.printf(
                "Race outcome: %d rejected by optimistic lock, %d rejected by stock check%n",
                optimisticLockFailures.get(), insufficientStockFailures.get());

        Product afterOrders = productRepository.findById(lastUnit.getId()).orElseThrow();
        assertThat(afterOrders.getStockQuantity())
                .as("stock must never go negative")
                .isZero();

        assertThat(orderRepository.count())
                .as("only the winning order should have been persisted")
                .isEqualTo(1);
    }
}
