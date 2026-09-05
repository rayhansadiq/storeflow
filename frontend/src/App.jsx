import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import DashboardStats from "./components/DashboardStats";
import ProductTable from "./components/ProductTable";
import SearchBar from "./components/SearchBar";
import Modal from "./components/Modal";
import ProductForm from "./components/ProductForm";
import OrderBuilder from "./components/OrderBuilder";
import OrderSummary from "./components/OrderSummary";
import OrderHistory from "./components/OrderHistory";
import { filterProducts } from "./utils/inventory";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./api/products";
import { fetchOrders, placeOrder } from "./api/orders";
import "./App.css";

const STATUS_FILTERS = ["All", "In Stock", "Low Stock", "Out of Stock"];

function App() {
  const [activeView, setActiveView] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [cart, setCart] = useState([]);
  const [orderError, setOrderError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const refreshFromApi = useCallback(async () => {
    setLoadError("");
    try {
      const [latestProducts, latestOrders] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
      ]);
      setProducts(latestProducts);
      setOrders(latestOrders);
    } catch (error) {
      setLoadError(
        `Could not reach the StoreFlow API. Make sure the backend is running on port 8080. (${error.message})`
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await refreshFromApi();
      setIsLoading(false);
    })();
  }, [refreshFromApi]);

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

  async function handleFormSubmit(formValues) {
    setActionError("");
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formValues);
      } else {
        await createProduct(formValues);
      }
      handleCloseModal();
      await refreshFromApi();
    } catch (error) {
      setActionError(`Could not save the product: ${error.message}`);
    }
  }

  async function handleDeleteProduct(id) {
    setActionError("");
    try {
      await deleteProduct(id);
      setCart((prev) => prev.filter((item) => item.productId !== id));
      await refreshFromApi();
    } catch (error) {
      setActionError(`Could not delete the product: ${error.message}`);
    }
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

  /**
   * The server owns validation, pricing, tax and the stock decrement. This only
   * sends the cart and reports back whatever the server decided.
   */
  async function handlePlaceOrder() {
    if (cart.length === 0) return;

    setIsPlacingOrder(true);
    setOrderError("");

    try {
      await placeOrder(cart);
      setCart([]);
      await refreshFromApi();
    } catch (error) {
      setOrderError(error.message);
      // Stock may have moved underneath us, so pull fresh numbers either way.
      await refreshFromApi();
    } finally {
      setIsPlacingOrder(false);
    }
  }

  async function handleResetDemoData() {
    const confirmed = window.confirm(
      "This will clear your cart and reload products and orders from the server. Continue?"
    );
    if (!confirmed) return;

    setCart([]);
    setOrderError("");
    setActionError("");
    setSearchQuery("");
    setStatusFilter("All");
    setCategoryFilter("All");
    await refreshFromApi();
  }

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onReset={handleResetDemoData} />
      <main className="main-content">
        <header className="main-header">
          <h1>StoreFlow Dashboard</h1>
          <p className="header-subtitle">Inventory and order management overview</p>
        </header>

        {loadError && (
          <p className="banner banner-error" role="alert">
            {loadError}
          </p>
        )}

        {actionError && (
          <p className="banner banner-error" role="alert">
            {actionError}
          </p>
        )}

        {isLoading && <p className="banner banner-info">Loading StoreFlow data...</p>}

        {!isLoading && activeView === "Dashboard" && (
          <>
            <DashboardStats products={products} orderCount={orders.length} revenue={revenue} />
            <section className="section">
              <h2>Products</h2>
              <ProductTable products={products} />
            </section>
          </>
        )}

        {!isLoading && activeView === "Products" && (
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

        {!isLoading && activeView === "Orders" && (
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
              <OrderSummary
                cart={cart}
                onPlaceOrder={handlePlaceOrder}
                isPlacing={isPlacingOrder}
              />
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
