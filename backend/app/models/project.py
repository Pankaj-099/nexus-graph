from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    share_token: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)
    color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    icon: Mapped[str] = mapped_column(String(50), default="graph")
    node_count: Mapped[int] = mapped_column(Integer, default=0)
    edge_count: Mapped[int] = mapped_column(Integer, default=0)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="projects")
    nodes: Mapped[list["Node"]] = relationship(
        "Node", back_populates="project", cascade="all, delete-orphan"
    )
    edges: Mapped[list["Edge"]] = relationship(
        "Edge", back_populates="project", cascade="all, delete-orphan"
    )
    schema_definitions: Mapped[list["SchemaDefinition"]] = relationship(
        "SchemaDefinition", back_populates="project", cascade="all, delete-orphan"
    )
    graph_snapshots: Mapped[list["GraphSnapshot"]] = relationship(
        "GraphSnapshot", back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Project {self.name}>"
