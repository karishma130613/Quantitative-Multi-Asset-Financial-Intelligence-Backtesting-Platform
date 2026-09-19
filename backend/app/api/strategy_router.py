from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from backend.app.schemas import BacktestRequest
from backend.app.data.market_provider import get_asset_history
from backend.app.quant.backtester import run_backtest
from backend.app.quant.visual_builder import run_visual_strategy_backtest

router = APIRouter(prefix="/api/strategy", tags=["Strategy Lab"])

PRESETS = [
    {
        "id": "sma_crossover",
        "name": "Dual Moving Average Crossover",
        "description": "Trend-following strategy that generates long positions when a fast SMA crosses above a slow SMA.",
        "default_params": {"fast_period": 20, "slow_period": 50, "transaction_cost_bps": 10.0, "slippage_bps": 5.0}
    },
    {
        "id": "ema_trend",
        "name": "Triple EMA Momentum Trend",
        "description": "Fast-reacting exponential moving average trend filter with dynamic volatility participation.",
        "default_params": {"fast_period": 12, "slow_period": 26, "transaction_cost_bps": 10.0, "slippage_bps": 5.0}
    },
    {
        "id": "momentum",
        "name": "Time-Series Momentum Strategy",
        "description": "Systematic momentum system allocating long when trailing n-day returns exceed hurdle rates.",
        "default_params": {"momentum_period": 14, "transaction_cost_bps": 10.0, "slippage_bps": 5.0}
    },
    {
        "id": "mean_reversion",
        "name": "Statistical Mean Reversion (Bollinger Bands)",
        "description": "Counter-trend strategy entering when prices pierce outer standard deviation bands and taking profits at the mean.",
        "default_params": {"lookback_period": 20, "std_dev_mult": 2.0, "transaction_cost_bps": 10.0, "slippage_bps": 5.0}
    }
]

@router.get("/presets")
def get_presets():
    return PRESETS

@router.post("/backtest")
def execute_backtest(req: BacktestRequest):
    df = get_asset_history(req.asset, start_date=req.start_date or "2021-01-01", end_date=req.end_date)
    if df.empty or len(df) < 30:
        raise HTTPException(status_code=400, detail="Insufficient historical price data for backtest execution.")

    params = {
        "fast_period": req.fast_period,
        "slow_period": req.slow_period,
        "momentum_period": req.momentum_period,
        "lookback_period": req.lookback_period,
        "std_dev_mult": req.std_dev_mult,
    }

    try:
        results = run_backtest(
            df=df,
            strategy_type=req.strategy_type,
            params=params,
            initial_capital=req.initial_capital,
            position_size_pct=req.position_size_pct,
            transaction_cost_bps=req.transaction_cost_bps,
            slippage_bps=req.slippage_bps
        )
        return {
            "asset": req.asset,
            "strategy_name": req.strategy_type,
            "parameters": params,
            "metrics": results["metrics"],
            "equity_curve": results["equity_curve"],
            "trades": results["trades"],
            "monthly_returns": results["monthly_returns"],
            "raw_signals": results["raw_signals"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtesting engine error: {str(e)}")

@router.post("/visual-backtest")
def execute_visual_backtest(req: BacktestRequest):
    if not req.custom_rules:
        raise HTTPException(status_code=400, detail="Custom visual rules definition is required.")

    df = get_asset_history(req.asset, start_date=req.start_date or "2021-01-01", end_date=req.end_date)
    if df.empty or len(df) < 30:
        raise HTTPException(status_code=400, detail="Insufficient historical price data.")

    try:
        results = run_visual_strategy_backtest(
            df=df,
            rules=req.custom_rules,
            initial_capital=req.initial_capital,
            position_size_pct=req.position_size_pct,
            transaction_cost_bps=req.transaction_cost_bps,
            slippage_bps=req.slippage_bps
        )
        return {
            "asset": req.asset,
            "strategy_name": "custom_visual_builder",
            "parameters": req.custom_rules,
            "metrics": results["metrics"],
            "equity_curve": results["equity_curve"],
            "trades": results["trades"],
            "monthly_returns": results["monthly_returns"],
            "raw_signals": results["raw_signals"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Visual strategy execution error: {str(e)}")
