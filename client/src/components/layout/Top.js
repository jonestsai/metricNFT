import 'bootstrap/dist/css/bootstrap.min.css';
import {
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { URLS } from '../../Settings';
import logo from '../../assets/logo.png';
import './Top.css';

export default function Top(props) {
  const navigate = useNavigate();
  const [collections, setCollections] = useState();

  const { partner } = props;

  let getCollectionsTimeout;

  const navigateToCollection = (value) => {
    clearTimeout(getCollectionsTimeout);

    getCollectionsTimeout = setTimeout(() => {
      getCollections(value);
    }, 500);

    const collection = collections.find(c => c.name === value);
    if (collection) {
      navigate(`collection/${collection.symbol}`);
    }
  }

  const getCollections = async (value) => {
    try {
      const response = await fetch(`${URLS.api}/collection/search/${value}`);
      const collections = await response.json();
      setCollections(collections);
    } catch (error) {
      console.log(error);
    }
  }

  const collectionOptions = collections?.length > 0 ? collections.map((collection) => {
    return (
      <option key={collection.symbol} value={collection.name} />
    )
  }) : null;

  return (
    <nav className=" px-4 border-bottom border-secondary navbar navbar-expand-lg navbar-dark bg-dark">
      <a href="/" className="me-5 navbar-brand">
        <img className="my-3 pe-3" src={logo} alt="Logo" height="50" />
        <span className="display-6 align-middle"><strong>MetricNFT</strong></span>
      </a>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <div className="navbar-nav" style={{ minWidth: "50%" }}>
          <input className="form-control" list="datalistOptions" placeholder="Search collections..." onChange={e => navigateToCollection(e.target.value)} />
          <datalist id="datalistOptions">
            {collectionOptions}
          </datalist>
        </div>
        <div className="ms-auto navbar-nav">
          <a href="/account" className="text-white align-self-center mx-3 mt-3 mb-2 nav-link">Account</a>
          <a role="button" className="align-self-center nav-link">
            <WalletMultiButton />
          </a>
        </div>
      </div>
    </nav>
  )
};
