function Sidebar({ activeView, setActiveView, onReset }) {
  const navItems = ["Dashboard", "Products", "Orders"];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">StoreFlow</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item}
            type="button"
            className={`sidebar-link ${activeView === item ? "active" : ""}`}
            onClick={() => setActiveView(item)}
            aria-current={activeView === item ? "page" : undefined}
          >
            {item}
          </button>
        ))}
      </nav>
      <button type="button" className="sidebar-reset" onClick={onReset}>
        Reset Demo Data
      </button>
    </aside>
  );
}

export default Sidebar;
