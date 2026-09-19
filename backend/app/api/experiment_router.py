import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database import get_db
from backend.app.models import Experiment, SavedStrategy, User
from backend.app.auth.dependencies import get_current_user_optional, get_current_user
from backend.app.schemas import ExperimentSaveRequest, SavedStrategySaveRequest

router = APIRouter(prefix="/api/experiments", tags=["Experiment History"])

@router.get("")
def list_experiments(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Lists saved backtest experiments. If unauthenticated, returns demo/cached experiments."""
    user_id = current_user.id if current_user else 1
    experiments = db.query(Experiment).filter(Experiment.user_id == user_id).order_by(Experiment.created_at.desc()).all()
    
    output = []
    for exp in experiments:
        output.append({
            "id": exp.id,
            "name": exp.name,
            "asset": exp.asset,
            "strategy_name": exp.strategy_name,
            "parameters": json.loads(exp.parameters_json) if exp.parameters_json else {},
            "metrics": json.loads(exp.metrics_json) if exp.metrics_json else {},
            "equity_curve": json.loads(exp.equity_curve_json) if exp.equity_curve_json else [],
            "trade_count": exp.trade_count,
            "created_at": exp.created_at.isoformat() if exp.created_at else None
        })
    return output

@router.post("")
def save_experiment(
    req: ExperimentSaveRequest,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Saves a backtest run to the experiment laboratory archive."""
    user_id = current_user.id if current_user else 1
    # Check if fallback demo user exists if not logged in
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=1, email="guest.researcher@quantlab.internal", hashed_password="demo", full_name="Guest Researcher")
        db.add(user)
        db.commit()

    exp = Experiment(
        user_id=user.id,
        name=req.name,
        asset=req.asset,
        strategy_name=req.strategy_name,
        parameters_json=json.dumps(req.parameters),
        metrics_json=json.dumps(req.metrics),
        equity_curve_json=json.dumps(req.equity_curve or []),
        trade_count=req.trade_count
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    return {
        "id": exp.id,
        "name": exp.name,
        "asset": exp.asset,
        "strategy_name": exp.strategy_name,
        "message": "Experiment successfully archived."
    }

@router.put("/{exp_id}")
def rename_experiment(
    exp_id: int,
    payload: Dict[str, str],
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    new_name = payload.get("name")
    if new_name:
        exp.name = new_name.strip()
        db.commit()
    return {"message": "Experiment renamed successfully", "name": exp.name}

@router.delete("/{exp_id}")
def delete_experiment(
    exp_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    exp = db.query(Experiment).filter(Experiment.id == exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found.")
    db.delete(exp)
    db.commit()
    return {"message": "Experiment deleted."}

# Saved Strategies
@router.get("/saved-strategies/list")
def list_saved_strategies(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    strategies = db.query(SavedStrategy).filter(SavedStrategy.user_id == user_id).order_by(SavedStrategy.created_at.desc()).all()
    output = []
    for s in strategies:
        output.append({
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "strategy_type": s.strategy_type,
            "parameters": json.loads(s.parameters_json) if s.parameters_json else {},
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return output

@router.post("/saved-strategies/save")
def save_strategy(
    req: SavedStrategySaveRequest,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=1, email="guest.researcher@quantlab.internal", hashed_password="demo", full_name="Guest Researcher")
        db.add(user)
        db.commit()

    strat = SavedStrategy(
        user_id=user.id,
        name=req.name,
        description=req.description or "",
        strategy_type=req.strategy_type,
        parameters_json=json.dumps(req.parameters)
    )
    db.add(strat)
    db.commit()
    db.refresh(strat)
    return {"id": strat.id, "name": strat.name, "message": "Strategy saved successfully."}

@router.delete("/saved-strategies/{strat_id}")
def delete_strategy(
    strat_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    strat = db.query(SavedStrategy).filter(SavedStrategy.id == strat_id).first()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found.")
    db.delete(strat)
    db.commit()
    return {"message": "Strategy deleted."}
