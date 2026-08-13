import { useState } from "react";
import { validateOrderQuantity } from "../utils/validation";

function OrderBuilder({ products, cart, onAddToCart, onRemoveFromCart }) {
  const availableProducts = products.filter((p) => p.stock > 0);
  const [selectedProductId, setSelectedProductId] = useState(availableProducts[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    const product = products.find((p) => p.id === Number(selectedProductId));
    if (!product) {
      setError("Select a product to add.");
      return;
    }

    const existingCartItem = cart.find((item) => item.productId === product.id);
    const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;
    const requestedTotal = alreadyInCart + Number(quantity);

    const validationError = validateOrderQuantity(product, requestedTotal);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    onAddToCart(product, Number(quantity));
    setQuantity(1);
  }

  return (
    <div className="order-builder">
      <div className="table-card">
        <form className="order-add-form" onSubmit={handleAdd}>
          <div className="form-field">
            <label htmlFor="product-select">Product</label>
            <select
              id="product-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {availableProducts.length === 0 && <option value="">No products in stock</option>}
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.stock} in stock
                </option>
              ))}
            </select>
          </div>

          <div className="form-field quantity-field">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={availableProducts.length === 0}>
            Add to Order
          </button>
        </form>
        {error && (
          <p className="field-error order-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {cart.length > 0 ? (
        <div className="table-card cart-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Line Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>${(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-link btn-danger"
                      onClick={() => onRemoveFromCart(item.productId)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state cart-empty-hint">
          Your order is empty. Add a product above to get started.
        </p>
      )}
    </div>
  );
}

export default OrderBuilder;
