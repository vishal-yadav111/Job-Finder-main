from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from .schemas import (
    AnalyzeJDEnvelope,
    AnalyzeJDRequest,
    ErrorEnvelope,
    GenerateAllEnvelope,
    GenerateAllRequest,
    GenerateCommunicationRequest,
    GenerateResponseEnvelope,
    TemplatesEnvelope,
)
from .service import get_ai_communication_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai-communication", tags=["ai-communication"])


@router.post("/generate", response_model=GenerateResponseEnvelope)
async def generate_communication(payload: GenerateCommunicationRequest):
    try:
        service = get_ai_communication_service()
        data = await service.generate_response(payload)
        return GenerateResponseEnvelope(data=data)
    except Exception as exc:
        logger.exception("AI communication generation failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/generate-all", response_model=GenerateAllEnvelope)
async def generate_all_communications(payload: GenerateAllRequest):
    try:
        service = get_ai_communication_service()
        data = await service.generate_all(payload)
        return GenerateAllEnvelope(data=data)
    except Exception as exc:
        logger.exception("AI communication generate-all failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/analyze-jd", response_model=AnalyzeJDEnvelope)
async def analyze_jd(payload: AnalyzeJDRequest):
    try:
        service = get_ai_communication_service()
        data = await service.analyze_jd(payload)
        return AnalyzeJDEnvelope(data=data)
    except Exception as exc:
        logger.exception("AI communication JD analysis failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/templates", response_model=TemplatesEnvelope)
async def list_templates():
    try:
        service = get_ai_communication_service()
        return TemplatesEnvelope(data=service.list_templates())
    except Exception as exc:
        logger.exception("AI communication template lookup failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
