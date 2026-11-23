import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Float
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    CLUB_EXECUTIVE = "club_executive"
    ADMIN = "admin"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    ADDITIONAL_INFO_REQUIRED = "additional_info_required"
    APPROVED = "approved"
    REJECTED = "rejected"

class MembershipStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
    LEFT_CLUB = "left_club"

class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class HandoverStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. A00012345
    major = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    school = Column(String(100), nullable=True) # e.g. SITC, SBE, SAS, SOL
    phone = Column(String(50), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    cgpa = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    memberships = relationship("Membership", back_populates="student", cascade="all, delete-orphan")
    event_registrations = relationship("EventRegistration", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")

class AcademicSession(Base):
    __tablename__ = "academic_sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # e.g. "2026/2027"
    term = Column(String(50), nullable=False) # "Fall", "Spring", "Summer"
    is_current = Column(Boolean, default=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    memberships = relationship("Membership", back_populates="academic_session")
    events = relationship("Event", back_populates="academic_session")

class ClubCategory(Base):
    __tablename__ = "club_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    clubs = relationship("Club", back_populates="category")

class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("club_categories.id"), nullable=False)
    description = Column(Text, nullable=False)
    mission = Column(Text, nullable=True)
    objectives = Column(Text, nullable=True)
    meeting_schedule = Column(String(255), nullable=True) # e.g. "Wednesdays 5:00 PM at SITC Hall"
    logo_url = Column(String(500), nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_suspended = Column(Boolean, default=False)
    suspension_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category = relationship("ClubCategory", back_populates="clubs")
    executives = relationship("ClubExecutive", back_populates="club", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="club", cascade="all, delete-orphan")
    documents = relationship("ClubDocument", back_populates="club", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="club", cascade="all, delete-orphan")
    handover_records = relationship("LeadershipTransition", back_populates="club", cascade="all, delete-orphan")
    applications = relationship("ClubApplication", back_populates="approved_club")

class ClubApplication(Base):
    __tablename__ = "club_applications"

    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    club_name = Column(String(150), nullable=False)
    category_id = Column(Integer, ForeignKey("club_categories.id"), nullable=False)
    description = Column(Text, nullable=False)
    mission = Column(Text, nullable=False)
    objectives = Column(Text, nullable=False)
    meeting_schedule = Column(String(255), nullable=True)
    founding_members_info = Column(Text, nullable=True) # JSON or structured text
    proposed_executives_info = Column(Text, nullable=True) # JSON or structured text
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    logo_url = Column(String(500), nullable=True)
    constitution_url = Column(String(500), nullable=True)
    supporting_docs_url = Column(String(500), nullable=True)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    admin_remarks = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    approved_club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    applicant = relationship("User", foreign_keys=[applicant_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    approved_club = relationship("Club", back_populates="applications")

class ClubDocument(Base):
    __tablename__ = "club_documents"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), default="constitution") # constitution, report, charter, guideline
    file_url = Column(String(500), nullable=False)
    file_size_kb = Column(Integer, nullable=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    club = relationship("Club", back_populates="documents")
    uploaded_by = relationship("User")

class ClubExecutive(Base):
    __tablename__ = "club_executives"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    position = Column(String(100), nullable=False) # President, Vice President, General Secretary, Treasurer, PRO
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    appointed_at = Column(DateTime, default=datetime.utcnow)
    relinquished_at = Column(DateTime, nullable=True)

    # Relationships
    club = relationship("Club", back_populates="executives")
    user = relationship("User")
    academic_session = relationship("AcademicSession")

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=True)
    status = Column(SQLEnum(MembershipStatus), default=MembershipStatus.PENDING, nullable=False)
    position = Column(String(100), default="General Member")
    application_reason = Column(Text, nullable=True)
    review_remarks = Column(Text, nullable=True)
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    club = relationship("Club", back_populates="memberships")
    student = relationship("Student", back_populates="memberships")
    academic_session = relationship("AcademicSession", back_populates="memberships")

    @property
    def user(self):
        return self.student.user if self.student else None

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    banner_url = Column(String(500), nullable=True)
    category = Column(String(100), default="General") # Workshop, Seminar, General Meeting, Social, Competition
    venue = Column(String(255), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=True)
    capacity = Column(Integer, nullable=True)
    target_audience = Column(String(100), default="All Students")
    registration_required = Column(Boolean, default=True)
    status = Column(SQLEnum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    qr_code_token = Column(String(255), unique=True, index=True, nullable=True) # secret signed token for checkin
    is_checkin_active = Column(Boolean, default=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    club = relationship("Club", back_populates="events")
    academic_session = relationship("AcademicSession", back_populates="events")
    created_by = relationship("User")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="event", cascade="all, delete-orphan")

class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="confirmed") # confirmed, waitlisted, cancelled
    registered_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="registrations")
    student = relationship("Student", back_populates="event_registrations")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    method = Column(String(50), default="qr_scan") # qr_scan, manual, offline_sync
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(String(255), nullable=True)

    # Relationships
    event = relationship("Event", back_populates="attendance_records")
    student = relationship("Student", back_populates="attendance_records")
    recorded_by = relationship("User")

    @property
    def user(self):
        return self.student.user if self.student else None

class LeadershipTransition(Base):
    __tablename__ = "leadership_transitions"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    outgoing_executive_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    incoming_executive_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    position = Column(String(100), nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id"), nullable=False)
    handover_notes = Column(Text, nullable=True)
    status = Column(SQLEnum(HandoverStatus), default=HandoverStatus.PENDING, nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Student Affairs administrator
    transition_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    club = relationship("Club", back_populates="handover_records")
    outgoing_executive = relationship("User", foreign_keys=[outgoing_executive_id])
    incoming_executive = relationship("User", foreign_keys=[incoming_executive_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    academic_session = relationship("AcademicSession")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50), default="general") # event, membership, club, system
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False) # e.g. "APPROVE_CLUB", "TRANSFER_LEADERSHIP"
    entity_type = Column(String(100), nullable=False) # "club", "membership", "event"
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
