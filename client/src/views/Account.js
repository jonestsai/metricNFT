import 'bootstrap/dist/css/bootstrap.min.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import React, { useState, useEffect } from 'react';
import { Button, Container, FloatingLabel, Form, Tab, Tabs } from 'react-bootstrap';
import Activities from './account/Activities';
import Notification from './account/Notification';
import Profile from './account/Profile';
import Settings from './account/Settings';
import { URLS } from '../Settings';
import './Account.css';

export default function Account() {
  // if (!publicKey) throw new WalletNotConnectedError();
  const { publicKey } = useWallet();

  const [userNotifications, setUserNotifications] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState('notifications');
  const [email, setEmail] = useState();

  useEffect(() => {
    fetchUser();
  }, [publicKey]);

  const fetchUser = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${URLS.api}/users/${publicKey.toString()}`);
      const userNotifications = await response.json();

      const email = userNotifications[0]?.email || '';
      setUserNotifications(userNotifications);
      setEmail(email);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container fluid>
      {!publicKey && (
        <h5 className="py-5 text-center">Connect wallet to see your profile page.</h5>
      )}
      {publicKey && (
        <div>
          <Profile />
          <Tabs
            fill
            activeKey={key}
            onSelect={(k) => setKey(k)}
            className="account my-5"
          >
            <Tab eventKey="notifications" title="Notifications">
              <Notification notifications={userNotifications} email={email} />
            </Tab>
            <Tab eventKey="activities" title="Activities">
              <Activities publicKey={publicKey} />
            </Tab>
            <Tab eventKey="settings" title="Settings">
              <Settings publicKey={publicKey} email={email} setEmail={setEmail} />
            </Tab>
          </Tabs>
        </div>
      )}
      {(publicKey && isLoading) && (
        <div className="my-5 text-center">
          <div className="spinner-border text-light" role="status" />
        </div>
      )}
    </Container>
  );
}