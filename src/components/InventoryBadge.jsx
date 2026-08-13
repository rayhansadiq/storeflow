function InventoryBadge({ status }) {
  const statusClass = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`badge badge-${statusClass}`}>{status}</span>;
}

export default InventoryBadge;
