const ROLE_RULES = {
  admin: {
    label: "Администратор",
    canUseCart: true,
    canViewOrders: true,
    canUpdateOrders: true,
    canViewReports: true,
    canManageProducts: true,
    canManageStaff: true,
  },
  manager: {
    label: "Менеджер",
    canUseCart: false,
    canViewOrders: true,
    canUpdateOrders: true,
    canViewReports: true,
    canManageProducts: true,
    canManageStaff: true,
  },
  user: {
    label: "Пользователь",
    canUseCart: true,
    canViewOrders: true,
    canUpdateOrders: false,
    canViewReports: false,
    canManageProducts: false,
    canManageStaff: false,
  },
  guest: {
    label: "Гость",
    canUseCart: false,
    canViewOrders: false,
    canUpdateOrders: false,
    canViewReports: false,
    canManageProducts: false,
    canManageStaff: false,
  },
};

const AUTH_STORAGE_KEY = "shop_console_auth";

const state = {
  auth: null,
  categories: [],
  customers: [],
  selectedCustomerId: null,
  products: [],
  cart: null,
  orders: [],
  branches: [],
  selectedBranchId: null,
  branchStructure: null,
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  bootstrapAuth();
});

function cacheElements() {
  Object.assign(els, {
    loginOverlay: document.querySelector("#loginOverlay"),
    loginForm: document.querySelector("#loginForm"),
    loginUsername: document.querySelector("#loginUsername"),
    loginPassword: document.querySelector("#loginPassword"),
    loginError: document.querySelector("#loginError"),
    userPanel: document.querySelector("#userPanel"),
    userNameLabel: document.querySelector("#userNameLabel"),
    userRoleLabel: document.querySelector("#userRoleLabel"),
    logoutBtn: document.querySelector("#logoutBtn"),
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
    refreshStaffBtn: document.querySelector("#refreshStaffBtn"),
    branchSelect: document.querySelector("#branchSelect"),
    branchForm: document.querySelector("#branchForm"),
    branchNameInput: document.querySelector("#branchNameInput"),
    branchCityInput: document.querySelector("#branchCityInput"),
    branchAddressInput: document.querySelector("#branchAddressInput"),
    branchPhoneInput: document.querySelector("#branchPhoneInput"),
    branchOpenedInput: document.querySelector("#branchOpenedInput"),
    branchStructurePanel: document.querySelector("#branchStructurePanel"),
    branchSummary: document.querySelector("#branchSummary"),
    staffEmptyHint: document.querySelector("#staffEmptyHint"),
    departmentsList: document.querySelector("#departmentsList"),
    storeZonesList: document.querySelector("#storeZonesList"),
    employeesList: document.querySelector("#employeesList"),
    departmentForm: document.querySelector("#departmentForm"),
    storeZoneForm: document.querySelector("#storeZoneForm"),
    employeeForm: document.querySelector("#employeeForm"),
    departmentNameInput: document.querySelector("#departmentNameInput"),
    departmentDescInput: document.querySelector("#departmentDescInput"),
    zoneNameInput: document.querySelector("#zoneNameInput"),
    zoneTypeInput: document.querySelector("#zoneTypeInput"),
    zoneFloorInput: document.querySelector("#zoneFloorInput"),
    zoneAreaInput: document.querySelector("#zoneAreaInput"),
    empFirstNameInput: document.querySelector("#empFirstNameInput"),
    empLastNameInput: document.querySelector("#empLastNameInput"),
    empPositionInput: document.querySelector("#empPositionInput"),
    empEmailInput: document.querySelector("#empEmailInput"),
    empPhoneInput: document.querySelector("#empPhoneInput"),
    empDepartmentInput: document.querySelector("#empDepartmentInput"),
    empHiredInput: document.querySelector("#empHiredInput"),
    toast: document.querySelector("#toast"),
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });

  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await login(els.loginUsername.value.trim(), els.loginPassword.value);
  });

  document.querySelectorAll("[data-demo-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      els.loginUsername.value = button.dataset.demoUser;
      els.loginPassword.value = button.dataset.demoPass;
      await login(button.dataset.demoUser, button.dataset.demoPass);
    });
  });

  els.logoutBtn.addEventListener("click", () => logout());

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

  els.refreshStaffBtn.addEventListener("click", loadStaffData);
  els.branchSelect.addEventListener("change", async () => {
    state.selectedBranchId = els.branchSelect.value ? Number(els.branchSelect.value) : null;
    await loadBranchStructure();
  });
  els.branchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createBranch();
  });
  els.departmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createDepartment();
  });
  els.storeZoneForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createStoreZone();
  });
  els.employeeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createEmployee();
  });
}

function bootstrapAuth() {
  const saved = readStoredAuth();
  if (saved) {
    login(saved.username, saved.password, { silent: true }).catch(() => showLogin());
    return;
  }
  showLogin();
}

function readStoredAuth() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.username || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeAuth(username, password) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username, password }));
}

function clearStoredAuth() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function showLogin(message = "") {
  document.body.classList.add("login-locked");
  els.loginOverlay.hidden = false;
  els.userPanel.hidden = true;
  if (message) {
    els.loginError.hidden = false;
    els.loginError.textContent = message;
  } else {
    els.loginError.hidden = true;
    els.loginError.textContent = "";
  }
}

function hideLogin() {
  document.body.classList.remove("login-locked");
  els.loginOverlay.hidden = true;
  els.loginError.hidden = true;
  els.loginError.textContent = "";
}

function renderUserPanel() {
  if (!state.auth) {
    els.userPanel.hidden = true;
    return;
  }
  els.userPanel.hidden = false;
  els.userNameLabel.textContent = state.auth.username;
  els.userRoleLabel.textContent = currentRole().label;
}

async function login(username, password, options = {}) {
  const { silent = false } = options;

  state.auth = { username, password, role: null };
  let profile;
  try {
    profile = await api("/auth/me");
  } catch (error) {
    state.auth = null;
    if (!silent) {
      showLogin(formatAuthError(error));
    }
    throw error;
  }

  state.auth = { username, password, role: profile.role };
  storeAuth(username, password);
  hideLogin();
  renderUserPanel();
  applyRoleRules();

  if (!silent) {
    showToast(`Вход выполнен: ${currentRole().label}`);
  }

  await loadInitialData();
}

function logout() {
  state.auth = null;
  state.categories = [];
  state.customers = [];
  state.selectedCustomerId = null;
  state.products = [];
  state.cart = null;
  state.orders = [];
  state.branches = [];
  state.selectedBranchId = null;
  state.branchStructure = null;
  clearStoredAuth();
  showLogin();
  renderUserPanel();
  els.productGrid.innerHTML = "";
  els.catalogCount.textContent = "0 товаров";
  setActiveView("catalogView");
}

function formatAuthError(error) {
  const message = error?.message || "Ошибка входа";
  if (message.includes("Invalid credentials") || message.includes("401")) {
    return "Неверный логин или пароль";
  }
  if (message.includes("403")) {
    return "Недостаточно прав";
  }
  return message;
}

async function loadInitialData() {
  if (!state.auth?.role) return;
  try {
    state.categories = await api("/categories");
    renderCategoryOptions();
    applyRoleRules();

    if (currentRole().canUseCart || currentRole().canViewOrders) {
      state.customers = await api("/customers");
      state.selectedCustomerId = state.customers[0]?.id ?? null;
      renderCustomerOptions();
    } else {
      state.customers = [];
      state.selectedCustomerId = null;
      els.customerSelect.innerHTML = "";
    }

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
  if (role.canManageStaff) tasks.push(loadStaffData());

  await Promise.all(tasks);
}

async function api(path, options = {}) {
  if (!state.auth) {
    throw new Error("Требуется авторизация");
  }

  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${state.auth.username}:${state.auth.password}`)}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }

  if (response.status === 401) {
    logout();
    throw new Error("Сессия истекла. Войдите снова.");
  }

  if (!response.ok) {
    const message = payload?.detail || "Request failed";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return payload;
}

function currentRole() {
  const role = state.auth?.role || "guest";
  return ROLE_RULES[role] || ROLE_RULES.guest;
}

function applyRoleRules() {
  const role = currentRole();
  const customerField = els.customerSelect.closest(".field");

  customerField.hidden = !(role.canUseCart || role.canViewOrders);
  els.productManagementPanel.hidden = !role.canManageProducts;
  toggleNav("cartView", role.canUseCart);
  toggleNav("ordersView", role.canViewOrders);
  toggleNav("reportsView", role.canViewReports);
  toggleNav("staffView", role.canManageStaff);

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
  if (viewId === "staffView") return role.canManageStaff;
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
    .map((item) => {
      const productId = item.productId || item.product_id;
      return `
      <div class="cart-item">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <div class="muted">${item.quantity} шт. x ${formatMoney(item.price)}</div>
        </div>
        <div class="cart-item-side">
          <strong>${formatMoney(item.subtotal)}</strong>
          <div class="cart-item-actions">
            <label class="field tiny cart-qty-field">
              <span>Кол-во</span>
              <input
                type="number"
                min="1"
                value="${item.quantity}"
                aria-label="Количество"
                onchange="updateCartQuantity('${productId}', this.value)"
              >
            </label>
            <button
              class="secondary-button danger"
              type="button"
              onclick="removeFromCart('${productId}')"
            >Удалить</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

async function removeFromCart(productId) {
  if (!currentRole().canUseCart || !state.selectedCustomerId) return;

  try {
    state.cart = await api(
      `/customers/${state.selectedCustomerId}/cart/items/${productId}`,
      { method: "DELETE" },
    );
    renderCart();
    showToast("Товар удалён из корзины");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function updateCartQuantity(productId, rawQuantity) {
  if (!currentRole().canUseCart || !state.selectedCustomerId) return;

  const quantity = Number.parseInt(rawQuantity, 10);
  if (!Number.isFinite(quantity) || quantity < 1) {
    showToast("Укажите количество не меньше 1", true);
    renderCart();
    return;
  }

  try {
    state.cart = await api(
      `/customers/${state.selectedCustomerId}/cart/items/${productId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      },
    );
    renderCart();
    showToast("Количество обновлено");
  } catch (error) {
    showToast(error.message, true);
    await loadCart();
  }
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

  if (targetView === "staffView" && currentRole().canManageStaff) {
    loadStaffData().catch((error) => showToast(error.message, true));
  }
}

async function loadStaffData() {
  if (!currentRole().canManageStaff) return;

  state.branches = await api("/branches");
  renderBranchOptions();

  if (state.selectedBranchId && !state.branches.some((b) => b.id === state.selectedBranchId)) {
    state.selectedBranchId = null;
  }

  if (!state.selectedBranchId && state.branches.length) {
    state.selectedBranchId = state.branches[0].id;
    els.branchSelect.value = String(state.selectedBranchId);
  }

  await loadBranchStructure();
}

function renderBranchOptions() {
  const options = [
    '<option value="">— выберите филиал —</option>',
    ...state.branches.map(
      (branch) =>
        `<option value="${branch.id}">${escapeHtml(branch.name)} — ${escapeHtml(branch.city)}</option>`,
    ),
  ];
  els.branchSelect.innerHTML = options.join("");
  if (state.selectedBranchId) {
    els.branchSelect.value = String(state.selectedBranchId);
  }
}

async function loadBranchStructure() {
  if (!state.selectedBranchId) {
    state.branchStructure = null;
    els.branchStructurePanel.hidden = true;
    els.staffEmptyHint.hidden = false;
    return;
  }

  state.branchStructure = await api(`/branches/${state.selectedBranchId}/structure`);
  els.branchStructurePanel.hidden = false;
  els.staffEmptyHint.hidden = true;
  renderBranchStructure();
}

function renderBranchStructure() {
  const data = state.branchStructure;
  if (!data) return;

  const branch = data.branch;
  els.branchSummary.innerHTML = `
    <div>
      <strong>${escapeHtml(branch.name)}</strong>
      <span class="pill">${escapeHtml(branch.city)}</span>
    </div>
    <p class="muted">${escapeHtml(branch.address || "—")} · ${escapeHtml(branch.phone || "—")}${
      branch.opened_at ? ` · с ${escapeHtml(branch.opened_at)}` : ""
    }</p>
  `;

  els.departmentsList.innerHTML = renderStaffRows(
    data.departments,
    (d) => `<strong>${escapeHtml(d.name)}</strong><span class="muted">${escapeHtml(d.description || "—")}</span>`,
    "Отделов пока нет",
  );

  els.storeZonesList.innerHTML = renderStaffRows(
    data.store_zones,
    (z) =>
      `<strong>${escapeHtml(z.name)}</strong><span class="muted">${escapeHtml(z.zone_type)} · этаж ${z.floor_number}${
        z.area_sqm != null ? ` · ${z.area_sqm} м²` : ""
      }</span>`,
    "Зон пока нет",
  );

  els.employeesList.innerHTML = data.employees.length
    ? data.employees
        .map((e) => {
          const dept = data.departments.find((d) => d.id === e.department_id);
          const deptLabel = dept ? dept.name : "—";
          return `
            <div class="staff-row staff-row-actions">
              <div>
                <strong>${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)}</strong>
                <span class="muted">${escapeHtml(e.position)} · ${escapeHtml(e.email)}</span>
                <span class="muted">Отдел: ${escapeHtml(deptLabel)} · с ${escapeHtml(e.hired_at)}</span>
              </div>
              <button class="secondary-button danger" type="button" onclick="deleteEmployee(${e.id})">Удалить</button>
            </div>
          `;
        })
        .join("")
    : '<div class="muted">Сотрудников пока нет</div>';

  els.empDepartmentInput.innerHTML = [
    '<option value="">Без отдела</option>',
    ...data.departments.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`),
  ].join("");
}

function renderStaffRows(items, renderItem, emptyText) {
  if (!items.length) {
    return `<div class="muted">${emptyText}</div>`;
  }
  return items
    .map(
      (item) => `
        <div class="staff-row">${renderItem(item)}</div>
      `,
    )
    .join("");
}

async function createBranch() {
  const payload = {
    name: els.branchNameInput.value.trim(),
    city: els.branchCityInput.value.trim(),
    address: els.branchAddressInput.value.trim(),
    phone: els.branchPhoneInput.value.trim(),
  };
  const opened = els.branchOpenedInput.value;
  if (opened) payload.opened_at = opened;

  const branch = await api("/branches", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  els.branchForm.reset();
  state.selectedBranchId = branch.id;
  showToast(`Филиал «${branch.name}» создан`);
  await loadStaffData();
}

async function createDepartment() {
  if (!state.selectedBranchId) {
    showToast("Сначала выберите филиал", true);
    return;
  }

  await api("/departments", {
    method: "POST",
    body: JSON.stringify({
      branch_id: state.selectedBranchId,
      name: els.departmentNameInput.value.trim(),
      description: els.departmentDescInput.value.trim(),
    }),
  });

  els.departmentForm.reset();
  showToast("Отдел добавлен");
  await loadBranchStructure();
}

async function createStoreZone() {
  if (!state.selectedBranchId) {
    showToast("Сначала выберите филиал", true);
    return;
  }

  const areaRaw = els.zoneAreaInput.value.trim();
  const payload = {
    branch_id: state.selectedBranchId,
    name: els.zoneNameInput.value.trim(),
    floor_number: Number(els.zoneFloorInput.value) || 1,
    zone_type: els.zoneTypeInput.value,
  };
  if (areaRaw) payload.area_sqm = Number(areaRaw);

  await api("/store-zones", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  els.storeZoneForm.reset();
  els.zoneFloorInput.value = "1";
  showToast("Зона добавлена");
  await loadBranchStructure();
}

async function createEmployee() {
  if (!state.selectedBranchId) {
    showToast("Сначала выберите филиал", true);
    return;
  }

  const deptVal = els.empDepartmentInput.value;
  const hired = els.empHiredInput.value;
  const payload = {
    first_name: els.empFirstNameInput.value.trim(),
    last_name: els.empLastNameInput.value.trim(),
    position: els.empPositionInput.value.trim(),
    email: els.empEmailInput.value.trim(),
    phone: els.empPhoneInput.value.trim(),
    branch_id: state.selectedBranchId,
    department_id: deptVal ? Number(deptVal) : null,
  };
  if (hired) payload.hired_at = hired;

  await api("/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  els.employeeForm.reset();
  showToast("Сотрудник добавлен");
  await loadBranchStructure();
}

async function deleteEmployee(employeeId) {
  if (!confirm("Удалить сотрудника?")) return;

  await api(`/employees/${employeeId}`, { method: "DELETE" });
  showToast("Сотрудник удалён");
  await loadBranchStructure();
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
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.deleteEmployee = deleteEmployee;
