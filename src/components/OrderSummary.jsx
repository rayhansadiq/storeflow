import { calculateSubtotal, calculateTax, calculateTotal, formatCurrency } from "../utils/calculations";

function OrderSummary({ cart, onPlaceOrder }) {
  const subtotal = calculateSubtotal(cart);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

  return (
    <div className="table-card order-summary">
      <div className="summary-row">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="summary-row">
        <span>HST (13%)</span>
        <span>{formatCurrency(tax)}</span>
      </div>
      <div className="summary-row summary-total">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <button
        type="button"
        className="btn-primary place-order-btn"
        onClick={onPlaceOrder}
        disabled={cart.length === 0}
      >
        Place Order
      </button>
    </div>
  );
}

export default OrderSummary;
