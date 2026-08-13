export const TAX_RATE = 0.13; // Ontario HST

export function calculateSubtotal(cartItems) {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateTax(subtotal) {
  return subtotal * TAX_RATE;
}

export function calculateTotal(subtotal, tax) {
  return subtotal + tax;
}

export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}
