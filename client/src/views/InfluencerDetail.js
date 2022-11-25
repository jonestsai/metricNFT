import { useState, useEffect } from 'react';
import { Container, Table, Tab, Tabs } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { URLS } from '../Settings';
import imageLoader from '../assets/loader.gif';
import solana from '../assets/solana-symbol.png';
import './InfluencerDetail.css';

export default function InfluencerDetail(props) {
  const { username } = useParams();
  const [influencer, setInfluencer] = useState();
  const [isInfluencerLoading, setIsInfluencerLoading] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [isWalletLoading, setIsWalletLoading] = useState(true);

  useEffect(() => {
    fetchInfluencer();
  }, [username]);

  useEffect(() => {
    fetchViewableWallets();
  }, [influencer]);

  const fetchInfluencer = async () => {
    try {
      const response = await fetch(`${URLS.api}/influencers/${username}`);
      const influencer = await response.json();

      setInfluencer(influencer);
    } catch (error) {
      // Do nothing
    } finally {
      setIsInfluencerLoading(false);
    }
  };

  const fetchViewableWallets = async () => {
    if (!influencer) {
      return;
    }

    setIsWalletLoading(true);
    const { viewableWallets } = influencer;
    const addresses = viewableWallets.map((wallet) => wallet.address);
    for (const address of addresses) {
      const walletTokens = await fetchViewableWalletTokens(address);
      setTokens(prevState => [...prevState, ...walletTokens]);
    }
    setIsWalletLoading(false);
  }

  const fetchViewableWalletTokens = async (address) => {
    try {
      const response = await fetch(`${URLS.api}/magiceden/wallets/${address}/tokens?offset=0&limit=100&listStatus=both`);
      const tokens = await response.json();

      return tokens;
    } catch (error) {
      console.log(error);
    }
  }

  const { twitter_username, twitter_display, image, portfolio_value, owned_nfts, volume_bought, max_purchase_item, max_purchase, volume_sold, max_sale_item, max_sale } = influencer || {};
  const solanaSymbol = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;
  const portfolioValue = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(portfolio_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  const ownedNFTs = owned_nfts || 0;
  const totalSpend = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(volume_bought).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  const highestPurchaseItem = max_purchase_item?.name;
  const highestPurchaseAmount = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(max_purchase).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  const totalSales = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(volume_sold).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  const highestSalesItem = max_sale_item?.name;
  const highestSalesAmount = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(max_sale).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  
  const items = tokens?.length > 0
    ? tokens.map((token) => {
      return (
        <div key={token.mintAddress} className="col">
          <div className="card text-white bg-dark">
            <img src={token.image} className="card-img-top" />
            <div className="card-body">
              <h5 className="card-title">{token.name}</h5>
            </div>
          </div>
        </div>
      )
    }) : null;

  const sortedActivities = influencer?.activities?.sort((a, b) => b.blockTime - a.blockTime);
  const updatedActivities = sortedActivities?.map((activity) => {
    switch(activity.type) {
      case 'list':
        activity.type = 'Listing';
        break;
      case 'delist':
        activity.type = 'Delisting';
        break;
      case 'bid':
        activity.type = 'Offer Made';
        break;
      case 'cancelBid':
        activity.type = 'Offer Canceled';
        break;
      case 'buyNow':
        const { wallets } = influencer;
        const addresses = wallets.map((wallet) => wallet.address);
        if (addresses.includes(activity.buyer)) {
          activity.type = 'Purchase';
        }
        if (addresses.includes(activity.seller)) {
          activity.type = 'Sale';
        }
        break;
    }
  });
  
  return (
    <Container fluid>
      <div className="row py-4 d-flex align-items-center">
        <div className="col-2 col-md-1">
          {!isInfluencerLoading && (
            <img className="rounded-circle img-fluid" height="50" src={image} />
          )}
          {isInfluencerLoading && (
            <img className="rounded-circle img-fluid" height="50" src={imageLoader} />
          )}
        </div>
        <div className="col-10 col-md-11">
          <h2 className="text-start d-flex align-items-center">
            {twitter_display}
          </h2>
        </div>
      </div>
      <div className="row g-md-4 pb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card bg-gray text-center">
            <div className="card-header">Portfolio Value</div>
            <div className="card-body">
              {!isInfluencerLoading && (
                <h4 className="card-title">{portfolioValue}</h4>
              )}
              {isInfluencerLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card bg-gray text-center">
            <div className="card-header">NFTs Owned</div>
            <div className="card-body">
              {!isInfluencerLoading && (
                <h4 className="card-title">{ownedNFTs}</h4>
              )}
              {isInfluencerLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card bg-gray text-center">
            <div className="card-header">Total Spend</div>
            <div className="card-body">
              {!isInfluencerLoading && (
                <h4 className="card-title">{totalSpend}</h4>
              )}
              {isInfluencerLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card bg-gray text-center">
            <div className="card-header">Total Sales</div>
            <div className="card-body">
              {!isInfluencerLoading && (
                <h4 className="card-title">{totalSales}</h4>
              )}
              {isInfluencerLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card bg-gray text-center">
            <div className="card-header">Highest Purchase</div>
            <div className="card-body">
              {!isInfluencerLoading && (
                <h4 className="card-title">{highestPurchaseItem}<br/><span className="text-secondary">{highestPurchaseAmount}</span></h4>
              )}
              {isInfluencerLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card bg-gray text-center">
            <div className="card-header">Highest Sales</div>
            <div className="card-body">
              {!isInfluencerLoading && (
                <h4 className="card-title">{highestSalesItem}<br/><span className="text-secondary">{highestSalesAmount}</span></h4>
              )}
              {isInfluencerLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
      </div>
      {isWalletLoading && (
        <div className="my-5 text-center">
          <div className="spinner-border text-light" role="status" />
        </div>
      )}
      {!isWalletLoading && (
      <Tabs
        justify
        defaultActiveKey="owned"
        className="influencer-detail mt-4 mb-5"
      >
        <Tab className="mx-3" eventKey="owned" title="Owned">
          <div className="row row-cols-3 row-cols-md-6 g-4">
            {items}
          </div>
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
              {sortedActivities?.length > 0 ? sortedActivities?.map((activity) => {
                const blockTime = new Date(activity.blocktime * 1000);
                return (
                  <tr key={`${activity.signature}${activity.type}`}>
                    <td className="text-white-50 text-start align-middle">{activity.collection}</td>
                    <td className="text-white-50 align-middle"><a className="link-secondary" href={`https://solscan.io/tx/${activity?.signature}`} target="_blank">{`${activity?.signature?.slice(0, 5)} ... ${activity?.signature?.slice(-3)}`}</a></td>
                    <td className="text-white-50 align-middle">{activity.type}</td>
                    <td className="text-white-50 align-middle">{blockTime.toLocaleString()}</td>
                    <td className="text-white-50 align-middle">{`${activity.price} SOL`}</td>
                    <td className="text-white-50 align-middle"><a className="link-secondary" href={`https://solscan.io/token/${activity?.token_mint}`} target="_blank">{`${activity?.token_mint?.slice(0, 5)} ... ${activity?.token_mint?.slice(-3)}`}</a></td>
                  </tr>
              )}) : null}
            </tbody>
          </Table>
        </Tab>
      </Tabs>
      )}
    </Container>
  );
}
