from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from backend.app.models.models import UserRole, ApplicationStatus, MembershipStatus, EventStatus, HandoverStatus

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Any

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    password: str
    student_id: Optional[str] = None # required if role is student
    major: Optional[str] = None
    department: Optional[str] = None
    school: Optional[str] = None
    phone: Optional[str] = None
    graduation_year: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Student Schemas
class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    student_id: str
    major: Optional[str] = None
    department: Optional[str] = None
    school: Optional[str] = None
    phone: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    student_profile: Optional[StudentProfileResponse] = None

    class Config:
        from_attributes = True

class StudentResponse(StudentProfileResponse):
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Academic Session Schemas
class AcademicSessionBase(BaseModel):
    name: str
    term: str
    is_current: bool = False
    start_date: datetime
    end_date: datetime

class AcademicSessionCreate(AcademicSessionBase):
    pass

class AcademicSessionResponse(AcademicSessionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Club Schemas
class ClubBase(BaseModel):
    name: str
    category_id: int
    description: str
    mission: Optional[str] = None
    objectives: Optional[str] = None
    meeting_schedule: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class ClubCreate(ClubBase):
    pass

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    mission: Optional[str] = None
    objectives: Optional[str] = None
    meeting_schedule: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    is_suspended: Optional[bool] = None
    suspension_reason: Optional[str] = None

class ClubResponse(ClubBase):
    id: int
    is_active: bool
    is_suspended: bool
    suspension_reason: Optional[str] = None
    created_at: datetime
    category: Optional[CategoryResponse] = None
    member_count: Optional[int] = 0
    upcoming_events_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Club Application Schemas
class ClubApplicationCreate(BaseModel):
    club_name: str
    category_id: int
    description: str
    mission: str
    objectives: str
    meeting_schedule: Optional[str] = None
    founding_members_info: Optional[str] = None
    proposed_executives_info: Optional[str] = None
    contact_email: EmailStr
    contact_phone: str
    logo_url: Optional[str] = None
    constitution_url: Optional[str] = None
    supporting_docs_url: Optional[str] = None

class ClubApplicationReview(BaseModel):
    status: ApplicationStatus
    admin_remarks: Optional[str] = None

class ClubApplicationResponse(BaseModel):
    id: int
    applicant_id: int
    club_name: str
    category_id: int
    description: str
    mission: str
    objectives: str
    meeting_schedule: Optional[str] = None
    founding_members_info: Optional[str] = None
    proposed_executives_info: Optional[str] = None
    contact_email: str
    contact_phone: str
    logo_url: Optional[str] = None
    constitution_url: Optional[str] = None
    supporting_docs_url: Optional[str] = None
    status: ApplicationStatus
    admin_remarks: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    applicant: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class ClubExecutiveResponse(BaseModel):
    id: int
    club_id: int
    user_id: int
    position: str
    is_active: bool
    appointed_at: datetime
    relinquished_at: Optional[datetime] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Membership Schemas
class MembershipApply(BaseModel):
    club_id: int
    application_reason: Optional[str] = None

class MembershipReview(BaseModel):
    status: MembershipStatus
    review_remarks: Optional[str] = None
    position: Optional[str] = "General Member"

class MembershipResponse(BaseModel):
    id: int
    club_id: int
    student_id: int
    status: MembershipStatus
    position: str
    application_reason: Optional[str] = None
    review_remarks: Optional[str] = None
    joined_at: Optional[datetime] = None
    created_at: datetime
    club: Optional[ClubResponse] = None
    student: Optional[StudentResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Event Schemas
class EventCreate(BaseModel):
    club_id: int
    academic_session_id: Optional[int] = None
    title: str
    description: str
    banner_url: Optional[str] = None
    category: str = "General"
    venue: str
    start_time: datetime
    end_time: datetime
    registration_deadline: Optional[datetime] = None
    capacity: Optional[int] = None
    target_audience: str = "All Students"
    registration_required: bool = True
    status: EventStatus = EventStatus.PUBLISHED

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    banner_url: Optional[str] = None
    category: Optional[str] = None
    venue: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    capacity: Optional[int] = None
    target_audience: Optional[str] = None
    registration_required: Optional[bool] = None
    status: Optional[EventStatus] = None
    is_checkin_active: Optional[bool] = None

class EventResponse(BaseModel):
    id: int
    club_id: int
    title: str
    description: str
    banner_url: Optional[str] = None
    category: str
    venue: str
    start_time: datetime
    end_time: datetime
    registration_deadline: Optional[datetime] = None
    capacity: Optional[int] = None
    target_audience: str
    registration_required: bool
    status: EventStatus
    qr_code_token: Optional[str] = None
    is_checkin_active: bool
    created_at: datetime
    club: Optional[ClubResponse] = None
    registrations_count: Optional[int] = 0
    attendees_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Attendance Schemas
class CheckInRequest(BaseModel):
    qr_code_token: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ManualAttendance(BaseModel):
    student_id: str
    notes: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: int
    event_id: int
    student_id: int
    checked_in_at: datetime
    method: str
    notes: Optional[str] = None
    student: Optional[StudentResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Leadership Transition Schemas
class LeadershipHandoverCreate(BaseModel):
    club_id: int
    incoming_executive_id: int
    position: str
    academic_session_id: int
    handover_notes: Optional[str] = None

class LeadershipHandoverReview(BaseModel):
    status: HandoverStatus
    approval_notes: Optional[str] = None

class LeadershipTransitionResponse(BaseModel):
    id: int
    club_id: int
    outgoing_executive_id: int
    incoming_executive_id: int
    position: str
    academic_session_id: int
    handover_notes: Optional[str] = None
    status: HandoverStatus
    transition_date: Optional[datetime] = None
    created_at: datetime
    outgoing_executive: Optional[UserResponse] = None
    incoming_executive: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    notification_type: str
    created_at: datetime

    class Config:
        from_attributes = True
