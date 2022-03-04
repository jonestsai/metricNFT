import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Row, Col, Navbar } from 'react-bootstrap';
import logo from '../../assets/logo.png';

export default class Top extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <Navbar expand="xs" className="border-bottom border-gray">
        <div>
          <img className="my-3 ps-1 pe-3" src={logo} alt="Logo" height="50" />
          <span className="display-6 align-middle"><strong>MetricNFT</strong></span>
        </div>
      </Navbar>
    )
  };
};
