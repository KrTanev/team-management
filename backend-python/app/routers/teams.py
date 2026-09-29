from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import current_user, require_admin
from app.db import get_db
from app.errors import ApiError
from app.models import Team, TeamMember, User
from app.schemas import Page, TeamCreate, TeamMemberIn, TeamMemberOut, TeamOut, TeamUpdate

router = APIRouter(prefix="/teams", tags=["teams"])


def _team_out(db: Session, team: Team) -> TeamOut:
    memberships = (
        db.execute(
            select(TeamMember).where(TeamMember.team_id == team.id).order_by(TeamMember.user_id)
        )
        .scalars()
        .all()
    )
    members = []
    for m in memberships:
        user = db.execute(select(User).where(User.id == m.user_id)).scalar_one()
        members.append(TeamMemberOut(user_id=user.id, display_name=user.display_name, role=m.role))
    return TeamOut(
        id=team.id,
        name=team.name,
        description=team.description,
        members=members,
        created_at=team.created_at,
        updated_at=team.updated_at,
    )


def _not_found():
    return JSONResponse({"message": "Team not found"}, status_code=404)


def _can_manage(db: Session, me: User, team_id: int) -> bool:
    if me.role == "admin":
        return True
    lead = db.execute(
        select(TeamMember.id).where(
            TeamMember.team_id == team_id, TeamMember.user_id == me.id, TeamMember.role == "lead"
        )
    ).first()
    return lead is not None


@router.get("", response_model=Page[TeamOut])
def list_teams(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    total = db.execute(select(func.count(Team.id))).scalar_one()
    teams = db.execute(select(Team).order_by(Team.id).limit(limit).offset(offset)).scalars().all()
    return Page[TeamOut](
        items=[_team_out(db, t) for t in teams], total=total, limit=limit, offset=offset
    )


@router.post("", response_model=TeamOut, status_code=201)
def create_team(body: TeamCreate, me: User = Depends(current_user), db: Session = Depends(get_db)):
    require_admin(me)
    if db.execute(select(Team.id).where(Team.name == body.name)).first():
        raise ApiError(409, "A team with that name already exists")
    team = Team(name=body.name, description=body.description)
    db.add(team)
    db.commit()
    return _team_out(db, team)


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, _me: User = Depends(current_user), db: Session = Depends(get_db)):
    team = db.get(Team, team_id)
    if team is None:
        return _not_found()
    return _team_out(db, team)


@router.patch("/{team_id}", response_model=TeamOut)
def update_team(
    team_id: int,
    body: TeamUpdate,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    team = db.get(Team, team_id)
    if team is None:
        return _not_found()
    if not _can_manage(db, me, team_id):
        raise ApiError(403, "Only admins and the team lead can edit this team")
    changes = body.model_dump(exclude_unset=True)
    if not changes:
        raise ApiError(422, "Nothing to update")
    if "name" in changes and changes["name"] != team.name:
        if db.execute(select(Team.id).where(Team.name == changes["name"])).first():
            raise ApiError(409, "A team with that name already exists")
    for field, value in changes.items():
        setattr(team, field, value)
    db.commit()
    return _team_out(db, team)


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: int, me: User = Depends(current_user), db: Session = Depends(get_db)):
    require_admin(me)
    team = db.get(Team, team_id)
    if team is None:
        return _not_found()
    db.delete(team)
    db.commit()
    return Response(status_code=204)


@router.post("/{team_id}/members", response_model=TeamOut, status_code=201)
def add_member(
    team_id: int,
    body: TeamMemberIn,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    team = db.get(Team, team_id)
    if team is None:
        return _not_found()
    if not _can_manage(db, me, team_id):
        raise ApiError(403, "Only admins and the team lead can add members")
    if db.get(User, body.user_id) is None:
        raise ApiError(404, "User not found")
    db.add(TeamMember(team_id=team_id, user_id=body.user_id, role=body.role))
    db.commit()
    return _team_out(db, team)


@router.delete("/{team_id}/members/{user_id}", status_code=204)
def remove_member(
    team_id: int,
    user_id: int,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if db.get(Team, team_id) is None:
        return _not_found()
    if not _can_manage(db, me, team_id):
        raise ApiError(403, "Only admins and the team lead can remove members")
    membership = db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    ).scalar_one_or_none()
    if membership is None:
        raise ApiError(404, "Not a member of this team")
    db.delete(membership)
    db.commit()
    return Response(status_code=204)
