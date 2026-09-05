import { API_BASE, handleResponse, jsonRequest } from "./http";

function toClientProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    stock: product.stockQuantity,
    version: product.version,
  };
}

function toServerProduct(product) {
  return {
    name: product.name,
    category: product.category,
    price: product.price,
    stockQuantity: product.stock,
  };
}

export async function fetchProducts() {
  const data = await handleResponse(await fetch(`${API_BASE}/products`));
  return data.map(toClientProduct);
}

export async function createProduct(product) {
  const response = await fetch(`${API_BASE}/products`, jsonRequest("POST", toServerProduct(product)));
  return toClientProduct(await handleResponse(response));
}

export async function updateProduct(id, product) {
  const response = await fetch(
    `${API_BASE}/products/${id}`,
    jsonRequest("PUT", toServerProduct(product))
  );
  return toClientProduct(await handleResponse(response));
}

export async function deleteProduct(id) {
  await handleResponse(await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" }));
}
