import axios from "axios";
import Index from "../modules/market/index/index.model.js";

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getValidNumbers = (values = []) =>
  values.map(toNumber).filter((value) => value !== null);

const fetchYahooQuote = async (symbol) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}`;

  const { data } = await axios.get(url, {
    params: {
      range: "1y",
      interval: "1d",
      events: "div,splits",
    },
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
    timeout: 15000,
  });

  const result = data?.chart?.result?.[0];

  if (!result) {
    const yahooError = data?.chart?.error?.description;
    throw new Error(yahooError || `No Yahoo data returned for ${symbol}`);
  }

  const meta = result.meta || {};
  const quote = result.indicators?.quote?.[0] || {};

  const opens = getValidNumbers(quote.open);
  const highs = getValidNumbers(quote.high);
  const lows = getValidNumbers(quote.low);
  const closes = getValidNumbers(quote.close);

  const last =
    toNumber(meta.regularMarketPrice) ?? closes[closes.length - 1] ?? null;

  const previousClose =
    toNumber(meta.previousClose) ?? toNumber(meta.chartPreviousClose) ?? null;

  if (last === null) {
    throw new Error(`Current price unavailable for ${symbol}`);
  }

  if (previousClose === null || previousClose <= 0) {
    throw new Error(`Previous close unavailable for ${symbol}`);
  }

  if (highs.length === 0 || lows.length === 0) {
    throw new Error(`52-week high/low unavailable for ${symbol}`);
  }

  return {
    last: Number(last.toFixed(2)),
    previousClose: Number(previousClose.toFixed(2)),
    yearHigh: Number(Math.max(...highs).toFixed(2)),
    yearLow: Number(Math.min(...lows).toFixed(2)),
    latestOpen:
      opens.length > 0 ? Number(opens[opens.length - 1].toFixed(2)) : null,
  };
};

const runMarketSyncJob = async () => {
  const startTime = new Date();

  console.log(`📈 [MarketSyncJob] Started at ${startTime.toISOString()}`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const indices = await Index.find({
      isActive: true,
      apiSymbol: { $exists: true, $type: "string", $ne: "" },
    }).select("_id name symbol apiSymbol");

    const unmappedCount = await Index.countDocuments({
      isActive: true,
      $or: [
        { apiSymbol: { $exists: false } },
        { apiSymbol: "" },
        { apiSymbol: null },
      ],
    });

    skipped = unmappedCount;

    console.log(
      `🔍 [MarketSyncJob] Mapped: ${indices.length}, Unmapped: ${unmappedCount}`,
    );

    for (const index of indices) {
      try {
        const quote = await fetchYahooQuote(index.apiSymbol);

        const change = Number((quote.last - quote.previousClose).toFixed(2));

        const changePercent =
          quote.previousClose > 0
            ? Number(
                (
                  ((quote.last - quote.previousClose) / quote.previousClose) *
                  100
                ).toFixed(2),
              )
            : 0;

        const updateResult = await Index.updateOne(
          { _id: index._id, isActive: true },
          {
            $set: {
              currentValue: quote.last,
              previousClose: quote.previousClose,
              highValue: quote.yearHigh,
              lowValue: quote.yearLow,
              change,
              changePercent,
              lastUpdated: new Date(),
            },
          },
        );

        if (updateResult.matchedCount !== 1) {
          throw new Error("Index was not found or became inactive");
        }

        updated++;

        console.log(
          `✅ [MarketSyncJob] ${index.name} | ${index.apiSymbol} | ${quote.last}`,
        );
      } catch (error) {
        failed++;

        console.error(
          `❌ [MarketSyncJob] Failed: ${index.name} (${index.apiSymbol})`,
          error.message,
        );
      }

      await sleep(500);
    }

    const duration = ((new Date() - startTime) / 1000).toFixed(2);

    console.log(
      `✅ [MarketSyncJob] Completed in ${duration}s | Updated: ${updated} | Failed: ${failed} | Skipped: ${skipped}`,
    );

    return {
      updated,
      failed,
      skipped,
      total: indices.length + skipped,
    };
  } catch (error) {
    console.error("❌ [MarketSyncJob] Fatal error:", error.message);

    return {
      updated,
      failed: failed + 1,
      skipped,
      total: updated + failed + skipped,
    };
  }
};

export { fetchYahooQuote };
export default runMarketSyncJob;
