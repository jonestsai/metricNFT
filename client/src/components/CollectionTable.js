import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import { FaStar, FaRegStar, FaRegBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { isCurrencyString, currencyToNumber } from '../utils/helpers';
import './CollectionTable.css';

export default function CollectionTable(props) {
  const { collections, partner } = props;
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

  return (
    <Table variant="dark" hover>
      <thead>
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
            onClick={() => requestSort('_24hChange')}
            className={`text-end ${getClassNamesFor('_24hChange')}`}>24h</th>
          <th scope="col" role="button"
            onClick={() => requestSort('_7dChange')}
            className={`text-end ${getClassNamesFor('_7dChange')}`}>7d</th>
          <th scope="col" role="button"
            onClick={() => requestSort('volume')}
            className={`text-end pe-1 ${getClassNamesFor('volume')}`}>24h Volume</th>
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
        {items?.map((item) => {
          const { row, image, name, symbol, floorPrice, oneDayPriceChangePct, sevenDayPriceChangePct, volume, floorMarketCap, maxSupply, holders, listedCount} = item;
          const _24hChangeColor = oneDayPriceChangePct < 0 ? 'text-danger' : 'text-success';
          const _7dChangeColor = sevenDayPriceChangePct < 0 ? 'text-danger' : 'text-success';
          const handleRowClick = (symbol) => {
            const partnerSearchParams = partner ? `?partner=${partner}` : '';
            navigate(`${symbol}${partnerSearchParams}`);
          }
          const handleNotificationClick = (name) => {
            navigate(`account?collection=${name}`);
          }

          return (
          <tr key={item.id}>
            <td className={`${partner ? 'd-none' : ''} text-white-50 ps-3 align-middle`}>
              {watchlist.has(symbol) ? <FaStar className="d-flex" size={20} role="button" color="#fc6" onClick={()=> handleWatchlistClick(symbol)} /> : <FaRegStar className="d-flex" size={20} role="button" onClick={()=> handleWatchlistClick(symbol)} />}
            </td>
            <td className={`${partner ? '' : 'ps-1'} text-white-50 align-middle`}>{row}</td>
            <td className="align-middle"><img className = "rounded-circle" height="40" src={image} role="button" onClick={()=> handleRowClick(symbol)} /></td>
            <td className="text-start align-middle"><u role="button" onClick={()=> handleRowClick(symbol)}>{name}</u></td>
            <td className="text-white-50 text-end align-middle">{floorPrice}</td>
            <td className={`${_24hChangeColor} text-end align-middle`}>{(oneDayPriceChangePct).toFixed(1)}%</td>
            <td className={`${_7dChangeColor} text-end align-middle`}>{(sevenDayPriceChangePct).toFixed(1)}%</td>
            <td className="text-white-50 text-end align-middle">{volume}</td>
            <td className="text-white-50 text-end align-middle">{floorMarketCap}</td>
            <td className="text-white-50 text-end align-middle">{maxSupply}</td>
            <td className="text-white-50 text-end align-middle">{holders}</td>
            <td className={`${partner ? 'pe-3' : ''} text-white-50 text-end align-middle`}>{listedCount}<br/><span className="text-secondary">{(listedCount/maxSupply * 100).toFixed(1)}%</span></td>
            <td className={`${partner ? 'd-none' : ''} text-white-50 text-end pe-3 align-middle`}><FaRegBell size={20} role="button" onClick={()=> handleNotificationClick(name)} /></td>
           </tr>
         )})}
      </tbody>
    </Table>
  );
};

const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = React.useState(config);

  const sortedItems = React.useMemo(() => {
    let sortableItems = items ? [...items] : null;
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
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
