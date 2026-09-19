from fastapi import APIRouter, HTTPException
from backend.app.schemas import AIQueryRequest, AIQueryResponse
from backend.app.quant.ai_assistant import query_ai_assistant

router = APIRouter(prefix="/api/ai", tags=["AI Research Assistant"])

@router.post("/query", response_model=AIQueryResponse)
async def ask_ai(req: AIQueryRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query prompt cannot be empty.")
    try:
        result = await query_ai_assistant(query=req.query, context_data=req.context_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Research Assistant error: {str(e)}")
