const dbName = "shop";
db = db.getSiblingDB(dbName);

db.dropDatabase();

const numberType = ["int", "long", "double", "decimal"];
const integerType = ["int", "long"];

db.createCollection("categories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: { bsonType: "string", minLength: 3 },
        description: { bsonType: "string" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "quantity", "price", "manufacturer", "categoryId"],
      properties: {
        name: { bsonType: "string", minLength: 3 },
        quantity: { bsonType: integerType, minimum: 0 },
        price: { bsonType: numberType, minimum: 0 },
        manufacturer: { bsonType: "string" },
        categoryId: { bsonType: "objectId" },
        technology: { enum: ["Laser", "Inkjet", "LED", "3D"] },
        paperFormat: { enum: ["A4", "A3", "A5"] },
        colors: { bsonType: integerType, minimum: 1 },
        characteristics: { bsonType: "object" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.createCollection("customers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["firstName", "lastName", "email", "phone"],
      properties: {
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
        phone: { bsonType: "string" },
        address: { bsonType: "string" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.createCollection("employees", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["firstName", "lastName", "position", "email", "salary"],
      properties: {
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        position: { bsonType: "string" },
        email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
        phone: { bsonType: "string" },
        salary: { bsonType: numberType, minimum: 0 },
        hiredAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["customerId", "products", "totalPrice", "status", "deliveryAddress", "orderDate"],
      properties: {
        customerId: { bsonType: "objectId" },
        employeeId: { bsonType: "objectId" },
        products: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["productId", "name", "quantity", "price"],
            properties: {
              productId: { bsonType: "objectId" },
              name: { bsonType: "string" },
              quantity: { bsonType: integerType, minimum: 1 },
              price: { bsonType: numberType, minimum: 0 },
            },
          },
        },
        totalPrice: { bsonType: numberType, minimum: 0 },
        status: { enum: ["processing", "shipped", "delivered", "cancelled"] },
        deliveryAddress: { bsonType: "string" },
        orderDate: { bsonType: "date" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

db.createCollection("carts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["customerId", "products", "updatedAt"],
      properties: {
        customerId: { bsonType: "objectId" },
        products: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["productId", "name", "quantity", "price"],
            properties: {
              productId: { bsonType: "objectId" },
              name: { bsonType: "string" },
              quantity: { bsonType: integerType, minimum: 1 },
              price: { bsonType: numberType, minimum: 0 },
            },
          },
        },
        updatedAt: { bsonType: "date" },
      },
    },
  },
  validationLevel: "strict",
  validationAction: "error",
});

const ids = {
  categories: {
    laser: ObjectId("100000000000000000000001"),
    inkjet: ObjectId("100000000000000000000002"),
    threeD: ObjectId("100000000000000000000003"),
    office: ObjectId("100000000000000000000004"),
    photo: ObjectId("100000000000000000000005"),
  },

  products: {
    hpLaser: ObjectId("100000000000000000000101"),
    canonPixma: ObjectId("100000000000000000000102"),
    epsonEcoTank: ObjectId("100000000000000000000103"),
    anycubic: ObjectId("100000000000000000000104"),
    brotherLaser: ObjectId("100000000000000000000105"),
    hpDesignJet: ObjectId("100000000000000000000106"),
    canonSelphy: ObjectId("100000000000000000000107"),
  },

  customers: {
    demo: ObjectId("100000000000000000000201"),
    alice: ObjectId("100000000000000000000202"),
    sofia: ObjectId("100000000000000000000203"),
    john: ObjectId("100000000000000000000204"),
    maria: ObjectId("100000000000000000000205"),
    alex: ObjectId("100000000000000000000206"),
  },

  employees: {
    manager: ObjectId("100000000000000000000301"),
    analyst: ObjectId("100000000000000000000302"),
  },

  orders: {
    demoApril: ObjectId("100000000000000000000401"),
    demoMay: ObjectId("100000000000000000000402"),
    aliceDesignJet: ObjectId("100000000000000000000403"),
    aliceBrother: ObjectId("100000000000000000000404"),
    sofiaAnycubic: ObjectId("100000000000000000000405"),
    sofiaPhoto: ObjectId("100000000000000000000406"),
    johnLaser: ObjectId("100000000000000000000407"),
    mariaInkjet: ObjectId("100000000000000000000408"),
    alexDesignJet: ObjectId("100000000000000000000409"),
    demoMay2: ObjectId("100000000000000000000410"),
    aliceBrother2: ObjectId("100000000000000000000411"),
    sofiaPhoto2: ObjectId("100000000000000000000412"),
    johnLaser2: ObjectId("100000000000000000000413"),
    mariaInkjet2: ObjectId("100000000000000000000414"),
  },
};

function total(products) {
  return Number(products.reduce((sum, product) => sum + product.price * product.quantity, 0).toFixed(2));
}

db.categories.insertMany([
  { _id: ids.categories.laser, name: "Laser Printers", description: "Printer for fast office printing in monochrome" },
  { _id: ids.categories.inkjet, name: "Inkjet Printers", description: "Printer for small office and home" },
  { _id: ids.categories.threeD, name: "3D Printers", description: "Desktop additive devices" },
  { _id: ids.categories.office, name: "Office Printers", description: "Super long-format printers" },
  { _id: ids.categories.photo, name: "Photo Printers", description: "Compact printers for photo" },
]);

db.products.insertMany([
  { _id: ids.products.hpLaser, name: "HP LaserJet Pro M404", manufacturer: "HP", technology: "Laser", paperFormat: "A4", colors: NumberInt(1), price: 299.99, quantity: NumberInt(15), categoryId: ids.categories.laser, characteristics: { print_speed: "38 ppm", resolution: "1200x1200", tray_capacity: "250" } },
  { _id: ids.products.canonPixma, name: "Canon PIXMA G3411", manufacturer: "Canon", technology: "Inkjet", paperFormat: "A4", colors: NumberInt(4), price: 199.99, quantity: NumberInt(20), categoryId: ids.categories.inkjet, characteristics: { print_speed: "9 ppm", resolution: "4800x1200", tray_capacity: "100" } },
  { _id: ids.products.epsonEcoTank, name: "Epson EcoTank L3250", manufacturer: "Epson", technology: "Inkjet", paperFormat: "A4", colors: NumberInt(4), price: 249.99, quantity: NumberInt(10), categoryId: ids.categories.inkjet, characteristics: { print_speed: "10 ppm", resolution: "5760x1440", tray_capacity: "100" } },
  { _id: ids.products.anycubic, name: "Anycubic Kobra 2", manufacturer: "Anycubic", technology: "3D", paperFormat: "A3", colors: NumberInt(1), price: 450, quantity: NumberInt(5), categoryId: ids.categories.threeD, characteristics: { print_speed: "250 mm/s", resolution: "0.1 mm", tray_capacity: "1 spool" } },
  { _id: ids.products.brotherLaser, name: "Brother HL-L2370DN", manufacturer: "Brother", technology: "Laser", paperFormat: "A4", colors: NumberInt(1), price: 320, quantity: NumberInt(12), categoryId: ids.categories.laser, characteristics: { print_speed: "34 ppm", resolution: "1200x1200", tray_capacity: "250" } },
  { _id: ids.products.hpDesignJet, name: "HP DesignJet T650", manufacturer: "HP", technology: "Inkjet", paperFormat: "A3", colors: NumberInt(4), price: 1200, quantity: NumberInt(4), categoryId: ids.categories.office, characteristics: { print_speed: "25 sec/page", resolution: "2400x1200", tray_capacity: "150" } },
  { _id: ids.products.canonSelphy, name: "Canon SELPHY CP1500", manufacturer: "Canon", technology: "Inkjet", paperFormat: "A5", colors: NumberInt(4), price: 180, quantity: NumberInt(8), categoryId: ids.categories.photo, characteristics: { print_speed: "41 sec/photo", resolution: "300x300", tray_capacity: "18" } },
]);

db.customers.insertMany([
  { _id: ids.customers.demo, firstName: "TEST", lastName: "Client", email: "test.client@example.com", phone: "+79990000001", address: "Moscow, Stromynka st., 20" },
  { _id: ids.customers.alice, firstName: "Anna", lastName: "Ivanova", email: "anna@example.com", phone: "+79990000002", address: "Moscow, Arbat st., 15" },
  { _id: ids.customers.sofia, firstName: "Vika", lastName: "Petrova", email: "vika@example.com", phone: "+79990000003", address: "Moscow, Tverskaya st., 7" },
  { _id: ids.customers.john, firstName: "John", lastName: "Smith", email: "john.smith@example.com", phone: "+79990000004", address: "Moscow, Lenina ave., 45" },
  { _id: ids.customers.maria, firstName: "Maria", lastName: "Gness", email: "maria@example.com", phone: "+79990000005", address: "Moscow, Pushkin sq., 3" },
  { _id: ids.customers.alex, firstName: "Nikita", lastName: "Pchelintsev", email: "nikita@example.com", phone: "+79990000006", address: "Moscow, Red Square, 1" },
]);

db.employees.insertMany([
  { _id: ids.employees.manager, firstName: "Ivan", lastName: "Manager", position: "manager", email: "manager@example.com", phone: "+79991111111", salary: 120000, hiredAt: new Date("2024-02-01T09:00:00Z") },
  { _id: ids.employees.analyst, firstName: "Elena", lastName: "Analyst", position: "analyst", email: "analyst@example.com", phone: "+79992222222", salary: 98000, hiredAt: new Date("2024-06-15T09:00:00Z") },
]);

db.carts.insertMany([
  { customerId: ids.customers.demo, products: [], updatedAt: new Date("2026-05-20T08:00:00Z") },
  { customerId: ids.customers.alice, products: [{ productId: ids.products.brotherLaser, name: "Brother HL-L2370DN", quantity: NumberInt(1), price: 320 }], updatedAt: new Date("2026-05-20T09:00:00Z") },
  { customerId: ids.customers.sofia, products: [{ productId: ids.products.anycubic, name: "Anycubic Kobra 2", quantity: NumberInt(1), price: 450 }], updatedAt: new Date("2026-05-20T10:00:00Z") },
  { customerId: ids.customers.john, products: [{ productId: ids.products.hpLaser, name: "HP LaserJet Pro M404", quantity: NumberInt(2), price: 299.99 }], updatedAt: new Date("2026-05-20T11:00:00Z") },
  { customerId: ids.customers.maria, products: [{ productId: ids.products.canonPixma, name: "Canon PIXMA G3411", quantity: NumberInt(1), price: 199.99 }], updatedAt: new Date("2026-05-20T12:00:00Z") },
  { customerId: ids.customers.alex, products: [], updatedAt: new Date("2026-05-20T13:00:00Z") },
]);

const orderProducts = {
  demoApril: [{ productId: ids.products.hpLaser, name: "HP LaserJet Pro M404", quantity: NumberInt(2), price: 299.99 }],
  demoMay: [{ productId: ids.products.canonPixma, name: "Canon PIXMA G3411", quantity: NumberInt(1), price: 199.99 }],
  demoMay2: [{ productId: ids.products.epsonEcoTank, name: "Epson EcoTank L3250", quantity: NumberInt(1), price: 249.99 }],
  aliceDesignJet: [{ productId: ids.products.hpDesignJet, name: "HP DesignJet T650", quantity: NumberInt(1), price: 1200 }],
  aliceBrother: [{ productId: ids.products.brotherLaser, name: "Brother HL-L2370DN", quantity: NumberInt(2), price: 320 }],
  aliceBrother2: [{ productId: ids.products.hpLaser, name: "HP LaserJet Pro M404", quantity: NumberInt(1), price: 299.99 }],
  sofiaAnycubic: [{ productId: ids.products.anycubic, name: "Anycubic Kobra 2", quantity: NumberInt(1), price: 450 }],
  sofiaPhoto: [{ productId: ids.products.canonSelphy, name: "Canon SELPHY CP1500", quantity: NumberInt(3), price: 180 }],
  sofiaPhoto2: [{ productId: ids.products.canonSelphy, name: "Canon SELPHY CP1500", quantity: NumberInt(2), price: 180 }],
  johnLaser: [{ productId: ids.products.hpLaser, name: "HP LaserJet Pro M404", quantity: NumberInt(1), price: 299.99 }],
  johnLaser2: [{ productId: ids.products.brotherLaser, name: "Brother HL-L2370DN", quantity: NumberInt(3), price: 320 }],
  mariaInkjet: [{ productId: ids.products.canonPixma, name: "Canon PIXMA G3411", quantity: NumberInt(2), price: 199.99 }],
  mariaInkjet2: [{ productId: ids.products.epsonEcoTank, name: "Epson EcoTank L3250", quantity: NumberInt(1), price: 249.99 }],
  alexDesignJet: [{ productId: ids.products.hpDesignJet, name: "HP DesignJet T650", quantity: NumberInt(1), price: 1200 }],
};

db.orders.insertMany([
  { _id: ids.orders.demoApril, customerId: ids.customers.demo, employeeId: ids.employees.manager, products: orderProducts.demoApril, totalPrice: total(orderProducts.demoApril), status: "delivered", deliveryAddress: "Moscow, Stromynka st., 20", orderDate: new Date("2026-04-25T10:00:00Z") },
  { _id: ids.orders.demoMay, customerId: ids.customers.demo, employeeId: ids.employees.manager, products: orderProducts.demoMay, totalPrice: total(orderProducts.demoMay), status: "shipped", deliveryAddress: "Moscow, Vernadskogo ave., 78", orderDate: new Date("2026-05-07T12:30:00Z") },
  { _id: ids.orders.demoMay2, customerId: ids.customers.demo, employeeId: ids.employees.manager, products: orderProducts.demoMay2, totalPrice: total(orderProducts.demoMay2), status: "delivered", deliveryAddress: "Moscow, Stromynka st., 20", orderDate: new Date("2026-05-14T14:00:00Z") },
  { _id: ids.orders.aliceDesignJet, customerId: ids.customers.alice, employeeId: ids.employees.analyst, products: orderProducts.aliceDesignJet, totalPrice: total(orderProducts.aliceDesignJet), status: "processing", deliveryAddress: "Moscow, Arbat st., 15", orderDate: new Date("2026-05-10T09:15:00Z") },
  { _id: ids.orders.aliceBrother, customerId: ids.customers.alice, employeeId: ids.employees.manager, products: orderProducts.aliceBrother, totalPrice: total(orderProducts.aliceBrother), status: "delivered", deliveryAddress: "Moscow, Arbat st., 15", orderDate: new Date("2026-05-15T11:40:00Z") },
  { _id: ids.orders.aliceBrother2, customerId: ids.customers.alice, employeeId: ids.employees.manager, products: orderProducts.aliceBrother2, totalPrice: total(orderProducts.aliceBrother2), status: "delivered", deliveryAddress: "Moscow, Arbat st., 15", orderDate: new Date("2026-05-20T10:00:00Z") },
  { _id: ids.orders.sofiaAnycubic, customerId: ids.customers.sofia, employeeId: ids.employees.manager, products: orderProducts.sofiaAnycubic, totalPrice: total(orderProducts.sofiaAnycubic), status: "delivered", deliveryAddress: "Moscow, Tverskaya st., 7", orderDate: new Date("2026-03-08T14:20:00Z") },
  { _id: ids.orders.sofiaPhoto, customerId: ids.customers.sofia, employeeId: ids.employees.analyst, products: orderProducts.sofiaPhoto, totalPrice: total(orderProducts.sofiaPhoto), status: "delivered", deliveryAddress: "Moscow, Tverskaya st., 7", orderDate: new Date("2026-05-18T16:05:00Z") },
  { _id: ids.orders.sofiaPhoto2, customerId: ids.customers.sofia, employeeId: ids.employees.analyst, products: orderProducts.sofiaPhoto2, totalPrice: total(orderProducts.sofiaPhoto2), status: "delivered", deliveryAddress: "Moscow, Tverskaya st., 7", orderDate: new Date("2026-05-21T09:30:00Z") },
  { _id: ids.orders.johnLaser, customerId: ids.customers.john, employeeId: ids.employees.manager, products: orderProducts.johnLaser, totalPrice: total(orderProducts.johnLaser), status: "delivered", deliveryAddress: "Moscow, Lenina ave., 45", orderDate: new Date("2026-05-08T13:00:00Z") },
  { _id: ids.orders.johnLaser2, customerId: ids.customers.john, employeeId: ids.employees.analyst, products: orderProducts.johnLaser2, totalPrice: total(orderProducts.johnLaser2), status: "delivered", deliveryAddress: "Moscow, Lenina ave., 45", orderDate: new Date("2026-05-19T15:20:00Z") },
  { _id: ids.orders.mariaInkjet, customerId: ids.customers.maria, employeeId: ids.employees.manager, products: orderProducts.mariaInkjet, totalPrice: total(orderProducts.mariaInkjet), status: "shipped", deliveryAddress: "Moscow, Pushkin sq., 3", orderDate: new Date("2026-05-12T11:00:00Z") },
  { _id: ids.orders.mariaInkjet2, customerId: ids.customers.maria, employeeId: ids.employees.analyst, products: orderProducts.mariaInkjet2, totalPrice: total(orderProducts.mariaInkjet2), status: "delivered", deliveryAddress: "Moscow, Pushkin sq., 3", orderDate: new Date("2026-05-22T10:45:00Z") },
  { _id: ids.orders.alexDesignJet, customerId: ids.customers.alex, employeeId: ids.employees.manager, products: orderProducts.alexDesignJet, totalPrice: total(orderProducts.alexDesignJet), status: "delivered", deliveryAddress: "Moscow, Red Square, 1", orderDate: new Date("2026-05-20T08:00:00Z") },
]);

db.categories.createIndex({ name: 1 }, { unique: true });
db.products.createIndex({ name: "text", manufacturer: "text" });
db.products.createIndex({ categoryId: 1 });
db.products.createIndex({ price: 1 });
db.customers.createIndex({ email: 1 }, { unique: true });
db.employees.createIndex({ email: 1 }, { unique: true });
db.carts.createIndex({ customerId: 1 }, { unique: true });
db.orders.createIndex({ customerId: 1, orderDate: -1 });
db.orders.createIndex({ orderDate: 1 });
db.orders.createIndex({ "products.productId": 1 });

if (db.getRole("shopAdminRole")) db.dropRole("shopAdminRole");
if (db.getRole("shopManagerRole")) db.dropRole("shopManagerRole");
if (db.getRole("shopUserRole")) db.dropRole("shopUserRole");
if (db.getRole("shopGuestRole")) db.dropRole("shopGuestRole");

db.createRole({
  role: "shopAdminRole",
  privileges: [],
  roles: [{ role: "dbOwner", db: dbName }],
});

db.createRole({
  role: "shopManagerRole",
  privileges: [
    { resource: { db: dbName, collection: "products" }, actions: ["find", "insert", "update", "remove"] },
    { resource: { db: dbName, collection: "categories" }, actions: ["find", "insert", "update"] },
    { resource: { db: dbName, collection: "orders" }, actions: ["find", "update"] },
  ],
  roles: [],
});

db.createRole({
  role: "shopUserRole",
  privileges: [
    { resource: { db: dbName, collection: "products" }, actions: ["find"] },
    { resource: { db: dbName, collection: "categories" }, actions: ["find"] },
    { resource: { db: dbName, collection: "carts" }, actions: ["find", "insert", "update"] },
    { resource: { db: dbName, collection: "orders" }, actions: ["find", "insert"] },
  ],
  roles: [],
});

db.createRole({
  role: "shopGuestRole",
  privileges: [
    { resource: { db: dbName, collection: "products" }, actions: ["find"] },
    { resource: { db: dbName, collection: "categories" }, actions: ["find"] },
  ],
  roles: [],
});

if (db.getUser("shop_admin")) db.dropUser("shop_admin");
if (db.getUser("shop_manager")) db.dropUser("shop_manager");
if (db.getUser("shop_user")) db.dropUser("shop_user");
if (db.getUser("shop_guest")) db.dropUser("shop_guest");

db.createUser({ user: "shop_admin", pwd: "admin123", roles: [{ role: "shopAdminRole", db: dbName }] });
db.createUser({ user: "shop_manager", pwd: "manager123", roles: [{ role: "shopManagerRole", db: dbName }] });
db.createUser({ user: "shop_user", pwd: "user123", roles: [{ role: "shopUserRole", db: dbName }] });
db.createUser({ user: "shop_guest", pwd: "guest123", roles: [{ role: "shopGuestRole", db: dbName }] });

