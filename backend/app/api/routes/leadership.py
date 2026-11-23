from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from backend.app.db.session import get_db
from backend.app.models.models import (
    Club, ClubExecutive, LeadershipTransition, User, Student, UserRole,
    HandoverStatus, Notification, AuditLog
)
from backend.app.schemas.schemas import (
    LeadershipHandoverCreate, LeadershipHandoverReview, LeadershipTransitionResponse
)
from backend.app.api.routes.auth import get_current_user, require_role

router = APIRouter(prefix="/leadership", tags=["Leadership Transition"])

# Nominate incoming executive and initiate handover
@router.post("/initiate", response_model=LeadershipTransitionResponse)
def initiate_leadership_transition(
    handover_in: LeadershipHandoverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == handover_in.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    # Only current active executive or Admin can initiate
    if current_user.role != UserRole.ADMIN:
        is_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == handover_in.club_id,
            ClubExecutive.user_id == current_user.id,
            ClubExecutive.is_active == True
        ).first()
        if not is_exec:
            raise HTTPException(status_code=403, detail="Only active club executives can initiate a leadership transition")

    # Verify incoming user exists
    incoming_user = db.query(User).filter(User.id == handover_in.incoming_executive_id).first()
    if not incoming_user:
        raise HTTPException(status_code=404, detail="Incoming executive user not found")

    trans = LeadershipTransition(
        club_id=handover_in.club_id,
        outgoing_executive_id=current_user.id,
        incoming_executive_id=handover_in.incoming_executive_id,
        position=handover_in.position,
        academic_session_id=handover_in.academic_session_id,
        handover_notes=handover_in.handover_notes,
        status=HandoverStatus.PENDING
    )
    db.add(trans)
    db.commit()
    db.refresh(trans)

    # Notify Student Affairs Admins
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for adm in admins:
        notif = Notification(
            user_id=adm.id,
            title="Leadership Handover Pending Review",
            message=f"{club.name} initiated transition for position '{handover_in.position}' to {incoming_user.first_name} {incoming_user.last_name}.",
            link="/admin/executive-handover",
            notification_type="club"
        )
        db.add(notif)
    db.commit()

    return trans

# Review and Approve/Reject Leadership Handover (Admin or Club President)
@router.put("/{transition_id}/review", response_model=LeadershipTransitionResponse)
def review_leadership_transition(
    transition_id: int,
    review_in: LeadershipHandoverReview,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    trans = db.query(LeadershipTransition).filter(LeadershipTransition.id == transition_id).first()
    if not trans:
        raise HTTPException(status_code=404, detail="Transition record not found")

    trans.status = review_in.status
    trans.approved_by_id = admin.id

    if review_in.status == HandoverStatus.APPROVED:
        trans.transition_date = datetime.utcnow()

        # 1. Deactivate outgoing executive record
        outgoing_exec = db.query(ClubExecutive).filter(
            ClubExecutive.club_id == trans.club_id,
            ClubExecutive.user_id == trans.outgoing_executive_id,
            ClubExecutive.is_active == True
        ).first()
        if outgoing_exec:
            outgoing_exec.is_active = False
            outgoing_exec.relinquished_at = datetime.utcnow()

        # 2. Create new active ClubExecutive record for incoming user
        new_exec = ClubExecutive(
            club_id=trans.club_id,
            user_id=trans.incoming_executive_id,
            position=trans.position,
            academic_session_id=trans.academic_session_id,
            is_active=True,
            appointed_at=datetime.utcnow()
        )
        db.add(new_exec)

        # 3. Elevate incoming user role to CLUB_EXECUTIVE if not already
        inc_user = db.query(User).filter(User.id == trans.incoming_executive_id).first()
        if inc_user and inc_user.role == UserRole.STUDENT:
            inc_user.role = UserRole.CLUB_EXECUTIVE

        # 4. Notify both incoming and outgoing executives
        notif_in = Notification(
            user_id=trans.incoming_executive_id,
            title="Leadership Appointment Approved",
            message=f"You have been officially appointed as {trans.position} for {trans.club.name}.",
            link=f"/executive/dashboard",
            notification_type="club"
        )
        notif_out = Notification(
            user_id=trans.outgoing_executive_id,
            title="Leadership Transition Completed",
            message=f"Your handover of {trans.position} in {trans.club.name} was approved by Student Affairs.",
            link=f"/student/dashboard",
            notification_type="club"
        )
        db.add(notif_in)
        db.add(notif_out)

    # Audit log
    audit = AuditLog(
        user_id=admin.id,
        action=f"REVIEW_LEADERSHIP_TRANSITION_{trans.status.value.upper()}",
        entity_type="leadership_transition",
        entity_id=trans.id,
        details=f"Transition ID {trans.id} set to {trans.status.value}."
    )
    db.add(audit)
    db.commit()
    db.refresh(trans)

    return trans

# Get handover transitions for a club
@router.get("/club/{club_id}", response_model=List[LeadershipTransitionResponse])
def get_club_transitions(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(LeadershipTransition).filter(
        LeadershipTransition.club_id == club_id
    ).order_by(LeadershipTransition.created_at.desc()).all()

# Admin views all transitions
@router.get("/all", response_model=List[LeadershipTransitionResponse])
def get_all_transitions(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    return db.query(LeadershipTransition).order_by(LeadershipTransition.created_at.desc()).all()
