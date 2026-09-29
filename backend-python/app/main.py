from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.db import Base, SessionLocal, engine, query_count
from app.errors import install_error_handlers
from app.models import User
from app.routers import auth, system, teams, users
from app.seed import reset


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.query(User.id).first() is None:
            reset(db, "small")
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Team Management API", version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.CORS_ORIGINS,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Query-Count"],
    )

    @app.middleware("http")
    async def count_queries(request: Request, call_next):
        box = [0]
        token = query_count.set(box)
        try:
            response = await call_next(request)
        finally:
            query_count.reset(token)
        if config.DEBUG_QUERIES:
            response.headers["X-Query-Count"] = str(box[0])
        return response

    install_error_handlers(app)
    for router in (system.router, auth.router, users.router, teams.router):
        app.include_router(router)
    return app


app = create_app()
