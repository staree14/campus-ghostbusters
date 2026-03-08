from pydantic import BaseModel


class CaptureRequest(BaseModel):

    user_id: int

    ghost_id: int

    lat: float

    lon: float