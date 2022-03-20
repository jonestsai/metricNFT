import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Row, Col, Navbar } from 'react-bootstrap';
import logo from '../../assets/logo.png';
import Wallet from '../../views/Wallet';

export default function Top() {
  return (
    <Navbar expand="xs" bg="dark" variant="dark" className="px-4 border-bottom border-gray">
      <Navbar.Brand href="/">
        <img className="my-3 pe-3" src={logo} alt="Logo" height="50" />
        <span className="display-6 align-middle"><strong>MetricNFT</strong></span>
      </Navbar.Brand>
      <span className="text-end align-middle">
        <Wallet />
      </span>
    </Navbar>
  )
};
