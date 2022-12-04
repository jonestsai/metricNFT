import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import solana from '../assets/solana-symbol.png';
import { isCurrencyString, currencyToNumber } from '../utils/helpers';

export default function InfluencersTable(props) {
  const { influencers } = props;
  const { items, requestSort, sortConfig } = useSortableData(influencers);
  const getClassNamesFor = (name) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };
  const navigate = useNavigate();

  return (
    <table className="table table-dark table-hover freeze-second-column">
      <thead className="sortable">
        <tr className="table-secondary">
          <th scope="col" className="ps-3">#</th>
          <th scope="col"></th>
          <th scope="col" role="button"
            onClick={() => requestSort('twitter_display')}
            className={`text-start ${getClassNamesFor('twitter_display')}`}>Influencer</th>
          <th scope="col" role="button"
            onClick={() => requestSort('portfolio_value')}
            className={`text-end ${getClassNamesFor('portfolio_value')}`}>Portfolio Value</th>
          <th scope="col" role="button"
            onClick={() => requestSort('owned_nfts')}
            className={`text-end ${getClassNamesFor('owned_nfts')}`}>NFTs Owned</th>
          <th scope="col" role="button"
            onClick={() => requestSort('volume_bought')}
            className={`text-end ${getClassNamesFor('volume_bought')}`}>Total Spend</th>
          <th scope="col" role="button"
            onClick={() => requestSort('max_purchase')}
            className={`text-end pe-1 ${getClassNamesFor('max_purchase')}`}>Highest Purchase</th>
          <th scope="col" role="button"
            onClick={() => requestSort('volume_sold')}
            className={`text-end pe-1 ${getClassNamesFor('volume_sold')}`}>Total Sales</th>
          <th scope="col" role="button"
            onClick={() => requestSort('max_sale')}
            className={`text-end pe-4 ${getClassNamesFor('max_sale')}`}>Highest Sales</th>
        </tr>
      </thead>
      <tbody>
        {items?.map((item, index) => {
          const row = index + 1;
          const { twitter_username, twitter_display, image, portfolio_value, owned_nfts, volume_bought, max_purchase_item, max_purchase, volume_sold, max_sale_item, max_sale } = item;
          const handleRowClick = (twitter_username) => {
            navigate(twitter_username);
          }
          const solanaSymbol = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;
          const portfolioValue = <div className="text-nowrap d-flex align-items-center justify-content-end">{solanaSymbol}{Number(portfolio_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
          const totalSpend = <div className="text-nowrap d-flex align-items-center justify-content-end">{solanaSymbol}{Number(volume_bought).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
          const highestPurchaseItem = max_purchase_item?.name;
          const highestPurchaseAmount = <div className="text-nowrap d-flex align-items-center justify-content-end">{solanaSymbol}{Number(max_purchase).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
          const totalSales = <div className="text-nowrap d-flex align-items-center justify-content-end">{solanaSymbol}{Number(volume_sold).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
          const highestSalesItem = max_sale_item?.name;
          const highestSalesAmount = <div className="text-nowrap d-flex align-items-center justify-content-end">{solanaSymbol}{Number(max_sale).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;

          return (
          <tr key={item.twitter_username}>
            <td className="ps-3 text-white-50 align-middle">{row}</td>
            <td className="align-middle"><img className = "rounded-circle" height="40" width="40" src={image} role="button" onClick={()=> handleRowClick(twitter_username)} /></td>
            <td className="text-start align-middle"><u role="button" onClick={()=> handleRowClick(twitter_username)}>{twitter_display}</u></td>
            <td className="text-white-50 text-end align-middle">{portfolioValue}</td>
            <td className="text-white-50 text-end align-middle">{owned_nfts}</td>
            <td className="text-white-50 text-end align-middle">{totalSpend}</td>
            <td className="text-white-50 text-end align-middle">{highestPurchaseItem}<br/><span className="text-secondary">{highestPurchaseAmount}</span></td>
            <td className="text-white-50 text-end align-middle">{totalSales}</td>
            <td className="text-white-50 text-end pe-4 align-middle">{highestSalesItem}<br/><span className="text-secondary">{highestSalesAmount}</span></td>
           </tr>
         )})}
      </tbody>
    </table>
  );
};

const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = React.useState(config);

  const sortedItems = React.useMemo(() => {
    let sortableItems = items ? [...items] : null;
    if (sortConfig !== null) {
      sortableItems?.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];
        if (isCurrencyString(aKey)) {
          aKey = currencyToNumber(aKey);
        }
        if (isCurrencyString(bKey)) {
          bKey = currencyToNumber(bKey);
        }

        if (aKey < bKey) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        if (aKey > bKey) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
