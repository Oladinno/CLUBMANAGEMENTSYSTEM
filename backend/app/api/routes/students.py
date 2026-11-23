import io
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from backend.app.db.session import get_db
from backend.app.models.models import (
    Student, User, Membership, EventRegistration, AttendanceRecord,
    ClubExecutive, LeadershipTransition, Event, Club, Notification, UserRole
)
from backend.app.schemas.schemas import NotificationResponse
from backend.app.api.routes.auth import get_current_user

router = APIRouter(prefix="/students", tags=["Student & Co-Curricular"])

# Module 7: Student Participation Dashboard Data
@router.get("/dashboard-stats")
def get_student_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")

    # Metrics
    total_clubs = db.query(Membership).filter(
        Membership.student_id == student.id,
        Membership.status == "approved"
    ).count()

    events_attended = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id
    ).count()

    events_registered = db.query(EventRegistration).filter(
        EventRegistration.student_id == student.id
    ).count()

    leadership_roles = db.query(ClubExecutive).filter(
        ClubExecutive.user_id == current_user.id,
        ClubExecutive.is_active == True
    ).all()

    # Recent activities (attendance)
    recent_attendances = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id
    ).order_by(AttendanceRecord.checked_in_at.desc()).limit(5).all()

    activities = []
    for att in recent_attendances:
        activities.append({
            "id": att.id,
            "title": f"Attended: {att.event.title}",
            "club_name": att.event.club.name,
            "date": att.checked_in_at,
            "method": att.method
        })

    return {
        "student_info": {
            "name": f"{current_user.first_name} {current_user.last_name}",
            "student_id": student.student_id,
            "school": student.school,
            "major": student.major,
            "graduation_year": student.graduation_year
        },
        "stats": {
            "total_clubs": total_clubs,
            "events_attended": events_attended,
            "events_registered": events_registered,
            "leadership_positions_count": len(leadership_roles)
        },
        "leadership_positions": [
            {"club_name": l.club.name, "position": l.position, "appointed_at": l.appointed_at}
            for l in leadership_roles
        ],
        "recent_activities": activities
    }

# Student Attendance History
@router.get("/attendance-history")
def get_student_attendance_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")

    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id
    ).order_by(AttendanceRecord.checked_in_at.desc()).all()

    result = []
    for r in records:
        result.append({
            "id": r.id,
            "event_title": r.event.title,
            "club_name": r.event.club.name,
            "event_date": r.event.start_time,
            "checked_in_at": r.checked_in_at,
            "method": r.method,
            "notes": r.notes
        })
    return result

# Co-Curricular Transcript Data (JSON)
@router.get("/co-curricular-transcript")
def get_co_curricular_transcript_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")

    memberships = db.query(Membership).filter(
        Membership.student_id == student.id,
        Membership.status == "approved"
    ).all()

    leadership = db.query(ClubExecutive).filter(
        ClubExecutive.user_id == current_user.id
    ).all()

    attendances = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id
    ).order_by(AttendanceRecord.checked_in_at.desc()).all()

    return {
        "student": {
            "full_name": f"{current_user.first_name} {current_user.last_name}",
            "student_id": student.student_id,
            "email": current_user.email,
            "school": student.school or "AUN School of Information Technology & Computing",
            "major": student.major or "Software Engineering",
            "department": student.department,
            "graduation_year": student.graduation_year
        },
        "club_memberships": [
            {
                "club_name": m.club.name,
                "category": m.club.category.name if m.club.category else "General",
                "position": m.position,
                "joined_at": m.joined_at,
                "left_at": m.left_at
            }
            for m in memberships
        ],
        "leadership_roles": [
            {
                "club_name": l.club.name,
                "position": l.position,
                "appointed_at": l.appointed_at,
                "relinquished_at": l.relinquished_at,
                "is_active": l.is_active
            }
            for l in leadership
        ],
        "events_attended": [
            {
                "event_title": a.event.title,
                "club_name": a.event.club.name,
                "category": a.event.category,
                "date": a.checked_in_at,
                "method": a.method
            }
            for a in attendances
        ],
        "total_events_attended": len(attendances),
        "total_clubs_joined": len(memberships),
        "generated_at": datetime.utcnow()
    }

# Export Co-Curricular Transcript as PDF
@router.get("/co-curricular-transcript/pdf")
def export_transcript_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")

    memberships = db.query(Membership).filter(
        Membership.student_id == student.id,
        Membership.status == "approved"
    ).all()

    leadership = db.query(ClubExecutive).filter(
        ClubExecutive.user_id == current_user.id
    ).all()

    attendances = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id
    ).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#002147'),
        alignment=1 # Center
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#4A5568'),
        alignment=1 # Center
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#002147'),
        spaceBefore=12,
        spaceAfter=6
    )
    cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=11)
    cell_normal = ParagraphStyle('CellNormal', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=11)

    story = []

    # Header
    story.append(Paragraph("AMERICAN UNIVERSITY OF NIGERIA", title_style))
    story.append(Paragraph("Office of Student Affairs | Division of Student Life", subtitle_style))
    story.append(Paragraph("OFFICIAL CO-CURRICULAR PARTICIPATION TRANSCRIPT", ParagraphStyle('SubSub', parent=subtitle_style, fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=colors.HexColor('#0C2340'))))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#002147'), spaceAfter=15))

    # Student Info Table
    info_data = [
        [
            Paragraph("<b>Student Name:</b>", cell_normal),
            Paragraph(f"{current_user.first_name} {current_user.last_name}", cell_bold),
            Paragraph("<b>Student ID:</b>", cell_normal),
            Paragraph(student.student_id, cell_bold)
        ],
        [
            Paragraph("<b>School:</b>", cell_normal),
            Paragraph(student.school or "SITC", cell_normal),
            Paragraph("<b>Major:</b>", cell_normal),
            Paragraph(student.major or "Software Engineering", cell_normal)
        ],
        [
            Paragraph("<b>Email:</b>", cell_normal),
            Paragraph(current_user.email, cell_normal),
            Paragraph("<b>Graduation Year:</b>", cell_normal),
            Paragraph(str(student.graduation_year or 2027), cell_normal)
        ]
    ]
    info_table = Table(info_data, colWidths=[100, 180, 100, 160])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F7FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#EDF2F7')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    # Section 1: Leadership Positions
    story.append(Paragraph("1. Leadership & Executive Roles", section_heading))
    if leadership:
        lead_data = [[
            Paragraph("Organization / Club", cell_bold),
            Paragraph("Executive Position", cell_bold),
            Paragraph("Appointment Period", cell_bold),
            Paragraph("Status", cell_bold)
        ]]
        for l in leadership:
            period = f"{l.appointed_at.strftime('%b %Y')} - {'Present' if l.is_active else (l.relinquished_at.strftime('%b %Y') if l.relinquished_at else 'Concluded')}"
            lead_data.append([
                Paragraph(l.club.name, cell_normal),
                Paragraph(l.position, cell_normal),
                Paragraph(period, cell_normal),
                Paragraph("Active" if l.is_active else "Completed", cell_normal)
            ])
        lead_table = Table(lead_data, colWidths=[180, 140, 140, 80])
        lead_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#002147')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#002147')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(lead_table)
    else:
        story.append(Paragraph("<i>No executive leadership positions held during this record period.</i>", cell_normal))

    story.append(Spacer(1, 14))

    # Section 2: Club Memberships
    story.append(Paragraph("2. Club & Organization Memberships", section_heading))
    if memberships:
        mem_data = [[
            Paragraph("Club Name", cell_bold),
            Paragraph("Category", cell_bold),
            Paragraph("Role", cell_bold),
            Paragraph("Joined Date", cell_bold)
        ]]
        for m in memberships:
            mem_data.append([
                Paragraph(m.club.name, cell_normal),
                Paragraph(m.club.category.name if m.club.category else "General", cell_normal),
                Paragraph(m.position or "General Member", cell_normal),
                Paragraph(m.joined_at.strftime('%b %d, %Y') if m.joined_at else "Enrolled", cell_normal)
            ])
        mem_table = Table(mem_data, colWidths=[180, 140, 120, 100])
        mem_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#1E3A8A')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(mem_table)
    else:
        story.append(Paragraph("<i>No active memberships recorded.</i>", cell_normal))

    story.append(Spacer(1, 14))

    # Section 3: Verified Event Attendances
    story.append(Paragraph("3. Event Participation & Attendance History", section_heading))
    if attendances:
        att_data = [[
            Paragraph("Event Title", cell_bold),
            Paragraph("Organizing Club", cell_bold),
            Paragraph("Attendance Date", cell_bold),
            Paragraph("Verification", cell_bold)
        ]]
        for a in attendances[:15]: # Show recent 15 in summary transcript
            att_data.append([
                Paragraph(a.event.title, cell_normal),
                Paragraph(a.event.club.name, cell_normal),
                Paragraph(a.checked_in_at.strftime('%b %d, %Y'), cell_normal),
                Paragraph("Verified QR" if a.method == "qr_scan" else "Verified Manual", cell_normal)
            ])
        att_table = Table(att_data, colWidths=[200, 160, 100, 80])
        att_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2563EB')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#2563EB')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(att_table)
    else:
        story.append(Paragraph("<i>No verified event attendance records yet.</i>", cell_normal))

    story.append(Spacer(1, 20))

    # Footer verification notice
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#A0AEC0'), spaceAfter=10))
    footer_text = f"Official Record generated electronically via AUN Club & Student Organization Management System on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}. Validated by AUN Student Affairs."
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, leading=10, textColor=colors.HexColor('#718096'), alignment=1)))

    doc.build(story)
    buffer.seek(0)
    filename = f"AUN_Transcript_{student.student_id}.pdf"
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Notifications for student
@router.get("/notifications", response_model=List[NotificationResponse])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()

@router.put("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}

@router.put("/notifications/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}
