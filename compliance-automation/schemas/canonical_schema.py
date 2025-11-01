"""
Canonical Schema for Compliance Automation Service

This module defines Pydantic models for normalizing all input data sources into a
unified schema for compliance checking. All inputs (BIM/IFC, ERP invoices, meters,
EPDs, transport, waste) are transformed into these canonical structures.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
from pydantic import BaseModel, Field, HttpUrl, field_validator
from uuid import UUID, uuid4


# ============================================================================
# ENUMERATIONS
# ============================================================================

class EvidenceType(str, Enum):
    """Types of evidence documents"""
    EPD = "epd"
    INVOICE = "invoice"
    METER_READING = "meter_reading"
    TRANSPORT_LOG = "transport_log"
    WASTE_RECEIPT = "waste_receipt"
    BIM_MODEL = "bim_model"
    IFC_FILE = "ifc_file"
    CERTIFICATION = "certification"
    TEST_REPORT = "test_report"
    PHOTO = "photo"
    OTHER = "other"


class MaterialCategory(str, Enum):
    """Standard material categories"""
    CONCRETE = "concrete"
    STEEL = "steel"
    TIMBER = "timber"
    ALUMINUM = "aluminum"
    GLASS = "glass"
    INSULATION = "insulation"
    MASONRY = "masonry"
    FINISHES = "finishes"
    MEP = "mep"
    OTHER = "other"


class EPDType(str, Enum):
    """EPD classification types"""
    PRODUCT_SPECIFIC = "product-specific"
    INDUSTRY_AVERAGE = "industry-average"
    GENERIC = "generic"


class Unit(str, Enum):
    """Standard units of measurement"""
    M3 = "m3"
    M2 = "m2"
    M = "m"
    KG = "kg"
    TONNE = "tonne"
    EACH = "each"
    L = "l"
    KWH = "kwh"
    MJ = "mj"


class TransportMode(str, Enum):
    """Transportation modes"""
    ROAD = "road"
    RAIL = "rail"
    SEA = "sea"
    AIR = "air"


class WasteType(str, Enum):
    """Waste classification"""
    LANDFILL = "landfill"
    RECYCLED = "recycled"
    REUSED = "reused"
    INCINERATED = "incinerated"
    HAZARDOUS = "hazardous"


# ============================================================================
# BASE MODELS
# ============================================================================

class EvidenceDocument(BaseModel):
    """Evidence document with URI and metadata"""
    id: UUID = Field(default_factory=uuid4)
    type: EvidenceType
    uri: str = Field(description="File path, URL, or database reference")
    filename: Optional[str] = None
    hash: Optional[str] = Field(None, description="SHA-256 hash for integrity")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GeographicLocation(BaseModel):
    """Geographic location data"""
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "Australia"
    postcode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ============================================================================
# EPD (Environmental Product Declaration) SCHEMA
# ============================================================================

class LCAStages(BaseModel):
    """Life Cycle Assessment stage breakdown per EN 15804"""
    a1_a3: Decimal = Field(description="Product stage: raw material, transport, manufacturing")
    a4: Decimal = Field(description="Transport to site")
    a5: Decimal = Field(description="Installation")
    b1_b7: Optional[Decimal] = Field(None, description="Use stage (operational)")
    c1_c4: Optional[Decimal] = Field(None, description="End of life")
    d: Optional[Decimal] = Field(None, description="Benefits beyond system boundary")

    @field_validator('a1_a3', 'a4', 'a5')
    @classmethod
    def validate_required_stages(cls, v):
        """Ensure required stages have values"""
        if v is None:
            raise ValueError("Required LCA stage cannot be None")
        return v

    def total_embodied_carbon(self) -> Decimal:
        """Calculate total embodied carbon (A1-A5 + C1-C4 + D)"""
        total = self.a1_a3 + self.a4 + self.a5
        if self.c1_c4:
            total += self.c1_c4
        if self.d:
            total += self.d
        return total


class EPDDocument(BaseModel):
    """Environmental Product Declaration"""
    id: UUID = Field(default_factory=uuid4)
    epd_number: str = Field(description="Official EPD registration number")
    product_name: str
    manufacturer: str
    declared_unit: Unit

    # Carbon data
    gwp_total: Decimal = Field(description="Global Warming Potential (kg CO2-e per declared unit)")
    lca_stages: LCAStages

    # Validity
    valid_from: date
    valid_until: date
    is_verified: bool = Field(default=False, description="Third-party verified?")
    verification_body: Optional[str] = None

    # Classification
    epd_type: EPDType
    category: MaterialCategory

    # References
    epd_url: Optional[HttpUrl] = None
    source: str = Field(default="EPD Australasia")

    # Evidence
    evidence: List[EvidenceDocument] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def is_valid_on(self, check_date: date) -> bool:
        """Check if EPD is valid on a given date"""
        return self.valid_from <= check_date <= self.valid_until


# ============================================================================
# BIM/IFC DATA SCHEMA
# ============================================================================

class IFCElement(BaseModel):
    """IFC building element from BIM model"""
    id: UUID = Field(default_factory=uuid4)
    ifc_guid: str = Field(description="IFC GlobalId")
    ifc_type: str = Field(description="IFC entity type (e.g., IfcWall, IfcSlab)")
    name: Optional[str] = None

    # Geometric properties
    quantity: Decimal
    unit: Unit
    volume: Optional[Decimal] = None
    area: Optional[Decimal] = None
    length: Optional[Decimal] = None

    # Material properties
    material_name: str
    material_category: MaterialCategory

    # Location in model
    storey: Optional[str] = None
    zone: Optional[str] = None

    # Properties from property sets
    properties: Dict[str, Any] = Field(default_factory=dict)

    # Evidence
    evidence: List[EvidenceDocument] = Field(default_factory=list)

    metadata: Dict[str, Any] = Field(default_factory=dict)


class BIMModel(BaseModel):
    """Complete BIM/IFC model"""
    id: UUID = Field(default_factory=uuid4)
    project_name: str
    ifc_schema: str = Field(default="IFC4")

    # Model metadata
    software: Optional[str] = None
    author: Optional[str] = None
    created_date: Optional[datetime] = None

    # Elements
    elements: List[IFCElement] = Field(default_factory=list)

    # Location
    location: Optional[GeographicLocation] = None

    # Evidence
    evidence: List[EvidenceDocument] = Field(default_factory=list)

    imported_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================================
# ERP INVOICE SCHEMA
# ============================================================================

class InvoiceLineItem(BaseModel):
    """Single line item on an invoice"""
    id: UUID = Field(default_factory=uuid4)
    line_number: int

    # Product information
    product_code: Optional[str] = None
    product_name: str
    description: Optional[str] = None

    # Quantity and pricing
    quantity: Decimal
    unit: Unit
    unit_price: Decimal
    total_price: Decimal
    currency: str = "AUD"

    # Material classification
    material_category: Optional[MaterialCategory] = None

    # EPD linkage
    epd_id: Optional[UUID] = None

    metadata: Dict[str, Any] = Field(default_factory=dict)


class ERPInvoice(BaseModel):
    """Purchase invoice from ERP system"""
    id: UUID = Field(default_factory=uuid4)
    invoice_number: str
    purchase_order: Optional[str] = None

    # Parties
    supplier_name: str
    supplier_abn: Optional[str] = None
    buyer_name: str
    buyer_abn: Optional[str] = None

    # Dates
    invoice_date: date
    delivery_date: Optional[date] = None
    payment_date: Optional[date] = None

    # Line items
    line_items: List[InvoiceLineItem] = Field(default_factory=list)

    # Totals
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    currency: str = "AUD"

    # Delivery
    delivery_location: Optional[GeographicLocation] = None

    # Evidence
    evidence: List[EvidenceDocument] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================================
# UTILITY METER SCHEMA
# ============================================================================

class MeterReading(BaseModel):
    """Individual meter reading"""
    id: UUID = Field(default_factory=uuid4)
    timestamp: datetime
    value: Decimal
    unit: Unit = Field(default=Unit.KWH)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UtilityMeter(BaseModel):
    """Utility meter data (electricity, gas, water)"""
    id: UUID = Field(default_factory=uuid4)
    meter_id: str
    meter_type: Literal["electricity", "gas", "water", "other"]

    # Location
    location: GeographicLocation
    building_area: Optional[Decimal] = Field(None, description="Building area serviced (m2)")

    # Readings
    readings: List[MeterReading] = Field(default_factory=list)

    # Emissions factor
    emissions_factor: Optional[Decimal] = Field(None, description="kg CO2-e per unit")
    emissions_factor_source: Optional[str] = None

    # Period
    start_date: date
    end_date: date

    # Evidence
    evidence: List[EvidenceDocument] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def total_consumption(self) -> Decimal:
        """Calculate total consumption over period"""
        if len(self.readings) < 2:
            return Decimal(0)
        return max(r.value for r in self.readings) - min(r.value for r in self.readings)

    def total_emissions(self) -> Optional[Decimal]:
        """Calculate total emissions if factor is available"""
        if self.emissions_factor:
            return self.total_consumption() * self.emissions_factor
        return None


# ============================================================================
# TRANSPORT SCHEMA
# ============================================================================

class TransportLeg(BaseModel):
    """Single transport leg"""
    id: UUID = Field(default_factory=uuid4)

    # Route
    origin: GeographicLocation
    destination: GeographicLocation
    distance_km: Decimal

    # Mode
    transport_mode: TransportMode
    vehicle_type: Optional[str] = None

    # Load
    cargo_weight_kg: Decimal
    load_factor: Decimal = Field(default=Decimal("1.0"), description="Utilization 0-1")

    # Emissions
    emissions_factor: Optional[Decimal] = Field(None, description="kg CO2-e per tonne-km")
    total_emissions: Optional[Decimal] = None

    # Date
    transport_date: date

    metadata: Dict[str, Any] = Field(default_factory=dict)

    def calculate_emissions(self) -> Decimal:
        """Calculate emissions for this leg"""
        if self.emissions_factor:
            tonne_km = (self.cargo_weight_kg / Decimal(1000)) * self.distance_km
            return tonne_km * self.emissions_factor
        return Decimal(0)


class TransportLog(BaseModel):
    """Transport and logistics data"""
    id: UUID = Field(default_factory=uuid4)
    shipment_id: str

    # Material reference
    material_name: str
    invoice_id: Optional[UUID] = None

    # Transport legs
    legs: List[TransportLeg] = Field(default_factory=list)

    # Evidence
    evidence: List[EvidenceDocument] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def total_distance_km(self) -> Decimal:
        """Total transport distance"""
        return sum(leg.distance_km for leg in self.legs)

    def total_emissions(self) -> Decimal:
        """Total transport emissions"""
        return sum(leg.calculate_emissions() for leg in self.legs)


# ============================================================================
# WASTE SCHEMA
# ============================================================================

class WasteStream(BaseModel):
    """Waste stream record"""
    id: UUID = Field(default_factory=uuid4)

    # Classification
    waste_type: WasteType
    material_category: MaterialCategory
    material_description: str

    # Quantity
    quantity: Decimal
    unit: Unit

    # Disposal
    disposal_date: date
    disposal_facility: str
    disposal_location: Optional[GeographicLocation] = None

    # Emissions
    emissions_factor: Optional[Decimal] = Field(None, description="kg CO2-e per unit")
    total_emissions: Optional[Decimal] = None

    # Circular economy metrics
    recycled_content_pct: Optional[Decimal] = Field(None, ge=0, le=100)
    diversion_from_landfill_pct: Optional[Decimal] = Field(None, ge=0, le=100)

    # Evidence
    evidence: List[EvidenceDocument] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================================
# PROJECT-LEVEL SCHEMA
# ============================================================================

class ComplianceProject(BaseModel):
    """Complete project with all data sources"""
    id: UUID = Field(default_factory=uuid4)
    project_name: str
    project_type: Literal["residential", "commercial", "industrial", "infrastructure"]

    # Timeline
    start_date: date
    end_date: Optional[date] = None

    # Location
    location: GeographicLocation

    # Building characteristics
    gross_floor_area_m2: Optional[Decimal] = None
    building_height_m: Optional[Decimal] = None
    number_of_storeys: Optional[int] = None

    # Data sources
    bim_models: List[BIMModel] = Field(default_factory=list)
    epds: List[EPDDocument] = Field(default_factory=list)
    invoices: List[ERPInvoice] = Field(default_factory=list)
    meters: List[UtilityMeter] = Field(default_factory=list)
    transport_logs: List[TransportLog] = Field(default_factory=list)
    waste_streams: List[WasteStream] = Field(default_factory=list)

    # Evidence repository
    evidence_documents: List[EvidenceDocument] = Field(default_factory=list)

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def total_embodied_carbon(self) -> Decimal:
        """Calculate total embodied carbon from all sources"""
        total = Decimal(0)

        # Sum EPD-based emissions
        for epd in self.epds:
            total += epd.lca_stages.total_embodied_carbon()

        # Sum transport emissions
        for transport in self.transport_logs:
            total += transport.total_emissions()

        # Sum waste emissions
        for waste in self.waste_streams:
            if waste.total_emissions:
                total += waste.total_emissions

        return total

    def carbon_intensity_per_m2(self) -> Optional[Decimal]:
        """Carbon intensity per m2 GFA"""
        if self.gross_floor_area_m2:
            return self.total_embodied_carbon() / self.gross_floor_area_m2
        return None
