from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "thesis_bot"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    GOOGLE_API_KEY: str | None = None
    CORS_ORIGINS: str = "*"  # Comma-separated list of origins, or "*" for all
    
    # Performance settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    VECTOR_SEARCH_K: int = 20  # Total documents to retrieve from vector store
    RETRIEVAL_TOP_K: int = 10  # Final number of docs to use (thesis prioritized)
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS into a list"""
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
