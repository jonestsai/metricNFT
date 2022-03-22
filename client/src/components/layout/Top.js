import 'bootstrap/dist/css/bootstrap.min.css';
import {
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import React from 'react';
import { Container, Row, Col, Navbar, Nav } from 'react-bootstrap';
import logo from '../../assets/logo.png';

export default function Top() {
  return (
    <Navbar expand="lg" bg="dark" variant="dark" className="px-4 border-bottom border-gray">
      <Navbar.Brand href="/">
        <img className="my-3 pe-3" src={logo} alt="Logo" height="50" />
        <span className="display-6 align-middle"><strong>MetricNFT</strong></span>
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse>
        <Nav className="ms-auto">
          <Nav.Link href="account" className="text-white align-self-center mx-3">Account</Nav.Link>
          <WalletMultiButton />
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
};
