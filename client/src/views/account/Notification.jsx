import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { Dropdown, DropdownButton, Table } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { URLS } from '../../Settings';

export default function Notification({ notifications, email }) {
  const { publicKey } = useWallet();
  const [collections, setCollections] = useState();
  const [userNotifications, setUserNotifications] = useState(notifications);
  const [searchParams] = useSearchParams();
  const [collectionOption, setCollectionOption] = useState(searchParams.get('collection') || '');
  const [sign, setSign] = useState('>');
  const [price, setPrice] = useState();
  const [isNotificationSaved, setIsNotificationSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setUserNotifications(notifications);
  }, [notifications]);
  
  useEffect(() => {
    fetchCollections();
  }, [publicKey]);

  const fetchCollections = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${URLS.api}/magiceden/collections`);
      const collections = await response.json();

      setCollections(collections);
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

  return (
    <div>
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
                  <td className="text-white-50 align-middle"><button type="button" className="btn btn-outline-danger" onClick={() => handleDeleteNotification(notification.id)}>✕</button></td>
                </tr>
            )})}
          </tbody>
        </Table>
      )}
    </div>
  );
}
