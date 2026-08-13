import { useState } from "react";
import { getInventoryStatus } from "../utils/inventory";
import InventoryBadge from "./InventoryBadge";

function ProductTable({
  products,
  onEdit,
  onDelete,
  emptyMessage = "No products match your search or filters.",
}) {
  const [confirmingId, setConfirmingId] = useState(null);
  const showActions = Boolean(onEdit || onDelete);

  function handleDeleteClick(id) {
    if (confirmingId === id) {
      onDelete(id);
      setConfirmingId(null);
    } else {
      setConfirmingId(id);
    }
  }

  if (products.length === 0) {
    return (
      <div className="table-card">
        <p className="empty-state">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>{product.stock}</td>
              <td>
                <InventoryBadge status={getInventoryStatus(product.stock)} />
              </td>
              {showActions && (
                <td className="actions-cell">
                  {onEdit && (
                    <button type="button" className="btn-link" onClick={() => onEdit(product)}>
                      Edit
                    </button>
                  )}
                  {onDelete &&
                    (confirmingId === product.id ? (
                      <span className="confirm-delete">
                        <button
                          type="button"
                          className="btn-link btn-danger"
                          onClick={() => handleDeleteClick(product.id)}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => setConfirmingId(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-link btn-danger"
                        onClick={() => handleDeleteClick(product.id)}
                      >
                        Delete
                      </button>
                    ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;
