import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from backend.app.quant.engine import (
    calculate_returns, calculate_sma, calculate_ema,
    calculate_annualized_volatility, calculate_sharpe_ratio,
    calculate_sortino_ratio, calculate_drawdown_series, calculate_calmar_ratio
)

def run_backtest(
    df: pd.DataFrame,
    strategy_type: str = "sma_crossover",
    params: Optional[Dict[str, Any]] = None,
    initial_capital: float = 100000.0,
    position_size_pct: float = 1.0,
    transaction_cost_bps: float = 10.0,
    slippage_bps: float = 5.0
) -> Dict[str, Any]:
    """
    Executes a realistic portfolio backtest without lookahead bias.
    Signals are generated based on information up to day t, executed at day t+1 open/close.
    Accounts for cash balances, transaction fees (bps), slippage (bps), and partial position sizing.
    """
    if df is None or len(df) < 30:
        raise ValueError("Insufficient historical data for backtesting (minimum 30 bars required).")

    params = params or {}
    work = df.copy().reset_index(drop=True)
    close = work["Close"]
    dates = work["Date"]
    n = len(work)

    # 1. Signal Generation (0 = Cash, 1 = Long)
    signals = np.zeros(n, dtype=int)

    if strategy_type == "sma_crossover":
        fast_p = int(params.get("fast_period", 20))
        slow_p = int(params.get("slow_period", 50))
        fast_ma = calculate_sma(close, fast_p)
        slow_ma = calculate_sma(close, slow_p)
        # Long when Fast MA > Slow MA
        condition = fast_ma > slow_ma
        signals[condition.values] = 1

    elif strategy_type == "ema_trend":
        fast_p = int(params.get("fast_period", 20))
        slow_p = int(params.get("slow_period", 50))
        fast_ema = calculate_ema(close, fast_p)
        slow_ema = calculate_ema(close, slow_p)
        condition = (close > fast_ema) & (fast_ema > slow_ema)
        signals[condition.values] = 1

    elif strategy_type == "momentum":
        mom_p = int(params.get("momentum_period", 14))
        momentum = close.pct_change(mom_p).fillna(0.0)
        condition = momentum > 0.0
        signals[condition.values] = 1

    elif strategy_type == "mean_reversion":
        lookback = int(params.get("lookback_period", 20))
        std_mult = float(params.get("std_dev_mult", 2.0))
        sma = calculate_sma(close, lookback)
        rolling_std = close.rolling(lookback, min_periods=2).std().fillna(0.0)
        lower_band = sma - std_mult * rolling_std
        upper_band = sma + std_mult * rolling_std
        
        in_pos = False
        for i in range(lookback, n):
            if not in_pos and close.iloc[i] < lower_band.iloc[i]:
                in_pos = True
            elif in_pos and close.iloc[i] > sma.iloc[i]:
                in_pos = False
            if in_pos:
                signals[i] = 1

    elif strategy_type == "custom_visual":
        # Handled by caller passing pre-computed signal array or evaluated conditions
        custom_sig = params.get("custom_signals")
        if custom_sig is not None and len(custom_sig) == n:
            signals = np.array(custom_sig, dtype=int)
        else:
            signals[close > calculate_sma(close, 20)] = 1
    else:
        # Default fallback to SMA 20/50
        fast_ma = calculate_sma(close, 20)
        slow_ma = calculate_sma(close, 50)
        signals[(fast_ma > slow_ma).values] = 1

    # Shift signals by 1 bar to prevent Look-Ahead Bias (signal at t executed at t+1)
    target_positions = np.roll(signals, 1)
    target_positions[0] = 0 # No position on first bar

    # 2. Portfolio Simulation
    cash = float(initial_capital)
    shares = 0.0
    total_fee_rate = (transaction_cost_bps + slippage_bps) / 10000.0 # bps to decimal
    
    portfolio_values = np.zeros(n, dtype=float)
    cash_history = np.zeros(n, dtype=float)
    position_values = np.zeros(n, dtype=float)
    signals_history = np.zeros(n, dtype=int)
    
    trades = []
    trade_id = 1
    in_trade = False
    current_entry_date = ""
    current_entry_price = 0.0
    current_entry_shares = 0.0
    total_fees_paid = 0.0

    benchmark_shares = (initial_capital * (1.0 - total_fee_rate)) / close.iloc[0]
    benchmark_values = benchmark_shares * close.values

    for i in range(n):
        price = float(close.iloc[i])
        date_str = str(dates.iloc[i])
        target_pos = target_positions[i] # 1 or 0
        
        # Check transition
        if target_pos == 1 and not in_trade:
            # Enter Long
            capital_to_allocate = cash * position_size_pct
            effective_price = price * (1.0 + slippage_bps / 10000.0)
            fee = capital_to_allocate * (transaction_cost_bps / 10000.0)
            total_fees_paid += fee
            
            shares = (capital_to_allocate - fee) / effective_price
            cash -= capital_to_allocate
            
            in_trade = True
            current_entry_date = date_str
            current_entry_price = effective_price
            current_entry_shares = shares
            signals_history[i] = 1 # BUY

        elif target_pos == 0 and in_trade:
            # Exit Long
            effective_price = price * (1.0 - slippage_bps / 10000.0)
            gross_proceeds = shares * effective_price
            fee = gross_proceeds * (transaction_cost_bps / 10000.0)
            total_fees_paid += fee
            net_proceeds = gross_proceeds - fee
            
            cash += net_proceeds
            pnl = net_proceeds - (current_entry_shares * current_entry_price)
            pnl_pct = (effective_price / current_entry_price - 1.0) * 100.0
            
            trades.append({
                "id": trade_id,
                "entry_date": current_entry_date,
                "exit_date": date_str,
                "entry_price": round(current_entry_price, 2),
                "exit_price": round(effective_price, 2),
                "position": "LONG",
                "size": round(current_entry_shares, 4),
                "pnl": round(pnl, 2),
                "pnl_pct": round(pnl_pct, 2),
                "fee_paid": round(fee * 2, 2), # roundtrip approximate
                "exit_reason": "Signal"
            })
            trade_id += 1
            shares = 0.0
            in_trade = False
            signals_history[i] = -1 # SELL
        else:
            signals_history[i] = 0

        pos_val = shares * price
        total_val = cash + pos_val
        portfolio_values[i] = total_val
        cash_history[i] = cash
        position_values[i] = pos_val

    # If still in trade at the end, mark remaining trade
    if in_trade:
        final_price = float(close.iloc[-1])
        final_pnl = (shares * final_price) - (current_entry_shares * current_entry_price)
        trades.append({
            "id": trade_id,
            "entry_date": current_entry_date,
            "exit_date": str(dates.iloc[-1]),
            "entry_price": round(current_entry_price, 2),
            "exit_price": round(final_price, 2),
            "position": "LONG",
            "size": round(current_entry_shares, 4),
            "pnl": round(final_pnl, 2),
            "pnl_pct": round((final_price / current_entry_price - 1.0) * 100.0, 2),
            "fee_paid": round(total_fees_paid, 2),
            "exit_reason": "EndOfPeriod"
        })

    # 3. Performance Metrics
    strat_series = pd.Series(portfolio_values, index=dates)
    bench_series = pd.Series(benchmark_values, index=dates)

    strat_returns = strat_series.pct_change().fillna(0.0)
    bench_returns = bench_series.pct_change().fillna(0.0)

    final_capital = float(portfolio_values[-1])
    bench_final_capital = float(benchmark_values[-1])

    total_return_pct = ((final_capital / initial_capital) - 1.0) * 100.0
    bench_return_pct = ((bench_final_capital / initial_capital) - 1.0) * 100.0

    years = max(n / 252.0, 0.1)
    ann_return_pct = (((final_capital / initial_capital) ** (1.0 / years)) - 1.0) * 100.0
    bench_ann_return_pct = (((bench_final_capital / initial_capital) ** (1.0 / years)) - 1.0) * 100.0

    sharpe = calculate_sharpe_ratio(strat_returns)
    bench_sharpe = calculate_sharpe_ratio(bench_returns)
    sortino = calculate_sortino_ratio(strat_returns)

    _, max_dd, _, _ = calculate_drawdown_series(strat_series)
    _, bench_max_dd, _, _ = calculate_drawdown_series(bench_series)

    calmar = calculate_calmar_ratio(ann_return_pct / 100.0, max_dd)

    # Beta and Alpha vs Benchmark
    cov = np.cov(strat_returns.values, bench_returns.values)
    bench_var = cov[1, 1]
    beta = float(cov[0, 1] / bench_var) if bench_var > 0 else 1.0
    alpha = float(ann_return_pct - (0.04 + beta * (bench_ann_return_pct - 0.04)))

    # Trade statistics
    total_trades = len(trades)
    winning_trades = [t for t in trades if t["pnl"] > 0]
    losing_trades = [t for t in trades if t["pnl"] <= 0]
    win_rate_pct = (len(winning_trades) / total_trades * 100.0) if total_trades > 0 else 0.0

    gross_profit = sum(t["pnl"] for t in winning_trades)
    gross_loss = abs(sum(t["pnl"] for t in losing_trades))
    profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (5.0 if gross_profit > 0 else 1.0)

    avg_win_pct = float(np.mean([t["pnl_pct"] for t in winning_trades])) if winning_trades else 0.0
    avg_loss_pct = float(np.mean([t["pnl_pct"] for t in losing_trades])) if losing_trades else 0.0
    best_trade_pct = float(max([t["pnl_pct"] for t in trades])) if trades else 0.0
    worst_trade_pct = float(min([t["pnl_pct"] for t in trades])) if trades else 0.0

    # Drawdown curve
    dd_curve, _, _, _ = calculate_drawdown_series(strat_series)

    # Downsample equity curve to max 350 points for snappy frontend rendering
    step = max(1, n // 350)
    sampled_indices = list(range(0, n, step))
    if (n - 1) not in sampled_indices:
        sampled_indices.append(n - 1)

    equity_curve = []
    for idx in sampled_indices:
        equity_curve.append({
            "date": str(dates.iloc[idx]),
            "portfolio_value": round(float(portfolio_values[idx]), 2),
            "benchmark_value": round(float(benchmark_values[idx]), 2),
            "drawdown_pct": round(float(dd_curve.iloc[idx] * 100.0), 2),
            "cash": round(float(cash_history[idx]), 2),
            "position_value": round(float(position_values[idx]), 2),
            "signal": int(signals_history[idx])
        })

    # Calculate monthly returns table
    monthly_ret = {}
    try:
        df_monthly = strat_series.copy()
        df_monthly.index = pd.to_datetime(dates)
        monthly_resampled = df_monthly.resample("ME").last().pct_change().dropna()
        for dt_idx, val in monthly_resampled.items():
            monthly_ret[dt_idx.strftime("%Y-%m")] = round(float(val * 100.0), 2)
    except Exception:
        pass

    metrics = {
        "total_return_pct": round(total_return_pct, 2),
        "annualized_return_pct": round(ann_return_pct, 2),
        "benchmark_return_pct": round(bench_return_pct, 2),
        "benchmark_annualized_return_pct": round(bench_ann_return_pct, 2),
        "alpha": round(alpha, 2),
        "beta": round(beta, 2),
        "sharpe_ratio": round(sharpe, 2),
        "benchmark_sharpe_ratio": round(bench_sharpe, 2),
        "sortino_ratio": round(sortino, 2),
        "max_drawdown_pct": round(max_dd * 100.0, 2),
        "benchmark_max_drawdown_pct": round(bench_max_dd * 100.0, 2),
        "calmar_ratio": round(calmar, 2),
        "win_rate_pct": round(win_rate_pct, 1),
        "profit_factor": profit_factor,
        "total_trades": total_trades,
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "avg_win_pct": round(avg_win_pct, 2),
        "avg_loss_pct": round(avg_loss_pct, 2),
        "best_trade_pct": round(best_trade_pct, 2),
        "worst_trade_pct": round(worst_trade_pct, 2),
        "total_fees_paid": round(total_fees_paid, 2),
        "final_capital": round(final_capital, 2),
        "benchmark_final_capital": round(bench_final_capital, 2)
    }

    return {
        "metrics": metrics,
        "equity_curve": equity_curve,
        "trades": trades,
        "monthly_returns": monthly_ret,
        "raw_signals": signals.tolist()
    }
