from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from backend.app.data.market_provider import get_asset_history
from backend.app.quant.detective import analyze_strategy_performance
from backend.app.quant.backtester import run_backtest

router = APIRouter(prefix="/api/detective", tags=["Strategy Detective"])

@router.post("/analyze")
def analyze_backtest(payload: Dict[str, Any] = Body(...)):
    """
    Forensic deep-dive into strategy behavior.
    Accepts { asset, strategy_type, params, backtest_result (optional) }
    """
    asset = payload.get("asset", "BTC-USD")
    strategy_type = payload.get("strategy_type", "sma_crossover")
    params = payload.get("params", {})
    backtest_result = payload.get("backtest_result")

    df = get_asset_history(asset, start_date=params.get("start_date", "2021-01-01"))
    if df.empty or len(df) < 30:
        raise HTTPException(status_code=400, detail="Insufficient price history for detective diagnosis.")

    if not backtest_result:
        backtest_result = run_backtest(
            df=df,
            strategy_type=strategy_type,
            params=params,
            initial_capital=float(params.get("initial_capital", 100000.0)),
            position_size_pct=float(params.get("position_size_pct", 1.0)),
            transaction_cost_bps=float(params.get("transaction_cost_bps", 10.0)),
            slippage_bps=float(params.get("slippage_bps", 5.0))
        )

    diagnosis = analyze_strategy_performance(
        df=df,
        backtest_result=backtest_result,
        strategy_name=strategy_type,
        asset_symbol=asset
    )
    return diagnosis
