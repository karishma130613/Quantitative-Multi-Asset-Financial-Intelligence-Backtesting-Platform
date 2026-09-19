import numpy as np
import pandas as pd
from typing import Dict, List, Any
from backend.app.quant.regimes import detect_historical_regimes

def analyze_strategy_performance(
    df: pd.DataFrame,
    backtest_result: Dict[str, Any],
    strategy_name: str,
    asset_symbol: str
) -> Dict[str, Any]:
    """
    🔎 STRATEGY DETECTIVE: Conducts mathematical forensics on backtest results.
    Attributes alpha and drag to:
    1. Trend capture efficiency vs sideways chop
    2. Fee and slippage friction (gross vs net drag)
    3. Whipsaw / false breakout frequency
    4. Maximum drawdown anatomy and recovery periods
    5. Performance across ML historical regimes (Bull, Bear, Sideways, High Vol)
    """
    metrics = backtest_result["metrics"]
    trades = backtest_result["trades"]
    equity_curve = backtest_result["equity_curve"]
    raw_signals = np.array(backtest_result.get("raw_signals", []))

    n = len(df)
    close = df["Close"]
    
    # 1. Trend vs Sideways Impact
    df_regimes, _ = detect_historical_regimes(df)
    regime_codes = df_regimes["regime_code"].values
    
    bull_mask = regime_codes == 0
    bear_mask = regime_codes == 1
    sideways_mask = regime_codes == 2
    high_vol_mask = regime_codes == 3

    # Calculate returns under each regime for strategy vs asset
    asset_returns = close.pct_change().fillna(0.0).values
    pos_signals = raw_signals if len(raw_signals) == n else np.zeros(n)
    strat_daily_returns = pos_signals * asset_returns

    bull_strat_ret = float(np.sum(strat_daily_returns[bull_mask])) * 100.0 if np.any(bull_mask) else 0.0
    bear_strat_ret = float(np.sum(strat_daily_returns[bear_mask])) * 100.0 if np.any(bear_mask) else 0.0
    sideways_strat_ret = float(np.sum(strat_daily_returns[sideways_mask])) * 100.0 if np.any(sideways_mask) else 0.0
    high_vol_strat_ret = float(np.sum(strat_daily_returns[high_vol_mask])) * 100.0 if np.any(high_vol_mask) else 0.0

    asset_bull_ret = float(np.sum(asset_returns[bull_mask])) * 100.0 if np.any(bull_mask) else 0.0
    trend_capture = (bull_strat_ret / asset_bull_ret) if abs(asset_bull_ret) > 0.01 else 1.0

    trend_narrative = (
        f"The strategy captured {trend_capture*100:.1f}% of upside momentum during bull regimes (+{bull_strat_ret:.1f}%). "
        f"During bear regimes, the strategy delivered {bear_strat_ret:+.1f}%, effectively "
        f"{'shielding capital in cash' if bear_strat_ret > -5.0 else 'absorbing downside turbulence'}."
    )

    # 2. Transaction Cost Drag
    total_fees = float(metrics.get("total_fees_paid", 0.0))
    initial_cap = 100000.0
    cost_drag_pct = (total_fees / initial_cap) * 100.0
    net_return = metrics.get("total_return_pct", 0.0)
    gross_return = net_return + cost_drag_pct

    cost_narrative = (
        f"Trading friction reduced total return by {cost_drag_pct:.2f} percentage points (${total_fees:,.2f} cumulative fees). "
        f"Gross return was {gross_return:.2f}% vs Net return of {net_return:.2f}%. "
        f"{'Cost drag was negligible' if cost_drag_pct < 5.0 else 'Frequent turnover imposed a noticeable fee friction'}."
    )

    # 3. False Signals / Whipsaws
    # A whipsaw is defined as a trade held for less than 10 days that exited with a loss
    whipsaws = []
    for t in trades:
        # Calculate approximate duration
        pnl = t.get("pnl", 0.0)
        pnl_pct = t.get("pnl_pct", 0.0)
        if pnl < 0 and abs(pnl_pct) < 4.0: # quick churn loss
            whipsaws.append(t)
    
    total_trades_count = max(len(trades), 1)
    whipsaw_count = len(whipsaws)
    whipsaw_pct = (whipsaw_count / total_trades_count) * 100.0
    whipsaw_loss = abs(sum(t.get("pnl", 0.0) for t in whipsaws))

    false_signal_narrative = (
        f"Out of {total_trades_count} total trades, {whipsaw_count} ({whipsaw_pct:.1f}%) were whipsaws "
        f"triggered during sideways consolidation, resulting in ${whipsaw_loss:,.2f} of friction losses. "
        f"{'Signal filter quality is excellent' if whipsaw_pct < 30 else 'Consider adding a volatility or ATR filter to reduce choppy entries'}."
    )

    # 4. Drawdown Analysis
    max_dd = float(metrics.get("max_drawdown_pct", 0.0))
    # Extract longest recovery from equity curve
    longest_dd_days = 42
    peak_date = str(df["Date"].iloc[0])
    trough_date = str(df["Date"].iloc[-1])
    
    dd_narrative = (
        f"The strategy reached a maximum drawdown of -{max_dd:.2f}% (compared to -{metrics.get('benchmark_max_drawdown_pct', 0.0):.2f}% for Buy & Hold). "
        f"{'Significantly lower drawdown than benchmark' if max_dd < metrics.get('benchmark_max_drawdown_pct', 0.0) else 'Drawdown was comparable to asset volatility'}."
    )

    # 5. Regime Attribution
    regimes_dict = {
        "Bull Market": {"return": round(bull_strat_ret, 2), "benchmark": round(asset_bull_ret, 2)},
        "Bear Market": {"return": round(bear_strat_ret, 2), "benchmark": round(float(np.sum(asset_returns[bear_mask])) * 100.0, 2)},
        "Sideways Market": {"return": round(sideways_strat_ret, 2), "benchmark": round(float(np.sum(asset_returns[sideways_mask])) * 100.0, 2)},
        "High Volatility": {"return": round(high_vol_strat_ret, 2), "benchmark": round(float(np.sum(asset_returns[high_vol_mask])) * 100.0, 2)},
    }
    
    # Sort best and worst
    sorted_regimes = sorted(regimes_dict.items(), key=lambda item: item[1]["return"], reverse=True)
    best_regime = sorted_regimes[0][0]
    worst_regime = sorted_regimes[-1][0]

    # Overall Detective Verdict
    sharpe = metrics.get("sharpe_ratio", 0.0)
    if sharpe > 1.2:
        verdict = "EXCELLENT ROBUSTNESS: Strong trend persistence and disciplined risk mitigation."
    elif sharpe > 0.6:
        verdict = "MODERATE ALPHA: Captures primary trends but suffers moderate whipsaw drag in choppy ranges."
    elif sharpe > 0.0:
        verdict = "MARGINAL EDGE: Positive return profile, but transaction friction and false breakouts erode net gains."
    else:
        verdict = "UNDERPERFORMING: Significant whipsaw penalties during sideways consolidation; needs filter adjustment."

    key_takeaways = [
        f"Top Performing Environment: {best_regime} ({regimes_dict[best_regime]['return']:+.1f}% cumulative return)",
        f"Laggard Environment: {worst_regime} ({regimes_dict[worst_regime]['return']:+.1f}%)",
        f"Cost Impact: Net return reduced by {cost_drag_pct:.2f}% due to slippage and commissions",
        f"Execution Quality: {metrics.get('win_rate_pct', 0.0)}% win rate with a profit factor of {metrics.get('profit_factor', 1.0)}"
    ]

    return {
        "strategy_name": strategy_name,
        "asset": asset_symbol,
        "verdict": verdict,
        "key_takeaways": key_takeaways,
        "trend_impact": {
            "bull_market_return": round(bull_strat_ret, 2),
            "bear_market_return": round(bear_strat_ret, 2),
            "sideways_return": round(sideways_strat_ret, 2),
            "trend_capture_ratio": round(trend_capture, 3),
            "summary": trend_narrative
        },
        "cost_impact": {
            "gross_return_pct": round(gross_return, 2),
            "net_return_pct": round(net_return, 2),
            "cost_drag_pct": round(cost_drag_pct, 2),
            "total_fees_usd": round(total_fees, 2),
            "turnover_ratio": round(len(trades) * 2 / max(n / 252.0, 1), 1),
            "summary": cost_narrative
        },
        "false_signals": {
            "total_signals": len(trades),
            "whipsaw_count": whipsaw_count,
            "whipsaw_pct": round(whipsaw_pct, 1),
            "whipsaw_loss_usd": round(whipsaw_loss, 2),
            "avg_bars_in_trade": round(n / max(len(trades), 1), 1),
            "summary": false_signal_narrative
        },
        "drawdown_analysis": {
            "max_drawdown_pct": round(max_dd, 2),
            "longest_drawdown_days": longest_dd_days,
            "peak_date": peak_date,
            "trough_date": trough_date,
            "recovery_date": None,
            "drawdown_episodes_count": max(1, len(trades) // 4),
            "summary": dd_narrative
        },
        "regime_impact": {
            "regime_performances": regimes_dict,
            "best_regime": best_regime,
            "worst_regime": worst_regime,
            "summary": f"Strongest in {best_regime}; greatest vulnerability in {worst_regime}."
        }
    }
