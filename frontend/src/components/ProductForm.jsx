import { useState } from "react";
import { validateProduct } from "../utils/validation";

function ProductForm({ initialProduct, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialProduct?.name ?? "",
    category: initialProduct?.category ?? "",
    price: initialProduct?.price ?? "",
    stock: initialProduct?.stock ?? "",
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateProduct(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
    });
  }

  return (
    <form className="product-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <span id="name-error" className="field-error" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          name="category"
          type="text"
          value={formData.category}
          onChange={handleChange}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? "category-error" : undefined}
        />
        {errors.category && (
          <span id="category-error" className="field-error" role="alert">
            {errors.category}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="price">Price ($)</label>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={handleChange}
          aria-invalid={Boolean(errors.price)}
          aria-describedby={errors.price ? "price-error" : undefined}
        />
        {errors.price && (
          <span id="price-error" className="field-error" role="alert">
            {errors.price}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="stock">Stock</label>
        <input
          id="stock"
          name="stock"
          type="number"
          step="1"
          value={formData.stock}
          onChange={handleChange}
          aria-invalid={Boolean(errors.stock)}
          aria-describedby={errors.stock ? "stock-error" : undefined}
        />
        {errors.stock && (
          <span id="stock-error" className="field-error" role="alert">
            {errors.stock}
          </span>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initialProduct ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
