import 'bootstrap/dist/css/bootstrap.min.css';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import React from 'react';
import { Container, Row, Col, Navbar } from 'react-bootstrap';
import logo from '../../assets/logo.png';

export default function Top() {
  const { publicKey } = useWallet();
  console.log(publicKey);

  return (
    <Navbar expand="xs" bg="dark" variant="dark" className="px-4 border-bottom border-gray">
      <Navbar.Brand href="/">
        <img className="my-3 pe-3" src={logo} alt="Logo" height="50" />
        <span className="display-6 align-middle"><strong>MetricNFT</strong></span>
      </Navbar.Brand>
      <span className="text-end align-middle">
        <WalletMultiButton />
      </span>
    </Navbar>
  )
};
