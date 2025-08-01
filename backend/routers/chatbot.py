
# Import the two separated AI functions
from .chatbot_ai import stream_answer, find_citation

from fastapi.responses import *
from fastapi import *
from database import *
from model import *
from typing import *

router = APIRouter()
db_dependency = Annotated[Session, Depends(get_db)]

#  --------------------------------------------------------- chatbot ---------------------------------------------------------
# --- Pydantic Models for Request/Response --- 
# Model for the streaming request body 
    
class StreamRequest(BaseModel):
    query: str
    context: str
    context_name: str
    messages: List[Dict]

class CitationRequest(BaseModel):
    answer: str
    context: str

class CitationResponse(BaseModel):
    sourceLine: str

# --- API Endpoints ---

@router.post("/stream-answer/")
async def stream_answer_endpoint(request: StreamRequest):
    """
    Receives a POST request with a body and returns a streaming response.
    """
    print(f"Streaming request received for query: '{request.query[:50]}...'")
    # The generator function is now defined directly within the endpoint
    async def event_generator():
        try:
            async for chunk in stream_answer(request.context, request.query, request.messages):
                yield chunk
        except Exception as e:
            print(f"Error in stream_answer event_generator: {e}")
            yield "An error occurred while streaming the response."
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/find-citation/", response_model=CitationResponse)
async def find_citation_endpoint(request: CitationRequest):
    """Receives context and an answer, returns the most relevant source line."""
    print(f"Received citation request for answer: '{request.answer[:50]}...'")
    try:
        source_line = find_citation(context=request.context, answer=request.answer)
        print(f"Returning Citation: {source_line}")
        return {"sourceLine": source_line}
    except Exception as e:
        print(f"An error occurred during find_citation_endpoint: {e}")
        raise HTTPException(status_code=500, detail="Error finding citation from AI model.")