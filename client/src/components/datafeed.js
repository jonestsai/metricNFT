const configurationData = {
  supported_resolutions: ['1D'],
};

const makeApiRequest = async (symbolInfo, resolution) => {
  let interval;
  if (resolution === '1D' || resolution === '1W' || resolution === '1M') {
    interval = '1d';
  } else if (resolution > 360) {
    interval = '6h';
  } else if (resolution > 60) {
    interval = '1h';
  } else {
    interval = '10m';
  }

  try {
    const response = await fetch(`https://metricnft.com/api/collection/${symbolInfo.ticker}/chart/${interval}`);
    return response.json();
  } catch(error) {
    throw new Error(`Error: ${error.status}`);
  }
}

export default {
  onReady: (callback) => {
    // console.log('[onReady]: Method call');
    setTimeout(() => callback(configurationData));
  },
  searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
    // console.log('[searchSymbols]: Method call');
  },
  resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
    // console.log('[resolveSymbol]: Method call', symbolName);
    const symbol = symbolName.substring(0, symbolName.indexOf(':'));
    const name = symbolName.substring(symbolName.indexOf(':') + 1);
    const symbolInfo = {
      ticker: symbol,
      name: name,
      description: name,
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: 'MetricNFT',
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      intraday_multiplier: 1,
      has_weekly_and_monthly: false,
      supported_resolutions: configurationData.supported_resolutions,
      volume_precision: 2,
      data_status: 'streaming',
    };

    // console.log('[resolveSymbol]: Symbol resolved', symbolName);
    onSymbolResolvedCallback(symbolInfo);
  },
  getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    const { from, to, firstDataRequest } = periodParams;
    try {
      const data = await makeApiRequest(symbolInfo, resolution);
      let bars = [];
      data.forEach(bar => {
        if (bar.ts / 1000 >= from && bar.ts / 1000 < to) {
          bars = [...bars, {
            time: bar.ts,
            low: bar.minFP,
            high: bar.maxFP,
            open: bar.oFP,
            close: bar.cFP,
            volume: bar.cV - bar.oV,
          }];
        }
      });
      if (bars.length) {
        onHistoryCallback(bars, { noData: false });
      } else {
        onHistoryCallback(bars, { noData: true });
      }
    } catch (error) {
      console.log('[getBars]: Get error', error);
      onErrorCallback(error);
    }
  },
  subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
    // console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID);
  },
  unsubscribeBars: (subscriberUID) => {
    // console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
  },
};