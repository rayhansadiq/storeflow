package com.storeflow.backend.config;

import com.storeflow.backend.model.Product;
import com.storeflow.backend.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedProducts(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() > 0) {
                return;
            }

            productRepository.saveAll(List.of(
                    new Product("Classic Hoodie", "Clothing", new BigDecimal("59.99"), 12),
                    new Product("Wireless Mouse", "Electronics", new BigDecimal("24.99"), 8),
                    new Product("Mechanical Keyboard", "Electronics", new BigDecimal("89.99"), 5),
                    new Product("Laptop Stand", "Accessories", new BigDecimal("34.99"), 20),
                    new Product("USB-C Hub", "Electronics", new BigDecimal("29.99"), 0),
                    new Product("Travel Backpack", "Bags", new BigDecimal("74.99"), 15),
                    new Product("Water Bottle", "Accessories", new BigDecimal("19.99"), 30),
                    new Product("Desk Lamp", "Home", new BigDecimal("39.99"), 3),
                    new Product("Wireless Headphones", "Electronics", new BigDecimal("129.99"), 7),
                    new Product("Phone Stand", "Accessories", new BigDecimal("14.99"), 0)));
        };
    }
}
