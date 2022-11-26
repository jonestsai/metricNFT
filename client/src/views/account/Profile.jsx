import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import imageLoader from '../../assets/loader.gif';
import solana from '../../assets/solana-symbol.png';
import { URLS } from '../../Settings';

export default function Profile() {
  const { publicKey } = useWallet();
  const [portfolio, setPortfolio] = useState();
  const [isPortfolioLoading, setIsPortfolioLoading] = useState();

  useEffect(() => {
    fetchPortfolio();
  }, [publicKey]);

  const fetchPortfolio = async () => {
    setIsPortfolioLoading(true);

    if (!publicKey) {
      return;
    }

    try {
      const response = await fetch(`${URLS.api}/hyperspace/get-wallet-stats/${publicKey.toString()}`);
      const stats = await response.json();

      setPortfolio(stats);
    } catch (error) {
      console.log(error);
    } finally {
      setIsPortfolioLoading(false);
    }
  }

  const displayName = `${publicKey?.toString().slice(0, 5)}...${publicKey?.toString().slice(-4)}`;
  const { portfolio_value, owned_nfts, volume_bought, max_purchase_item, max_purchase, volume_sold, max_sale_item, max_sale } = portfolio || {};
  const solanaSymbol = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;
  const portfolioValue = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(portfolio_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  const ownedNFTs = owned_nfts || 0;
  const totalSpend = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(volume_bought).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  const totalSales = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(volume_sold).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  const highestPurchaseItem = max_purchase_item?.name;
  const highestPurchaseAmount = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(max_purchase).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
  const highestSalesItem = max_sale_item?.name;
  const highestSalesAmount = <div className="text-nowrap d-flex align-items-center justify-content-center">{solanaSymbol}{Number(max_sale).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;

  return (
    <div>
      <div className="row py-4 d-flex align-items-center">
        <div className="col-2 col-md-1">
          <img className="rounded-circle img-fluid" height="50" src={imageLoader} />
        </div>
        <div className="col-10 col-md-11">
          <h2 className="text-start d-flex align-items-center">
            {displayName}
          </h2>
        </div>
      </div>
      <div className="row g-md-4 pb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card bg-gray text-center">
            <div className="card-header">Portfolio Value</div>
            <div className="card-body">
              {!isPortfolioLoading && (
                <h4 className="card-title">{portfolioValue}</h4>
              )}
              {isPortfolioLoading && (
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
              {!isPortfolioLoading && (
                <h4 className="card-title">{ownedNFTs}</h4>
              )}
              {isPortfolioLoading && (
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
              {!isPortfolioLoading && (
                <h4 className="card-title">{totalSpend}</h4>
              )}
              {isPortfolioLoading && (
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
              {!isPortfolioLoading && (
                <h4 className="card-title">{totalSales}</h4>
              )}
              {isPortfolioLoading && (
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
              {!isPortfolioLoading && (
                <h4 className="card-title">{highestPurchaseItem}<br/><span className="text-secondary">{highestPurchaseAmount}</span></h4>
              )}
              {isPortfolioLoading && (
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
              {!isPortfolioLoading && (
                <h4 className="card-title">{highestSalesItem}<br/><span className="text-secondary">{highestSalesAmount}</span></h4>
              )}
              {isPortfolioLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
