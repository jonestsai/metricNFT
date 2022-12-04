import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { URLS } from '../../Settings';

export default function Activities() {
  const { publicKey } = useWallet();
  const [activities, setActivities] = useState();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [publicKey]);
  
  const fetchActivities = async () => {
    if (!publicKey) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${URLS.api}/magiceden/wallets/${publicKey.toString()}/activities?offset=0&limit=100`);
      const activities = await response.json();

      setActivities(activities);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container-fluid px-sm-0">
      <div className="table-responsive">
        <table className="table table-dark table-hover">
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
            {activities?.length > 0 ? activities?.map((activity) => {
              const blockTime = new Date(activity.blockTime * 1000);
              return (
                <tr key={`${activity.signature}${activity.type}`}>
                  <td className="text-white-50 text-start align-middle">{activity.collection}</td>
                  <td className="text-white-50 align-middle"><a className="link-secondary" href={`https://solscan.io/tx/${activity.signature}`} target="_blank">{`${activity.signature.slice(0, 5)} ... ${activity.signature.slice(-3)}`}</a></td>
                  <td className="text-white-50 align-middle">{activity.type}</td>
                  <td className="text-white-50 align-middle">{blockTime.toLocaleString()}</td>
                  <td className="text-white-50 align-middle">{`${activity.price} SOL`}</td>
                  <td className="text-white-50 align-middle"><a className="link-secondary" href={`https://solscan.io/token/${activity.tokenMint}`} target="_blank">{`${activity.tokenMint.slice(0, 5)} ... ${activity.tokenMint.slice(-3)}`}</a></td>
                </tr>
            )}) : null}
          </tbody>
        </table>
      </div>
      {(publicKey && isLoading) && (
        <div className="my-5 text-center">
          <div className="spinner-border text-light" role="status" />
        </div>
      )}
    </div>
  );
}
