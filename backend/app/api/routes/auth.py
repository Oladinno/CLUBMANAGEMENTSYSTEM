from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from backend.app.db.session import get_db
from backend.app.models.models import User, Student, UserRole, AuditLog
from backend.app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_role(roles: list[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    # If student, verify student_id uniqueness
    if user_in.role == UserRole.STUDENT:
        if not user_in.student_id:
            raise HTTPException(status_code=400, detail="Student ID is required for student registration")
        existing_student = db.query(Student).filter(Student.student_id == user_in.student_id).first()
        if existing_student:
            raise HTTPException(status_code=400, detail="Student ID already registered")

    # Create user
    user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name.strip(),
        last_name=user_in.last_name.strip(),
        role=user_in.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create student profile if role is student or exec
    if user.role in [UserRole.STUDENT, UserRole.CLUB_EXECUTIVE]:
        student = Student(
            user_id=user.id,
            student_id=user_in.student_id or f"A{user.id:06d}",
            major=user_in.major,
            department=user_in.department,
            school=user_in.school or "SITC",
            phone=user_in.phone,
            graduation_year=user_in.graduation_year or 2027
        )
        db.add(student)
        db.commit()

    # Log action
    audit = AuditLog(
        user_id=user.id,
        action="REGISTER",
        entity_type="user",
        entity_id=user.id,
        details=f"User registered with role {user.role.value}"
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role.value})

    user_data = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "student_profile": {
            "id": user.student_profile.id,
            "student_id": user.student_profile.student_id,
            "school": user.student_profile.school,
            "major": user.student_profile.major
        } if user.student_profile else None
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated. Contact Student Affairs.")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role.value})

    user_data = {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "student_profile": {
            "id": user.student_profile.id,
            "student_id": user.student_profile.student_id,
            "school": user.student_profile.school,
            "major": user.student_profile.major
        } if user.student_profile else None
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
