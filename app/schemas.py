from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


OrderStatus = Literal["processing", "shipped", "delivered", "cancelled"]


class CategoryOut(BaseModel):
    id: str
    name: str
    description: str | None = None


class ProductOut(BaseModel):
    id: str
    name: str
    manufacturer: str
    technology: str | None = None
    paper_format: str | None = Field(default=None, alias="paperFormat")
    colors: int | None = None
    price: float
    quantity: int
    category_id: str = Field(alias="categoryId")
    characteristics: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True)


class ProductCreate(BaseModel):
    name: str = Field(min_length=3, max_length=160)
    manufacturer: str = Field(min_length=1, max_length=100)
    technology: Literal["Laser", "Inkjet", "LED", "3D"]
    paper_format: Literal["A4", "A3", "A5"] = Field(alias="paperFormat")
    colors: int = Field(ge=1)
    price: float = Field(ge=0)
    quantity: int = Field(ge=0)
    category_id: str = Field(alias="categoryId")
    characteristics: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=160)
    manufacturer: str | None = Field(default=None, min_length=1, max_length=100)
    technology: Literal["Laser", "Inkjet", "LED", "3D"] | None = None
    paper_format: Literal["A4", "A3", "A5"] | None = Field(default=None, alias="paperFormat")
    colors: int | None = Field(default=None, ge=1)
    price: float | None = Field(default=None, ge=0)
    quantity: int | None = Field(default=None, ge=0)
    category_id: str | None = Field(default=None, alias="categoryId")
    characteristics: dict[str, Any] | None = None

    model_config = ConfigDict(populate_by_name=True)


class CustomerOut(BaseModel):
    id: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: str
    phone: str
    address: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class EmployeeOut(BaseModel):
    id: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    position: str
    email: str
    phone: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class CartItemIn(BaseModel):
    product_id: str = Field(alias="productId")
    quantity: int = Field(gt=0)

    model_config = ConfigDict(populate_by_name=True)


class CartItemOut(BaseModel):
    product_id: str = Field(alias="productId")
    name: str
    quantity: int
    price: float
    subtotal: float

    model_config = ConfigDict(populate_by_name=True)


class CartOut(BaseModel):
    customer_id: str = Field(alias="customerId")
    products: list[CartItemOut]
    total_price: float = Field(alias="totalPrice")
    updated_at: datetime | None = Field(default=None, alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class CheckoutIn(BaseModel):
    delivery_address: str = Field(alias="deliveryAddress", min_length=5, max_length=300)
    employee_id: str | None = Field(default=None, alias="employeeId")

    model_config = ConfigDict(populate_by_name=True)


class OrderProductOut(BaseModel):
    product_id: str = Field(alias="productId")
    name: str
    quantity: int
    price: float
    subtotal: float

    model_config = ConfigDict(populate_by_name=True)


class OrderOut(BaseModel):
    id: str
    customer_id: str = Field(alias="customerId")
    employee_id: str | None = Field(default=None, alias="employeeId")
    products: list[OrderProductOut]
    total_price: float = Field(alias="totalPrice")
    status: OrderStatus
    delivery_address: str = Field(alias="deliveryAddress")
    order_date: datetime = Field(alias="orderDate")

    model_config = ConfigDict(populate_by_name=True)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class TopSaleOut(BaseModel):
    product_id: str = Field(alias="productId")
    name: str
    sold_quantity: int = Field(alias="soldQuantity")
    revenue: float

    model_config = ConfigDict(populate_by_name=True)


class ActiveCustomerOut(BaseModel):
    customer_id: str = Field(alias="customerId")
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    email: str
    purchase_count: int = Field(alias="purchaseCount")
    total_spent: float = Field(alias="totalSpent")

    model_config = ConfigDict(populate_by_name=True)


class CategoryDemandOut(BaseModel):
    category_id: str = Field(alias="categoryId")
    name: str
    sold_quantity: int = Field(alias="soldQuantity")
    revenue: float

    model_config = ConfigDict(populate_by_name=True)


class BranchCreate(BaseModel):
    name: str
    city: str


class BranchOut(BaseModel):
    id: int
    name: str
    city: str


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    position: str
    email: str
    branch_id: int


class EmployeeOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    position: str
    email: str
    branch_id: int