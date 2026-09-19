import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple

TRADING_DAYS_PER_YEAR = 252

def calculate_returns(prices: pd.Series) -> pd.Series:
    """Calculates daily simple percentage returns, filling first NaN with 0.0."""
    if prices is None or len(prices) == 0:
        return pd.Series(dtype=float)
    returns = prices.pct_change().fillna(0.0)
    # Replace inf or -inf with 0
    returns = returns.replace([np.inf, -np.inf], 0.0)
    return returns

def calculate_sma(series: pd.Series, window: int) -> pd.Series:
    """Calculates Simple Moving Average."""
    if series is None or len(series) == 0:
        return pd.Series(dtype=float)
    return series.rolling(window=window, min_periods=1).mean()

def calculate_ema(series: pd.Series, span: int) -> pd.Series:
    """Calculates Exponential Moving Average."""
    if series is None or len(series) == 0:
        return pd.Series(dtype=float)
    return series.ewm(span=span, adjust=False).mean()

def calculate_cumulative_returns(returns: pd.Series) -> pd.Series:
    """Calculates cumulative returns (1 + r).cumprod() - 1."""
    if returns is None or len(returns) == 0:
        return pd.Series(dtype=float)
    return (1.0 + returns).cumprod() - 1.0

def calculate_annualized_volatility(returns: pd.Series, window: Optional[int] = None) -> float:
    """Calculates annualized volatility using sqrt(252)."""
    if returns is None or len(returns) < 2:
        return 0.0
    if window is not None and len(returns) >= window:
        sub_returns = returns.iloc[-window:]
    else:
        sub_returns = returns
    std = sub_returns.std()
    if np.isnan(std) or np.isinf(std):
        return 0.0
    return float(std * np.sqrt(TRADING_DAYS_PER_YEAR))

def calculate_rolling_volatility(returns: pd.Series, window: int = 20) -> pd.Series:
    """Calculates rolling annualized volatility."""
    if returns is None or len(returns) == 0:
        return pd.Series(dtype=float)
    return (returns.rolling(window=window, min_periods=2).std() * np.sqrt(TRADING_DAYS_PER_YEAR)).fillna(0.0)

def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.04) -> float:
    """Calculates annualized Sharpe Ratio."""
    if returns is None or len(returns) < 2:
        return 0.0
    mean_daily_return = returns.mean()
    daily_rf = risk_free_rate / TRADING_DAYS_PER_YEAR
    excess_return = mean_daily_return - daily_rf
    daily_std = returns.std()
    if daily_std == 0.0 or np.isnan(daily_std) or np.isinf(daily_std):
        return 0.0
    sharpe = (excess_return / daily_std) * np.sqrt(TRADING_DAYS_PER_YEAR)
    return float(np.clip(sharpe, -10.0, 10.0))

def calculate_sortino_ratio(returns: pd.Series, risk_free_rate: float = 0.04) -> float:
    """Calculates annualized Sortino Ratio (penalizing only downside volatility)."""
    if returns is None or len(returns) < 2:
        return 0.0
    daily_rf = risk_free_rate / TRADING_DAYS_PER_YEAR
    excess_returns = returns - daily_rf
    downside_returns = excess_returns[excess_returns < 0]
    if len(downside_returns) == 0:
        return 3.0 # High positive if no downside
    downside_std = np.sqrt(np.mean(downside_returns ** 2))
    if downside_std == 0.0 or np.isnan(downside_std) or np.isinf(downside_std):
        return 0.0
    sortino = (excess_returns.mean() / downside_std) * np.sqrt(TRADING_DAYS_PER_YEAR)
    return float(np.clip(sortino, -10.0, 10.0))

def calculate_drawdown_series(prices: pd.Series) -> Tuple[pd.Series, float, str, str]:
    """
    Calculates the drawdown series, maximum drawdown percentage, peak date, and trough date.
    """
    if prices is None or len(prices) == 0:
        return pd.Series(dtype=float), 0.0, "", ""
    
    cumulative_max = prices.cummax()
    drawdown = (prices - cumulative_max) / cumulative_max
    drawdown = drawdown.replace([np.inf, -np.inf], 0.0).fillna(0.0)
    
    max_dd = float(abs(drawdown.min())) if len(drawdown) > 0 else 0.0
    
    trough_idx = drawdown.idxmin() if len(drawdown) > 0 else None
    if trough_idx is not None and trough_idx in prices.index:
        peak_idx = prices.loc[:trough_idx].idxmax()
        peak_date = str(peak_idx)
        trough_date = str(trough_idx)
    else:
        peak_date = ""
        trough_date = ""

    return drawdown, max_dd, peak_date, trough_date

def calculate_calmar_ratio(annualized_return: float, max_drawdown: float) -> float:
    """Calculates Calmar Ratio = Annualized Return / Max Drawdown."""
    if max_drawdown <= 0.0001:
        return 0.0
    calmar = annualized_return / max_drawdown
    return float(np.clip(calmar, -20.0, 20.0))

def compute_asset_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Computes SMA 20/50/200, EMA 20, Returns, Cum Returns, Rolling Vol, Drawdown for a market dataframe."""
    result = df.copy()
    if "Close" not in result.columns:
        return result

    close = result["Close"]
    returns = calculate_returns(close)
    result["returns"] = returns.round(4)
    result["cum_returns"] = calculate_cumulative_returns(returns).round(4)
    result["sma_20"] = calculate_sma(close, 20).round(2)
    result["sma_50"] = calculate_sma(close, 50).round(2)
    result["sma_200"] = calculate_sma(close, 200).round(2)
    result["ema_20"] = calculate_ema(close, 20).round(2)
    result["volatility_20"] = calculate_rolling_volatility(returns, 20).round(4)
    
    dd_series, _, _, _ = calculate_drawdown_series(close)
    result["drawdown"] = dd_series.round(4)
    return result

def calculate_correlation_matrix(price_dict: Dict[str, pd.Series]) -> Tuple[List[str], List[List[float]]]:
    """Computes correlation matrix of returns for provided asset price series."""
    returns_dict = {}
    for sym, series in price_dict.items():
        if series is not None and len(series) > 1:
            returns_dict[sym] = calculate_returns(series)
    
    if not returns_dict:
        return [], []
    
    df_returns = pd.DataFrame(returns_dict).dropna()
    assets = list(df_returns.columns)
    corr_matrix = df_returns.corr().fillna(0.0).values.tolist()
    # Round to 3 decimals
    rounded_matrix = [[round(val, 3) for val in row] for row in corr_matrix]
    return assets, rounded_matrix
