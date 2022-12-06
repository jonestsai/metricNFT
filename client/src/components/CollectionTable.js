import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaRegBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import solana from '../assets/solana-symbol.png';
import ethereum from '../assets/ethereum-symbol.png';
import { COLLECTIONS_PER_PAGE } from '../utils/constants';
import { isCurrencyString, currencyToNumber } from '../utils/helpers';

export default function CollectionTable(props) {
  const { collections, exchangeRates, currency, currentPage, partner } = props;
  const { items, requestSort, sortConfig } = useSortableData(collections);
  const getClassNamesFor = (name) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState(new Set(JSON.parse(localStorage.getItem('watchlist'))));

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify([...watchlist]));
  }, [watchlist]);

  const handleWatchlistClick = (symbol) => {
    if (watchlist.has(symbol)) {
      setWatchlist(prev => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    } else {
      setWatchlist(prev => new Set(prev).add(symbol));
    }
  }

  const paginatedResult = items?.slice(
    (currentPage - 1) * COLLECTIONS_PER_PAGE,
    (currentPage - 1) * COLLECTIONS_PER_PAGE + COLLECTIONS_PER_PAGE
  );

  return (
    <table className="table table-dark table-hover freeze-third-column">
      <thead className="sortable sticky-top">
        <tr className="table-secondary">
          <th scope="col" className={`${partner ? 'd-none' : ''} ps-3`}></th>
          <th scope="col" className={`${partner ? '' : 'ps-0'}`}>#</th>
          <th scope="col"></th>
          <th scope="col" role="button"
            onClick={() => requestSort('name')}
            className={`text-start ${getClassNamesFor('name')}`}>Collection</th>
          <th scope="col" role="button"
            onClick={() => requestSort('floorPrice')}
            className={`text-end ${getClassNamesFor('floorPrice')}`}>Floor</th>
          <th scope="col" role="button"
            onClick={() => requestSort('oneDayPriceChangePct')}
            className={`text-end ${getClassNamesFor('oneDayPriceChangePct')}`}>24h</th>
          <th scope="col" role="button"
            onClick={() => requestSort('sevenDayPriceChangePct')}
            className={`text-end ${getClassNamesFor('sevenDayPriceChangePct')}`}>7d</th>
          <th scope="col" role="button"
            onClick={() => requestSort('oneDayVolume')}
            className={`text-end pe-1 ${getClassNamesFor('oneDayVolume')}`}>24h Volume</th>
          <th scope="col" role="button"
            onClick={() => requestSort('floorMarketCap')}
            className={`text-end pe-1 ${getClassNamesFor('floorMarketCap')}`}>Floor Mkt Cap</th>
          <th scope="col" role="button"
            onClick={() => requestSort('maxSupply')}
            className={`text-end pe-1 ${getClassNamesFor('maxSupply')}`}>Tokens</th>
          <th scope="col" role="button"
            onClick={() => requestSort('holders')}
            className={`text-end pe-1 ${getClassNamesFor('holders')}`}>Owners</th>
          <th scope="col" role="button"
            onClick={() => requestSort('listedCount')}
            className={`${partner ? 'pe-3' : 'pe-1'} text-end ${getClassNamesFor('listedCount')}`}>Listed</th>
          <th scope="col" className={`${partner ? 'd-none' : ''} text-end pe-3`}></th>
        </tr>
      </thead>
      <tbody>
        {paginatedResult?.map((item) => {
          const { row, image, chain, name, symbol, floorPrice, oneDayPriceChangePct, sevenDayPriceChangePct, oneDayVolume, floorMarketCap, maxSupply, holders, listedCount} = item;
          const _24hChangeColor = oneDayPriceChangePct < 0 ? 'text-danger' : 'text-success';
          const _7dChangeColor = sevenDayPriceChangePct < 0 ? 'text-danger' : 'text-success';
          const handleRowClick = (symbol) => {
            const partnerSearchParams = partner ? `?partner=${partner}` : '';
            navigate(`collection/${symbol}${partnerSearchParams}`);
          }
          const handleNotificationClick = (name) => {
            navigate(`account?collection=${name}`);
          }

          let currencySymbol;
          let currencyRate = 1;
          let marketCapCurrencyRate = 1;
          switch (currency) {
            case 'SOL':
              currencySymbol = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;
              currencyRate = 1 / exchangeRates?.['solana/usd'];
              marketCapCurrencyRate = 1 / exchangeRates?.['solana/usd'];
              break;
            case 'ETH':
              currencySymbol = <img className="pe-1" src={ethereum} alt="ethereum-logo" height="14" />;
              currencyRate = 1 / exchangeRates?.['ethereum/usd'];
              marketCapCurrencyRate = 1 / exchangeRates?.['ethereum/usd'];
              break;
            case 'USD':
              currencySymbol = '$';
              currencyRate = 1;
              marketCapCurrencyRate = 1;
              break;
            default:
              if (chain === 'solana') {
                currencySymbol = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;
                currencyRate = 1 / exchangeRates?.['solana/usd'];
              }

              if (chain === 'ethereum') {
                currencySymbol = <img className="pe-1" src={ethereum} alt="ethereum-logo" height="14" />;
                currencyRate = 1 / exchangeRates?.['ethereum/usd'];
              }

              marketCapCurrencyRate = 1;
          }

          const floorPriceText = <div className="text-nowrap d-flex align-items-center justify-content-end">{currencySymbol}{(floorPrice * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
          const volume = <span className="text-nowrap d-flex align-items-center justify-content-end">{currencySymbol}{(oneDayVolume * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</span>;
          const marketCapCurrencySymbol = currency === 'Currency' ? '$' : currencySymbol;
          const floorMarketCapText = <span className="text-nowrap d-flex align-items-center justify-content-end">{marketCapCurrencySymbol}{(floorMarketCap * marketCapCurrencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</span>;

          return (
          <tr key={item.id}>
            <td className={`${partner ? 'd-none' : ''} text-white-50 ps-3 align-middle`}>
              {watchlist.has(symbol) ? <FaStar className="d-flex" size={20} role="button" color="#fc6" onClick={()=> handleWatchlistClick(symbol)} /> : <FaRegStar className="d-flex" size={20} role="button" onClick={()=> handleWatchlistClick(symbol)} />}
            </td>
            <td className={`${partner ? '' : 'ps-1'} text-white-50 align-middle`}>{row}</td>
            <td className="align-middle"><img className = "rounded-circle" height="40" width="40" src={image} role="button" onClick={()=> handleRowClick(symbol)} /></td>
            <td className="text-start align-middle"><u role="button" onClick={()=> handleRowClick(symbol)}>{name}</u></td>
            <td className="text-white-50 text-end align-middle">{floorPriceText}</td>
            <td className={`${_24hChangeColor} text-end align-middle`}>{(oneDayPriceChangePct).toFixed(1)}%</td>
            <td className={`${_7dChangeColor} text-end align-middle`}>{(sevenDayPriceChangePct).toFixed(1)}%</td>
            <td className="text-white-50 text-end align-middle">{volume}</td>
            <td className="text-white-50 text-end align-middle">{floorMarketCapText}</td>
            <td className="text-white-50 text-end align-middle">{maxSupply}</td>
            <td className="text-white-50 text-end align-middle">{holders}</td>
            <td className={`${partner ? 'pe-3' : ''} text-white-50 text-end lh-sm align-middle`}>{listedCount}<br/><span className="text-secondary">{(listedCount/maxSupply * 100).toFixed(1)}%</span></td>
            <td className={`${partner ? 'd-none' : ''} text-white-50 text-end pe-3 align-middle`}>
              {chain === 'solana' && <FaRegBell size={20} role="button" onClick={()=> handleNotificationClick(name)} />}
            </td>
           </tr>
         )})}
      </tbody>
    </table>
  );
};

const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = React.useState(config);

  const sortedItems = React.useMemo(() => {
    let sortableItems = items ? [...items] : null;
    if (sortConfig !== null) {
      sortableItems?.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];
        if (isCurrencyString(aKey)) {
          aKey = currencyToNumber(aKey);
        }
        if (isCurrencyString(bKey)) {
          bKey = currencyToNumber(bKey);
        }

        if (aKey < bKey) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        if (aKey > bKey) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
