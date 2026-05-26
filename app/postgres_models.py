from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey, String, Text, Numeric, Boolean, Date
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Branch(Base):
    """Филиал магазина."""

    __tablename__ = "branches"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(String(512), default="")
    phone: Mapped[str] = mapped_column(String(32), default="")
    opened_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    departments: Mapped[list["Department"]] = relationship(back_populates="branch")
    store_zones: Mapped[list["StoreZone"]] = relationship(back_populates="branch")
    employees: Mapped[list["Employee"]] = relationship(back_populates="branch")


class Department(Base):
    """Отдел внутри филиала (продажи, склад, сервис)."""

    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")

    branch: Mapped["Branch"] = relationship(back_populates="departments")
    employees: Mapped[list["Employee"]] = relationship(back_populates="department")


class StoreZone(Base):
    """Зона/секция внутри магазина (этаж, склад, витрина)."""

    __tablename__ = "store_zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    floor_number: Mapped[int] = mapped_column(default=1)
    zone_type: Mapped[str] = mapped_column(String(64))
    area_sqm: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    branch: Mapped["Branch"] = relationship(back_populates="store_zones")


class Employee(Base):
    """Персонал филиала."""

    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(255))
    last_name: Mapped[str] = mapped_column(String(255))
    position: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(32), default="")
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    hired_at: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    branch: Mapped["Branch"] = relationship(back_populates="employees")
    department: Mapped[Optional["Department"]] = relationship(back_populates="employees")
