from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from backend.app.data.market_provider import get_asset_history, SUPPORTED_ASSETS
from backend.app.quant.engine import calculate_returns

router = APIRouter(prefix="/api/correlation", tags=["Correlation Lab"])

@router.get("/matrix")
def get_correlation_matrix(
    start_date: str = Query("2021-01-01"),
    end_date: Optional[str] = Query(None),
    rolling_window: int = Query(60)
):
    """
    Computes cross-asset correlation matrix, rolling correlation series,
    and interactive network graph nodes/links for 2D/3D visualization.
    """
    symbols = list(SUPPORTED_ASSETS.keys())
    returns_dict = {}
    prices_dict = {}

    for sym in symbols:
        df = get_asset_history(sym, start_date=start_date, end_date=end_date)
        if not df.empty and len(df) > 10:
            df["Date"] = pd.to_datetime(df["Date"])
            df = df.set_index("Date")
            prices_dict[sym] = df["Close"]
            returns_dict[sym] = calculate_returns(df["Close"])

    df_returns = pd.DataFrame(returns_dict).dropna()
    active_symbols = list(df_returns.columns)

    # 1. Full sample correlation matrix
    corr_df = df_returns.corr().fillna(0.0)
    matrix = [[round(float(corr_df.loc[r, c]), 3) for c in active_symbols] for r in active_symbols]

    # 2. Rolling correlations for key pairs
    key_pairs = [
        ("GLD", "BTC-USD"),
        ("NVDA", "SPY"),
        ("BTC-USD", "ETH-USD"),
        ("GLD", "SPY"),
        ("NVDA", "BTC-USD"),
        ("QQQ", "TLT")
    ]
    rolling_pairs = {}
    for a, b in key_pairs:
        if a in df_returns.columns and b in df_returns.columns:
            pair_key = f"{a} / {b}"
            roll_corr = df_returns[a].rolling(rolling_window).corr(df_returns[b]).dropna()
            # Sample rolling correlation for snappy chart
            step = max(1, len(roll_corr) // 150)
            sampled_series = roll_corr.iloc[::step]
            rolling_pairs[pair_key] = [
                {"date": dt.strftime("%Y-%m-%d"), "correlation": round(float(val), 3)}
                for dt, val in sampled_series.items()
            ]

    # 3. Interactive Network Graph (Nodes and Links)
    nodes = []
    for sym in active_symbols:
        meta = SUPPORTED_ASSETS.get(sym, {})
        nodes.append({
            "id": sym,
            "name": meta.get("name", sym),
            "category": meta.get("category", "Asset"),
            "volatility": meta.get("volatility", 0.25),
        })

    links = []
    n_nodes = len(active_symbols)
    for i in range(n_nodes):
        for j in range(i + 1, n_nodes):
            sym1 = active_symbols[i]
            sym2 = active_symbols[j]
            weight = round(float(corr_df.loc[sym1, sym2]), 3)
            # Only include meaningful relationship edges
            if abs(weight) >= 0.15:
                links.append({
                    "source": sym1,
                    "target": sym2,
                    "weight": weight,
                    "type": "positive" if weight > 0 else "inverse"
                })

    return {
        "assets": active_symbols,
        "matrix": matrix,
        "rolling_correlation_pairs": rolling_pairs,
        "network_nodes": nodes,
        "network_links": links
    }
