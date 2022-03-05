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
    const { image, name, floor, _23dfloor, _30dfloor, _24hvolume, maxsupply, ownerscount, listedcount } = this.props.collection;
    
    const _24hChange = (floor - _23dfloor)/_23dfloor * 100;
    const _24hChangeColor = _24hChange < 0 ? 'text-danger' : 'text-success';
    const _7dChange = (floor - _30dfloor)/_30dfloor * 100;
    const _7dChangeColor = _7dChange < 0 ? 'text-danger' : 'text-success';

    return (
      <tr>
        <td className="text-white-50">{row}</td>
        <td><img className = "rounded-circle" height="40" src={require(`../assets/${image}`)} /></td>
        <th scope="row" className="text-start">{name}</th>
        <td className="text-white-50 text-end">{parseFloat(floor).toFixed(2)}</td>
        <td className={`${_24hChangeColor} text-end`}>{(_24hChange).toFixed(1)}%</td>
        <td className={`${_7dChangeColor} text-end`}>{(_7dChange).toFixed(1)}%</td>
        <td className="text-white-50 text-end">{parseFloat(_24hvolume).toFixed(2)}</td>
        <td className="text-white-50 text-end">{(floor*maxsupply).toFixed(2)}</td>
        <td className="text-white-50 text-end">{maxsupply}</td>
        <td className="text-white-50 text-end">{ownerscount}</td>
        <td className="text-white-50 text-end pe-4">{listedcount}<br/><span className="text-secondary">{(listedcount/maxsupply * 100).toFixed(1)}%</span></td>
      </tr>
    )
  };
};
