import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: Optional[str] = "Quant Researcher"

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    avatar_url: str
    theme_preference: str
    created_at: datetime.datetime


    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    theme_preference: Optional[str] = None
    research_api_key: Optional[str] = None

# --- MARKET DATA SCHEMAS ---
class MarketDataPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    returns: Optional[float] = 0.0
    cum_returns: Optional[float] = 0.0
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_20: Optional[float] = None
    volatility_20: Optional[float] = None
    drawdown: Optional[float] = None

class AssetSummary(BaseModel):
    symbol: str
    name: str
    category: str # Commodity, Crypto, Equity, Index
    current_price: float
    change_24h: float
    change_24h_pct: float
    annualized_return: float
    annualized_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    current_regime: str
    sparkline: List[float]

# --- STRATEGY & BACKTEST SCHEMAS ---
class BacktestRequest(BaseModel):
    asset: str = "BTC-USD"
    strategy_type: str = "sma_crossover" # sma_crossover, ema_trend, momentum, mean_reversion, custom_visual
    start_date: Optional[str] = "2021-01-01"
    end_date: Optional[str] = None
    initial_capital: float = 100000.0
    position_size_pct: float = 1.0 # 100% position
    transaction_cost_bps: float = 10.0 # 10 bps (0.10%)
    slippage_bps: float = 5.0 # 5 bps
    
    # Strategy specific parameters
    fast_period: Optional[int] = 20
    slow_period: Optional[int] = 50
    momentum_period: Optional[int] = 14
    lookback_period: Optional[int] = 20
    std_dev_mult: Optional[float] = 2.0
    
    # Custom rule conditions for visual builder
    custom_rules: Optional[Dict[str, Any]] = None

class TradeRecord(BaseModel):
    id: int
    entry_date: str
    exit_date: str
    entry_price: float
    exit_price: float
    position: str # LONG
    size: float
    pnl: float
    pnl_pct: float
    fee_paid: float
    exit_reason: str # Signal, StopLoss, EndOfPeriod

class PerformanceMetrics(BaseModel):
    total_return_pct: float
    annualized_return_pct: float
    benchmark_return_pct: float
    benchmark_annualized_return_pct: float
    alpha: float
    beta: float
    sharpe_ratio: float
    benchmark_sharpe_ratio: float
    sortino_ratio: float
    max_drawdown_pct: float
    benchmark_max_drawdown_pct: float
    calmar_ratio: float
    win_rate_pct: float
    profit_factor: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    avg_win_pct: float
    avg_loss_pct: float
    best_trade_pct: float
    worst_trade_pct: float
    total_fees_paid: float
    final_capital: float
    benchmark_final_capital: float

class EquityPoint(BaseModel):
    date: str
    portfolio_value: float
    benchmark_value: float
    drawdown_pct: float
    cash: float
    position_value: float
    signal: Optional[int] = 0 # 1: Buy, -1: Sell, 0: Hold

class BacktestResponse(BaseModel):
    asset: str
    strategy_name: str
    parameters: Dict[str, Any]
    metrics: PerformanceMetrics
    equity_curve: List[EquityPoint]
    trades: List[TradeRecord]
    monthly_returns: Dict[str, float]

# --- STRATEGY DETECTIVE SCHEMAS ---
class TrendImpactAnalysis(BaseModel):
    bull_market_return: float
    bear_market_return: float
    sideways_return: float
    trend_capture_ratio: float
    summary: str

class CostImpactAnalysis(BaseModel):
    gross_return_pct: float
    net_return_pct: float
    cost_drag_pct: float
    total_fees_usd: float
    turnover_ratio: float
    summary: str

class FalseSignalAnalysis(BaseModel):
    total_signals: int
    whipsaw_count: int
    whipsaw_pct: float
    whipsaw_loss_usd: float
    avg_bars_in_trade: float
    summary: str

class DrawdownAnalysis(BaseModel):
    max_drawdown_pct: float
    longest_drawdown_days: int
    peak_date: str
    trough_date: str
    recovery_date: Optional[str]
    drawdown_episodes_count: int
    summary: str

class RegimeImpactAnalysis(BaseModel):
    regime_performances: Dict[str, Dict[str, Any]]
    best_regime: str
    worst_regime: str
    summary: str

class DetectiveAnalysisResponse(BaseModel):
    strategy_name: str
    asset: str
    verdict: str
    key_takeaways: List[str]
    trend_impact: TrendImpactAnalysis
    cost_impact: CostImpactAnalysis
    false_signals: FalseSignalAnalysis
    drawdown_analysis: DrawdownAnalysis
    regime_impact: RegimeImpactAnalysis

# --- MARKET WEATHER SCHEMAS ---
class HistoricalWeatherPoint(BaseModel):
    date: str
    asset: str
    price: float
    daily_return: float
    volatility: float
    regime_code: int # 0: Bull, 1: Bear, 2: Sideways, 3: High Vol
    regime_name: str # Bull Market, Bear Market, Sideways, High Volatility
    weather_icon: str # ☀️, 🌧️, 🌫️, ⛈️, 🌤️
    confidence: float
    narrative: str

class MarketWeatherResponse(BaseModel):
    asset: str
    current_weather: HistoricalWeatherPoint
    distribution: Dict[str, float]
    timeline: List[HistoricalWeatherPoint]

# --- STRESS TEST SCHEMAS ---
class StressTestScenarioResult(BaseModel):
    scenario_name: str
    description: str
    total_return_pct: float
    max_drawdown_pct: float
    sharpe_ratio: float
    total_fees: float
    status: str # PASS, WARNING, FAIL

class StressTestResponse(BaseModel):
    asset: str
    strategy_name: str
    base_return: float
    base_drawdown: float
    base_sharpe: float
    scenarios: List[StressTestScenarioResult]
    cost_sensitivity: List[Dict[str, Any]] # Fee BPS vs Net Return
    fragility_score: float # 0 to 100 (lower is more robust)
    summary: str

# --- CORRELATION LAB SCHEMAS ---
class CorrelationMatrixResponse(BaseModel):
    assets: List[str]
    matrix: List[List[float]]
    rolling_correlation_pairs: Dict[str, List[Dict[str, Any]]]
    network_nodes: List[Dict[str, Any]]
    network_links: List[Dict[str, Any]]

# --- AI RESEARCH ASSISTANT SCHEMAS ---
class AIQueryRequest(BaseModel):
    query: str
    context_data: Optional[Dict[str, Any]] = None

class AIQueryResponse(BaseModel):
    response: str
    calculated_facts: Dict[str, Any]
    suggested_followups: List[str]

# --- EXPERIMENT CRUD SCHEMAS ---
class ExperimentSaveRequest(BaseModel):
    name: str
    asset: str
    strategy_name: str
    parameters: Dict[str, Any]
    metrics: Dict[str, Any]
    equity_curve: Optional[List[Dict[str, Any]]] = None
    trade_count: int = 0

class ExperimentResponse(BaseModel):
    id: int
    name: str
    asset: str
    strategy_name: str
    parameters: Dict[str, Any]
    metrics: Dict[str, Any]
    trade_count: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SavedStrategySaveRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    strategy_type: str
    parameters: Dict[str, Any]

class SavedStrategyResponse(BaseModel):
    id: int
    name: str
    description: str
    strategy_type: str
    parameters: Dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True
