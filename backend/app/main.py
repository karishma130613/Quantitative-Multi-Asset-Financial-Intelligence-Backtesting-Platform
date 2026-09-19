import json
import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User, Experiment, SavedStrategy
from backend.app.auth.security import get_password_hash

# Import Routers
from backend.app.auth.router import router as auth_router
from backend.app.api.market_router import router as market_router
from backend.app.api.correlation_router import router as correlation_router
from backend.app.api.strategy_router import router as strategy_router
from backend.app.api.detective_router import router as detective_router
from backend.app.api.weather_router import router as weather_router
from backend.app.api.stress_router import router as stress_router
from backend.app.api.ai_router import router as ai_router
from backend.app.api.experiment_router import router as experiment_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)

    # Seed initial demo researcher if database is empty
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@quantlab.io").first()
        if not demo_user:
            demo_user = User(
                email="demo@quantlab.io",
                hashed_password=get_password_hash("quantlab2025"),
                full_name="Alexander Vance, CFA",
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=QuantLabAlpha",
                theme_preference="dark"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Seed a sample experiment
            sample_exp = Experiment(
                user_id=demo_user.id,
                name="BTC Momentum & Volatility Breakout",
                asset="BTC-USD",
                strategy_name="momentum",
                parameters_json=json.dumps({"momentum_period": 14, "transaction_cost_bps": 10.0, "slippage_bps": 5.0}),
                metrics_json=json.dumps({
                    "total_return_pct": 142.80,
                    "annualized_return_pct": 34.50,
                    "benchmark_return_pct": 89.20,
                    "benchmark_annualized_return_pct": 24.10,
                    "alpha": 12.40,
                    "beta": 0.88,
                    "sharpe_ratio": 1.62,
                    "benchmark_sharpe_ratio": 0.98,
                    "sortino_ratio": 2.15,
                    "max_drawdown_pct": 24.50,
                    "benchmark_max_drawdown_pct": 52.80,
                    "calmar_ratio": 1.41,
                    "win_rate_pct": 58.3,
                    "profit_factor": 2.14,
                    "total_trades": 24,
                    "winning_trades": 14,
                    "losing_trades": 10,
                    "avg_win_pct": 12.4,
                    "avg_loss_pct": -4.2,
                    "best_trade_pct": 38.5,
                    "worst_trade_pct": -8.1,
                    "total_fees_paid": 1240.50,
                    "final_capital": 242800.00,
                    "benchmark_final_capital": 189200.00
                }),
                trade_count=24
            )
            db.add(sample_exp)
            db.commit()
    except Exception as e:
        print(f"[Warning] Seeding initialization error: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title="QUANTLAB API",
    description="Quantitative Multi-Asset Financial Intelligence & Backtesting Platform API",
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

# CORS configuration for development and cloud deployments
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
if "*" in origins or not origins or origins == ["*"]:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Global Disclaimer Header
@app.middleware("http")
async def add_disclaimer_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-QuantLab-Disclaimer"] = (
        "Educational and historical analysis only. Backtested performance does not guarantee future returns."
    )
    return response

# Register Routers
app.include_router(auth_router)
app.include_router(market_router)
app.include_router(correlation_router)
app.include_router(strategy_router)
app.include_router(detective_router)
app.include_router(weather_router)
app.include_router(stress_router)
app.include_router(ai_router)
app.include_router(experiment_router)

@app.get("/")
def root():
    return {
        "platform": "QUANTLAB",
        "tagline": "Quantitative Multi-Asset Financial Intelligence & Backtesting Platform",
        "version": settings.PROJECT_VERSION,
        "status": "ONLINE",
        "disclaimer": "This platform is intended for educational, research and historical analysis purposes. Backtested performance does not guarantee future returns and should not be considered financial advice."
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }
