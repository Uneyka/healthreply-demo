from app.nlp.classify import classify_event


def test_precedence_miss_over_beat() -> None:
    event, direction, conf, hits = classify_event('Company misses earnings but says beat next quarter', '')
    assert event == 'EARNINGS_MISS'
    assert direction == 'bearish'
    assert conf > 0.8
    assert hits
