# Historical-price coverage review — September 16, 2026

Daily Portfolio now defaults to backfilled history. The separate Price history control returns to the original cache; Calculation basis still independently controls action recovery. This update is included in the September 16 GitHub Pages release. Trade Review remains available with its separate, unchanged yearly-reset model.

## What changed

Seven histories were already available in the research archive but not connected to the dashboard: BTCUSD → BTC-USD, ETHUSD → ETH-USD, SOLUSD → SOL-USD, ALA → ALA.TO, U.UN → U-UN.TO, COCOA → CC=F, NATGAS → NG=F.

Eight additional histories were downloaded: TRXUSD → TRX-USD, XRPUSD → XRP-USD, US_SMALL_CAP_2000 → ^RUT, 6988 → 6988.T, 3988/BACHF → 3988.HK, ALUM → ALUM.L, FI → FISV, AAVE/USDT → Binance AAVEUSDT.

ALUM is the USD-quoted London WisdomTree Aluminium ETC, not a US stock or an aluminium futures price. [London Stock Exchange](https://www.londonstockexchange.com/stock/ALUM/wisdomtree/company-page), [issuer listing details](https://www.wisdomtree.com/se/products/commodities/wisdomtree-aluminium).

Fiserv's FI history is carried under FISV following the exchange/ticker change. [Nasdaq historical-data instructions](https://www.nasdaqtrader.com/TraderNews.aspx?id=DTN2025-32).

AAVE uses the exact USDT pair, not AAVE-USD; this preserves the alert's price unit without claiming USDT/USD exchange conversion. [Binance market-data-only endpoint documentation](https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md).

All prices stop at September 10, the existing model cutoff. Original source actions, reported fills, trims, allocation weights, exclusions, data/marks.json and the yearly Trade Review model are unchanged. Generated source responses are saved privately in the sibling research archive's price-backfill-raw/ folder; normalized prices, provenance and the comparison audit live in this dashboard's data/ folder. `npm run backfill` reruns the pull with three workers and bounded request timeouts; `npm test` validates both scenarios offline.

Daily CSV exports retain full precision and include each active position's mark, nominal currency, quote date, provider symbol, price basis and source link. Ledger rows stay within the selected range; a carried mark's quote date can legitimately precede that range.

## Before / after: entire continuous replay

The account starts once at $100,000 before the first usable entry. These are modeled ending values for March 5, 2024 through September 10, 2026, NOT annual returns or the selected 2026 date-range P/L.

| Action basis | Original ending value | Backfilled ending value | Difference | Fallback/stale calendar days | Excluded lifecycles |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original covered actions | $111,873.06 | $111,820.94 | −$52.11 | 325 → 1 | 75 → 75 |
| With action-recovery estimates | $124,764.84 | $124,756.12 | −$8.72 | 637 → 52 | 43 → 43 |

Both accounting identities reconcile below $0.000001 every day. The large improvement is daily price coverage, not a large increase in terminal profit. Closed-trade profits still use recorded action prices, and marked equity only changes later entries/adds when those actions occur. Missing historical movements can therefore change the path dramatically without changing terminal totals much. Prices may increase or decrease subsequent position sizes; this pull slightly decreased ending values.

## Still unresolved

- ORLA: Yahoo returned only recent history, not usable 2025 entry-period history. No future quote was used for the old trade.
- HES and BLD: both Yahoo chart hosts returned HTTP 404; Nasdaq historical requests with ISO dates returned “Symbol not exists.” Their recorded executions remain, with explicitly labeled execution fallbacks between actions. Do not substitute CVX or QXO for old stock prices.
- Exchange holidays can still create stale/initial execution fallback days even after including the preceding 14 days of prices. A carried prior close is not a same-day quote.
- Futures/index histories are continuous/benchmark proxies; actual traded contract, roll and CFD mechanics remain unknown.
- CAD, JPY, HKD and USDT marks match the action prices' nominal units. Currency exposure and FX conversion are not modeled. Displayed dollars remain nominal-equivalent estimates, not verified USD brokerage returns.
- The 43 exclusions in the recovery view still need entry/weight/addition/closure evidence. Historical closes must not be presented as verified execution prices or used to invent trades.

## Next checks

Find a historical provider retaining delisted-stock data for HES/BLD and full ORLA history, without buying a plan or exposing credentials without approval. Verify instrument identity, currencies and corporate actions before integration. Implement share-count changes for splits and explicit FX treatment before claiming actual USD portfolio performance. Resolve remaining source-action histories separately. The original quote cache and all before/after audit values remain available for spot checks.

Verification: 57 automated tests passed (19 Daily Portfolio, 38 Trade Review). Browser checks verified all four action/price combinations, unchanged exclusion counts, and ALUM's December 19 close carried to December 20 with its source, currency and date visible. A correct identity verifies arithmetic, not complete source accuracy.
