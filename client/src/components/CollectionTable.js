import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Table } from 'react-bootstrap';
import { FaRegBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { isCurrencyString, currencyToNumber } from '../utils/helpers';
import './CollectionTable.css';

export default function CollectionTable(props) {
  const { items, requestSort, sortConfig } = useSortableData(props.collections);
  const getClassNamesFor = (name) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };
  const navigate = useNavigate();

  return (
    <Table variant="dark" hover>
      <thead>
        <tr className="table-secondary">
          <th scope="col">#</th>
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
            className={`text-end pe-1 ${getClassNamesFor('listedCount')}`}>Listed</th>
          <th scope="col" className={`text-end pe-3`}></th>
        </tr>
      </thead>
      <tbody>
        {items?.map((item) => {
          const { row, image, name, symbol, floorPrice, _24hChange, _7dChange, volume, floorMarketCap, maxSupply, holders, listedCount} = item;
          const _24hChangeColor = _24hChange < 0 ? 'text-danger' : 'text-success';
          const _7dChangeColor = _7dChange < 0 ? 'text-danger' : 'text-success';
          const handleRowClick = (symbol) => {
            navigate(symbol);
          }
          const handleNotificationClick = (name) => {
            navigate(`account?collection=${name}`);
          }

          return (
          <tr key={item.id}>
            <td className="text-white-50 align-middle">{row}</td>
            <td className="align-middle"><img className = "rounded-circle" height="40" src={image} role="button" onClick={()=> handleRowClick(symbol)} /></td>
            <td className="text-start align-middle"><u role="button" onClick={()=> handleRowClick(symbol)}>{name}</u></td>
            <td className="text-white-50 text-end align-middle">{floorPrice}</td>
            <td className={`${_24hChangeColor} text-end align-middle`}>{(_24hChange).toFixed(1)}%</td>
            <td className={`${_7dChangeColor} text-end align-middle`}>{(_7dChange).toFixed(1)}%</td>
            <td className="text-white-50 text-end align-middle">{volume}</td>
            <td className="text-white-50 text-end align-middle">{floorMarketCap}</td>
            <td className="text-white-50 text-end align-middle">{maxSupply}</td>
            <td className="text-white-50 text-end align-middle">{holders}</td>
            <td className="text-white-50 text-end align-middle">{listedCount}<br/><span className="text-secondary">{(listedCount/maxSupply * 100).toFixed(1)}%</span></td>
            <td className="text-white-50 text-end pe-3 align-middle"><FaRegBell size={20} role="button" onClick={()=> handleNotificationClick(name)} /></td>
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
