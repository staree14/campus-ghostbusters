from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from db.database import Base
import datetime


class Ghost(Base):

    __tablename__ = "active_ghosts"

    id = Column(Integer, primary_key=True)

    type = Column(String)

    lat = Column(Float)

    lon = Column(Float)

    captured = Column(Boolean, default=False)

    spawn_time = Column(DateTime, default=datetime.datetime.utcnow)

    expiration_time = Column(DateTime)