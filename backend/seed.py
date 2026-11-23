from datetime import datetime, timedelta
import secrets
from backend.app.db.session import SessionLocal, Base, engine
from backend.app.models.models import (
    User, Student, ClubCategory, Club, ClubExecutive, Membership, Event,
    EventRegistration, AttendanceRecord, AcademicSession, UserRole,
    MembershipStatus, EventStatus
)
from backend.app.core.security import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).filter(User.email == "admin@aun.edu.ng").first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding AUN Club Management System Database...")

    # 1. Academic Sessions
    curr_session = AcademicSession(
        name="2026/2027",
        term="Spring",
        is_current=True,
        start_date=datetime(2026, 1, 15),
        end_date=datetime(2026, 5, 25)
    )
    past_session = AcademicSession(
        name="2025/2026",
        term="Fall",
        is_current=False,
        start_date=datetime(2025, 8, 20),
        end_date=datetime(2025, 12, 18)
    )
    db.add(curr_session)
    db.add(past_session)
    db.commit()

    # 2. Club Categories
    cat_academic = ClubCategory(name="Academic & Technical", description="Engineering, Computing, Sciences, and Business societies", icon="Code")
    cat_arts = ClubCategory(name="Arts & Culture", description="Music, Drama, Dance, and Cultural Heritage", icon="Palette")
    cat_sports = ClubCategory(name="Sports & Recreation", description="Athletics, Esports, Martial arts, and Fitness", icon="Trophy")
    cat_leadership = ClubCategory(name="Leadership & Civic Engagement", description="Rotaract, Debate, Model UN, and Community Outreach", icon="ShieldCheck")
    cat_faith = ClubCategory(name="Faith & Spiritual", description="Interfaith and spiritual life associations", icon="Heart")
    db.add_all([cat_academic, cat_arts, cat_sports, cat_leadership, cat_faith])
    db.commit()

    # 3. Users: Admin, Executives, Students
    admin_user = User(
        email="admin@aun.edu.ng",
        hashed_password=get_password_hash("Admin123!"),
        first_name="Dr. Amina",
        last_name="Bello",
        role=UserRole.ADMIN,
        is_active=True
    )

    exec_user1 = User(
        email="tunde.adebayo@aun.edu.ng",
        hashed_password=get_password_hash("Student123!"),
        first_name="Tunde",
        last_name="Adebayo",
        role=UserRole.CLUB_EXECUTIVE,
        is_active=True
    )

    exec_user2 = User(
        email="fatima.umar@aun.edu.ng",
        hashed_password=get_password_hash("Student123!"),
        first_name="Fatima",
        last_name="Umar",
        role=UserRole.CLUB_EXECUTIVE,
        is_active=True
    )

    student_user1 = User(
        email="chidi.okonkwo@aun.edu.ng",
        hashed_password=get_password_hash("Student123!"),
        first_name="Chidi",
        last_name="Okonkwo",
        role=UserRole.STUDENT,
        is_active=True
    )

    student_user2 = User(
        email="zainab.aliyu@aun.edu.ng",
        hashed_password=get_password_hash("Student123!"),
        first_name="Zainab",
        last_name="Aliyu",
        role=UserRole.STUDENT,
        is_active=True
    )

    db.add_all([admin_user, exec_user1, exec_user2, student_user1, student_user2])
    db.commit()

    # 4. Student Profiles
    s_exec1 = Student(user_id=exec_user1.id, student_id="A00021450", major="Software Engineering", school="SITC", graduation_year=2027)
    s_exec2 = Student(user_id=exec_user2.id, student_id="A00022310", major="Telecommunications & Wireless", school="SITC", graduation_year=2026)
    s_stud1 = Student(user_id=student_user1.id, student_id="A00024580", major="Computer Science", school="SITC", graduation_year=2028)
    s_stud2 = Student(user_id=student_user2.id, student_id="A00023890", major="Business Administration", school="SBE", graduation_year=2027)
    db.add_all([s_exec1, s_exec2, s_stud1, s_stud2])
    db.commit()

    # 5. Clubs
    club_gdsc = Club(
        name="Google Developer Student Club (GDSC AUN)",
        category_id=cat_academic.id,
        description="A university-based community group for students interested in Google developer technologies, mobile development, cloud computing, and AI.",
        mission="Bridge the gap between theory and practice for student developers at the American University of Nigeria.",
        objectives="Host weekly coding sprints, organize hackathons, and build impactful community projects.",
        meeting_schedule="Fridays 4:00 PM - SITC Lab 3",
        logo_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop",
        email="gdsc@aun.edu.ng",
        phone="+234 803 111 2233",
        is_active=True
    )

    club_rotaract = Club(
        name="AUN Rotaract Club",
        category_id=cat_leadership.id,
        description="A service and leadership development organization empowering youth through community projects in Yola and Adamawa State.",
        mission="Develop leadership through community service and international fellowship.",
        objectives="Organize community cleanups, feed-the-hungry campaigns, and literacy initiatives.",
        meeting_schedule="Saturdays 11:00 AM - Student Center Room 204",
        logo_url="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=150&auto=format&fit=crop",
        email="rotaract@aun.edu.ng",
        phone="+234 802 444 5566",
        is_active=True
    )

    club_cyber = Club(
        name="AUN Cybersecurity & Ethical Hacking Society",
        category_id=cat_academic.id,
        description="Student-led cybersecurity research group focusing on CTFs, network defense, penetration testing, and digital forensics.",
        mission="Raise cyber defense awareness and nurture future cybersecurity leaders across Africa.",
        objectives="Organize hands-on capture-the-flag competitions, security audits, and workshops.",
        meeting_schedule="Wednesdays 5:30 PM - Cybersecurity Lab",
        logo_url="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop",
        email="cybersec@aun.edu.ng",
        phone="+234 805 777 8899",
        is_active=True
    )
    db.add_all([club_gdsc, club_rotaract, club_cyber])
    db.commit()

    # 6. Club Executives
    ex1 = ClubExecutive(club_id=club_gdsc.id, user_id=exec_user1.id, position="President", academic_session_id=curr_session.id, is_active=True)
    ex2 = ClubExecutive(club_id=club_rotaract.id, user_id=exec_user2.id, position="President", academic_session_id=curr_session.id, is_active=True)
    db.add_all([ex1, ex2])
    db.commit()

    # 7. Memberships
    m1 = Membership(club_id=club_gdsc.id, student_id=s_exec1.id, status=MembershipStatus.APPROVED, position="President", joined_at=datetime.utcnow() - timedelta(days=90))
    m2 = Membership(club_id=club_gdsc.id, student_id=s_stud1.id, status=MembershipStatus.APPROVED, position="General Member", joined_at=datetime.utcnow() - timedelta(days=45))
    m3 = Membership(club_id=club_rotaract.id, student_id=s_exec2.id, status=MembershipStatus.APPROVED, position="President", joined_at=datetime.utcnow() - timedelta(days=120))
    m4 = Membership(club_id=club_rotaract.id, student_id=s_stud2.id, status=MembershipStatus.APPROVED, position="Treasurer", joined_at=datetime.utcnow() - timedelta(days=60))
    m5 = Membership(club_id=club_cyber.id, student_id=s_stud1.id, status=MembershipStatus.PENDING, position="General Member", application_reason="Passionate about ethical hacking and network security.")
    db.add_all([m1, m2, m3, m4, m5])
    db.commit()

    # 8. Events
    ev1 = Event(
        club_id=club_gdsc.id,
        academic_session_id=curr_session.id,
        title="Modern Web Development with React & TypeScript",
        description="Comprehensive masterclass on modern frontend architectures, hooks, state management, and API integrations.",
        banner_url="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop",
        category="Workshop",
        venue="Robert Pastor E-Library, Auditorium",
        start_time=datetime.utcnow() + timedelta(days=2, hours=3),
        end_time=datetime.utcnow() + timedelta(days=2, hours=6),
        capacity=100,
        status=EventStatus.PUBLISHED,
        qr_code_token=secrets.token_urlsafe(32),
        is_checkin_active=True,
        created_by_id=exec_user1.id
    )

    ev2 = Event(
        club_id=club_rotaract.id,
        academic_session_id=curr_session.id,
        title="Yola Community Outreach & Tree Planting Campaign",
        description="Annual green initiative by AUN Rotaract Club in collaboration with the local community in Yola.",
        banner_url="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop",
        category="Community Service",
        venue="Community Center & Jimeta Green Belt",
        start_time=datetime.utcnow() + timedelta(days=7, hours=2),
        end_time=datetime.utcnow() + timedelta(days=7, hours=7),
        capacity=60,
        status=EventStatus.PUBLISHED,
        qr_code_token=secrets.token_urlsafe(32),
        is_checkin_active=False,
        created_by_id=exec_user2.id
    )

    past_ev = Event(
        club_id=club_gdsc.id,
        academic_session_id=curr_session.id,
        title="AUN Annual Hackathon: Tech for Social Good",
        description="48-hour student hackathon solving real-world challenges in health, education, and commerce.",
        banner_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop",
        category="Hackathon",
        venue="SITC Innovation Hub",
        start_time=datetime.utcnow() - timedelta(days=14),
        end_time=datetime.utcnow() - timedelta(days=12),
        capacity=120,
        status=EventStatus.COMPLETED,
        qr_code_token=secrets.token_urlsafe(32),
        is_checkin_active=False,
        created_by_id=exec_user1.id
    )
    db.add_all([ev1, ev2, past_ev])
    db.commit()

    # 9. Attendance and Registrations
    reg1 = EventRegistration(event_id=ev1.id, student_id=s_stud1.id, status="confirmed")
    reg2 = EventRegistration(event_id=ev1.id, student_id=s_stud2.id, status="confirmed")
    reg3 = EventRegistration(event_id=past_ev.id, student_id=s_stud1.id, status="confirmed")

    att1 = AttendanceRecord(event_id=past_ev.id, student_id=s_stud1.id, checked_in_at=datetime.utcnow() - timedelta(days=14), method="qr_scan")
    att2 = AttendanceRecord(event_id=past_ev.id, student_id=s_exec1.id, checked_in_at=datetime.utcnow() - timedelta(days=14), method="manual")
    db.add_all([reg1, reg2, reg3, att1, att2])
    db.commit()

    db.close()
    print("Database seeding completed successfully with realistic AUN data!")

if __name__ == "__main__":
    seed_database()
