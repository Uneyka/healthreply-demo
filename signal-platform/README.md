# News → Signal Platform (Manual Trading, Deterministic Core)

Self-hosted, Raspberry Pi-ready prototype for **manual trading ideas only**.

## Hard constraints
- No broker integration
- No trade execution
- Deterministic classifier + deterministic scoring path
- LLM summary optional and OFF by default

## Architecture
```text
app/
  main.py
  config.py
  ingest/
    rss.py
    finnhub.py
  nlp/
    summarize.py
    classify.py
  market/
    prices.py
    features.py
  signal/
    scoring.py
    gates.py
    builder.py
  notify/
    telegram.py
    notion.py
  storage/
    db.py
    models.py
  backtest/
    replay.py
    metrics.py
  utils/
    time.py
    text.py
    hashing.py
    logging.py
```

## Deterministic flow
1. Ingest RSS (optional Finnhub)
2. Dedupe by hash(normalized_title + source + timestamp_bucket), ignore for 24h
3. Rule-based event classification with precedence
4. Compute market features (ATR%, trend, regime)
5. Expected move range model (mu/sigma priors × vol × regime × source weight)
6. Gate filters (confidence, expected range, ATR band, cooldown, confirmation)
7. Build signal payload (bias, trigger, invalidation, risk note)
8. Deliver to Telegram + Notion, store all artifacts in SQLite

## Event types
- EARNINGS_BEAT / EARNINGS_MISS
- GUIDANCE_RAISED / GUIDANCE_CUT
- MNA
- ANALYST_UPGRADE / ANALYST_DOWNGRADE
- REGULATORY_LEGAL_POS / REGULATORY_LEGAL_NEG
- MACRO_HAWKISH / MACRO_DOVISH
- GEOPOL_RISK_ON / GEOPOL_RISK_OFF
- OTHER

## SQLite tables
- news_items
- classifications
- market_features
- signals
- deliveries
- errors

## Telegram format (MarkdownV2)
```text
[BREAKING] <ASSET>
Time (UTC), Source
Headline
Event: <event_type> (direction)
Impact: <0-100>  Confidence: <0-100>
Expected move (underlying): <low%> to <high%> (1-4h)
Trigger: <condition>
Invalidation: <condition>
Risk: gaps/spread/slippage warning
Link
```

## Example Telegram message
```text
[BREAKING] AAPL
Time (UTC): 2026-02-12T12:10:00+00:00
Source: https://feeds.a.dj.com/rss/RSSMarketsMain.xml
Headline: Apple beats earnings and raises outlook
Event: EARNINGS_BEAT (bullish)
Impact: 78  Confidence: 74
Expected move (underlying): 0.45% to 1.18% (1-4h)
Trigger: Bullish confirmation: hold above 20MA / recent pivot before considering entry.
Invalidation: Invalid if price closes back below confirmation level.
Risk: Manual trading only. Watch spread, slippage, gap risk, and event headline revisions.
Link: https://example.com/news
```

## Example Notion page payload
- Title: `AAPL EARNINGS_BEAT`
- Properties: Asset, Bias, Confidence
- Body:
  - Human-readable summary line
  - Full JSON payload code block

## Raspberry Pi install (<20 min)
1. Install Docker + Compose plugin.
2. Clone repository, then:
   ```bash
   cd signal-platform
   cp .env.example .env
   ```
3. Set Telegram + optional Notion/Finnhub env values.
4. Start:
   ```bash
   docker compose up -d --build
   ```
5. Health check:
   ```bash
   curl http://localhost:8080/health
   ```

## Backtest / replay
Replay stored news deterministically:
```bash
docker compose run --rm scheduler python -m app.backtest.replay
```

Outputs:
- input_news
- emitted_signals
- signals_per_day_proxy
- confidence_distribution
- expected_high_distribution
- directional_proxy_note (for 1h/4h move check)

## Reliability notes
- JSON structured logs
- restart: unless-stopped
- polling interval from env
- price cache to reduce API calls

## Security notes
- External text sanitized
- Deterministic rules prevent prompt-injection impact on core decisions
- Secrets only via `.env`

## Windows quick start
```powershell
cd signal-platform
copy .env.example .env
docker compose up -d --build
curl http://localhost:8080/health
```
