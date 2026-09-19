from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from backend.app.data.market_provider import get_asset_history
from backend.app.quant.stress_test import run_stress_test_suite

router = APIRouter(prefix="/api/stress", tags=["Strategy Stress Test"])

@router.post("/run")
def run_stress_test(payload: Dict[str, Any] = Body(...)):
    """
    Executes multiple stress scenarios, crisis simulations (Covid 2020, Rate hike 2022),
    slippage sensitivity and generates fragility score.
    """
    asset = payload.get("asset", "BTC-USD")
    strategy_type = payload.get("strategy_type", "sma_crossover")
    params = payload.get("params", {"fast_period": 20, "slow_period": 50})

    df = get_asset_history(asset, start_date="2020-01-01")
    if df.empty or len(df) < 50:
        raise HTTPException(status_code=400, detail="Insufficient price history for stress test simulation.")

    try:
        results = run_stress_test_suite(
            df=df,
            strategy_type=strategy_type,
            base_params=params,
            asset_symbol=asset
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stress test simulation error: {str(e)}")
