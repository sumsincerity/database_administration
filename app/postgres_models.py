from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column


class Base(DeclarativeBase):
    pass


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(255))

    city: Mapped[str] = mapped_column(String(255))


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)

    first_name: Mapped[str] = mapped_column(String(255))

    last_name: Mapped[str] = mapped_column(String(255))

    position: Mapped[str] = mapped_column(String(255))

    email: Mapped[str] = mapped_column(String(255))

    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.id")
    )