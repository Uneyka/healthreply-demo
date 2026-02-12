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


## Option A (fertige Online-Lösung) – TradingView + Telegram in ~30 Minuten
Wenn du eine sofort nutzbare Lösung willst (ohne eigenen 24/7-Betrieb), nutze TradingView Alerts direkt auf Telegram.

### Was du dafür brauchst
1. TradingView Account (Pro empfohlen für mehr gleichzeitige Alerts)
2. Telegram Bot (über @BotFather)
3. Deine Telegram Chat-ID

### Schritt 1: Telegram Bot erstellen
1. In Telegram `@BotFather` öffnen.
2. `/newbot` ausführen.
3. Bot-Namen + Username vergeben.
4. Bot-Token speichern.

### Schritt 2: Chat-ID ermitteln
1. Deinem Bot einmal `/start` schreiben.
2. Im Browser öffnen:
   `https://api.telegram.org/bot<DEIN_BOT_TOKEN>/getUpdates`
3. In der JSON-Antwort `chat.id` kopieren.

### Schritt 3: TradingView Alert erstellen
1. Chart öffnen (z. B. SPY, NASDAQ, DAX-CFD).
2. Indikator/Signalquelle wählen (z. B. Breakout, MA-Cross, RSI-Regeln).
3. `Alert` anlegen.
4. Bei Nachricht ein strukturiertes Template nutzen, z. B.:

```text
[TV SIGNAL] {{ticker}}
Zeit: {{time}}
Close: {{close}}
Rule: Breakout/Trend
Bias: {{strategy.order.action}}
Risk: Manual decision only. No certainty.
```

### Schritt 4: TradingView -> Telegram verbinden
TradingView kann Telegram nicht nativ direkt ansprechen; nutze einen Webhook-Middleware-Dienst (z. B. Make.com, Zapier, Pipedream).

Standardfluss:
1. TradingView Alert mit Webhook URL senden.
2. Middleware empfängt Payload.
3. Middleware ruft Telegram `sendMessage` API auf:
   `https://api.telegram.org/bot<TOKEN>/sendMessage`
4. Body:
   - `chat_id`: deine Chat-ID
   - `text`: Nachricht aus Alert

### Schritt 5: Sicherheits- und Qualitätsfilter (empfohlen)
- Nur Signale innerhalb definierter Handelszeiten.
- Cooldown pro Asset (z. B. 10–20 min).
- Mindestens 2 Bedingungen kombinieren (Trend + Volatilität).
- Immer Risikozeile mitsenden (Slippage/Gap möglich).

### Schritt 6: Live-Test
1. Test-Alert manuell triggern.
2. Prüfen, ob Telegram Nachricht ankommt.
3. Erst danach mehrere Märkte gleichzeitig aktivieren.

### Copy/Paste Telegram Test
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>" \
  -d "text=Setup OK: TradingView Pipeline aktiv"
```

### Nach dem Start (deine Routine)
- 1x täglich prüfen, ob Alerts angekommen sind.
- Spam reduzieren: Cooldown + strengere Trigger.
- Wöchentlich Regeln nachschärfen (False Positives reduzieren).

