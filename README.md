# QUANTLAB 🧪⚡

### Quantitative Multi-Asset Financial Intelligence & Backtesting Platform

QUANTLAB is a production-ready, full-stack quantitative financial intelligence laboratory designed for systematic asset analysis, algorithmic strategy simulation, tail-risk stress testing, and forensic performance attribution across **Gold**, **Bitcoin**, **NVIDIA**, and global macro assets.

Designed with a futuristic **Cybernetic Quantitative Research Laboratory** aesthetic, QUANTLAB bridges mathematical rigor (Pandas, NumPy, Scikit-learn) with interactive WebGL/Canvas graphics and an institutional-grade forensic diagnosis engine.

---

## 🏛️ Platform Architecture

```mermaid
graph TD
    subgraph Frontend ["Frontend (React 18 + Vite)"]
        UI[Futuristic Lab UI]
        ThemeCtx[Theme Engine: Dark / Light]
        AuthCtx[Auth Context: JWT Persistence]
        Canvas3D[3D Asset Sphere & Spatial Network]
        ChartEng[High-Performance Canvas Charts]
    end

    subgraph Backend ["Backend (FastAPI Engine)"]
        RouterAuth[Authentication & Reset API]
        RouterMarket[Multi-Asset Provider API]
        RouterQuant[Vectorized Quant Metrics]
        RouterBacktest[Realistic Backtester & Blotter]
        RouterDetective[Strategy Detective Attribution]
        RouterWeather[Market Weather Regime Station]
        RouterStress[Tail-Risk Stress Test Engine]
        RouterVisual[Visual Strategy Compiler]
        RouterAI[Deterministic AI Assistant]
    end

    subgraph Storage ["Persistence Layer"]
        DB[(PostgreSQL / SQLite Database)]
        Models[Users, Experiments, Strategies, Tokens]
    end

    UI --> AuthCtx
    UI --> ThemeCtx
    UI --> Canvas3D
    UI --> ChartEng
    AuthCtx --> RouterAuth
    UI --> RouterMarket
    UI --> RouterBacktest
    UI --> RouterDetective
    UI --> RouterWeather
    UI --> RouterStress
    UI --> RouterVisual
    UI --> RouterAI
    RouterAuth --> DB
    RouterBacktest --> DB
```

---

## 🌟 Key Differentiators & Signature Features

### 1. 🔎 Strategy Detective
Forensic attribution engine that answers **WHY** a strategy achieved its specific results:
* **Trend Capture Impact**: Evaluates return capture across bull, bear, and consolidation cycles.
* **Transaction Cost Drag**: Quantifies gross return vs. net return after fee frictions.
* **False Signal Penalty**: Identifies whipsaws during sideways ranges and assigns a dollar-value loss.
* **Drawdown Post-Mortem**: Identifies peak-to-trough impairments and longest recovery duration.
* **Market Regime Attribution**: Attaches strategy performance to machine-learning detected regimes.

### 2. 🌦️ Market Weather Station
Classifies historical market environments into intuitive meteorological conditions using unsupervised ML (K-Means clustering on returns and realized volatility):
* ☀️ **Bull Market**: Sustained upside momentum and moderate volatility.
* 🌧️ **Bear Market**: Persistent negative returns and elevated drawdown risk.
* 🌫️ **Sideways Market**: Low trend magnitude and range-bound volatility.
* ⛈️ **High Volatility**: Extreme standard deviation spikes and tail-risk turbulence.
Includes an **interactive timeline scrubber** with automated time-series playback.

### 3. 🧪 Strategy Lab & Realistic Backtesting Engine
Simulates institutional execution realism:
* **Cash & Portfolio Accounting**: Tracks actual portfolio value, cash balance, and dynamic allocations.
* **Frictions**: Supports transaction cost drag (basis points) and execution slippage penalties.
* **Zero Look-Ahead Bias**: Vectorized computations avoid future data leakage.
* **Execution Blotter**: Full trade ledger detailing entry/exit dates, prices, position size, net PnL, and commissions.
* **Buy & Hold Benchmarking**: Compares total return, Sharpe ratio, and drawdown against static passive holding.

### 4. 💥 Strategy Stress Testing
Tests strategy resilience against historical tail-risk shocks:
* **2020 Covid Liquidity Shock**: Flash crash and recovery test.
* **2022 Central Bank Tightening**: Prolonged macro equity and crypto bear cycle.
* **5x Slippage Multiplier**: Simulates illiquidity freeze.
* **Fragility Coefficient**: 0 to 100 fragility rating based on stress drawdown amplification.
* **Fee Sensitivity Matrix**: Tests fee friction from 0 bps up to 50 bps.

### 5. 🔗 Interactive Correlation Lab
* **Dynamic Network Map**: Arrange assets on an interactive WebGL canvas showing positive (cyan) and inverse (red) links.
* **Rolling Correlation**: Scrutinize time-varying Pearson correlation across user-defined rolling windows (20 to 180 days).
* **Empirical Matrix**: Full heat-mapped correlation grid computed from daily log returns.

### 6. 🧩 Visual Strategy Builder
Construct rule-based strategies visually without programming:
* Supports `IF / AND / OR` condition blocks comparing Price, Moving Averages (20, 50, 200 SMA, 20 EMA), Momentum, and Volatility.
* Compiles directly into the backend backtesting engine with instant trade blotting and Detective forensic audit.

### 7. 🤖 AI Quantitative Research Assistant
* Grounded in **verified platform mathematical computations**.
* Answers natural language queries regarding portfolio metrics, drawdowns, and asset comparisons.
* Zero numerical hallucination: incorporates computed facts directly into reasoning.

### 8. 🔐 Institutional-Grade Authentication
* Secure **bcrypt password hashing** and stateless **JWT tokens**.
* Complete flow: Sign Up, Login, Forgot Password, Token-based Password Reset, and Profile Management.
* Password visibility toggle, live password strength meter, and demo instant access credentials.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, Vite |
| **Styling & Theme** | Modern Glassmorphism CSS, Dual Theme (Obsidian Dark / High-Contrast Light) |
| **Graphics & 3D** | Interactive HTML5 Canvas, WebGL 3D Data Network Sphere |
| **Backend Framework** | Python 3.12, FastAPI, Uvicorn |
| **Quantitative Processing** | Pandas, NumPy, Vectorized Indicators |
| **Machine Learning** | Scikit-learn (K-Means Regime Clustering) |
| **Database & ORM** | SQLAlchemy, PostgreSQL (Production) / SQLite (Development) |
| **Security & Auth** | Passlib (bcrypt), PyJWT, Secrets API |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Python 3.10+** (Python 3.12 recommended)
* **Node.js 18+** and npm

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# (Optional) Create and activate a virtual environment
py -3.12 -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run the test verification suite
py -3.12 test_backend.py

# Launch FastAPI development server on port 8000
py -3.12 -m uvicorn app.main:app --reload --port 8000
```

The backend server will initialize tables and seed a demo quantitative researcher:
* **API Documentation**: http://localhost:8000/docs
* **Health Check**: http://localhost:8000/api/health

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server on port 5173
npm run dev

# Build for production
npm run build
```

Open your browser at: **http://localhost:5173**

---

## 🔑 Demo Access Credentials

For rapid institutional evaluation, use the instant demo button on the login screen or enter:
* **Email**: `demo@quantlab.io`
* **Password**: `quantlab2025`

---

## ⚙️ Environment Variables Configuration

Copy `.env.example` to `.env`:

```ini
# Backend Environment
RESEARCH_API_KEY=your_optional_llm_key_here
DATABASE_URL=sqlite:///./quantlab.db
# In production PostgreSQL:
# DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/quantlab
SECRET_KEY=quantlab_jwt_production_secret_key_change_me_98327498
ENVIRONMENT=development
CORS_ORIGINS=*
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Frontend Environment
VITE_API_URL=http://localhost:8000
```

---

## 🚢 Production Deployment

### Docker Deployment
```bash
# Build and run multi-container stack
docker-compose up --build -d
```

### Production Build Verification
To ensure high availability and zero runtime compilation issues:
1. Run backend verification suite:
   ```bash
   py -3.12 backend/test_backend.py
   ```
2. Build frontend production assets:
   ```bash
   cd frontend && npm run build
   ```

---

## ⚖️ Financial Compliance Disclaimer

> **IMPORTANT NOTICE**: This platform is designed exclusively for educational, quantitative research, and historical analysis purposes. Backtested algorithmic performance does not guarantee future financial returns and should never be construed as personalized investment advice.
