import 'bootstrap/dist/css/bootstrap.min.css';
import {
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import React, { useState, useEffect } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { URLS } from '../../Settings';
import logo from '../../assets/logo.png';
import './Top.css';

export default function Top() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState();

  useEffect(() => {
    getCollections();
  }, []);

  const getCollections = async () => {
    try {
      const response = await fetch(`${URLS.api}/magic-eden/collections`);
      const collections = await response.json();
      setCollections(collections);
    } catch (error) {
      console.log(error);
    }
  }

  const navigateToCollection = (value) => {
    const collection = collections.find(c => c.name === value);
    if (collection) {
      navigate(collection.symbol);
    }
  }

  const collectionOptions = collections?.length > 0 ? collections.map((collection) => {
    return (
      <option key={collection.symbol} value={collection.name} />
    )
  }) : null;

  return (
    <Navbar expand="lg" bg="dark" variant="dark" className="px-4 border-bottom border-secondary">
      <Navbar.Brand className="me-5" href="/">
        <img className="my-3 pe-3" src={logo} alt="Logo" height="50" />
        <span className="display-6 align-middle"><strong>MetricNFT</strong></span>
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse>
        <Nav style={{ minWidth: "50%" }}>
          <input className="form-control" list="datalistOptions" placeholder="Search collections..." onChange={e => navigateToCollection(e.target.value)} />
          <datalist id="datalistOptions">
            {collectionOptions}
          </datalist>
        </Nav>
        <Nav className="ms-auto">
          <Nav.Link href="account" className="text-white align-self-center mx-3">Account</Nav.Link>
          <Nav.Link><WalletMultiButton /></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
};
