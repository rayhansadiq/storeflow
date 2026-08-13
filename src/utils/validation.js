export function validateProduct(product) {
  const errors = {};

  if (!product.name || !product.name.trim()) {
    errors.name = "Name cannot be blank.";
  }

  if (!product.category || !product.category.trim()) {
    errors.category = "Category cannot be blank.";
  }

  const price = parseFloat(product.price);
  if (Number.isNaN(price) || price <= 0) {
    errors.price = "Price must be greater than 0.";
  }

  const stock = parseInt(product.stock, 10);
  if (Number.isNaN(stock) || stock < 0) {
    errors.stock = "Stock cannot be negative.";
  }

  return errors;
}

export function validateOrderQuantity(product, requestedQuantity) {
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    return "Quantity must be at least 1.";
  }

  if (!Number.isInteger(requestedQuantity)) {
    return "Quantity must be a whole number.";
  }

  if (requestedQuantity > product.stock) {
    return `Only ${product.stock} units are available.`;
  }

  return null;
}
