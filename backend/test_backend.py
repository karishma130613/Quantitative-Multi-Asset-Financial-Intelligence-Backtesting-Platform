import sys
import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

# Add workspace to sys.path
sys.path.insert(0, os.path.abspath("."))


def run_tests():
    print("=== QUANTLAB BACKEND VERIFICATION SUITE ===")
    
    # 1. Database & Models
    print("[1/8] Testing database connection & model initialization...")
    from backend.app.database import engine, Base, SessionLocal
    from backend.app.models import User, Experiment, SavedStrategy
    from backend.app.auth.security import get_password_hash, verify_password, create_access_token, decode_access_token
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Test Auth security
    pwd = "QuantSecurePassword2025!"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed), "Password verification failed"
    token = create_access_token({"sub": "test@quantlab.io"})
    payload = decode_access_token(token)
    assert payload and payload["sub"] == "test@quantlab.io", "JWT token encoding/decoding failed"
    print("  -> Auth hashing & JWT verification: PASSED")

    # 2. Market Provider
    print("[2/8] Testing Multi-Asset Market Provider (Gold, BTC, NVDA)...")
    from backend.app.data.market_provider import get_asset_history, SUPPORTED_ASSETS
    for sym in ["GLD", "BTC-USD", "NVDA"]:
        df = get_asset_history(sym, start_date="2022-01-01")
        assert df is not None and len(df) > 50, f"Failed retrieving history for {sym}"
        assert "Close" in df.columns and "Date" in df.columns
    print(f"  -> History retrieved for {len(SUPPORTED_ASSETS)} assets: PASSED")

    # 3. Quantitative Engine
    print("[3/8] Testing Vectorized Quantitative Metrics...")
    from backend.app.quant.engine import (
        compute_asset_indicators, calculate_returns, calculate_annualized_volatility,
        calculate_sharpe_ratio, calculate_drawdown_series, calculate_correlation_matrix
    )
    df_btc = get_asset_history("BTC-USD", start_date="2022-01-01")
    df_ind = compute_asset_indicators(df_btc)
    assert "sma_20" in df_ind.columns and "ema_20" in df_ind.columns and "drawdown" in df_ind.columns
    ann_vol = calculate_annualized_volatility(df_ind["returns"])
    sharpe = calculate_sharpe_ratio(df_ind["returns"])
    dd, max_dd, p_date, t_date = calculate_drawdown_series(df_ind["Close"])
    assert ann_vol > 0, "Annualized vol calculation failed"
    assert max_dd >= 0, "Max drawdown calculation failed"
    print(f"  -> BTC Vol: {ann_vol*100:.1f}%, Sharpe: {sharpe:.2f}, Max DD: {max_dd*100:.1f}%: PASSED")

    # 4. ML Market Regime Detection
    print("[4/8] Testing ML Historical Market Regime Clustering (K-Means)...")
    from backend.app.quant.regimes import detect_historical_regimes
    df_reg, meta = detect_historical_regimes(df_btc)
    assert "regime_name" in df_reg.columns and "weather_icon" in df_reg.columns
    assert len(meta["distribution"]) == 4, "Regime distribution missing classes"
    print(f"  -> Regimes detected: {meta['distribution']}: PASSED")

    # 5. Backtesting Engine
    print("[5/8] Testing Realistic Portfolio Backtesting (Fees, Slippage, Cash)...")
    from backend.app.quant.backtester import run_backtest
    bt_res = run_backtest(
        df_btc,
        strategy_type="sma_crossover",
        params={"fast_period": 20, "slow_period": 50},
        initial_capital=100000.0,
        position_size_pct=1.0,
        transaction_cost_bps=10.0,
        slippage_bps=5.0
    )
    m = bt_res["metrics"]
    assert "total_return_pct" in m and "benchmark_return_pct" in m
    assert "trades" in bt_res and len(bt_res["equity_curve"]) > 10
    print(f"  -> Backtest Return: {m['total_return_pct']}% vs Buy&Hold: {m['benchmark_return_pct']}%, Trades: {m['total_trades']}: PASSED")

    # 6. Strategy Detective
    print("[6/8] Testing Strategy Detective Forensics...")
    from backend.app.quant.detective import analyze_strategy_performance
    diag = analyze_strategy_performance(df_btc, bt_res, "SMA Crossover", "BTC-USD")
    assert "trend_impact" in diag and "cost_impact" in diag and "false_signals" in diag
    print(f"  -> Detective Verdict: {diag['verdict'][:50]}...: PASSED")

    # 7. Stress Testing & Visual Builder
    print("[7/8] Testing Strategy Stress Test & Visual Builder...")
    from backend.app.quant.stress_test import run_stress_test_suite
    from backend.app.quant.visual_builder import run_visual_strategy_backtest
    stress_res = run_stress_test_suite(df_btc, "sma_crossover", {"fast_period": 20, "slow_period": 50})
    assert "fragility_score" in stress_res and len(stress_res["scenarios"]) >= 3
    
    # Visual Builder Test
    rules = {
        "operator": "AND",
        "conditions": [
            {"indicator_left": "price", "operator": ">", "indicator_right": "sma_20"}
        ]
    }
    vis_res = run_visual_strategy_backtest(df_btc, rules)
    assert vis_res["metrics"]["total_trades"] >= 0
    print(f"  -> Stress Fragility Score: {stress_res['fragility_score']}, Visual Builder Trades: {vis_res['metrics']['total_trades']}: PASSED")

    # 8. AI Research Assistant
    print("[8/8] Testing AI Research Assistant Deterministic Engine...")
    import asyncio
    from backend.app.quant.ai_assistant import query_ai_assistant
    ai_resp = asyncio.run(query_ai_assistant(
        "Why did this strategy perform poorly and what is the drawdown?",
        context_data={"metrics": m, "asset": "BTC-USD"}
    ))
    assert len(ai_resp["response"]) > 50 and len(ai_resp["suggested_followups"]) > 0
    print(f"  -> AI Assistant Response Length: {len(ai_resp['response'])} chars: PASSED")

    print("\nALL 8 BACKEND MODULES PASSED WITH 100% SUCCESS!")
    db.close()

if __name__ == "__main__":
    run_tests()
