from app.signal.gates import pass_gates
from app.storage.models import MarketFeatures


def test_risk_filter_equivalent_gate_rejects_low_confidence() -> None:
    features = MarketFeatures(asset='SPY', price=100, atr_pct=1.0, trend='up', regime='trending', above_short_ma=True, recent_pivot=99)
    ok, reason = pass_gates('SPY', 'bullish', 0.1, 1.0, 90, features)
    assert ok is False
    assert reason == 'low_confidence'
