from app.signal.gates import pass_gates
from app.signal.scoring import compute_expected_range
from app.storage.models import MarketFeatures


def test_scoring_returns_range_and_confidence() -> None:
    f = MarketFeatures(asset='AAPL', price=100, atr_pct=1.1, trend='up', regime='trending', above_short_ma=True, recent_pivot=99)
    low, high, impact, conf = compute_expected_range('MACRO_DOVISH', 'bullish', 0.74, f, 'dj.com', {'default': 1.0, 'dj.com': 1.1})
    assert 0 < low < high
    assert 0 <= conf <= 1
    assert impact > 0


def test_gates_reject_unclear_low_impact() -> None:
    f = MarketFeatures(asset='SPY', price=100, atr_pct=1.0, trend='up', regime='trending', above_short_ma=True, recent_pivot=99)
    ok, reason = pass_gates('SPY', 'unclear', 0.9, 1.2, 70, f)
    assert ok is False
    assert reason == 'unclear_direction'
