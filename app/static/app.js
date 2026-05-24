const ROLE_RULES = {
  admin: {
    label: "Администратор",
    canUseCart: true,
    canViewOrders: true,
    canUpdateOrders: true,
    canViewReports: true,
    canManageProducts: true,
  },
  manager: {
    label: "Менеджер",
    canUseCart: false,
    canViewOrders: true,
    canUpdateOrders: true,
    canViewReports: true,
    canManageProducts: true,
  },
  user: {
    label: "Пользователь",
    canUseCart: true,
    canViewOrders: true,
    canUpdateOrders: false,
    canViewReports: false,
    canManageProducts: false,
  },
  guest: {
    label: "Гость",
    canUseCart: false,
    canViewOrders: false,
    canUpdateOrders: false,
    canViewReports: false,
    canManageProducts: false,
  },
};

const state = {
  role: "admin",
  categories: [],
  customers: [],
  selectedCustomerId: null,
  products: [],
  cart: null,
  orders: [],
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  loadInitialData();
});

function cacheElements() {
  Object.assign(els, {
    roleSelect: document.querySelector("#roleSelect"),
    customerSelect: document.querySelector("#customerSelect"),
    categorySelect: document.querySelector("#categorySelect"),
    searchForm: document.querySelector("#searchForm"),
    queryInput: document.querySelector("#queryInput"),
    manufacturerInput: document.querySelector("#manufacturerInput"),
    minPriceInput: document.querySelector("#minPriceInput"),
    maxPriceInput: document.querySelector("#maxPriceInput"),
    technologySelect: document.querySelector("#technologySelect"),
    inStockInput: document.querySelector("#inStockInput"),
    resetFiltersBtn: document.querySelector("#resetFiltersBtn"),
    refreshCatalogBtn: document.querySelector("#refreshCatalogBtn"),
    productGrid: document.querySelector("#productGrid"),
    catalogCount: document.querySelector("#catalogCount"),
    productManagementPanel: document.querySelector("#productManagementPanel"),
    productForm: document.querySelector("#productForm"),
    productFormMode: document.querySelector("#productFormMode"),
    resetProductFormBtn: document.querySelector("#resetProductFormBtn"),
    productIdInput: document.querySelector("#productIdInput"),
    productNameInput: document.querySelector("#productNameInput"),
    productManufacturerInput: document.querySelector("#productManufacturerInput"),
    productCategoryInput: document.querySelector("#productCategoryInput"),
    productTechnologyInput: document.querySelector("#productTechnologyInput"),
    productPaperFormatInput: document.querySelector("#productPaperFormatInput"),
    productColorsInput: document.querySelector("#productColorsInput"),
    productPriceInput: document.querySelector("#productPriceInput"),
    productQuantityInput: document.querySelector("#productQuantityInput"),
    cartBadge: document.querySelector("#cartBadge"),
    cartItems: document.querySelector("#cartItems"),
    cartTotalLine: document.querySelector("#cartTotalLine"),
    refreshCartBtn: document.querySelector("#refreshCartBtn"),
    checkoutForm: document.querySelector("#checkoutForm"),
    deliveryAddressInput: document.querySelector("#deliveryAddressInput"),
    ordersList: document.querySelector("#ordersList"),
    ordersCount: document.querySelector("#ordersCount"),
    refreshOrdersBtn: document.querySelector("#refreshOrdersBtn"),
    refreshReportsBtn: document.querySelector("#refreshReportsBtn"),
    topMonthsInput: document.querySelector("#topMonthsInput"),
    minPurchasesInput: document.querySelector("#minPurchasesInput"),
    demandStartInput: document.querySelector("#demandStartInput"),
    demandEndInput: document.querySelector("#demandEndInput"),
    unsoldDateInput: document.querySelector("#unsoldDateInput"),
    topSalesReport: document.querySelector("#topSalesReport"),
    activeCustomersReport: document.querySelector("#activeCustomersReport"),
    categoryDemandReport: document.querySelector("#categoryDemandReport"),
    unsoldProductsReport: document.querySelector("#unsoldProductsReport"),
    toast: document.querySelector("#toast"),
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });

  els.roleSelect.addEventListener("change", async () => {
    state.role = els.roleSelect.value;
    applyRoleRules();
    renderProducts();
    renderCart();
    renderOrders();
    await loadRoleData();
    showToast(`Роль: ${currentRole().label}`);
  });

  els.customerSelect.addEventListener("change", async () => {
    state.selectedCustomerId = els.customerSelect.value;
    await loadRoleData();
  });

  els.searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await searchProducts();
  });

  els.resetFiltersBtn.addEventListener("click", async () => {
    els.searchForm.reset();
    els.inStockInput.checked = true;
    await searchProducts();
  });

  els.refreshCatalogBtn.addEventListener("click", searchProducts);
  els.refreshCartBtn.addEventListener("click", loadCart);
  els.refreshOrdersBtn.addEventListener("click", loadOrders);
  els.refreshReportsBtn.addEventListener("click", loadReports);
  els.topMonthsInput.addEventListener("change", loadReports);
  els.minPurchasesInput.addEventListener("change", loadReports);
  els.demandStartInput.addEventListener("change", loadReports);
  els.demandEndInput.addEventListener("change", loadReports);
  els.unsoldDateInput.addEventListener("change", loadReports);
  els.resetProductFormBtn.addEventListener("click", resetProductForm);

  els.productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveProduct();
  });

  els.checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await checkout();
  });
}

async function loadInitialData() {
  try {
    const [categories, customers] = await Promise.all([
      api("/categories"),
      api("/customers"),
    ]);

    state.categories = categories;
    state.customers = customers;
    state.selectedCustomerId = customers[0]?.id ?? null;

    renderCategoryOptions();
    renderCustomerOptions();
    applyRoleRules();
    await Promise.all([searchProducts(), loadRoleData()]);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function loadRoleData() {
  const role = currentRole();
  const tasks = [];

  if (role.canUseCart) tasks.push(loadCart());
  if (role.canViewOrders) tasks.push(loadOrders());
  if (role.canViewReports) tasks.push(loadReports());

  await Promise.all(tasks);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    payload = JSON.parse(text);
  }

  if (!response.ok) {
    const message = payload?.detail || "Request failed";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return payload;
}

function currentRole() {
  return ROLE_RULES[state.role];
}

function applyRoleRules() {
  const role = currentRole();
  const customerField = els.customerSelect.closest(".field");

  customerField.hidden = !(role.canUseCart || role.canViewOrders);
  els.productManagementPanel.hidden = !role.canManageProducts;
  toggleNav("cartView", role.canUseCart);
  toggleNav("ordersView", role.canViewOrders);
  toggleNav("reportsView", role.canViewReports);

  if (!role.canManageProducts) resetProductForm();

  const activeView = document.querySelector(".view.active")?.id;
  if (activeView && !isViewAllowed(activeView)) {
    setActiveView("catalogView");
  }
}

function toggleNav(viewId, isAllowed) {
  const button = document.querySelector(`.nav-button[data-view="${viewId}"]`);
  if (button) button.hidden = !isAllowed;
}

function isViewAllowed(viewId) {
  const role = currentRole();
  if (viewId === "cartView") return role.canUseCart;
  if (viewId === "ordersView") return role.canViewOrders;
  if (viewId === "reportsView") return role.canViewReports;
  return true;
}

function renderCategoryOptions() {
  const options = [
    '<option value="">Все категории</option>',
    ...state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`),
  ].join("");

  els.categorySelect.innerHTML = options;
  els.productCategoryInput.innerHTML = state.categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("");
}

function renderCustomerOptions() {
  els.customerSelect.innerHTML = state.customers
    .map((customer) => {
      const name = `${customer.firstName} ${customer.lastName}`;
      return `<option value="${customer.id}">${escapeHtml(name)}</option>`;
    })
    .join("");
  if (state.selectedCustomerId) {
    els.customerSelect.value = state.selectedCustomerId;
  }
}

async function searchProducts() {
  const params = new URLSearchParams();
  const query = els.queryInput.value.trim();
  const manufacturer = els.manufacturerInput.value.trim();

  if (query) params.set("query", query);
  if (els.categorySelect.value) params.set("category_id", els.categorySelect.value);
  if (manufacturer) params.set("manufacturer", manufacturer);
  if (els.technologySelect.value) params.set("technology", els.technologySelect.value);
  if (els.minPriceInput.value) params.set("min_price", els.minPriceInput.value);
  if (els.maxPriceInput.value) params.set("max_price", els.maxPriceInput.value);
  if (els.inStockInput.checked) params.set("in_stock", "true");

  state.products = await api(`/products/search?${params.toString()}`);
  renderProducts();
}

function renderProducts() {
  const role = currentRole();
  els.catalogCount.textContent = formatCount(state.products.length, "товар", "товара", "товаров");

  if (!state.products.length) {
    els.productGrid.innerHTML = '<div class="empty-state">Товары не найдены</div>';
    return;
  }

  els.productGrid.innerHTML = state.products
    .map((product) => {
      const maxQuantity = Math.max(product.quantity, 1);
      const disabled = product.quantity < 1 ? "disabled" : "";
      const cartControls = role.canUseCart
        ? `
          <div class="cart-row">
            <input id="qty-${product.id}" type="number" min="1" max="${maxQuantity}" value="1" ${disabled}>
            <button class="primary-button" type="button" onclick="addToCart('${product.id}')" ${disabled}>
              <span class="icon icon-cart" aria-hidden="true"></span>
              В корзину
            </button>
          </div>
        `
        : '<div class="muted">Доступен только просмотр товара</div>';
      const managementControls = role.canManageProducts
        ? `
          <div class="product-admin-row">
            <button class="secondary-button" type="button" onclick="editProduct('${product.id}')">Редактировать</button>
            <button class="danger-button" type="button" onclick="deleteProduct('${product.id}')">Удалить</button>
          </div>
        `
        : "";

      return `
        <article class="product-card">
          <div class="product-visual" data-tech="${escapeHtml(product.technology || "")}">
            <div class="printer-art" aria-hidden="true">
              <span class="printer-slot"></span>
              <span class="printer-light"></span>
            </div>
          </div>
          <div class="product-body">
            <div>
              <h3 class="product-title">${escapeHtml(product.name)}</h3>
              <div class="meta-row">
                <span>${escapeHtml(product.manufacturer)}</span>
                <span class="pill">${escapeHtml(product.technology || "Other")}</span>
              </div>
            </div>
            <div class="price-row">
              <span class="price">${formatMoney(product.price)}</span>
              <span class="stock">${product.quantity} шт.</span>
            </div>
            <div class="meta-row">
              <span>${escapeHtml(product.paperFormat || "-")}</span>
              <span>${product.colors || "-"} цв.</span>
            </div>
            ${cartControls}
            ${managementControls}
          </div>
        </article>
      `;
    })
    .join("");
}

async function addToCart(productId) {
  if (!currentRole().canUseCart || !state.selectedCustomerId) return;

  const quantityInput = document.querySelector(`#qty-${productId}`);
  const quantity = Number(quantityInput?.value || 1);

  try {
    state.cart = await api(`/customers/${state.selectedCustomerId}/cart/items`, {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
    renderCart();
    showToast("Товар добавлен в корзину");
  } catch (error) {
    showToast(error.message, true);
  }
}

function editProduct(productId) {
  if (!currentRole().canManageProducts) return;

  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  els.productIdInput.value = product.id;
  els.productNameInput.value = product.name;
  els.productManufacturerInput.value = product.manufacturer;
  els.productCategoryInput.value = product.categoryId;
  els.productTechnologyInput.value = product.technology || "Laser";
  els.productPaperFormatInput.value = product.paperFormat || "A4";
  els.productColorsInput.value = product.colors || 1;
  els.productPriceInput.value = product.price;
  els.productQuantityInput.value = product.quantity;
  els.productFormMode.textContent = `Редактирование: ${product.name}`;
  els.productManagementPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveProduct() {
  if (!currentRole().canManageProducts) return;

  const productId = els.productIdInput.value;
  const payload = {
    name: els.productNameInput.value.trim(),
    manufacturer: els.productManufacturerInput.value.trim(),
    categoryId: els.productCategoryInput.value,
    technology: els.productTechnologyInput.value,
    paperFormat: els.productPaperFormatInput.value,
    colors: Number(els.productColorsInput.value),
    price: Number(els.productPriceInput.value),
    quantity: Number(els.productQuantityInput.value),
    characteristics: {},
  };

  try {
    await api(productId ? `/products/${productId}` : "/products", {
      method: productId ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    });
    resetProductForm();
    await Promise.all([searchProducts(), currentRole().canViewReports ? loadReports() : Promise.resolve()]);
    showToast(productId ? "Товар обновлен" : "Товар создан");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deleteProduct(productId) {
  if (!currentRole().canManageProducts) return;

  const product = state.products.find((item) => item.id === productId);
  const name = product ? product.name : "товар";
  if (!confirm(`Удалить ${name}?`)) return;

  try {
    await api(`/products/${productId}`, { method: "DELETE" });
    resetProductForm();
    await Promise.all([searchProducts(), currentRole().canViewReports ? loadReports() : Promise.resolve()]);
    showToast("Товар удален");
  } catch (error) {
    showToast(error.message, true);
  }
}

function resetProductForm() {
  els.productForm.reset();
  els.productIdInput.value = "";
  els.productColorsInput.value = 1;
  els.productFormMode.textContent = "Создание нового товара";
  if (state.categories[0]) {
    els.productCategoryInput.value = state.categories[0].id;
  }
}

async function loadCart() {
  if (!currentRole().canUseCart || !state.selectedCustomerId) {
    state.cart = null;
    renderCart();
    return;
  }

  state.cart = await api(`/customers/${state.selectedCustomerId}/cart`);
  renderCart();
}

function renderCart() {
  if (!currentRole().canUseCart) {
    els.cartBadge.textContent = "0";
    els.cartTotalLine.textContent = "Корзина недоступна";
    els.cartItems.innerHTML = '<div class="empty-state">Эта роль не имеет доступа к корзине</div>';
    return;
  }

  const products = state.cart?.products || [];
  els.cartBadge.textContent = products.reduce((sum, item) => sum + item.quantity, 0);
  els.cartTotalLine.textContent = `Итого: ${formatMoney(state.cart?.totalPrice || 0)}`;

  if (!products.length) {
    els.cartItems.innerHTML = '<div class="empty-state">Корзина пуста</div>';
    return;
  }

  els.cartItems.innerHTML = products
    .map((item) => `
      <div class="cart-item">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <div class="muted">${item.quantity} шт. x ${formatMoney(item.price)}</div>
        </div>
        <strong>${formatMoney(item.subtotal)}</strong>
      </div>
    `)
    .join("");
}

async function checkout() {
  if (!currentRole().canUseCart || !state.selectedCustomerId) return;

  try {
    const address = els.deliveryAddressInput.value.trim();
    await api(`/customers/${state.selectedCustomerId}/orders/from-cart`, {
      method: "POST",
      body: JSON.stringify({ deliveryAddress: address }),
    });
    await Promise.all([loadCart(), loadOrders(), searchProducts(), currentRole().canViewReports ? loadReports() : Promise.resolve()]);
    showToast("Заказ оформлен");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function loadOrders() {
  if (!currentRole().canViewOrders || !state.selectedCustomerId) {
    state.orders = [];
    renderOrders();
    return;
  }

  state.orders = await api(`/customers/${state.selectedCustomerId}/orders`);
  renderOrders();
}

function renderOrders() {
  if (!currentRole().canViewOrders) {
    els.ordersCount.textContent = "Заказы недоступны";
    els.ordersList.innerHTML = '<div class="empty-state">Эта роль не имеет доступа к заказам</div>';
    return;
  }

  els.ordersCount.textContent = formatCount(state.orders.length, "заказ", "заказа", "заказов");

  if (!state.orders.length) {
    els.ordersList.innerHTML = '<div class="empty-state">Заказов нет</div>';
    return;
  }

  const canUpdate = currentRole().canUpdateOrders;
  els.ordersList.innerHTML = state.orders
    .map((order) => `
      <article class="order-card">
        <div class="order-meta">
          <div>
            <h3>Заказ ${order.id.slice(-6)}</h3>
            <div class="muted">${formatDate(order.orderDate)} · ${formatMoney(order.totalPrice)}</div>
          </div>
          ${canUpdate ? renderStatusForm(order) : `<span class="pill">${escapeHtml(order.status)}</span>`}
        </div>
        <div class="order-items">
          ${order.products.map((item) => `
            <div>${escapeHtml(item.name)} · ${item.quantity} шт. · ${formatMoney(item.subtotal)}</div>
          `).join("")}
        </div>
      </article>
    `)
    .join("");
}

function renderStatusForm(order) {
  return `
    <form class="status-form" onsubmit="updateOrderStatus(event, '${order.id}')">
      <select id="status-${order.id}">
        ${["processing", "shipped", "delivered", "cancelled"].map((status) => `
          <option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>
        `).join("")}
      </select>
      <button class="secondary-button" type="submit">Сохранить</button>
    </form>
  `;
}

async function updateOrderStatus(event, orderId) {
  event.preventDefault();
  if (!currentRole().canUpdateOrders) return;

  const status = document.querySelector(`#status-${orderId}`).value;

  try {
    await api(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await Promise.all([loadOrders(), currentRole().canViewReports ? loadReports() : Promise.resolve()]);
    showToast("Статус обновлен");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function loadReports() {
  if (!currentRole().canViewReports) return;

  const months = els.topMonthsInput.value || 3;
  const minPurchases = els.minPurchasesInput.value || 1;
  const startDate = els.demandStartInput.value;
  const endDate = els.demandEndInput.value;
  const unsoldDate = els.unsoldDateInput.value;

  try {
    const [topSales, activeCustomers, categoryDemand, unsoldProducts] = await Promise.all([
      api(`/reports/top-sales?months=${months}&limit=5`),
      api(`/reports/active-customers?min_purchases=${minPurchases}&days=90`),
      api(`/reports/category-demand?start_date=${startDate}&end_date=${endDate}`),
      api(`/reports/unsold-products?date=${unsoldDate}`),
    ]);

    renderTopSales(topSales);
    renderActiveCustomers(activeCustomers);
    renderCategoryDemand(categoryDemand);
    renderUnsoldProducts(unsoldProducts);
  } catch (error) {
    showToast(error.message, true);
  }
}

function renderTopSales(items) {
  renderReportList(els.topSalesReport, items, (item) => ({
    title: item.name,
    meta: `${item.soldQuantity} шт.`,
    value: formatMoney(item.revenue),
  }));
}

function renderActiveCustomers(items) {
  renderReportList(els.activeCustomersReport, items, (item) => ({
    title: `${item.firstName} ${item.lastName}`,
    meta: `${item.purchaseCount} заказов`,
    value: formatMoney(item.totalSpent),
  }));
}

function renderCategoryDemand(items) {
  renderReportList(els.categoryDemandReport, items, (item) => ({
    title: item.name,
    meta: `${item.soldQuantity} шт.`,
    value: formatMoney(item.revenue),
  }));
}

function renderUnsoldProducts(items) {
  renderReportList(els.unsoldProductsReport, items.slice(0, 8), (item) => ({
    title: item.name,
    meta: item.manufacturer,
    value: formatMoney(item.price),
  }));
}

function renderReportList(container, items, mapper) {
  if (!items.length) {
    container.innerHTML = '<div class="empty-state">Нет данных</div>';
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const row = mapper(item);
      return `
        <div class="report-item">
          <div>
            <strong>${escapeHtml(row.title)}</strong>
            <span>${escapeHtml(row.meta)}</span>
          </div>
          <strong>${escapeHtml(row.value)}</strong>
        </div>
      `;
    })
    .join("");
}

function setActiveView(viewId) {
  const targetView = isViewAllowed(viewId) ? viewId : "catalogView";

  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === targetView);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === targetView);
  });
}

function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle("error", isError);
  els.toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("visible"), 2600);
}

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCount(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? few : many;
  return `${count} ${word}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addToCart = addToCart;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
