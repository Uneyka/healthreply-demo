from app.nlp.classify import classify_event


def test_classifier_detects_earnings_beat() -> None:
    event, direction, conf, _ = classify_event('ABC beats earnings and raises outlook', 'strong quarter')
    assert event == 'EARNINGS_BEAT'
    assert direction == 'bullish'
    assert conf >= 0.6
