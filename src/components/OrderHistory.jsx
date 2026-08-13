import { formatCurrency } from "../utils/calculations";

function OrderHistory({ orders }) {
  const recentOrders = orders.slice(0, 5);

  if (recentOrders.length === 0) {
    return (
      <div className="table-card">
        <p className="empty-state">No orders placed yet.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="product-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{new Date(order.date).toLocaleString()}</td>
              <td>{order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}</td>
              <td>{formatCurrency(order.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrderHistory;
