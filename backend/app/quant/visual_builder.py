import numpy as np
import pandas as pd
from typing import Dict, List, Any
from backend.app.quant.engine import (
    calculate_sma, calculate_ema, calculate_rolling_volatility
)
from backend.app.quant.backtester import run_backtest

def evaluate_visual_rules(df: pd.DataFrame, rules: Dict[str, Any]) -> np.ndarray:
    """
    Evaluates visual builder rules to generate signals (0 or 1).
    Structure of rules:
    {
      "operator": "AND", // "AND" or "OR"
      "conditions": [
         {"indicator_left": "sma_20", "operator": ">", "indicator_right": "sma_50"},
         {"indicator_left": "momentum_14", "operator": ">", "indicator_right": "value_0"}
      ],
      "action_then": "BUY",
      "action_else": "SELL"
    }
    """
    close = df["Close"]
    n = len(df)
    
    # Precompute common indicators
    indicators = {
        "price": close,
        "sma_20": calculate_sma(close, 20),
        "sma_50": calculate_sma(close, 50),
        "sma_200": calculate_sma(close, 200),
        "ema_20": calculate_ema(close, 20),
        "ema_50": calculate_ema(close, 50),
        "momentum_14": close.pct_change(14).fillna(0.0),
        "volatility_20": calculate_rolling_volatility(close.pct_change().fillna(0.0), 20),
        "value_0": pd.Series(0.0, index=df.index),
        "value_0.02": pd.Series(0.02, index=df.index),
    }

    conditions = rules.get("conditions", [])
    logic_op = rules.get("operator", "AND").upper()

    if not conditions:
        # Default: Price > SMA 20
        return (close > calculate_sma(close, 20)).astype(int).values

    eval_results = []
    for cond in conditions:
        left_key = cond.get("indicator_left", "price")
        right_key = cond.get("indicator_right", "sma_50")
        op = cond.get("operator", ">")

        # Resolve left
        left_series = indicators.get(left_key)
        if left_series is None:
            # Check if custom number
            try:
                left_series = pd.Series(float(left_key), index=df.index)
            except Exception:
                left_series = close

        # Resolve right
        right_series = indicators.get(right_key)
        if right_series is None:
            try:
                right_series = pd.Series(float(right_key), index=df.index)
            except Exception:
                right_series = indicators["sma_50"]

        # Apply operator
        if op == ">":
            mask = left_series > right_series
        elif op == ">=":
            mask = left_series >= right_series
        elif op == "<":
            mask = left_series < right_series
        elif op == "<=":
            mask = left_series <= right_series
        elif op == "==":
            mask = np.isclose(left_series, right_series, atol=0.01)
        else:
            mask = left_series > right_series

        eval_results.append(mask.values)

    if not eval_results:
        return np.ones(n, dtype=int)

    if logic_op == "OR":
        combined_mask = np.any(eval_results, axis=0)
    else: # Default AND
        combined_mask = np.all(eval_results, axis=0)

    signals = np.zeros(n, dtype=int)
    signals[combined_mask] = 1
    return signals

def run_visual_strategy_backtest(
    df: pd.DataFrame,
    rules: Dict[str, Any],
    initial_capital: float = 100000.0,
    position_size_pct: float = 1.0,
    transaction_cost_bps: float = 10.0,
    slippage_bps: float = 5.0
) -> Dict[str, Any]:
    """Runs a backtest using visual rules."""
    signals = evaluate_visual_rules(df, rules)
    return run_backtest(
        df,
        strategy_type="custom_visual",
        params={"custom_signals": signals.tolist()},
        initial_capital=initial_capital,
        position_size_pct=position_size_pct,
        transaction_cost_bps=transaction_cost_bps,
        slippage_bps=slippage_bps
    )
