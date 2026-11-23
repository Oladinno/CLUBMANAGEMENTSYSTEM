from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from backend.app.db.session import get_db
from backend.app.models.models import (
    Club, ClubCategory, ClubApplication, ClubExecutive, Membership, Event,
    User, UserRole, ApplicationStatus, MembershipStatus, AuditLog, Notification
)
from backend.app.schemas.schemas import (
    ClubResponse, ClubCreate, ClubUpdate, CategoryResponse, CategoryBase,
    ClubApplicationCreate, ClubApplicationReview, ClubApplicationResponse, ClubExecutiveResponse
)
from backend.app.api.routes.auth import get_current_user, require_role

router = APIRouter(prefix="/clubs", tags=["Clubs"])

# Public categories
@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(ClubCategory).filter(ClubCategory.is_active == True).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(
    cat_in: CategoryBase,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    existing = db.query(ClubCategory).filter(ClubCategory.name == cat_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    cat = ClubCategory(**cat_in.dict())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

# Public club directory
@router.get("", response_model=List[ClubResponse])
def get_clubs(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Club).filter(Club.is_active == True, Club.is_suspended == False)
    if category_id:
        query = query.filter(Club.category_id == category_id)
    if search:
        query = query.filter(Club.name.ilike(f"%{search}%") | Club.description.ilike(f"%{search}%"))

    clubs = query.offset(skip).limit(limit).all()
    # Enrich counts
    result = []
    for c in clubs:
        member_cnt = db.query(Membership).filter(
            Membership.club_id == c.id,
            Membership.status == MembershipStatus.APPROVED
        ).count()
        event_cnt = db.query(Event).filter(
            Event.club_id == c.id,
            Event.start_time >= datetime.utcnow()
        ).count()
        c_dict = {
            "id": c.id,
            "name": c.name,
            "category_id": c.category_id,
            "description": c.description,
            "mission": c.mission,
            "objectives": c.objectives,
            "meeting_schedule": c.meeting_schedule,
            "logo_url": c.logo_url,
            "cover_image_url": c.cover_image_url,
            "email": c.email,
            "phone": c.phone,
            "is_active": c.is_active,
            "is_suspended": c.is_suspended,
            "suspension_reason": c.suspension_reason,
            "created_at": c.created_at,
            "category": c.category,
            "member_count": member_cnt,
            "upcoming_events_count": event_cnt
        }
        result.append(c_dict)
    return result

@router.get("/{club_id}", response_model=ClubResponse)
def get_club(club_id: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    member_cnt = db.query(Membership).filter(
        Membership.club_id == club.id,
        Membership.status == MembershipStatus.APPROVED
    ).count()
    event_cnt = db.query(Event).filter(
        Event.club_id == club.id,
        Event.start_time >= datetime.utcnow()
    ).count()
    return {
        "id": club.id,
        "name": club.name,
        "category_id": club.category_id,
        "description": club.description,
        "mission": club.mission,
        "objectives": club.objectives,
        "meeting_schedule": club.meeting_schedule,
        "logo_url": club.logo_url,
        "cover_image_url": club.cover_image_url,
        "email": club.email,
        "phone": club.phone,
        "is_active": club.is_active,
        "is_suspended": club.is_suspended,
        "suspension_reason": club.suspension_reason,
        "created_at": club.created_at,
        "category": club.category,
        "member_count": member_cnt,
        "upcoming_events_count": event_cnt
    }

# Update Club (Exec or Admin)
@router.put("/{club_id}", response_model=ClubResponse)
def update_club(
    club_id: int,
    club_in: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    # Check permission: Admin or Executive of this club
    if current_user.role != UserRole.ADMIN:
        is_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == club_id,
            ClubExecutive.user_id == current_user.id,
            ClubExecutive.is_active == True
        ).first()
        if not is_exec:
            raise HTTPException(status_code=403, detail="Not authorized to edit this club")

    for field, val in club_in.dict(exclude_unset=True).items():
        setattr(club, field, val)

    db.commit()
    db.refresh(club)
    return club

@router.get("/{club_id}/executives", response_model=List[ClubExecutiveResponse])
def get_club_executives(
    club_id: int,
    db: Session = Depends(get_db)
):
    return db.query(ClubExecutive).filter(
        ClubExecutive.club_id == club_id,
        ClubExecutive.is_active == True
    ).all()

# Module 2: Club Registration Applications
@router.post("/applications/register", response_model=ClubApplicationResponse)
def submit_club_application(
    app_in: ClubApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = ClubApplication(
        applicant_id=current_user.id,
        club_name=app_in.club_name,
        category_id=app_in.category_id,
        description=app_in.description,
        mission=app_in.mission,
        objectives=app_in.objectives,
        meeting_schedule=app_in.meeting_schedule,
        founding_members_info=app_in.founding_members_info,
        proposed_executives_info=app_in.proposed_executives_info,
        contact_email=app_in.contact_email,
        contact_phone=app_in.contact_phone,
        logo_url=app_in.logo_url,
        constitution_url=app_in.constitution_url,
        supporting_docs_url=app_in.supporting_docs_url,
        status=ApplicationStatus.PENDING
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Notify admins
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for adm in admins:
        notif = Notification(
            user_id=adm.id,
            title="New Club Registration",
            message=f"{current_user.first_name} {current_user.last_name} submitted a registration application for '{app.club_name}'.",
            link="/admin/registrations",
            notification_type="club"
        )
        db.add(notif)
    db.commit()

    return app

@router.get("/applications/my", response_model=List[ClubApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ClubApplication).filter(ClubApplication.applicant_id == current_user.id).order_by(ClubApplication.created_at.desc()).all()

@router.get("/applications/all", response_model=List[ClubApplicationResponse])
def get_all_applications(
    status: Optional[ApplicationStatus] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    query = db.query(ClubApplication)
    if status:
        query = query.filter(ClubApplication.status == status)
    return query.order_by(ClubApplication.created_at.desc()).all()

@router.put("/applications/{app_id}/review", response_model=ClubApplicationResponse)
def review_club_application(
    app_id: int,
    review_in: ClubApplicationReview,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    app = db.query(ClubApplication).filter(ClubApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = review_in.status
    app.admin_remarks = review_in.admin_remarks
    app.reviewed_by_id = admin.id
    app.reviewed_at = datetime.utcnow()

    # If approved, instantiate the Club and make applicant President
    if review_in.status == ApplicationStatus.APPROVED:
        # Check if club already created from this app
        if not app.approved_club_id:
            club = Club(
                name=app.club_name,
                category_id=app.category_id,
                description=app.description,
                mission=app.mission,
                objectives=app.objectives,
                meeting_schedule=app.meeting_schedule,
                logo_url=app.logo_url,
                email=app.contact_email,
                phone=app.contact_phone,
                is_active=True
            )
            db.add(club)
            db.commit()
            db.refresh(club)

            app.approved_club_id = club.id

            # Appoint applicant as President executive
            exec_profile = ClubExecutive(
                club_id=club.id,
                user_id=app.applicant_id,
                position="President",
                is_active=True
            )
            db.add(exec_profile)

            # Update applicant role to CLUB_EXECUTIVE if currently STUDENT
            applicant_user = db.query(User).filter(User.id == app.applicant_id).first()
            if applicant_user and applicant_user.role == UserRole.STUDENT:
                applicant_user.role = UserRole.CLUB_EXECUTIVE

            # Also add to Membership as approved
            if applicant_user and applicant_user.student_profile:
                membership = Membership(
                    club_id=club.id,
                    student_id=applicant_user.student_profile.id,
                    status=MembershipStatus.APPROVED,
                    position="President",
                    joined_at=datetime.utcnow()
                )
                db.add(membership)

    # Notify applicant
    status_label = app.status.value.replace("_", " ").title()
    notif = Notification(
        user_id=app.applicant_id,
        title=f"Club Application {status_label}",
        message=f"Your club registration application for '{app.club_name}' was updated to '{status_label}'. Remarks: {review_in.admin_remarks or 'None'}",
        link=f"/student/clubs",
        notification_type="club"
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=admin.id,
        action=f"REVIEW_CLUB_APP_{app.status.value.upper()}",
        entity_type="club_application",
        entity_id=app.id,
        details=f"Status set to {app.status.value}. Remarks: {review_in.admin_remarks}"
    )
    db.add(audit)
    db.commit()
    db.refresh(app)
    return app
