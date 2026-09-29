import os

# Settings are read straight from the environment with fallbacks.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./team-management.db")
TEST_MODE = os.getenv("BD_TEST_MODE") == "1"
DEBUG_QUERIES = os.getenv("BD_DEBUG_QUERIES") == "1" or TEST_MODE
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
TOKEN_BYTES = 32
