from typing import Literal

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app import config, seed
from app.db import get_db
from app.errors import ApiError

router = APIRouter(tags=["system"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/__test__/reset", status_code=204, include_in_schema=False)
def reset(size: Literal["small", "large"] = "small", db: Session = Depends(get_db)):
    """Used by BetterDev's hidden checks. Do not remove."""
    if not config.TEST_MODE:
        raise ApiError(404, "Not found")
    seed.reset(db, size)
    return Response(status_code=204)
