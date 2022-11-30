import 'bootstrap/dist/css/bootstrap.min.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import React, { useState, useEffect } from 'react';
import { Button, Container, FloatingLabel, Form, Table, Tab, Tabs } from 'react-bootstrap';
import Notification from './account/Notification';
import Profile from './account/Profile';
import Settings from './account/Settings';
import { URLS } from '../Settings';
import './Account.css';

export default function Account() {
  // if (!publicKey) throw new WalletNotConnectedError();
  const { publicKey } = useWallet();

  const [wallet, setWallet] = useState();
  const [userNotifications, setUserNotifications] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState('notifications');
  const [email, setEmail] = useState();

  useEffect(() => {
    fetchWallet();
  }, [publicKey]);

  const fetchWallet = async () => {
    setIsLoading(true);

    if (!publicKey) {
      return;
    }

    try {
      const response = await fetch(`${URLS.api}/magiceden/wallets/${publicKey.toString()}/activities?offset=0&limit=100`);
      const wallet = await response.json();

      setWallet(wallet);
    } catch (error) {
      console.log(error);
    }

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
              <Table variant="dark" hover>
                <thead>
                  <tr className="table-secondary">
                    <th scope="col">Collection</th>
                    <th scope="col">Transaction ID</th>
                    <th scope="col">Transaction Type</th>
                    <th scope="col">Time</th>
                    <th scope="col">Total Amount</th>
                    <th scope="col">Mint Address</th>
                  </tr>
                </thead>
                <tbody>
                  {wallet?.length > 0 ? wallet?.map((item) => {
                    const blockTime = new Date(item.blockTime * 1000);
                    return (
                      <tr key={`${item.signature}${item.type}`}>
                        <td className="text-white-50 text-start align-middle">{item.collection}</td>
                        <td className="text-white-50 align-middle"><a className="link-secondary" href={`https://solscan.io/tx/${item.signature}`} target="_blank">{`${item.signature.slice(0, 5)} ... ${item.signature.slice(-3)}`}</a></td>
                        <td className="text-white-50 align-middle">{item.type}</td>
                        <td className="text-white-50 align-middle">{blockTime.toLocaleString()}</td>
                        <td className="text-white-50 align-middle">{`${item.price} SOL`}</td>
                        <td className="text-white-50 align-middle"><a className="link-secondary" href={`https://solscan.io/token/${item.tokenMint}`} target="_blank">{`${item.tokenMint.slice(0, 5)} ... ${item.tokenMint.slice(-3)}`}</a></td>
                      </tr>
                  )}) : null}
                </tbody>
              </Table>
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