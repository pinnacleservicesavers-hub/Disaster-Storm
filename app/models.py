"""
SQLAlchemy Database Models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="contractor")  # contractor, homeowner, admin
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    contractor_profile = relationship("ContractorProfile", back_populates="user", uselist=False)
    jobs = relationship("Job", back_populates="contractor")


class Membership(Base):
    __tablename__ = "memberships"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan = Column(String(50), nullable=False)  # one_time, monthly
    status = Column(String(50), default="active")  # active, cancelled, expired
    stripe_subscription_id = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ContractorProfile(Base):
    __tablename__ = "contractor_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    license_number = Column(String(100))
    service_areas = Column(JSON)  # List of states/regions
    certifications = Column(JSON)  # OSHA, ANSI, etc.
    equipment = Column(JSON)  # List of equipment
    alert_phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="contractor_profile")


class Property(Base):
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    address = Column(String(500), nullable=False)
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    property_type = Column(String(100))
    year_built = Column(Integer)
    square_feet = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    jobs = relationship("Job", back_populates="property")


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    contractor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="lead")  # lead, in_progress, complete, invoiced, paid
    job_type = Column(String(100))
    description = Column(Text)
    estimated_cost = Column(Float)
    actual_cost = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    property = relationship("Property", back_populates="jobs")
    contractor = relationship("User", back_populates="jobs")
    media = relationship("MediaAsset", back_populates="job")
    claim = relationship("Claim", back_populates="job", uselist=False)


class MediaAsset(Base):
    __tablename__ = "media_assets"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50))  # image, video
    ai_labels = Column(JSON)  # AI-generated damage labels
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    job = relationship("Job", back_populates="media")


class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), unique=True, nullable=False)
    claim_number = Column(String(100))
    insurance_company = Column(String(255))
    policy_number = Column(String(100))
    status = Column(String(50), default="draft")  # draft, submitted, disputed, approved, paid
    requested_amount = Column(Float)
    offered_amount = Column(Float, nullable=True)
    final_amount = Column(Float, nullable=True)
    rebuttal_history = Column(JSON)  # Array of negotiation attempts
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    job = relationship("Job", back_populates="claim")
    invoice = relationship("Invoice", back_populates="claim", uselist=False)


class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), unique=True, nullable=False)
    invoice_number = Column(String(100), unique=True, nullable=False)
    line_items = Column(JSON)  # Cost breakdown
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, default=0)
    total = Column(Float, nullable=False)
    status = Column(String(50), default="draft")  # draft, sent, disputed, approved, paid
    xactimate_reference = Column(JSON, nullable=True)  # Xactimate comparison data
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    
    # Relationships
    claim = relationship("Claim", back_populates="invoice")


class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    state = Column(String(10), nullable=False)  # FL, TX, CA, etc.
    contract_type = Column(String(50))  # AOB, standard, etc.
    contract_text = Column(Text)
    aob_included = Column(Boolean, default=False)
    signed = Column(Boolean, default=False)
    signed_at = Column(DateTime, nullable=True)
    docusign_envelope_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LienDeadline(Base):
    __tablename__ = "lien_deadlines"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    state = Column(String(10), nullable=False)
    completion_date = Column(DateTime, nullable=False)
    deadline_date = Column(DateTime, nullable=False)
    days_remaining = Column(Integer)
    status = Column(String(50), default="active")  # active, filed, expired
    created_at = Column(DateTime, default=datetime.utcnow)
