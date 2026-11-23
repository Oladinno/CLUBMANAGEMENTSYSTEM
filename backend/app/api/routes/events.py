import secrets
import qrcode
import io
import base64
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.db.session import get_db
from backend.app.models.models import (
    Event, EventRegistration, AttendanceRecord, Club, Student, User, UserRole,
    EventStatus, ClubExecutive, Membership, Notification, AuditLog
)
from backend.app.schemas.schemas import (
    EventCreate, EventUpdate, EventResponse, CheckInRequest, ManualAttendance, AttendanceResponse
)
from backend.app.api.routes.auth import get_current_user, require_role

router = APIRouter(prefix="/events", tags=["Events & Attendance"])

# Public / Student: Get upcoming published events
@router.get("", response_model=List[EventResponse])
def get_events(
    club_id: Optional[int] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Event).filter(Event.status == EventStatus.PUBLISHED)
    if club_id:
        query = query.filter(Event.club_id == club_id)
    if category:
        query = query.filter(Event.category == category)

    events = query.order_by(Event.start_time.asc()).offset(skip).limit(limit).all()
    result = []
    for ev in events:
        reg_count = db.query(EventRegistration).filter(EventRegistration.event_id == ev.id).count()
        att_count = db.query(AttendanceRecord).filter(AttendanceRecord.event_id == ev.id).count()
        ev_dict = {
            "id": ev.id,
            "club_id": ev.club_id,
            "title": ev.title,
            "description": ev.description,
            "banner_url": ev.banner_url,
            "category": ev.category,
            "venue": ev.venue,
            "start_time": ev.start_time,
            "end_time": ev.end_time,
            "registration_deadline": ev.registration_deadline,
            "capacity": ev.capacity,
            "target_audience": ev.target_audience,
            "registration_required": ev.registration_required,
            "status": ev.status,
            "qr_code_token": ev.qr_code_token,
            "is_checkin_active": ev.is_checkin_active,
            "created_at": ev.created_at,
            "club": ev.club,
            "registrations_count": reg_count,
            "attendees_count": att_count
        }
        result.append(ev_dict)
    return result

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    reg_count = db.query(EventRegistration).filter(EventRegistration.event_id == ev.id).count()
    att_count = db.query(AttendanceRecord).filter(AttendanceRecord.event_id == ev.id).count()
    return {
        "id": ev.id,
        "club_id": ev.club_id,
        "title": ev.title,
        "description": ev.description,
        "banner_url": ev.banner_url,
        "category": ev.category,
        "venue": ev.venue,
        "start_time": ev.start_time,
        "end_time": ev.end_time,
        "registration_deadline": ev.registration_deadline,
        "capacity": ev.capacity,
        "target_audience": ev.target_audience,
        "registration_required": ev.registration_required,
        "status": ev.status,
        "qr_code_token": ev.qr_code_token,
        "is_checkin_active": ev.is_checkin_active,
        "created_at": ev.created_at,
        "club": ev.club,
        "registrations_count": reg_count,
        "attendees_count": att_count
    }

# Create Event (Exec or Admin)
@router.post("", response_model=EventResponse)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        is_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == event_in.club_id,
            ClubExecutive.user_id == current_user.id,
            ClubExecutive.is_active == True
        ).first()
        if not is_exec:
            raise HTTPException(status_code=403, detail="Not authorized to create events for this club")

    # Generate secure QR code token
    qr_token = secrets.token_urlsafe(32)

    ev = Event(
        club_id=event_in.club_id,
        academic_session_id=event_in.academic_session_id,
        title=event_in.title,
        description=event_in.description,
        banner_url=event_in.banner_url,
        category=event_in.category,
        venue=event_in.venue,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        registration_deadline=event_in.registration_deadline,
        capacity=event_in.capacity,
        target_audience=event_in.target_audience,
        registration_required=event_in.registration_required,
        status=event_in.status,
        qr_code_token=qr_token,
        is_checkin_active=False,
        created_by_id=current_user.id
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # Broadcast notification to club members
    club = db.query(Club).filter(Club.id == ev.club_id).first()
    members = db.query(Membership).filter(
        Membership.club_id == ev.club_id,
        Membership.status == "approved"
    ).all()
    for m in members:
        if m.student and m.student.user_id:
            notif = Notification(
                user_id=m.student.user_id,
                title=f"New Event: {ev.title}",
                message=f"{club.name} published an upcoming event '{ev.title}' scheduled for {ev.start_time.strftime('%b %d, %Y at %I:%M %p')}.",
                link=f"/events/{ev.id}",
                notification_type="event"
            )
            db.add(notif)
    db.commit()

    return ev

# Update Event (Exec or Admin)
@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role != UserRole.ADMIN:
        is_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == ev.club_id,
            ClubExecutive.user_id == current_user.id,
            ClubExecutive.is_active == True
        ).first()
        if not is_exec:
            raise HTTPException(status_code=403, detail="Not authorized to edit this event")

    for field, val in event_in.dict(exclude_unset=True).items():
        setattr(ev, field, val)

    db.commit()
    db.refresh(ev)
    return ev

# Toggle Check-in Activation & QR Code Generation
@router.post("/{event_id}/toggle-checkin")
def toggle_checkin(
    event_id: int,
    active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role != UserRole.ADMIN:
        is_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == ev.club_id,
            ClubExecutive.user_id == current_user.id,
            ClubExecutive.is_active == True
        ).first()
        if not is_exec:
            raise HTTPException(status_code=403, detail="Not authorized")

    ev.is_checkin_active = active
    # Refresh token if activating to avoid stale QR codes
    if active and not ev.qr_code_token:
        ev.qr_code_token = secrets.token_urlsafe(32)

    db.commit()
    return {"is_checkin_active": ev.is_checkin_active, "qr_code_token": ev.qr_code_token}

# Get QR Code Image for Event Check-in
@router.get("/{event_id}/qr-code")
def get_event_qr_code(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    if not ev.qr_code_token:
        ev.qr_code_token = secrets.token_urlsafe(32)
        db.commit()

    # Generate QR Code png image
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4,
    )
    # The QR payload contains json/data with event token
    qr_data = f"AUN_EVENT:{ev.id}:{ev.qr_code_token}"
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#002147", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="image/png")

# Student registers for an event
@router.post("/{event_id}/register")
def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile required")

    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev or ev.status != EventStatus.PUBLISHED:
        raise HTTPException(status_code=404, detail="Event not available for registration")

    # Check capacity
    if ev.capacity:
        count = db.query(EventRegistration).filter(EventRegistration.event_id == event_id).count()
        if count >= ev.capacity:
            raise HTTPException(status_code=400, detail="Event registration is full")

    # Check duplicate
    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.student_id == student.id
    ).first()
    if existing:
        return {"message": "Already registered", "registration_id": existing.id}

    reg = EventRegistration(
        event_id=event_id,
        student_id=student.id,
        status="confirmed"
    )
    db.add(reg)
    db.commit()

    # Notify student
    notif = Notification(
        user_id=current_user.id,
        title="Event Registration Confirmed",
        message=f"You are confirmed for '{ev.title}' on {ev.start_time.strftime('%b %d, %Y')}.",
        link=f"/events/{ev.id}",
        notification_type="event"
    )
    db.add(notif)
    db.commit()

    return {"message": "Successfully registered for event", "registration_id": reg.id}

# Module 6: QR Code Attendance Check-in
@router.post("/check-in")
def check_in_attendance(
    check_in: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile required to check in")

    # Check token prefix format if from scanner
    token_str = check_in.qr_code_token
    if "AUN_EVENT:" in token_str:
        parts = token_str.split(":")
        if len(parts) >= 3:
            token_str = parts[2]

    # Find event by token
    ev = db.query(Event).filter(Event.qr_code_token == token_str).first()
    if not ev:
        raise HTTPException(status_code=400, detail="Invalid check-in QR code")

    if not ev.is_checkin_active:
        raise HTTPException(status_code=400, detail="Event check-in is not currently active")

    # Prevent duplicate attendance
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.event_id == ev.id,
        AttendanceRecord.student_id == student.id
    ).first()
    if existing:
        return {
            "status": "already_checked_in",
            "message": "You have already checked in to this event",
            "checked_in_at": existing.checked_in_at
        }

    att = AttendanceRecord(
        event_id=ev.id,
        student_id=student.id,
        checked_in_at=datetime.utcnow(),
        method="qr_scan"
    )
    db.add(att)
    db.commit()
    db.refresh(att)

    # Notify student
    notif = Notification(
        user_id=current_user.id,
        title="Event Attendance Recorded",
        message=f"Your attendance for '{ev.title}' has been successfully verified via QR code.",
        link=f"/student/my-attendance",
        notification_type="event"
    )
    db.add(notif)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully checked in to {ev.title}!",
        "checked_in_at": att.checked_in_at
    }

# Manual Attendance Check-in (by Exec or Admin)
@router.post("/{event_id}/manual-attendance")
def manual_attendance(
    event_id: int,
    manual_in: ManualAttendance,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.role != UserRole.ADMIN:
        is_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == ev.club_id,
            ClubExecutive.user_id == current_user.id,
            ClubExecutive.is_active == True
        ).first()
        if not is_exec:
            raise HTTPException(status_code=403, detail="Not authorized")

    student = None
    if manual_in.student_id.isdigit():
        student = db.query(Student).filter(Student.id == int(manual_in.student_id)).first()
    if not student:
        student = db.query(Student).filter(Student.student_id == manual_in.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with ID: " + str(manual_in.student_id))

    # Prevent duplicate
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.event_id == event_id,
        AttendanceRecord.student_id == student.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already marked present")

    att = AttendanceRecord(
        event_id=event_id,
        student_id=student.id,
        checked_in_at=datetime.utcnow(),
        method="manual",
        recorded_by_id=current_user.id,
        notes=manual_in.notes
    )
    db.add(att)
    db.commit()

    return {"status": "success", "message": "Attendance marked manually"}

# Get Attendees List for an Event
@router.get("/{event_id}/attendees", response_model=List[AttendanceResponse])
def get_event_attendees(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    return db.query(AttendanceRecord).filter(AttendanceRecord.event_id == event_id).all()
