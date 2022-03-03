import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Table } from 'react-bootstrap';

class Collection extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const row = this.props.row;
    // const collection = this.props.collection;
    const { name, floor, _23dfloor, _30dfloor, _24hvolume, maxsupply, ownerscount, listedcount } = this.props.collection;

    return (
      <tr>
        <th scope="row">{row}</th>
        <td>{name}</td>
        <td>{parseFloat(floor).toFixed(2)}</td>
        <td>{((floor - _23dfloor)/_23dfloor*100).toFixed(1)}%</td>
        <td>{((floor - _30dfloor)/_30dfloor*100).toFixed(1)}%</td>
        <td>{parseFloat(_24hvolume).toFixed(2)}</td>
        <td>{(floor*maxsupply).toFixed(2)}</td>
        <td>{maxsupply}</td>
        <td>{ownerscount}</td>
        <td>{listedcount} ({(listedcount/maxsupply*100).toFixed(1)}%)</td>
      </tr>
    )
  };
};

export default Collection;
