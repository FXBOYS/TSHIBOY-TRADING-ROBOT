# TSHIBOY Trading Robot — Netlify Starter

## What works
Installable responsive PWA using the supplied avatar, live OHLC candle retrieval through Twelve Data, deterministic rule-based confirmation scoring, conservative no-trade handling, SL and TP1/2/3 on valid setups, risk budget display, strategy presets. No random price or signal generation.

## What does NOT work yet
**No real MT5 execution, paper orders, user login, multi-user isolation, continuous background trading, broker-derived lot sizing, or fully validated strategy/backtest.** The Execute Order button is deliberately disabled. The server endpoint also refuses orders. Do not advertise this build as an autonomous trading robot.

## Deploy for free to Netlify
1. Create a Twelve Data account and obtain a market-data API key. Check that your plan covers your instruments and intervals; XAUUSD and indices may not be available on free plans.
2. Upload this entire project to GitHub, then import the repository into Netlify (recommended for Functions), or deploy via Netlify CLI.
3. Netlify Site configuration > Environment variables: add `TWELVEDATA_API_KEY` with the private key. Do not add it to JavaScript or GitHub.
4. Trigger a fresh production deploy. Open the Netlify HTTPS site on your phone. iPhone: Safari > Share > Add to Home Screen. Android: browser menu > Install app.
5. Tap ANALYSE REAL CANDLES. If the data provider rejects a symbol, the app will display the error and never invent a trade.

## MT5 execution roadmap
The official MetaTrader5 Python library requires an installed MT5 terminal. Netlify Functions cannot host that terminal. For phone-independent execution, deploy a separately hosted always-on MT5 terminal/gateway or choose a broker with a genuine HTTPS trading API. Add server-side authentication, per-user credential vault, quote freshness checks, symbol contract specs, tick value and currency conversion, position sizing, daily loss/drawdown limits, order idempotency, audit logs, order status reconciliation, and demo account validation before enabling the UI execution button. No secure MT5 gateway can be created by supplying only a market-data API key.

## Security
Never share broker passwords or keys in chat, HTML, or browser local storage. The market-data key stays in Netlify environment variables. Public market candles are not a substitute for executable broker bid/ask quotes.

## Testing
`npm test` (Node 20+).

## Device-local paper trading (added)
The PLACE PAPER TRADE button activates only after a qualifying analysis. Trades are stored in that phone's browser localStorage; they are **not** backed up, authenticated, or synchronized. The hypothetical fill uses the most recent provider candle close; a real order would have spread, slippage, and different fills. Paper sizing uses synthetic USD per price-unit contracts, **not** Exness lots. Re-scan the same instrument/timeframe to settle against newer provider candles: TP1 or SL, whichever occurs first; if both occur in one candle, assume SL first. TP2 and TP3 are reference levels only. This is a limited forward-testing journal, not tick-accurate execution or reliable backtesting. Maximum three open paper trades per device. No automatic background scans.

## Deployment status
Files are prepared for Netlify but **not deployed**. Deploy from a GitHub repository via Netlify and set TWELVEDATA_API_KEY as a server-side environment variable. A Netlify account authorization is required to publish; no account access or deployment has been performed here. The app will run on your phone without your laptop while hosted, but continuous background analysis and MT5 execution are not included.
