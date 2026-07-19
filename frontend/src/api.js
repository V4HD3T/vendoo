/**
 * api.js — Vendoo API Service Layer
 * Change BASE_URL to match your own backend address.
 */
export const BASE_URL = "http://localhost:3000/api";

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const get  = (p, t)    => req("GET",    p, null, t);
const post = (p, b, t) => req("POST",   p, b,    t);
const put  = (p, b, t) => req("PUT",    p, b,    t);
const del  = (p, t)    => req("DELETE", p, null, t);

export const auth = {
  register: (email, name, password, role) =>
    post("/auth/register", { email, name, password, role }),
  login:    (email, password) => post("/auth/login", { email, password }),
  getMe:    (token)           => get("/auth/me", token),
};

export const categories = {
  list: () => get("/categories"),
};

export const products = {
  list: (params = {}) =>
    get("/products?" + new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    )),
  get:    (id)              => get(`/products/${id}`),
  create: (data, token)     => post("/products", data, token),
  update: (id, data, token) => put(`/products/${id}`, data, token),
  remove: (id, token)       => del(`/products/${id}`, token),
};

export const cart = {
  get:    (token)                 => get("/cart", token),
  add:    (productId, qty, token) => post("/cart", { productId, quantity: qty }, token),
  update: (itemId, qty, token)    => put(`/cart/item/${itemId}`, { quantity: qty }, token),
  remove: (itemId, token)         => del(`/cart/item/${itemId}`, token),
  clear:  (token)                 => del("/cart", token),
};

export const favorites = {
  get:    (token)             => get("/favorites", token),
  add:    (productId, token)  => post("/favorites", { productId }, token),
  remove: (productId, token)  => del(`/favorites/${productId}`, token),
  check:  (productId, token)  => get(`/favorites/check/${productId}`, token),
};

export const orders = {
  create:          (shippingAddress, token) => post("/orders", { shippingAddress }, token),
  list:            (token)                  => get("/orders", token),
  get:             (id, token)              => get(`/orders/${id}`, token),
  listForSeller:   (token)                  => get("/orders/seller/items", token),
  updateItemStatus:(itemId, status, token)  => put(`/orders/items/${itemId}/status`, { status }, token),
};
