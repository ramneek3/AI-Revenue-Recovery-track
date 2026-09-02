from fastapi import APIRouter
from app.api.seed import router as seed_router
from app.api.transactions import router as transactions_router
from app.api.metrics import router as metrics_router
from app.api.escalations import router as escalations_router
from app.api.recovery import router as recovery_router

api_router = APIRouter()
api_router.include_router(seed_router)
api_router.include_router(transactions_router)
api_router.include_router(metrics_router)
api_router.include_router(escalations_router)
api_router.include_router(recovery_router)
