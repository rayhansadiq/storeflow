import { API_BASE, handleResponse, jsonRequest } from "./http";

function toClientOrder(order) {
  return {
    id: order.id,
    date: order.createdAt,
    subtotal: Number(order.subtotal),
    tax: Number(order.taxAmount),
    total: Number(order.total),
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      price: Number(item.unitPrice),
    })),
  };
}

export async function fetchOrders() {
  const data = await handleResponse(await fetch(`${API_BASE}/orders`));
  return data.map(toClientOrder);
}

/**
 * Sends only product ids and quantities. Prices, tax and totals are calculated
 * server-side so the client cannot influence what an order costs.
 */
export async function placeOrder(cart) {
  const payload = {
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  };

  const response = await fetch(`${API_BASE}/orders`, jsonRequest("POST", payload));
  return toClientOrder(await handleResponse(response));
}
