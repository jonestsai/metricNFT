import 'bootstrap/dist/css/bootstrap.min.css';
import {
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import React, { useState, useEffect } from 'react';
import { FaChevronLeft } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import CollectionSearchBar from '../CollectionSearchBar';
import { URLS } from '../../Settings';
import logo from '../../assets/logo.png';
import { getCurrentPage } from '../../utils/helpers';
import './Top.css';

export default function Top(props) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { partner } = props;

  const page = getCurrentPage(pathname);

  return (
    <div>
      <div className="row fixed-top d-sm-none bg-dark border-bottom border-gray text-center">
        {page.secondary && (
          <div className="col-3 p-4 text-center" role="button" onClick={()=> navigate(-1)}>
            <FaChevronLeft size={20} />
          </div>
        )}
      </div>
      {page.secondary && (
        <div className="d-sm-none pt-5">&nbsp;</div>
      )}
      <div className="d-none d-sm-block">
        <nav className="px-4 border-bottom border-secondary navbar navbar-expand-lg navbar-dark bg-dark">
          <a href="/" className="me-5 navbar-brand">
            <img className="my-3 pe-3" src={logo} alt="Logo" height="50" />
            <span className="display-6 align-middle"><strong>MetricNFT</strong></span>
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <div className="navbar-nav" style={{ minWidth: "50%" }}>
              <CollectionSearchBar datalistKey="desktopSearchBar" />
            </div>
            <div className="ms-auto navbar-nav">
              <a href="/account" className="text-white align-self-center mx-3 mt-3 mb-2 nav-link">Account</a>
              <a role="button" className="align-self-center nav-link">
                <WalletMultiButton />
              </a>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
};
