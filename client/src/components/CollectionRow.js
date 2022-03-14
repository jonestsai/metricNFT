import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Table } from 'react-bootstrap';

export default function CollectionRow(props) {
  const { row, collection, currency, currencyRate } = props;
  const { image, name, floorprice, _1dfloor, _7dfloor, _24hvolume, maxsupply, ownerscount, listedcount } = collection;

  let currencySymbol = '';
  switch (currency) {
    case 'BTC':
      currencySymbol = '₿';
      break;
    case 'ETH':
      currencySymbol = 'Ξ';
      break;
    case 'USD':
      currencySymbol = '$';
      break;
    case 'CAD':
      currencySymbol = '$';
      break;
    case 'EUR':
      currencySymbol = '€';
      break;
  }

  const floorPrice = `${currencySymbol}${(floorprice * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;
  const _24hChange = _1dfloor ? (floorprice - _1dfloor) / _1dfloor * 100 : 0;
  const _24hChangeColor = _24hChange < 0 ? 'text-danger' : 'text-success';
  const _7dChange = _7dfloor ? (floorprice - _7dfloor) / _7dfloor * 100 : 0;
  const _7dChangeColor = _7dChange < 0 ? 'text-danger' : 'text-success';
  const volume = `${currencySymbol}${((_24hvolume || 0) * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;
  const floorMarketCap = `${currencySymbol}${(floorprice * maxsupply * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;

  return (
    <tr>
      <td className="text-white-50 align-middle">{row}</td>
      <td className="align-middle"><img className = "rounded-circle" height="40" src={require(`../assets/${image}`)} /></td>
      <th scope="row" className="text-start align-middle">{name}</th>
      <td className="text-white-50 text-end align-middle">{floorPrice}</td>
      <td className={`${_24hChangeColor} text-end align-middle`}>{(_24hChange).toFixed(1)}%</td>
      <td className={`${_7dChangeColor} text-end align-middle`}>{(_7dChange).toFixed(1)}%</td>
      <td className="text-white-50 text-end align-middle">{volume}</td>
      <td className="text-white-50 text-end align-middle">{floorMarketCap}</td>
      <td className="text-white-50 text-end align-middle">{maxsupply}</td>
      <td className="text-white-50 text-end align-middle">{ownerscount}</td>
      <td className="text-white-50 text-end pe-4 align-middle">{listedcount}<br/><span className="text-secondary">{(listedcount/maxsupply * 100).toFixed(1)}%</span></td>
    </tr>
  )
};
