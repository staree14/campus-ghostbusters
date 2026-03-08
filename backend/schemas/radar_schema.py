from pydantic import BaseModel

class RadarRequest(BaseModel):
    lat: float
    lon: float