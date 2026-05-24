# Internet Shop API with MongoDB

Учебный проект FastAPI + MongoDB для базы данных интернет-магазина.

## Запуск

```bash
docker compose up --build
```

После старта API доступен здесь:

- Фронтенд: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

При первом старте MongoDB-контейнер автоматически выполняет [docker/mongo-init/01-init-shop.js](/Users/mac/VisualStudioProjects/mongodb_administration/docker/mongo-init/01-init-shop.js). Скрипт:

- очищает БД `shop` через `db.dropDatabase()`;
- создает коллекции `categories`, `products`, `customers`, `employees`, `orders`, `carts`;
- включает MongoDB JSON Schema validation через `$jsonSchema`, `validationLevel: "strict"` и `validationAction: "error"`;
- заполняет коллекции демонстрационными данными через `insertMany(...)`;
- создает индексы через `createIndex(...)`;
- создает роли MongoDB через `createRole(...)`;
- создает пользователей MongoDB через `createUser(...)`.

Скрипты из `/docker-entrypoint-initdb.d` выполняются только когда volume MongoDB пустой. Чтобы полностью пересоздать учебную БД:

```bash
docker compose down -v
docker compose up --build
```

## MongoDB init script

Основной init-скрипт:

```bash
docker/mongo-init/01-init-shop.js
```

## Пользователи БД

- `shop_admin / admin123` — полный доступ к БД `shop`.
- `shop_manager / manager123` — управление товарами, категориями и статусами заказов, без управления пользователями.
- `shop_user / user123` — просмотр товаров, корзина, создание заказов.
- `shop_guest / guest123` — только просмотр товаров и категорий.

## Основные запросы API

- `GET /categories` — список всех категорий.
- `GET /categories/{category_id}/products` — товары в категории.
- `GET /products/by-name?name=Canon` — поиск продукта по названию.
- `GET /products/search?query=Canon&category_name=Inkjet&min_price=100&max_price=300&manufacturer=Canon&in_stock=true` — поиск по ключевым словам, категории, цене и характеристикам.
- `POST /customers/{customer_id}/cart/items` — добавить товар в корзину.
- `GET /customers/{customer_id}/cart` — получить корзину и общую стоимость.
- `POST /customers/{customer_id}/orders/from-cart` — оформить заказ из корзины.
- `GET /customers/{customer_id}/orders` — заказы клиента.
- `PATCH /orders/{order_id}/status` — обновить статус заказа.
- `GET /reports/top-sales?months=3&limit=10` — топ продаж за последние месяцы.
- `GET /reports/active-customers?min_purchases=1&days=90` — клиенты, которые сделали больше N покупок за период.
- `GET /reports/category-demand?start_date=2026-05-01&end_date=2026-05-31` — спрос по категориям за срок.
- `GET /reports/unsold-products?date=2026-05-07` — товары, не проданные в дату.

## Фронтенд

Простой интерфейс находится в `app/static` и открывается по адресу http://localhost:8000.

В нем доступны:

- переключатель роли `Администратор / Менеджер / Пользователь / Гость`;
- поиск товаров по ключевым словам, категории, производителю, цене и наличию;
- добавление товаров в корзину выбранного клиента;
- подсчет общей стоимости корзины;
- оформление заказа из корзины;
- просмотр заказов клиента и обновление статуса заказа;
- создание, редактирование и удаление товаров для ролей администратора и менеджера;
- отчеты по топ-продажам, активным клиентам, спросу категорий и непроданным товарам.

Ограничения фронтенда по ролям:

- `Администратор` — каталог, корзина, заказы, статусы, отчеты, управление товарами.
- `Менеджер` — каталог, заказы, статусы, отчеты, управление товарами; корзина недоступна.
- `Пользователь` — каталог, корзина, оформление заказа, просмотр своих заказов.
- `Гость` — только просмотр каталога и поиск товаров.

## Демо ObjectId

Для быстрых проверок:

- customer Demo: `665000000000000000000201`
- customer Alice: `665000000000000000000202`
- category Inkjet: `665000000000000000000002`
- product Canon PIXMA: `665000000000000000000102`
- order Demo May: `665000000000000000000402`

Пример добавления товара в корзину:

```bash
curl -X POST http://localhost:8000/customers/665000000000000000000201/cart/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"665000000000000000000102","quantity":2}'
```

Остановить контейнеры:

```bash
docker compose down
```
