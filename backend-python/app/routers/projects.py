from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.auth import current_user
from app.db import get_db
from app.errors import ApiError
from app.models import Project, ProjectMember, ProjectStatus, ProjectTeams, Team, User
from app.schemas import (
    Page,
    ProjectCreate,
    ProjectMemberIn,
    ProjectMemberOut,
    ProjectOut,
    ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_visible_project(db: Session, me: User, project_id: int) -> Project | None:
    project = db.get(Project, project_id)
    if project is None:
        return None
    if me.role == "admin":
        return project
    membership = db.execute(
        select(ProjectMember.id).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == me.id,
        )
    ).first()
    if membership is None:
        return None
    return project


def _require_project_admin(db: Session, me: User, project_id: int) -> Project:
    project = _get_visible_project(db, me, project_id)
    if project is None:
        raise ApiError(404, "Project not found")
    if me.role == "admin":
        return project
    role = db.execute(
        select(ProjectMember.role).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == me.id,
        )
    ).scalar_one_or_none()
    if role != "admin":
        raise ApiError(403, "Project admin required")
    return project


def _validate_team_ids(db: Session, team_ids: list[int]) -> None:
    for tid in team_ids:
        if db.get(Team, tid) is None:
            raise ApiError(422, "Unknown team id")


def _replace_team_links(db: Session, project_id: int, team_ids: list[int]) -> None:
    db.execute(delete(ProjectTeams).where(ProjectTeams.project_id == project_id))
    for tid in team_ids:
        db.add(ProjectTeams(project_id=project_id, team_id=tid))


def _project_out(db: Session, project: Project) -> ProjectOut:
    team_ids = (
        db.execute(
            select(ProjectTeams.team_id)
            .where(ProjectTeams.project_id == project.id)
            .order_by(ProjectTeams.team_id)
        )
        .scalars()
        .all()
    )
    memberships = db.execute(
        select(ProjectMember.user_id, User.display_name, ProjectMember.role)
        .join(User, User.id == ProjectMember.user_id)
        .where(ProjectMember.project_id == project.id)
        .order_by(ProjectMember.user_id)
    ).all()
    members = [
        ProjectMemberOut(
            user_id=user_id,
            display_name=display_name,
            role=role,
        )
        for user_id, display_name, role in memberships
    ]
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        team_ids=team_ids,
        members=members,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("", response_model=Page[ProjectOut])
def list_projects(
    status: ProjectStatus | None = None,
    team_id: int | None = Query(None, alias="teamId"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    query = select(Project)
    if me.role != "admin":
        query = query.where(
            Project.id.in_(select(ProjectMember.project_id).where(ProjectMember.user_id == me.id))
        )
    if status is not None:
        query = query.where(Project.status == status)
    if team_id is not None:
        query = query.where(
            Project.id.in_(select(ProjectTeams.project_id).where(ProjectTeams.team_id == team_id))
        )

    total = db.execute(select(func.count()).select_from(query.subquery())).scalar_one()
    projects = db.execute(query.order_by(Project.id).limit(limit).offset(offset)).scalars().all()
    return Page[ProjectOut](
        items=[_project_out(db, p) for p in projects],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    body: ProjectCreate,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    _validate_team_ids(db, body.team_ids)
    if db.execute(select(Project.id).where(Project.name == body.name)).first():
        raise ApiError(409, "A project with that name already exists")

    project = Project(name=body.name, description=body.description, status=body.status)
    db.add(project)
    db.flush()
    db.add(ProjectMember(project_id=project.id, user_id=me.id, role="admin"))
    for tid in body.team_ids:
        db.add(ProjectTeams(project_id=project.id, team_id=tid))
    db.commit()
    db.refresh(project)
    return _project_out(db, project)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    project = _get_visible_project(db, me, project_id)
    if project is None:
        raise ApiError(404, "Project not found")
    return _project_out(db, project)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    body: ProjectUpdate,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    project = _require_project_admin(db, me, project_id)
    changes = body.model_dump(exclude_unset=True)

    if changes.get("name") == "":
        changes.pop("name")

    if "name" in changes:
        changes["name"] = changes["name"].strip()
        if not changes["name"]:
            raise ApiError(422, "Name cannot be empty")

    team_ids = changes.pop("team_ids", None)

    if not changes and team_ids is None:
        raise ApiError(422, "Nothing to update")

    if "name" in changes and changes["name"] != project.name:
        existing = db.scalar(
            select(Project.id).where(Project.name == changes["name"], Project.id != project.id)
        )
        if existing is not None:
            raise ApiError(409, "A project with that name already exists")

    if team_ids is not None:
        _validate_team_ids(db, team_ids)
        _replace_team_links(db, project.id, team_ids)

    for field, value in changes.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return _project_out(db, project)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    project = _require_project_admin(db, me, project_id)
    db.delete(project)
    db.commit()
    return Response(status_code=204)


@router.post("/{project_id}/members", response_model=ProjectOut, status_code=201)
def add_project_member(
    project_id: int,
    body: ProjectMemberIn,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    project = _require_project_admin(db, me, project_id)
    if db.get(User, body.user_id) is None:
        raise ApiError(404, "User not found")
    existing = db.execute(
        select(ProjectMember.id).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == body.user_id,
        )
    ).first()
    if existing is not None:
        raise ApiError(409, "User is already a project member")

    db.add(ProjectMember(project_id=project_id, user_id=body.user_id, role=body.role))
    db.commit()
    db.refresh(project)
    return _project_out(db, project)


@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_project_member(
    project_id: int,
    user_id: int,
    me: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    _require_project_admin(db, me, project_id)
    membership = db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    ).scalar_one_or_none()
    if membership is None:
        raise ApiError(404, "Not a member of this project")

    if membership.role == "admin":
        admin_count = db.execute(
            select(func.count())
            .select_from(ProjectMember)
            .where(ProjectMember.project_id == project_id, ProjectMember.role == "admin")
        ).scalar_one()
        if admin_count <= 1:
            raise ApiError(409, "Cannot remove the last project admin")

    db.delete(membership)
    db.commit()
    return Response(status_code=204)
