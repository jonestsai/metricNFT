import 'bootstrap/dist/css/bootstrap.min.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import React, { useState, useEffect } from 'react';
import { Button, Container, FloatingLabel, Form, Tab, Tabs } from 'react-bootstrap';
import { URLS } from '../Settings';
import './Account.css';

export default function Account() {
  // if (!publicKey) throw new WalletNotConnectedError();
  const { publicKey } = useWallet();

  const [wallet, setWallet] = useState();
  const [user, setUser] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState('my-items');
  const [email, setEmail] = useState();
  const [isSaved, setIsSaved] = useState(false);

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
    }

    try {
      const response = await fetch(`${URLS.api}/users/${publicKey.toString()}`);
      const user = await response.json();
      // console.log(user);
      setUser(user);
      setEmail(user.email);
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      wallet_address: publicKey,
      email: email,
    };

    setIsLoading(true);
    try {
      const response = await fetch(`${URLS.api}/users/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status >= 200 && response.status < 300) {
        setIsSaved(true);
      } else {
        throw new Error(response.statusText);
      }
    } catch (error) {
      // Fail silently. This action is not important enough to interrupt the user's workflow.
      // alert('There was an issue saving. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

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
          className="account my-5"
        >
          <Tab eventKey="my-items" title="My Items">
            <div className="row row-cols-1 row-cols-md-5 g-4">
              {items}
            </div>
          </Tab>
          <Tab eventKey="notifications" title="Notifications">
            <div>Notifications</div>
          </Tab>
          <Tab eventKey="settings" title="Settings">
            <form className="py-5" onSubmit={handleSubmit}>
              <div className="row justify-content-md-center">
                <div className="col-md-4">
                  <FloatingLabel
                    controlId="floatingInput"
                    label="Email address"
                    className="mb-3"
                  >
                    <Form.Control
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </FloatingLabel>
                </div>
              </div>
              <div className="row">
                <div className="col-md-1 offset-md-4">
                  <button type="submit" className="btn btn-primary">Save</button>
                  {isSaved && (
                    <div className="text-success my-1">Saved!</div>
                  )}
                </div>
              </div>
            </form>
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