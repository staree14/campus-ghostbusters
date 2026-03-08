import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://ghostuser:prapti@localhost:5432/ghostbusters"
)