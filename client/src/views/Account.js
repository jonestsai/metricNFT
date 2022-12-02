import 'bootstrap/dist/css/bootstrap.min.css';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { useState, useEffect } from 'react';
import { Container, Tab, Tabs } from 'react-bootstrap';
import { FaChevronRight, FaRegAddressCard, FaRegBell } from 'react-icons/fa';
import { FiActivity, FiSettings } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import Activities from './account/Activities';
import Notifications from './account/Notifications';
import Profile from './account/Profile';
import Settings from './account/Settings';
import imageLoader from '../assets/loader.gif';
import { URLS } from '../Settings';
import './Account.css';

export default function Account() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();

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

  const handleProfileClick = () => {
    navigate('profile');
  }

  const handleWalletsClick = () => {
    navigate('wallets');
  }

  const handleNotificationsClick = () => {
    navigate('notifications');
  }

  const handleActivitiesClick = () => {
    navigate('activities');
  }

  const handleSettingsClick = () => {
    navigate('settings');
  }

  const displayName = `${publicKey?.toString().slice(0, 5)}...${publicKey?.toString().slice(-4)}`;

  return (
    <Container fluid>
      {!publicKey && (
        <h5 className="py-5 text-center">Connect wallet to see your profile page.</h5>
      )}
      {publicKey && (
        <div>
          <div className="d-block d-sm-none px-3">
            <h1 className="pt-5 pb-4">Account</h1>
            <div className="row pt-4 pb-1 align-items-center" role="button" onClick={()=> handleProfileClick()}>
              <div className="col-3">
                <img className="rounded-circle img-fluid" src={imageLoader} />
              </div>
              <div className="col-7">
                <div className="h5 mb-0">{displayName}</div>
                <div className="text-muted">Show Profile</div>
              </div>
              <div className="col-2 text-end">
                <FaChevronRight size={20} />
              </div>
            </div>
            <hr />
            <div className="row py-4 align-items-center" role="button" onClick={()=> handleWalletsClick()}>
              <div className="col-2 text-start">
                <FaRegAddressCard size={25} />
              </div>
              <div className="col-8 fs-5">Wallets</div>
              <div className="col-2 text-end">
                <FaChevronRight size={20} />
              </div>
            </div>
            <div className="row py-4 align-items-center" role="button" onClick={()=> handleNotificationsClick()}>
              <div className="col-2 text-start">
                <FaRegBell size={25} />
              </div>
              <div className="col-8 fs-5">Notifications</div>
              <div className="col-2 text-end">
                <FaChevronRight size={20} />
              </div>
            </div>
            <div className="row py-4 align-items-center" role="button" onClick={()=> handleActivitiesClick()}>
              <div className="col-2 text-start">
                <FiActivity size={25} />
              </div>
              <div className="col-8 fs-5">Wallet Activities</div>
              <div className="col-2 text-end">
                <FaChevronRight size={20} />
              </div>
            </div>
            <div className="row py-4 align-items-center" role="button" onClick={()=> handleSettingsClick()}>
              <div className="col-2 text-start">
                <FiSettings size={25} />
              </div>
              <div className="col-8 fs-5">Settings</div>
              <div className="col-2 text-end">
                <FaChevronRight size={20} />
              </div>
            </div>
          </div>
          <div className="d-none d-sm-block">
            <Profile />
            <Tabs
              fill
              activeKey={key}
              onSelect={(k) => setKey(k)}
              className="account my-5"
            >
              <Tab eventKey="notifications" title="Notifications">
                <Notifications notifications={userNotifications} email={email} />
              </Tab>
              <Tab eventKey="activities" title="Activities">
                <Activities publicKey={publicKey} />
              </Tab>
              <Tab eventKey="settings" title="Settings">
                <Settings publicKey={publicKey} email={email} setEmail={setEmail} />
              </Tab>
            </Tabs>
          </div>
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