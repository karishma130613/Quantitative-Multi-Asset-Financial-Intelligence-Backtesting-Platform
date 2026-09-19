from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.app.data.market_provider import get_asset_history
from backend.app.quant.regimes import detect_historical_regimes

router = APIRouter(prefix="/api/weather", tags=["Market Weather"])

@router.get("/timeline")
def get_market_weather(
    asset: str = Query("BTC-USD"),
    start_date: str = Query("2021-01-01"),
    end_date: Optional[str] = Query(None)
):
    """
    Returns historical market weather classifications (Bull ☀️, Bear 🌧️, Sideways 🌫️, High Vol ⛈️)
    derived from unsupervised ML regime clustering across historical dates.
    """
    df = get_asset_history(asset, start_date=start_date, end_date=end_date)
    if df.empty or len(df) < 30:
        raise HTTPException(status_code=400, detail="Insufficient price history for market weather calculation.")

    df_regimes, meta = detect_historical_regimes(df)

    # Downsample timeline for fluid interactive scrubbing (e.g. 200 points max)
    n = len(df_regimes)
    step = max(1, n // 200)
    sampled = df_regimes.iloc[::step].copy()
    if sampled.iloc[-1]["Date"] != df_regimes.iloc[-1]["Date"]:
        import pandas as pd
        sampled = pd.concat([sampled, df_regimes.iloc[[-1]]])

    timeline = []
    for _, row in sampled.iterrows():
        timeline.append({
            "date": str(row["Date"]),
            "asset": asset,
            "price": float(row["Close"]),
            "daily_return": round(float(row.get("returns", 0.0)) * 100, 2),
            "volatility": round(float(row.get("volatility_20", 0.25)) * 100, 1),
            "regime_code": int(row["regime_code"]),
            "regime_name": str(row["regime_name"]),
            "weather_icon": str(row["weather_icon"]),
            "confidence": float(row["confidence"]),
            "narrative": str(row["narrative"])
        })

    last_row = df_regimes.iloc[-1]
    current_weather = {
        "date": str(last_row["Date"]),
        "asset": asset,
        "price": float(last_row["Close"]),
        "daily_return": round(float(last_row.get("returns", 0.0)) * 100, 2),
        "volatility": round(float(last_row.get("volatility_20", 0.25)) * 100, 1),
        "regime_code": int(last_row["regime_code"]),
        "regime_name": str(last_row["regime_name"]),
        "weather_icon": str(last_row["weather_icon"]),
        "confidence": float(last_row["confidence"]),
        "narrative": str(last_row["narrative"])
    }

    return {
        "asset": asset,
        "current_weather": current_weather,
        "distribution": meta["distribution"],
        "metadata": meta,
        "timeline": timeline
    }
