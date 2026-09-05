package com.storeflow.backend.service;

import com.storeflow.backend.exception.ProductNotFoundException;
import com.storeflow.backend.model.Product;
import com.storeflow.backend.repository.ProductRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return productRepository.findAllByOrderByIdAsc();
    }

    @Transactional
    public Product create(Product product) {
        return productRepository.save(product);
    }

    @Transactional
    public Product update(Long id, Product changes) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        existing.setName(changes.getName());
        existing.setCategory(changes.getCategory());
        existing.setPrice(changes.getPrice());
        existing.setStockQuantity(changes.getStockQuantity());

        return productRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException(id);
        }
        productRepository.deleteById(id);
    }
}
