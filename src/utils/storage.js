const PRODUCTS_KEY = "storeflow_products";
const ORDERS_KEY = "storeflow_orders";

export function loadProducts(defaultProducts) {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return defaultProducts;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultProducts;
  } catch (error) {
    console.warn("Could not read saved products, using starter data.", error);
    return defaultProducts;
  }
}

export function saveProducts(products) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.warn("Could not save products to localStorage.", error);
  }
}

export function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Could not read saved orders, starting fresh.", error);
    return [];
  }
}

export function saveOrders(orders) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.warn("Could not save orders to localStorage.", error);
  }
}
