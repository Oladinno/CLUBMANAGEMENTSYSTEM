import io
import csv
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from backend.app.db.session import get_db
from backend.app.models.models import (
    Club, ClubCategory, ClubApplication, User, Student, Membership, Event,
    AttendanceRecord, LeadershipTransition, AcademicSession, AuditLog, UserRole
)
from backend.app.schemas.schemas import AcademicSessionBase, AcademicSessionCreate, AcademicSessionResponse, UserResponse
from backend.app.api.routes.auth import require_role

router = APIRouter(prefix="/admin", tags=["Student Affairs Administration"])

# Student Affairs Master Dashboard Analytics
@router.get("/dashboard-analytics")
def get_admin_dashboard_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    total_clubs = db.query(Club).count()
    active_clubs = db.query(Club).filter(Club.is_active == True, Club.is_suspended == False).count()
    suspended_clubs = db.query(Club).filter(Club.is_suspended == True).count()
    total_students = db.query(Student).count()
    total_memberships = db.query(Membership).filter(Membership.status == "approved").count()
    total_events = db.query(Event).count()
    upcoming_events = db.query(Event).filter(Event.start_time >= datetime.utcnow(), Event.status == "published").count()
    pending_applications = db.query(ClubApplication).filter(ClubApplication.status == "pending").count()
    pending_handovers = db.query(LeadershipTransition).filter(LeadershipTransition.status == "pending").count()

    # Membership distribution by category
    categories = db.query(ClubCategory).all()
    category_distribution = []
    for cat in categories:
        club_ids = [c.id for c in cat.clubs]
        m_count = db.query(Membership).filter(
            Membership.club_id.in_(club_ids),
            Membership.status == "approved"
        ).count() if club_ids else 0
        category_distribution.append({
            "category": cat.name,
            "clubs_count": len(club_ids),
            "memberships_count": m_count
        })

    # Recent Audit Logs
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    logs_data = []
    for log in recent_logs:
        logs_data.append({
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "details": log.details,
            "created_at": log.created_at,
            "user_email": log.user.email if log.user else "System"
        })

    return {
        "metrics": {
            "total_clubs": total_clubs,
            "active_clubs": active_clubs,
            "suspended_clubs": suspended_clubs,
            "total_students": total_students,
            "total_memberships": total_memberships,
            "total_events": total_events,
            "upcoming_events": upcoming_events,
            "pending_applications": pending_applications,
            "pending_handovers": pending_handovers
        },
        "category_distribution": category_distribution,
        "recent_logs": logs_data
    }

# Academic Sessions Management
@router.get("/academic-sessions", response_model=List[AcademicSessionResponse])
def get_academic_sessions(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    return db.query(AcademicSession).order_by(AcademicSession.start_date.desc()).all()

@router.post("/academic-sessions", response_model=AcademicSessionResponse)
def create_academic_session(
    sess_in: AcademicSessionBase,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    if sess_in.is_current:
        # unset others
        db.query(AcademicSession).update({"is_current": False})

    session_obj = AcademicSession(**sess_in.dict())
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj

# Club Suspension / Reactivation
@router.put("/clubs/{club_id}/status")
def set_club_status(
    club_id: int,
    is_active: bool,
    is_suspended: bool,
    suspension_reason: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    club.is_active = is_active
    club.is_suspended = is_suspended
    club.suspension_reason = suspension_reason if is_suspended else None

    action_name = "SUSPEND_CLUB" if is_suspended else ("ACTIVATE_CLUB" if is_active else "DEACTIVATE_CLUB")
    audit = AuditLog(
        user_id=admin.id,
        action=action_name,
        entity_type="club",
        entity_id=club.id,
        details=f"Reason: {suspension_reason or 'No reason provided'}"
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "is_active": club.is_active, "is_suspended": club.is_suspended}

# User Management: list all users
@router.get("/users")
def get_all_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            User.email.ilike(f"%{search}%") |
            User.first_name.ilike(f"%{search}%") |
            User.last_name.ilike(f"%{search}%")
        )

    users = query.offset(skip).limit(limit).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "student_id": u.student_profile.student_id if u.student_profile else None,
            "school": u.student_profile.school if u.student_profile else None,
            "major": u.student_profile.major if u.student_profile else None
        })
    return result

# Reports & Analytics: Export CSV of Club Activities
@router.get("/reports/clubs/csv")
def export_clubs_csv(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    clubs = db.query(Club).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Club Name", "Category", "Status", "Total Members", "Total Events", "Created At"])

    for c in clubs:
        m_count = db.query(Membership).filter(Membership.club_id == c.id, Membership.status == "approved").count()
        e_count = db.query(Event).filter(Event.club_id == c.id).count()
        status = "Suspended" if c.is_suspended else ("Active" if c.is_active else "Inactive")
        writer.writerow([
            c.id,
            c.name,
            c.category.name if c.category else "None",
            status,
            m_count,
            e_count,
            c.created_at.strftime("%Y-%m-%d")
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aun_clubs_report.csv"}
    )

# Reports & Analytics: Export CSV of Student Attendance
@router.get("/reports/attendance/csv")
def export_attendance_csv(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    records = db.query(AttendanceRecord).order_by(AttendanceRecord.checked_in_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Record ID", "Student Name", "Student ID", "Event Title", "Club Name", "Checked In At", "Method"])

    for r in records:
        student_name = f"{r.student.user.first_name} {r.student.user.last_name}" if r.student and r.student.user else "Unknown"
        student_id = r.student.student_id if r.student else "Unknown"
        event_title = r.event.title if r.event else "Unknown"
        club_name = r.event.club.name if r.event and r.event.club else "Unknown"
        writer.writerow([
            r.id,
            student_name,
            student_id,
            event_title,
            club_name,
            r.checked_in_at.strftime("%Y-%m-%d %H:%M"),
            r.method
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aun_attendance_report.csv"}
    )
