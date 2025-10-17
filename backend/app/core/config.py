from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    app_name: str = "Where2Meet API"
    app_version: str = "0.1.0"
    debug: bool = True
    port: int = 8000
    host: str = "0.0.0.0"
    
    frontend_url: str = "http://localhost:3000"
    backend_cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    supabase_service_key: Optional[str] = None
    
    tfl_app_id: Optional[str] = None
    tfl_app_key: Optional[str] = None
    
    geocoder_user_agent: str = "where2meet_api"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()