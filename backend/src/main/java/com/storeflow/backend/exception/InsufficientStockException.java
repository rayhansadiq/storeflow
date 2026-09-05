package com.storeflow.backend.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String productName, int available) {
        super("Only " + available + " units of " + productName + " are available.");
    }
}
