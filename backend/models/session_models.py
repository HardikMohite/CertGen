from pydantic import BaseModel


class SessionCreateResponse(BaseModel):
    """Response model returned when a new session is created."""

    session_id: str
    message: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "session_id": "a3f92a23-91e7-4c4b-b6d1-123abc",
                "message": "Session created successfully",
            }
        }
    }