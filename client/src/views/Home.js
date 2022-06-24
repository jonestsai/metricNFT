import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import CollectionTable from '../components/CollectionTable';
import Pagination from '../components/Pagination';
import { LAMPORTS_PER_SOL, COLLECTIONS_PER_PAGE, MAGICEDEN_IMAGE_URL } from '../utils/constants';
import './Home.css';

export default function Home(props) {
  const [exchangeRates, setExchangeRates] = useState();
  const [currency, setCurrency] = useState('SOL');
  const [currencyRate, setCurrencyRate] = useState(1);
  const [isRatesLoading, setIsRatesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    document.title = 'MetricNFT';
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setIsRatesLoading(true);

    try {
      const ids = ['solana', 'ethereum'];
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.toString()}&vs_currencies=usd`);
      const currencies = await response.json();
      const rates = ids.reduce((rate, id) => ({
        ...rate,
        [`${id}/usd`]: currencies[id]?.usd,
      }), {});

      setExchangeRates(rates);
    } catch (error) {
      // Do nothing
    } finally {
      setIsRatesLoading(false);
    }
  }

  const handleCurrencySelect = (select) => {
    const USD = exchangeRates['solana/usd'];
    const ETH = USD / exchangeRates['ethereum/usd'];
    let rate = 1;

    switch (select) {
      case 'USD':
        rate = USD;
        break;
      case 'ETH':
        rate = ETH;
        break;
    }

    setCurrencyRate(rate);
    setCurrency(select);
  }

  const { collections, isLoading } = props;
  const collectionsByMC = collections?.sort((a, b) => {
    return (b.floor_price * b.total_supply) - (a.floor_price * a.total_supply);
  });
  const filteredResult = collectionsByMC?.filter((collection) => {
    return collection.floor_price && collection.total_supply && collection.unique_holders > 50 && collection.listed_count > 10;
  });
  const paginatedResult = filteredResult?.slice(
    (currentPage - 1) * COLLECTIONS_PER_PAGE,
    (currentPage - 1) * COLLECTIONS_PER_PAGE + COLLECTIONS_PER_PAGE
  );

  const data = paginatedResult?.map((collection, index) => {
    const { image, name, symbol, floor_price, live_floor_price, one_day_volume, one_day_price_change, live_one_day_price_change, seven_day_price_change, live_seven_day_price_change, total_supply, unique_holders, listed_count, live_listed_count } = collection;
    const floorPrice = live_floor_price || floor_price;
    const floorPriceInSOL = floorPrice / LAMPORTS_PER_SOL;
    const oneDayPriceChange = live_one_day_price_change || one_day_price_change;
    const sevenDayPriceChange = live_seven_day_price_change || seven_day_price_change;
    let currencySymbol = '';
    switch (currency) {
      case 'ETH':
        currencySymbol = 'Ξ';
        break;
      case 'USD':
        currencySymbol = '$';
        break;
    }

    const floorPriceText = `${currencySymbol}${(floorPriceInSOL * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;
    const oneDayPriceChangePct = oneDayPriceChange ? oneDayPriceChange * 100 : 0;
    const sevenDayPriceChangePct = sevenDayPriceChange ? sevenDayPriceChange * 100 : 0;
    const volume = `${currencySymbol}${((one_day_volume / LAMPORTS_PER_SOL || 0) * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;
    const maxSupply = total_supply;
    const floorMarketCap = `${currencySymbol}${(floorPriceInSOL * maxSupply * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;
    const listedCount = live_listed_count || listed_count;

    return (
      {
        id: collection.id,
        row: (currentPage - 1) * COLLECTIONS_PER_PAGE + index + 1,
        image: `${MAGICEDEN_IMAGE_URL}${image}`,
        name,
        symbol,
        floorPrice: floorPriceText,
        oneDayPriceChangePct,
        sevenDayPriceChangePct,
        volume,
        floorMarketCap,
        maxSupply,
        holders: unique_holders,
        listedCount,          
      }
    );
  });

  return (
    <Container fluid>
      <h3 className="text-start pt-5">NFT Prices by Floor Market Cap</h3>
      <DropdownButton
        variant="secondary"
        menuVariant="dark"
        title={currency}
        className="text-end mb-3"
        onSelect={handleCurrencySelect}
      >
        <Dropdown.Item eventKey="SOL" active={!!(currency === 'SOL')}>SOL</Dropdown.Item>
        {!isRatesLoading && (
          <div>
            {exchangeRates['solana/usd'] && (
              <Dropdown.Item eventKey="USD" active={!!(currency === 'USD')}>USD</Dropdown.Item>
            )}
            {exchangeRates['ethereum/usd'] && (
              <Dropdown.Item eventKey="ETH" active={!!(currency === 'ETH')}>ETH</Dropdown.Item>
            )}
          </div>
        )}
      </DropdownButton>
      <div className="table-responsive-sm">
        <CollectionTable
          collections={data}
        />
        {isLoading && (
          <div className="my-5 text-center">
            <div className="spinner-border text-light" role="status" />
          </div>
        )}
      </div>
      <div className="pt-3">
        <Pagination
          total={collections?.length}
          itemsPerPage={COLLECTIONS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </Container>
  )
};
