import os
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple

REGIME_NAMES = {
    0: {"name": "Bull Market", "icon": "☀️", "desc": "Strong positive price trend with moderate to low volatility."},
    1: {"name": "Bear Market", "icon": "🌧️", "desc": "Sustained downward price momentum with elevated downside risk."},
    2: {"name": "Sideways Market", "icon": "🌫️", "desc": "Mean-reverting, range-bound price action with low directional momentum."},
    3: {"name": "High Volatility", "icon": "⛈️", "desc": "Erratic, turbulent price swings and tail risk."}
}

def _kmeans_numpy(X: np.ndarray, k: int = 4, max_iters: int = 30, seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """
    Pure NumPy K-Means Clustering implementation.
    Robust, deterministic, zero OpenMP/C++ DLL lockups across all platforms.
    """
    n = len(X)
    if n <= k:
        return np.zeros(n, dtype=int), X.copy()

    rng = np.random.default_rng(seed)
    # Init centers with k-means++ style spread
    first_idx = rng.integers(0, n)
    centers = [X[first_idx]]
    
    for _ in range(1, k):
        dist_sq = np.min([np.sum((X - c) ** 2, axis=1) for c in centers], axis=0)
        probs = dist_sq / (np.sum(dist_sq) + 1e-9)
        next_idx = rng.choice(n, p=probs)
        centers.append(X[next_idx])
        
    centers = np.array(centers)

    labels = np.zeros(n, dtype=int)
    for _ in range(max_iters):
        # Compute Euclidean distance to all centers: shape (n, k)
        distances = np.linalg.norm(X[:, np.newaxis, :] - centers[np.newaxis, :, :], axis=2)
        new_labels = np.argmin(distances, axis=1)
        
        # Update centers
        new_centers = np.array([
            X[new_labels == i].mean(axis=0) if np.any(new_labels == i) else centers[i]
            for i in range(k)
        ])
        
        if np.all(labels == new_labels) or np.allclose(centers, new_centers, atol=1e-4):
            labels = new_labels
            centers = new_centers
            break
            
        labels = new_labels
        centers = new_centers

    return labels, centers

def detect_historical_regimes(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Applies unsupervised ML (K-Means Clustering) on 3 primary market dimensions:
    1. Trend Momentum: 20-day cumulative return
    2. Trend Strength: Ratio of Price to 50-day SMA
    3. Realized Risk: 20-day rolling annualized volatility
    
    Clusters are mapped deterministically to Bull, Bear, Sideways, High Volatility regimes.
    """
    if df is None or len(df) < 50:
        fallback_df = df.copy() if df is not None else pd.DataFrame()
        fallback_df["regime_code"] = 0
        fallback_df["regime_name"] = "Bull Market"
        fallback_df["weather_icon"] = "☀️"
        fallback_df["confidence"] = 0.85
        fallback_df["narrative"] = "Historical baseline regime"
        return fallback_df, {"distribution": {"Bull Market": 1.0}, "features": ["momentum", "trend", "volatility"]}

    work = df.copy()
    close = work["Close"]
    
    # Feature 1: 20-day return
    ret20 = close.pct_change(20).fillna(0.0)
    
    # Feature 2: Price / SMA50 distance
    sma50 = close.rolling(50, min_periods=1).mean()
    trend_dist = ((close - sma50) / sma50).fillna(0.0)
    
    # Feature 3: Realized Volatility (20-day)
    daily_ret = close.pct_change().fillna(0.0)
    vol20 = (daily_ret.rolling(20, min_periods=2).std() * np.sqrt(252)).fillna(0.20)

    # Feature Matrix
    X = np.column_stack([ret20.values, trend_dist.values, vol20.values])
    X = np.nan_to_num(X, nan=0.0, posinf=1.0, neginf=-1.0)

    # Standardize features
    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0) + 1e-6
    X_scaled = (X - mean) / std

    # Pure NumPy K-Means (instant & rock solid)
    cluster_labels, centers = _kmeans_numpy(X_scaled, k=4, max_iters=25, seed=42)

    cluster_stats = []
    for c in range(4):
        mask = cluster_labels == c
        c_ret = float(np.mean(ret20.values[mask])) if np.any(mask) else 0.0
        c_trend = float(np.mean(trend_dist.values[mask])) if np.any(mask) else 0.0
        c_vol = float(np.mean(vol20.values[mask])) if np.any(mask) else 0.2
        cluster_stats.append({
            "cluster": c,
            "ret": c_ret,
            "trend": c_trend,
            "vol": c_vol
        })

    # Sort to assign regimes:
    # 1. High Vol: highest vol
    sorted_by_vol = sorted(cluster_stats, key=lambda x: x["vol"], reverse=True)
    high_vol_cluster = sorted_by_vol[0]["cluster"]
    
    remaining = [x for x in cluster_stats if x["cluster"] != high_vol_cluster]
    sorted_by_bull = sorted(remaining, key=lambda x: x["ret"] + x["trend"], reverse=True)
    bull_cluster = sorted_by_bull[0]["cluster"]
    
    sorted_by_bear = sorted(remaining, key=lambda x: x["ret"] + x["trend"])
    bear_cluster = sorted_by_bear[0]["cluster"]
    
    sideways_cluster = [x["cluster"] for x in remaining if x["cluster"] not in (bull_cluster, bear_cluster)][0]

    cluster_to_regime_code = {
        bull_cluster: 0,       # Bull
        bear_cluster: 1,       # Bear
        sideways_cluster: 2,   # Sideways
        high_vol_cluster: 3    # High Volatility
    }

    # Vectorized confidence score
    distances = np.linalg.norm(X_scaled - centers[cluster_labels], axis=1)
    max_d = np.percentile(distances, 95) if len(distances) > 0 else 1.0
    confidence = np.clip(1.0 - (distances / (max_d + 1e-6)) * 0.45, 0.55, 0.98).round(3)

    mapped_codes = np.array([cluster_to_regime_code.get(c, 2) for c in cluster_labels], dtype=int)
    mapped_names = [REGIME_NAMES[code]["name"] for code in mapped_codes]
    mapped_icons = [REGIME_NAMES[code]["icon"] for code in mapped_codes]
    
    work["regime_code"] = mapped_codes
    work["regime_name"] = mapped_names
    work["weather_icon"] = mapped_icons
    work["confidence"] = confidence

    # Fast vectorized narrative creation
    close_vals = close.values
    vol_vals = vol20.values * 100
    ret_vals = ret20.values * 100

    narratives = []
    for code, p, v, r in zip(mapped_codes, close_vals, vol_vals, ret_vals):
        if code == 0:
            narratives.append(f"Bull market phase. 20-day momentum at +{r:.1f}%, volatility controlled at {v:.1f}%.")
        elif code == 1:
            narratives.append(f"Bear market pressure. Price below key moving averages, 20-day momentum at {r:.1f}%.")
        elif code == 2:
            narratives.append(f"Sideways consolidation. Rangebound price action at ${p:.2f}, low trend commitment.")
        else:
            narratives.append(f"Turbulent high-volatility conditions. Realized volatility spiked to {v:.1f}%.")
    work["narrative"] = narratives

    total_bars = len(mapped_codes)
    distribution = {
        "Bull Market": round(float(np.sum(mapped_codes == 0)) / total_bars, 3),
        "Bear Market": round(float(np.sum(mapped_codes == 1)) / total_bars, 3),
        "Sideways Market": round(float(np.sum(mapped_codes == 2)) / total_bars, 3),
        "High Volatility": round(float(np.sum(mapped_codes == 3)) / total_bars, 3),
    }

    meta = {
        "algorithm": "K-Means Multi-Dimensional Regime Clustering",
        "features": ["20d Momentum", "SMA50 Trend Ratio", "Realized Volatility"],
        "distribution": distribution,
        "cluster_centers": {
            "Bull": {"momentum": f"+{cluster_stats[bull_cluster]['ret']*100:.1f}%", "vol": f"{cluster_stats[bull_cluster]['vol']*100:.1f}%"},
            "Bear": {"momentum": f"{cluster_stats[bear_cluster]['ret']*100:.1f}%", "vol": f"{cluster_stats[bear_cluster]['vol']*100:.1f}%"},
            "Sideways": {"momentum": f"{cluster_stats[sideways_cluster]['ret']*100:.1f}%", "vol": f"{cluster_stats[sideways_cluster]['vol']*100:.1f}%"},
            "High Vol": {"momentum": f"{cluster_stats[high_vol_cluster]['ret']*100:.1f}%", "vol": f"{cluster_stats[high_vol_cluster]['vol']*100:.1f}%"}
        }
    }

    return work, meta
