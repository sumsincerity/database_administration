import re
from contextlib import asynccontextmanager
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from typing import Annotated, Any

from bson import ObjectId
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.config import get_settings
from app.db import close_mongo_connection, connect_to_mongo, database
from app.schemas import (
    ActiveCustomerOut,
    CartItemIn,
    CartItemOut,
    CartOut,
    CategoryDemandOut,
    CategoryOut,
    CheckoutIn,
    CustomerOut,
    EmployeeCreate,
    EmployeeOut,
    OrderOut,
    OrderProductOut,
    OrderStatusUpdate,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    TopSaleOut,
    BranchOut,
    BranchCreate
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import postgres_db
from app.postgres_models import Base
from app.postgres_models import Branch
from app.postgres_models import Employee
from app.db import engine

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"


def parse_object_id(value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")

    return ObjectId(value)


def serialize_category(document: dict[str, Any]) -> CategoryOut:
    return CategoryOut(
        id=str(document["_id"]),
        name=document["name"],
        description=document.get("description"),
    )


def serialize_product(document: dict[str, Any]) -> ProductOut:
    return ProductOut(
        id=str(document["_id"]),
        name=document["name"],
        manufacturer=document["manufacturer"],
        technology=document.get("technology"),
        paper_format=document.get("paperFormat"),
        colors=document.get("colors"),
        price=float(document["price"]),
        quantity=int(document["quantity"]),
        category_id=str(document["categoryId"]),
        characteristics=document.get("characteristics", {}),
    )


def serialize_customer(document: dict[str, Any]) -> CustomerOut:
    return CustomerOut(
        id=str(document["_id"]),
        first_name=document["firstName"],
        last_name=document["lastName"],
        email=document["email"],
        phone=document["phone"],
        address=document.get("address"),
    )


def serialize_employee(document: dict[str, Any]) -> EmployeeOut:
    return EmployeeOut(
        id=str(document["_id"]),
        first_name=document["firstName"],
        last_name=document["lastName"],
        position=document["position"],
        email=document["email"],
        phone=document.get("phone"),
    )


def serialize_cart_item(document: dict[str, Any]) -> CartItemOut:
    quantity = int(document["quantity"])
    price = float(document["price"])
    return CartItemOut(
        product_id=str(document["productId"]),
        name=document["name"],
        quantity=quantity,
        price=price,
        subtotal=round(price * quantity, 2),
    )


def serialize_cart(document: dict[str, Any]) -> CartOut:
    products = [serialize_cart_item(item) for item in document.get("products", [])]
    total_price = round(sum(item.subtotal for item in products), 2)
    return CartOut(
        customer_id=str(document["customerId"]),
        products=products,
        total_price=total_price,
        updated_at=document.get("updatedAt"),
    )


def serialize_order_product(document: dict[str, Any]) -> OrderProductOut:
    quantity = int(document["quantity"])
    price = float(document["price"])
    return OrderProductOut(
        product_id=str(document["productId"]),
        name=document["name"],
        quantity=quantity,
        price=price,
        subtotal=round(price * quantity, 2),
    )


def serialize_order(document: dict[str, Any]) -> OrderOut:
    return OrderOut(
        id=str(document["_id"]),
        customer_id=str(document["customerId"]),
        employee_id=str(document["employeeId"]) if document.get("employeeId") else None,
        products=[serialize_order_product(item) for item in document["products"]],
        total_price=float(document["totalPrice"]),
        status=document["status"],
        delivery_address=document["deliveryAddress"],
        order_date=document["orderDate"],
    )


def date_range(start: date, end: date) -> tuple[datetime, datetime]:
    if end < start:
        raise HTTPException(status_code=400, detail="end_date must be greater than or equal to start_date")

    start_at = datetime.combine(start, time.min, tzinfo=UTC)
    end_at = datetime.combine(end + timedelta(days=1), time.min, tzinfo=UTC)
    return start_at, end_at


async def ensure_customer_exists(db: AsyncIOMotorDatabase, customer_id: ObjectId) -> dict[str, Any]:
    customer = await db.customers.find_one({"_id": customer_id})
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    return customer


async def find_default_employee(db: AsyncIOMotorDatabase) -> ObjectId | None:
    employee = await db.employees.find_one(sort=[("_id", 1)])
    return employee["_id"] if employee else None


def now_utc() -> datetime:
    return datetime.now(UTC)


async def ensure_category_exists(db: AsyncIOMotorDatabase, category_id: ObjectId) -> None:
    if await db.categories.find_one({"_id": category_id}) is None:
        raise HTTPException(status_code=404, detail="Category not found")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    await close_mongo_connection()


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
async def frontend() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
async def health(db: Annotated[AsyncIOMotorDatabase, Depends(database)]) -> dict[str, str]:
    await db.command("ping")
    return {"status": "ok", "database": db.name}


@app.get("/categories", response_model=list[CategoryOut])
async def list_categories(
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> list[CategoryOut]:
    cursor = db.categories.find().sort("name", 1)
    return [serialize_category(document) async for document in cursor]


@app.get("/customers", response_model=list[CustomerOut])
async def list_customers(
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> list[CustomerOut]:
    cursor = db.customers.find().sort([("lastName", 1), ("firstName", 1)])
    return [serialize_customer(document) async for document in cursor]


@app.get("/categories/{category_id}/products", response_model=list[ProductOut])
async def list_products_by_category(
    category_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> list[ProductOut]:
    category_oid = parse_object_id(category_id, "category_id")
    category = await db.categories.find_one({"_id": category_oid})
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    cursor = db.products.find({"categoryId": category_oid}).sort("name", 1)
    return [serialize_product(document) async for document in cursor]


@app.get("/products", response_model=list[ProductOut])
async def list_products(
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
    limit: int = Query(default=100, ge=1, le=1000),
    skip: int = Query(default=0, ge=0),
) -> list[ProductOut]:
    cursor = db.products.find().sort("name", 1).skip(skip).limit(limit)
    return [serialize_product(document) async for document in cursor]


@app.get("/products/search", response_model=list[ProductOut])
async def search_products(
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
    query: str | None = Query(default=None, min_length=1),
    category_id: str | None = Query(default=None),
    category_name: str | None = Query(default=None, min_length=1),
    manufacturer: str | None = Query(default=None, min_length=1),
    technology: str | None = Query(default=None),
    paper_format: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    min_colors: int | None = Query(default=None, ge=1),
    in_stock: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
) -> list[ProductOut]:
    filters: dict[str, Any] = {}

    if query:
        escaped_query = re.escape(query)
        filters["$or"] = [
            {"name": {"$regex": escaped_query, "$options": "i"}},
            {"manufacturer": {"$regex": escaped_query, "$options": "i"}},
            {"technology": {"$regex": escaped_query, "$options": "i"}},
        ]

    if category_id:
        filters["categoryId"] = parse_object_id(category_id, "category_id")
    elif category_name:
        category = await db.categories.find_one({"name": {"$regex": re.escape(category_name), "$options": "i"}})
        if category is None:
            return []
        filters["categoryId"] = category["_id"]

    if manufacturer:
        filters["manufacturer"] = {"$regex": re.escape(manufacturer), "$options": "i"}
    if technology:
        filters["technology"] = technology
    if paper_format:
        filters["paperFormat"] = paper_format
    if min_colors is not None:
        filters["colors"] = {"$gte": min_colors}
    if in_stock is True:
        filters["quantity"] = {"$gt": 0}
    elif in_stock is False:
        filters["quantity"] = 0

    price_filter: dict[str, float] = {}
    if min_price is not None:
        price_filter["$gte"] = min_price
    if max_price is not None:
        price_filter["$lte"] = max_price
    if price_filter:
        filters["price"] = price_filter

    cursor = db.products.find(filters).sort("name", 1).skip(skip).limit(limit)
    return [serialize_product(document) async for document in cursor]


@app.get("/products/by-name", response_model=list[ProductOut])
async def find_product_by_name(
    name: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> list[ProductOut]:
    cursor = db.products.find({"name": {"$regex": re.escape(name), "$options": "i"}}).sort("name", 1)
    return [serialize_product(document) async for document in cursor]


@app.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> ProductOut:
    category_oid = parse_object_id(product.category_id, "categoryId")
    await ensure_category_exists(db, category_oid)

    document = product.model_dump(by_alias=True)
    document["categoryId"] = category_oid
    result = await db.products.insert_one(document)

    created = await db.products.find_one({"_id": result.inserted_id})
    if created is None:
        raise HTTPException(status_code=500, detail="Created product was not found")

    return serialize_product(created)


@app.get("/products/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> ProductOut:
    product_oid = parse_object_id(product_id, "product_id")
    product = await db.products.find_one({"_id": product_oid})
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return serialize_product(product)


@app.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> ProductOut:
    product_oid = parse_object_id(product_id, "product_id")
    update_data = product.model_dump(by_alias=True, exclude_unset=True, exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No product fields to update")

    if "categoryId" in update_data:
        category_oid = parse_object_id(update_data["categoryId"], "categoryId")
        await ensure_category_exists(db, category_oid)
        update_data["categoryId"] = category_oid

    updated = await db.products.find_one_and_update(
        {"_id": product_oid},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return serialize_product(updated)


@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> None:
    product_oid = parse_object_id(product_id, "product_id")
    if await db.orders.find_one({"products.productId": product_oid}) is not None:
        raise HTTPException(status_code=409, detail="Product has existing orders and cannot be deleted")

    result = await db.products.delete_one({"_id": product_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")


@app.get("/customers/{customer_id}/cart", response_model=CartOut)
async def get_customer_cart(
    customer_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> CartOut:
    customer_oid = parse_object_id(customer_id, "customer_id")
    await ensure_customer_exists(db, customer_oid)

    cart = await db.carts.find_one({"customerId": customer_oid})
    if cart is None:
        cart = {"customerId": customer_oid, "products": [], "updatedAt": now_utc()}
        await db.carts.insert_one(cart)

    return serialize_cart(cart)


@app.post("/customers/{customer_id}/cart/items", response_model=CartOut)
async def add_product_to_cart(
    customer_id: str,
    item: CartItemIn,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> CartOut:
    customer_oid = parse_object_id(customer_id, "customer_id")
    product_oid = parse_object_id(item.product_id, "productId")

    await ensure_customer_exists(db, customer_oid)
    product = await db.products.find_one({"_id": product_oid})
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if int(product["quantity"]) < item.quantity:
        raise HTTPException(status_code=409, detail="Not enough product quantity in stock")

    cart = await db.carts.find_one({"customerId": customer_oid})
    if cart is None:
        cart = {"customerId": customer_oid, "products": [], "updatedAt": now_utc()}

    products = cart.get("products", [])
    for cart_item in products:
        if cart_item["productId"] == product_oid:
            new_quantity = int(cart_item["quantity"]) + item.quantity
            if int(product["quantity"]) < new_quantity:
                raise HTTPException(status_code=409, detail="Not enough product quantity in stock")
            cart_item["quantity"] = new_quantity
            break
    else:
        products.append(
            {
                "productId": product_oid,
                "name": product["name"],
                "quantity": item.quantity,
                "price": float(product["price"]),
            }
        )

    cart["products"] = products
    cart["updatedAt"] = now_utc()
    await db.carts.replace_one({"customerId": customer_oid}, cart, upsert=True)
    return serialize_cart(cart)


@app.post("/customers/{customer_id}/orders/from-cart", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order_from_cart(
    customer_id: str,
    checkout: CheckoutIn,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> OrderOut:
    customer_oid = parse_object_id(customer_id, "customer_id")
    await ensure_customer_exists(db, customer_oid)

    cart = await db.carts.find_one({"customerId": customer_oid})
    if cart is None or not cart.get("products"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    employee_oid = parse_object_id(checkout.employee_id, "employeeId") if checkout.employee_id else await find_default_employee(db)
    if employee_oid is not None and await db.employees.find_one({"_id": employee_oid}) is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    order_products = []
    for item in cart["products"]:
        product = await db.products.find_one({"_id": item["productId"]})
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product {item['name']} not found")
        if int(product["quantity"]) < int(item["quantity"]):
            raise HTTPException(status_code=409, detail=f"Not enough quantity for {product['name']}")

        order_products.append(
            {
                "productId": product["_id"],
                "name": product["name"],
                "quantity": int(item["quantity"]),
                "price": float(product["price"]),
            }
        )

    total_price = round(sum(item["price"] * item["quantity"] for item in order_products), 2)
    order = {
        "customerId": customer_oid,
        "products": order_products,
        "totalPrice": total_price,
        "status": "processing",
        "deliveryAddress": checkout.delivery_address,
        "orderDate": now_utc(),
    }
    if employee_oid is not None:
        order["employeeId"] = employee_oid

    result = await db.orders.insert_one(order)
    order["_id"] = result.inserted_id

    for item in order_products:
        await db.products.update_one({"_id": item["productId"]}, {"$inc": {"quantity": -int(item["quantity"])}})

    await db.carts.update_one(
        {"customerId": customer_oid},
        {"$set": {"products": [], "updatedAt": now_utc()}},
    )
    return serialize_order(order)


@app.get("/customers/{customer_id}/orders", response_model=list[OrderOut])
async def list_customer_orders(
    customer_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> list[OrderOut]:
    customer_oid = parse_object_id(customer_id, "customer_id")
    await ensure_customer_exists(db, customer_oid)

    cursor = db.orders.find({"customerId": customer_oid}).sort("orderDate", -1)
    return [serialize_order(document) async for document in cursor]


@app.patch("/orders/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
) -> OrderOut:
    order_oid = parse_object_id(order_id, "order_id")
    updated = await db.orders.find_one_and_update(
        {"_id": order_oid},
        {"$set": {"status": payload.status}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Order not found")

    return serialize_order(updated)


@app.get("/reports/top-sales", response_model=list[TopSaleOut])
async def top_sales(
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
    months: int = Query(default=3, ge=1, le=36),
    limit: int = Query(default=10, ge=1, le=100),
) -> list[TopSaleOut]:
    start_date = datetime.now(UTC) - timedelta(days=30 * months)
    pipeline = [
        {"$match": {"orderDate": {"$gte": start_date}, "status": {"$ne": "cancelled"}}},
        {"$unwind": "$products"},
        {
            "$group": {
                "_id": "$products.productId",
                "name": {"$first": "$products.name"},
                "soldQuantity": {"$sum": "$products.quantity"},
                "revenue": {"$sum": {"$multiply": ["$products.price", "$products.quantity"]}},
            }
        },
        {"$sort": {"revenue": -1, "soldQuantity": -1}},
        {"$limit": limit},
    ]
    cursor = db.orders.aggregate(pipeline)
    return [
        TopSaleOut(
            product_id=str(document["_id"]),
            name=document["name"],
            sold_quantity=int(document["soldQuantity"]),
            revenue=round(float(document["revenue"]), 2),
        )
        async for document in cursor
    ]


@app.get("/reports/active-customers", response_model=list[ActiveCustomerOut])
async def active_customers(
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
    min_purchases: int = Query(default=1, ge=0),
    days: int = Query(default=90, ge=1, le=3650),
) -> list[ActiveCustomerOut]:
    start_date = datetime.now(UTC) - timedelta(days=days)
    pipeline = [
        {"$match": {"orderDate": {"$gte": start_date}, "status": {"$ne": "cancelled"}}},
        {
            "$group": {
                "_id": "$customerId",
                "purchaseCount": {"$sum": 1},
                "totalSpent": {"$sum": "$totalPrice"},
            }
        },
        {"$match": {"purchaseCount": {"$gt": min_purchases}}},
        {"$lookup": {"from": "customers", "localField": "_id", "foreignField": "_id", "as": "customer"}},
        {"$unwind": "$customer"},
        {"$sort": {"purchaseCount": -1, "totalSpent": -1}},
    ]
    cursor = db.orders.aggregate(pipeline)
    return [
        ActiveCustomerOut(
            customer_id=str(document["_id"]),
            first_name=document["customer"]["firstName"],
            last_name=document["customer"]["lastName"],
            email=document["customer"]["email"],
            purchase_count=int(document["purchaseCount"]),
            total_spent=round(float(document["totalSpent"]), 2),
        )
        async for document in cursor
    ]


@app.get("/reports/category-demand", response_model=list[CategoryDemandOut])
async def category_demand(
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
    start_date: date,
    end_date: date,
) -> list[CategoryDemandOut]:
    start_at, end_at = date_range(start_date, end_date)
    pipeline = [
        {"$match": {"orderDate": {"$gte": start_at, "$lt": end_at}, "status": {"$ne": "cancelled"}}},
        {"$unwind": "$products"},
        {"$lookup": {"from": "products", "localField": "products.productId", "foreignField": "_id", "as": "product"}},
        {"$unwind": "$product"},
        {"$lookup": {"from": "categories", "localField": "product.categoryId", "foreignField": "_id", "as": "category"}},
        {"$unwind": "$category"},
        {
            "$group": {
                "_id": "$category._id",
                "name": {"$first": "$category.name"},
                "soldQuantity": {"$sum": "$products.quantity"},
                "revenue": {"$sum": {"$multiply": ["$products.price", "$products.quantity"]}},
            }
        },
        {"$sort": {"soldQuantity": -1, "revenue": -1}},
    ]
    cursor = db.orders.aggregate(pipeline)
    return [
        CategoryDemandOut(
            category_id=str(document["_id"]),
            name=document["name"],
            sold_quantity=int(document["soldQuantity"]),
            revenue=round(float(document["revenue"]), 2),
        )
        async for document in cursor
    ]


@app.get("/reports/unsold-products", response_model=list[ProductOut])
async def unsold_products(
    db: Annotated[AsyncIOMotorDatabase, Depends(database)],
    target_date: date = Query(alias="date"),
) -> list[ProductOut]:
    start_at, end_at = date_range(target_date, target_date)
    sold_product_ids = await db.orders.distinct(
        "products.productId",
        {"orderDate": {"$gte": start_at, "$lt": end_at}, "status": {"$ne": "cancelled"}},
    )
    cursor = db.products.find({"_id": {"$nin": sold_product_ids}}).sort("name", 1)
    return [serialize_product(document) async for document in cursor]


@app.get("/employees", response_model=list[EmployeeOut])
async def get_employees(
    db: Annotated[AsyncSession, Depends(postgres_db)],
):
    result = await db.execute(select(Employee))

    employees = result.scalars().all()

    return [
        EmployeeOut(
            id=e.id,
            first_name=e.first_name,
            last_name=e.last_name,
            position=e.position,
            email=e.email,
            branch_id=e.branch_id,
        )
        for e in employees
    ]


@app.post("/employees", response_model=EmployeeOut)
async def create_employee(
    employee: EmployeeCreate,
    db: Annotated[AsyncSession, Depends(postgres_db)],
):
    new_employee = Employee(
        first_name=employee.first_name,
        last_name=employee.last_name,
        position=employee.position,
        email=employee.email,
        branch_id=employee.branch_id,
    )

    db.add(new_employee)

    await db.commit()

    await db.refresh(new_employee)

    return EmployeeOut(
        id=new_employee.id,
        first_name=new_employee.first_name,
        last_name=new_employee.last_name,
        position=new_employee.position,
        email=new_employee.email,
        branch_id=new_employee.branch_id,
    )


@app.delete("/employees/{employee_id}")
async def delete_employee(
    employee_id: int,
    db: Annotated[AsyncSession, Depends(postgres_db)],
):
    employee = await db.get(Employee, employee_id)

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    await db.delete(employee)

    await db.commit()

    return {"message": "Employee deleted"}


@app.get("/branches", response_model=list[BranchOut])
async def get_branches(
    db: Annotated[AsyncSession, Depends(postgres_db)],
):
    result = await db.execute(select(Branch))

    branches = result.scalars().all()

    return [
        BranchOut(
            id=b.id,
            name=b.name,
            city=b.city,
        )
        for b in branches
    ]


@app.post("/branches", response_model=BranchOut)
async def create_branch(
    branch: BranchCreate,
    db: Annotated[AsyncSession, Depends(postgres_db)],
):
    new_branch = Branch(
        name=branch.name,
        city=branch.city,
    )

    db.add(new_branch)

    await db.commit()

    await db.refresh(new_branch)

    return BranchOut(
        id=new_branch.id,
        name=new_branch.name,
        city=new_branch.city,
    )