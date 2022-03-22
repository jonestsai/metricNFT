import 'bootstrap/dist/css/bootstrap.min.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { URLS } from '../Settings';
import './Account.css';

export default function Account() {
  // if (!publicKey) throw new WalletNotConnectedError();
  const { publicKey } = useWallet();

  const [wallet, setWallet] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState('my-items');

  useEffect(() => {
    fetchWallet();
  }, [publicKey]);

  const fetchWallet = async () => {
    setIsLoading(true);

    if (!publicKey) {
      return;
    }

    try {
      const response = await fetch(`${URLS.api}/magic-eden/wallets/${publicKey.toString()}/tokens?offset=0&limit=100&listedOnly`);
      const wallet = await response.json();
      // console.log(wallet);
      setWallet(wallet);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  const items = wallet?.length > 0
    ? wallet.map((item) => {
      return (
        <div key={item.mintAddress} className="col">
          <div className="card text-white bg-dark">
            <img src={item.image} className="card-img-top" />
            <div className="card-body">
              <h5 className="card-title">{item.name}</h5>
            </div>
          </div>
        </div>
      )
    }) : null;

  return (
    <Container fluid>
      {!publicKey && (
        <h5 className="py-5">Connect wallet to see your profile page.</h5>
      )}
      {publicKey && (
        <Tabs
          fill
          activeKey={key}
          onSelect={(k) => setKey(k)}
          className="account mt-5 mb-4"
        >
          <Tab eventKey="my-items" title="My Items">
            <div className="row row-cols-1 row-cols-md-5 g-4">
              {items}
            </div>
          </Tab>
          <Tab eventKey="alerts" title="Alerts">
            <div>Alerts</div>
          </Tab>
          <Tab eventKey="settings" title="Settings">
            <div>Settings</div>
          </Tab>
        </Tabs>
      )}
      {(publicKey && isLoading) && (
        <div className="my-5 text-center">
          <div className="spinner-border text-light" role="status" />
        </div>
      )}
    </Container>
  );
}