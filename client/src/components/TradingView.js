import React, { useState, useEffect } from 'react';
import { widget } from '../charting_library';
import Datafeed from './datafeed.js';

export function TradingView(props) {

  const { symbolName } = props;

  useEffect(() => {
    const widgetOptions = {
      symbol: symbolName, // default symbol
      interval: '1D', // default interval
      width: '100%',
      container: 'tv_chart_container',
      datafeed: Datafeed,
      library_path: '/charting_library/',
      disabled_features: ['header_symbol_search', 'header_compare'],
      theme: 'Dark',
    };

    new widget(widgetOptions);
  }, [symbolName]);

  return (
    <div className="mb-4" id="tv_chart_container" />
  );
}