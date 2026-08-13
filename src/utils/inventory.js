export function getInventoryStatus(stock) {
  if (stock === 0) return "Out of Stock";
  if (stock <= 10) return "Low Stock";
  return "In Stock";
}

export function filterProducts(products, { query = "", status = "All", category = "All" } = {}) {
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery);

    const matchesStatus =
      status === "All" || getInventoryStatus(product.stock) === status;

    const matchesCategory = category === "All" || product.category === category;

    return matchesQuery && matchesStatus && matchesCategory;
  });
}
