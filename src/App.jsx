import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardStats from "./components/DashboardStats";
import ProductTable from "./components/ProductTable";
import SearchBar from "./components/SearchBar";
import Modal from "./components/Modal";
import ProductForm from "./components/ProductForm";
import OrderBuilder from "./components/OrderBuilder";
import OrderSummary from "./components/OrderSummary";
import OrderHistory from "./components/OrderHistory";
import { starterProducts } from "./data/starterProducts";
import { filterProducts } from "./utils/inventory";
import { calculateSubtotal, calculateTax, calculateTotal } from "./utils/calculations";
import { loadProducts, saveProducts, loadOrders, saveOrders } from "./utils/storage";
import "./App.css";

const STATUS_FILTERS = ["All", "In Stock", "Low Stock", "Out of Stock"];

function getNextProductId(products) {
  return products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
}

function getNextOrderId(orders) {
  return orders.length ? Math.max(...orders.map((o) => o.id)) + 1 : 1;
}

function App() {
  const [activeView, setActiveView] = useState("Dashboard");
  const [products, setProducts] = useState(() => loadProducts(starterProducts));
  const [orders, setOrders] = useState(() => loadOrders());

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [cart, setCart] = useState([]);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const categories = Array.from(new Set(products.map((p) => p.category))).sort();

  const filteredProducts = filterProducts(products, {
    query: searchQuery,
    status: statusFilter,
    category: categoryFilter,
  });

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  function handleAddClick() {
    setEditingProduct(null);
    setIsModalOpen(true);
  }

  function handleEditClick(product) {
    setEditingProduct(product);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
  }

  function handleFormSubmit(formValues) {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...formValues } : p))
      );
    } else {
      const newProduct = { id: getNextProductId(products), ...formValues };
      setProducts((prev) => [...prev, newProduct]);
    }
    handleCloseModal();
  }

  function handleDeleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((item) => item.productId !== id));
  }

  function handleAddToCart(product, quantity) {
    setOrderError("");
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity }];
    });
  }

  function handleRemoveFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  function handlePlaceOrder() {
    if (cart.length === 0) return;

    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        setOrderError(`${item.name} is no longer available.`);
        return;
      }
      if (item.quantity > product.stock) {
        setOrderError(`Only ${product.stock} units of ${product.name} are available.`);
        return;
      }
    }

    const subtotal = calculateSubtotal(cart);
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal, tax);

    const newOrder = {
      id: getNextOrderId(orders),
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      tax,
      total,
    };

    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cart.find((item) => item.productId === p.id);
        return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setOrderError("");
  }

  function handleResetDemoData() {
    const confirmed = window.confirm(
      "This will erase all products, orders, and revenue data and restore the original demo data. Continue?"
    );
    if (!confirmed) return;

    setProducts(starterProducts);
    setOrders([]);
    setCart([]);
    setOrderError("");
    setSearchQuery("");
    setStatusFilter("All");
    setCategoryFilter("All");
  }

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onReset={handleResetDemoData} />
      <main className="main-content">
        <header className="main-header">
          <h1>StoreFlow Dashboard</h1>
          <p className="header-subtitle">Inventory and order management overview</p>
        </header>

        {activeView === "Dashboard" && (
          <>
            <DashboardStats products={products} orderCount={orders.length} revenue={revenue} />
            <section className="section">
              <h2>Products</h2>
              <ProductTable products={products} />
            </section>
          </>
        )}

        {activeView === "Products" && (
          <section className="section">
            <div className="products-toolbar">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />

              <div className="filter-group">
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    className={`filter-btn ${statusFilter === status ? "active" : ""}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {categories.length > 1 && (
                <select
                  className="category-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}

              <button className="btn-primary" onClick={handleAddClick}>
                Add Product
              </button>
            </div>

            <ProductTable
              products={filteredProducts}
              onEdit={handleEditClick}
              onDelete={handleDeleteProduct}
              emptyMessage={
                products.length === 0
                  ? 'No products yet. Click "Add Product" to create your first one.'
                  : "No products match your search or filters."
              }
            />
          </section>
        )}

        {activeView === "Orders" && (
          <>
            <section className="section">
              <h2>Build an Order</h2>
              <OrderBuilder
                products={products}
                cart={cart}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
              />
            </section>

            <section className="section">
              <h2>Order Summary</h2>
              <OrderSummary cart={cart} onPlaceOrder={handlePlaceOrder} />
              {orderError && (
                <p className="field-error order-error" role="alert">
                  {orderError}
                </p>
              )}
            </section>

            <section className="section">
              <h2>Recent Orders</h2>
              <OrderHistory orders={orders} />
            </section>
          </>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? "Edit Product" : "Add Product"}
      >
        <ProductForm
          initialProduct={editingProduct}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}

export default App;
