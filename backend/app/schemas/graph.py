from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel


class NodeCreate(BaseModel):
    external_id: str
    label: str
    node_type: str = "default"
    properties: dict = {}
    position_x: float = 0.0
    position_y: float = 0.0
    color: Optional[str] = None
    size: int = 40


class NodeUpdate(BaseModel):
    label: Optional[str] = None
    node_type: Optional[str] = None
    properties: Optional[dict] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    color: Optional[str] = None
    size: Optional[int] = None


class NodeResponse(BaseModel):
    id: int
    project_id: int
    external_id: str
    label: str
    node_type: str
    properties: dict
    position_x: float
    position_y: float
    color: Optional[str]
    size: int
    created_at: datetime

    model_config = {"from_attributes": True}


class EdgeCreate(BaseModel):
    source_external_id: str
    target_external_id: str
    relationship_type: str = "relates_to"
    label: Optional[str] = None
    properties: dict = {}
    weight: float = 1.0
    is_directed: bool = True


class EdgeResponse(BaseModel):
    id: int
    project_id: int
    source_id: int
    target_id: int
    relationship_type: str
    label: Optional[str]
    properties: dict
    weight: float
    is_directed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class GraphDataResponse(BaseModel):
    nodes: list[NodeResponse]
    edges: list[EdgeResponse]
    total_nodes: int
    total_edges: int


class SchemaDefinitionCreate(BaseModel):
    name: str
    schema_type: str  # 'node' or 'edge'
    color: str = "#6366f1"
    icon: Optional[str] = None
    properties_schema: dict = {}


class SchemaDefinitionResponse(BaseModel):
    id: int
    project_id: int
    name: str
    schema_type: str
    color: str
    icon: Optional[str]
    properties_schema: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkImportData(BaseModel):
    nodes: list[NodeCreate] = []
    edges: list[EdgeCreate] = []


class BulkImportResponse(BaseModel):
    nodes_created: int
    edges_created: int
    nodes_skipped: int
    edges_skipped: int
    errors: list[str] = []
