from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
import pandas as pd
from backend.app.data.market_provider import get_asset_history, get_supported_assets_list, SUPPORTED_ASSETS
from backend.app.quant.engine import (
    compute_asset_indicators, calculate_annualized_volatility,
    calculate_sharpe_ratio, calculate_drawdown_series, calculate_returns
)
from backend.app.quant.regimes import detect_historical_regimes

router = APIRouter(prefix="/api/market", tags=["Market Explorer"])

@router.get("/assets")
def get_assets():
    """Returns overview of all supported assets with sparklines and key metrics."""
    summaries = []
    for sym, meta in SUPPORTED_ASSETS.items():
        try:
            df = get_asset_history(sym, start_date="2023-01-01")
            df_with_ind = compute_asset_indicators(df)
            close = df_with_ind["Close"]
            returns = calculate_returns(close)
            
            curr_price = float(close.iloc[-1])
            prev_price = float(close.iloc[-2]) if len(close) > 1 else curr_price
            chg = curr_price - prev_price
            chg_pct = (chg / prev_price) * 100.0 if prev_price > 0 else 0.0

            ann_vol = calculate_annualized_volatility(returns) * 100.0
            sharpe = calculate_sharpe_ratio(returns)
            _, max_dd, _, _ = calculate_drawdown_series(close)

            # Regime
            df_reg, _ = detect_historical_regimes(df)
            current_regime = df_reg["regime_name"].iloc[-1] if not df_reg.empty else "Bull Market"

            # Sparkline (last 30 bars)
            sparkline = close.iloc[-30:].round(2).tolist()

            summaries.append({
                "symbol": sym,
                "name": meta["name"],
                "category": meta["category"],
                "current_price": round(curr_price, 2),
                "change_24h": round(chg, 2),
                "change_24h_pct": round(chg_pct, 2),
                "annualized_return": round(float(returns.mean() * 252 * 100), 2),
                "annualized_volatility": round(ann_vol, 2),
                "sharpe_ratio": round(sharpe, 2),
                "max_drawdown": round(max_dd * 100.0, 2),
                "current_regime": current_regime,
                "sparkline": sparkline
            })
        except Exception as e:
            continue
    return summaries

@router.get("/history")
def get_history(
    symbol: str = Query("BTC-USD", description="Asset symbol, e.g. GLD, BTC-USD, NVDA, SPY"),
    start_date: str = Query("2021-01-01", description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD")
):
    """Returns historical OHLCV data enriched with SMA 20/50/200, EMA 20, Returns, Volatility, and Drawdowns."""
    df = get_asset_history(symbol, start_date=start_date, end_date=end_date)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data available for symbol {symbol}")

    df_indicators = compute_asset_indicators(df)
    
    # Downsample if overly massive for charting performance
    n = len(df_indicators)
    step = max(1, n // 500)
    sampled = df_indicators.iloc[::step].copy()
    if sampled.iloc[-1]["Date"] != df_indicators.iloc[-1]["Date"]:
        sampled = pd.concat([sampled, df_indicators.iloc[[-1]]])

    records = []
    for _, row in sampled.iterrows():
        records.append({
            "date": str(row["Date"]),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": float(row["Volume"]),
            "returns": float(row.get("returns", 0.0)),
            "cum_returns": float(row.get("cum_returns", 0.0)),
            "sma_20": float(row["sma_20"]) if pd.notnull(row["sma_20"]) else None,
            "sma_50": float(row["sma_50"]) if pd.notnull(row["sma_50"]) else None,
            "sma_200": float(row["sma_200"]) if pd.notnull(row["sma_200"]) else None,
            "ema_20": float(row["ema_20"]) if pd.notnull(row["ema_20"]) else None,
            "volatility_20": float(row["volatility_20"]) if pd.notnull(row["volatility_20"]) else None,
            "drawdown": float(row["drawdown"]) if pd.notnull(row["drawdown"]) else None,
        })
    return {
        "symbol": symbol,
        "count": len(records),
        "data": records
    }
