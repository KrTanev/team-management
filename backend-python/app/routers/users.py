from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import current_user, hash_password, require_admin
from app.db import get_db
from app.errors import ApiError
from app.models import User
from app.schemas import Page, UserCreate, UserOut, UserRole, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise ApiError(404, "User not found")
    return user


@router.get("", response_model=Page[UserOut])
def list_users(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: str | None = None,
    role: UserRole | None = None,
    _me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    users = db.execute(select(User).order_by(User.id)).scalars().all()
    if search:
        needle = search.lower()
        users = [
            u
            for u in users
            if needle in u.email.lower()
            or needle in u.display_name.lower()
            or needle in f"{u.first_name} {u.last_name}".lower()
        ]
    if role:
        users = [u for u in users if u.role == role]
    return Page[UserOut](items=users, total=len(users), limit=limit, offset=offset)


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, _me: User = Depends(current_user), db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.execute(select(User.id).where(User.email == email)).first():
        raise ApiError(409, "Email already in use")
    user = User(
        email=email,
        first_name=body.first_name,
        last_name=body.last_name,
        display_name=body.display_name or f"{body.first_name} {body.last_name}",
        role=body.role,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, _me: User = Depends(current_user), db: Session = Depends(get_db)):
    return _get_user(db, user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdate,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, user_id)
    if me.id != user.id and me.role != "admin":
        raise ApiError(403, "You can only edit your own profile")
    changes = body.model_dump(exclude_unset=True)
    if not changes:
        raise ApiError(422, "Nothing to update")
    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, me: User = Depends(current_user), db: Session = Depends(get_db)):
    require_admin(me)
    db.delete(_get_user(db, user_id))
    db.commit()
    return Response(status_code=204)
