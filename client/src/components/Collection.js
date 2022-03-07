import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Table } from 'react-bootstrap';

export default class Collection extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const row = this.props.row;
    // const collection = this.props.collection;
    const { image, name, floor, _1dfloor, _7dfloor, _24hvolume, maxsupply, ownerscount, listedcount } = this.props.collection;
    
    const _24hChange = _1dfloor ? (floor - _1dfloor) / _1dfloor * 100 : 0;
    const _24hChangeColor = _24hChange < 0 ? 'text-danger' : 'text-success';
    const _7dChange = _7dfloor ? (floor - _7dfloor) / _7dfloor * 100 : 0;
    const _7dChangeColor = _7dChange < 0 ? 'text-danger' : 'text-success';

    return (
      <tr>
        <td className="text-white-50 align-middle">{row}</td>
        <td className="align-middle"><img className = "rounded-circle" height="40" src={require(`../assets/${image}`)} /></td>
        <th scope="row" className="text-start align-middle">{name}</th>
        <td className="text-white-50 text-end align-middle">{parseFloat(floor).toFixed(2)}</td>
        <td className={`${_24hChangeColor} text-end align-middle`}>{(_24hChange).toFixed(1)}%</td>
        <td className={`${_7dChangeColor} text-end align-middle`}>{(_7dChange).toFixed(1)}%</td>
        <td className="text-white-50 text-end align-middle">{parseFloat(_24hvolume || 0).toFixed(2)}</td>
        <td className="text-white-50 text-end align-middle">{(floor * maxsupply).toFixed(2)}</td>
        <td className="text-white-50 text-end align-middle">{maxsupply}</td>
        <td className="text-white-50 text-end align-middle">{ownerscount}</td>
        <td className="text-white-50 text-end pe-4 align-middle">{listedcount}<br/><span className="text-secondary">{(listedcount/maxsupply * 100).toFixed(1)}%</span></td>
      </tr>
    )
  };
};
