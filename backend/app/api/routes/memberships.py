from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.db.session import get_db
from backend.app.models.models import (
    Membership, Club, Student, User, UserRole, MembershipStatus, Notification, AuditLog, ClubExecutive
)
from backend.app.schemas.schemas import MembershipApply, MembershipReview, MembershipResponse
from backend.app.api.routes.auth import get_current_user, require_role

router = APIRouter(prefix="/memberships", tags=["Memberships"])

# Student applies to join club
@router.post("/apply", response_model=MembershipResponse)
def apply_for_membership(
    apply_in: MembershipApply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(
            status_code=400,
            detail="Only student accounts can join clubs. Administrators and non-student accounts cannot apply for club memberships."
        )

    club = db.query(Club).filter(Club.id == apply_in.club_id, Club.is_active == True, Club.is_suspended == False).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found or not active")

    # Prevent duplicate applications
    existing = db.query(Membership).filter(
        Membership.club_id == apply_in.club_id,
        Membership.student_id == student.id
    ).first()

    if existing:
        if existing.status == MembershipStatus.APPROVED:
            raise HTTPException(status_code=400, detail="You are already an approved member of this club")
        elif existing.status == MembershipStatus.PENDING:
            raise HTTPException(status_code=400, detail="You already have a pending membership request for this club")
        else:
            # Re-apply if previously rejected or left
            existing.status = MembershipStatus.PENDING
            existing.application_reason = apply_in.application_reason
            existing.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

    membership = Membership(
        club_id=apply_in.club_id,
        student_id=student.id,
        status=MembershipStatus.PENDING,
        application_reason=apply_in.application_reason,
        position="General Member"
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    # Notify club executives
    executives = db.query(ClubExecutive).filter(
        ClubExecutive.club_id == club.id,
        ClubExecutive.is_active == True
    ).all()
    for ex in executives:
        notif = Notification(
            user_id=ex.user_id,
            title="New Membership Application",
            message=f"{current_user.first_name} {current_user.last_name} ({student.student_id}) requested to join {club.name}.",
            link=f"/executive/membership-requests",
            notification_type="membership"
        )
        db.add(notif)
    db.commit()

    return membership

# Student views their memberships
@router.get("/my", response_model=List[MembershipResponse])
def get_my_memberships(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        return []
    return db.query(Membership).filter(Membership.student_id == student.id).all()

# Club Executive views membership applications for their club
@router.get("/club/{club_id}", response_model=List[MembershipResponse])
def get_club_memberships(
    club_id: int,
    status: Optional[MembershipStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify permission: Admin or Executive of this club
    if current_user.role != UserRole.ADMIN:
        is_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == club_id,
            ClubExecutive.user_id == current_user.id,
            ClubExecutive.is_active == True
        ).first()
        if not is_exec:
            raise HTTPException(status_code=403, detail="Not authorized to view memberships for this club")

    query = db.query(Membership).filter(Membership.club_id == club_id)
    if status:
        query = query.filter(Membership.status == status)
    return query.order_by(Membership.created_at.desc()).all()

# Club Executive reviews membership request
@router.put("/{membership_id}/review", response_model=MembershipResponse)
def review_membership(
    membership_id: int,
    review_in: MembershipReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    mem = db.query(Membership).filter(Membership.id == membership_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Membership application not found")

    # Verify authorization: Executive of this club or Admin
    if current_user.role != UserRole.ADMIN:
        is_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == mem.club_id,
            ClubExecutive.user_id == current_user.id,
            ClubExecutive.is_active == True
        ).first()
        if not is_exec:
            raise HTTPException(status_code=403, detail="Not authorized to review applications for this club")

    mem.status = review_in.status
    mem.review_remarks = review_in.review_remarks
    if review_in.position:
        mem.position = review_in.position

    if review_in.status == MembershipStatus.APPROVED:
        mem.joined_at = datetime.utcnow()
    elif review_in.status in [MembershipStatus.REJECTED, MembershipStatus.LEFT_CLUB]:
        mem.left_at = datetime.utcnow()

    db.commit()
    db.refresh(mem)

    # Notify student
    club = db.query(Club).filter(Club.id == mem.club_id).first()
    target_student = db.query(Student).filter(Student.id == mem.student_id).first()
    if target_student and target_student.user_id:
        status_text = mem.status.value.replace("_", " ").title()
        notif = Notification(
            user_id=target_student.user_id,
            title=f"Membership {status_text}",
            message=f"Your membership request for {club.name if club else 'the club'} was {status_text}. {review_in.review_remarks or ''}",
            link=f"/student/my-clubs",
            notification_type="membership"
        )
        db.add(notif)
        db.commit()

    return mem

# Student leaves club
@router.post("/{membership_id}/leave")
def leave_club(
    membership_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")

    mem = db.query(Membership).filter(
        Membership.id == membership_id,
        Membership.student_id == student.id
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Membership not found")

    mem.status = MembershipStatus.LEFT_CLUB
    mem.left_at = datetime.utcnow()
    db.commit()
    return {"message": "You have left the club successfully"}
