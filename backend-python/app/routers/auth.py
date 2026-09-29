from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import current_user, issue_token, verify_password
from app.db import get_db
from app.errors import ApiError
from app.models import User
from app.schemas import LoginIn, LoginOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == body.email.lower())).scalar_one_or_none()
    if user is None:
        raise ApiError(401, "No account with that email")
    if not verify_password(body.password, user.password_hash):
        raise ApiError(401, "Wrong password")
    return LoginOut(token=issue_token(db, user), user=UserOut.model_validate(user))


@router.post("/logout", status_code=204)
def logout(_user: User = Depends(current_user)):
    # The frontend drops the token from storage, which logs the user out.
    return Response(status_code=204)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user
