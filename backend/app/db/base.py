# Import all models here so Alembic can discover them
from app.db.base_class import Base
from app.models.user import User
from app.models.file import File
from app.models.transcription import Transcription
