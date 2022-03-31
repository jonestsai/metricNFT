import 'bootstrap/dist/css/bootstrap.min.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import React, { useState, useEffect } from 'react';
import { Button, Container, Dropdown, DropdownButton, FloatingLabel, Form, Table, Tab, Tabs } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { URLS } from '../Settings';
import './Account.css';

export default function Account() {
  // if (!publicKey) throw new WalletNotConnectedError();
  const { publicKey } = useWallet();

  const [wallet, setWallet] = useState();
  const [collections, setCollections] = useState();
  const [userNotifications, setUserNotifications] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState('notifications');
  const [searchParams] = useSearchParams();
  const [collectionOption, setCollectionOption] = useState(searchParams.get('collection'));
  const [sign, setSign] = useState('>');
  const [price, setPrice] = useState();
  const [email, setEmail] = useState();
  const [isNotificationSaved, setIsNotificationSaved] = useState(false);
  const [isEmailSaved, setIsEmailSaved] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, [publicKey]);

  const fetchWallet = async () => {
    setIsLoading(true);

    if (!publicKey) {
      return;
    }

    try {
      const response = await fetch(`${URLS.api}/magic-eden/wallets/${publicKey.toString()}/activities?offset=0&limit=100`);
      const wallet = await response.json();
      console.log(wallet);
      setWallet(wallet);
    } catch (error) {
      console.log(error);
    }

    try {
      const response = await fetch(`${URLS.api}/magic-eden/collections`);
      const collections = await response.json();
      // console.log(collections);
      setCollections(collections);
    } catch (error) {
      console.log(error);
    }

    try {
      const response = await fetch(`${URLS.api}/users/${publicKey.toString()}`);
      const userNotifications = await response.json();
      // console.log(userNotifications);
      const email = userNotifications[0]?.email || '';
      setUserNotifications(userNotifications);
      setEmail(email);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  const collectionOptions = collections?.length > 0
    ? collections.map((collection) => {
      return (
        <option key={collection.symbol} value={collection.name} />
      )
    }) : null;
  
  const handleSaveNotification = async (e) => {
    e.preventDefault();

    const collection = collections.find(c => c.name === collectionOption);
    // console.log(collection);

    if (!email) {
      alert('Please save your email under Settings');
      return;
    }

    if (!collection) {
      alert('Collection not found');
      return;
    }

    if (!price) {
      alert('Please set a price');
      return;
    }

    const { symbol, name, image } = collection;
    const data = {
      wallet_address: publicKey,
      symbol,
      name,
      image,
      sign,
      price,
    };

    setIsLoading(true);
    try {
      const response = await fetch(`${URLS.api}/users/notification`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status >= 200 && response.status < 300) {
        userNotifications.push({
          wallet_address: publicKey,
          collection_symbol: symbol,
          collection_name: name,
          collection_image: image,
          sign,
          price,
        });
        setUserNotifications(userNotifications);
        setIsNotificationSaved(true);
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

  const handleDeleteNotification = async (id) => {
    setIsLoading(true);
    const data = {
      id,
    };

    try {
      const response = await fetch(`${URLS.api}/users/notification/delete`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status >= 200 && response.status < 300) {
        const notifications = userNotifications.filter((notification) => {
          return notification.id !== id;
        });
        setUserNotifications(notifications);
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
  
  const handleEmail = async (action) => {
    const data = {
      wallet_address: publicKey,
      email: action === 'connect' ? email : null,
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
        if (action === 'connect') {
          setIsEmailSaved(true);
        }

        if (action === 'disconnect') {
          setEmail('');
          setIsEmailSaved(false);
        }
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
        <h5 className="py-5 text-center">Connect wallet to see your profile page.</h5>
      )}
      {publicKey && (
        <Tabs
          fill
          activeKey={key}
          onSelect={(k) => setKey(k)}
          className="account my-5"
        >
          <Tab eventKey="notifications" title="Notifications">
            <form className="py-5" onSubmit={handleSaveNotification}>
            <div className="row input-group mb-3">
              <div className="col-12 col-md-7 mb-1">
                <input className="form-control" list="datalistOptions" value={collectionOption} placeholder="Type to search..." onChange={e => setCollectionOption(e.target.value)} />
                <datalist id="datalistOptions">
                  {collectionOptions}
                </datalist>
              </div>
              <div className="col-5 col-md-2">
                <span className="input-group-text">Price</span>
              </div>
              <div className="col-2 col-md-1">
                <DropdownButton variant="light" title={sign} onSelect={e => setSign(e)}>
                  <Dropdown.Item eventKey=">">{'>'}</Dropdown.Item>
                  <Dropdown.Item eventKey="<">{'<'}</Dropdown.Item>
                </DropdownButton>
              </div>
              <div className="col-5 col-md-2">
                <div className="input-group">
                  <input type="text" aria-label="Price" className="form-control" onChange={e => setPrice(e.target.value)} />
                  <span className="input-group-text">SOL</span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-1">
                <button type="submit" className="btn btn-primary">Save</button>
                {isNotificationSaved && (
                  <div className="text-success my-1">Saved!</div>
                )}
              </div>
            </div>
            </form>
            {(publicKey && !isLoading) && (
              <Table variant="dark" hover>
                <thead>
                  <tr className="table-secondary">
                    <th scope="col">Name</th>
                    <th scope="col">Condition</th>
                    <th scope="col">Sent</th>
                    <th scope="col">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {userNotifications?.map((notification) => {
                    return (
                      <tr key={notification.collection_symbol}>
                        <td className="text-white-50 text-start align-middle">{notification.collection_name}</td>
                        <td className="text-white-50 align-middle">{`Price ${notification.sign} ${notification.price} SOL`}</td>
                        <td className="text-white-50 align-middle">{notification.sent_at || 'No'}</td>
                        <td className="text-white-50 align-middle"><button type="button" class="btn btn-outline-danger" onClick={() => handleDeleteNotification(notification.id)}>✕</button></td>
                      </tr>
                  )})}
                </tbody>
              </Table>
            )}
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
                  return (
                    <tr key={`${item.signature}${item.type}`}>
                      <td className="text-white-50 text-start align-middle">{item.collection}</td>
                      <td className="text-white-50 align-middle"><a className="link-secondary" href={`https://solscan.io/tx/${item.signature}`} target="_blank">{`${item.signature.slice(0, 5)} ... ${item.signature.slice(-3)}`}</a></td>
                      <td className="text-white-50 align-middle">{item.type}</td>
                      <td className="text-white-50 align-middle">{new Date(item.blockTime * 1000).toDateString()}</td>
                      <td className="text-white-50 align-middle">{`${item.price} SOL`}</td>
                      <td className="text-white-50 align-middle"><a className="link-secondary" href={`https://solscan.io/token/${item.tokenMint}`} target="_blank">{`${item.tokenMint.slice(0, 5)} ... ${item.tokenMint.slice(-3)}`}</a></td>
                    </tr>
                )}) : null}
              </tbody>
            </Table>
          </Tab>
          <Tab eventKey="settings" title="Settings">
            <form className="py-5" onSubmit={e => e.preventDefault()}>
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
                <div className="col-md-4 offset-md-4 d-flex justify-content-between">
                  <button type="button" className="btn btn-primary" onClick={() => handleEmail('connect')}>Save</button>
                  {isEmailSaved && (
                    <div className="text-success my-1">Saved!</div>
                  )}
                  <button type="button" className="btn btn-outline-danger" onClick={() => handleEmail('disconnect')}>Disconnect Email</button>
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