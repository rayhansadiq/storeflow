import { getInventoryStatus } from "../utils/inventory";

function DashboardStats({ products, orderCount, revenue }) {
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter(
    (p) => getInventoryStatus(p.stock) === "Low Stock"
  ).length;

  const stats = [
    { label: "Total Products", value: totalProducts },
    { label: "Inventory Units", value: totalUnits },
    { label: "Low Stock", value: lowStockCount },
    { label: "Orders", value: orderCount },
    { label: "Revenue", value: `$${revenue.toFixed(2)}` },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <span className="stat-label">{stat.label}</span>
          <span className="stat-value">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;
