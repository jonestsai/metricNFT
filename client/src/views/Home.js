import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Container, Dropdown, DropdownButton, Nav } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import CollectionTable from '../components/CollectionTable';
import Pagination from '../components/Pagination';
import { LAMPORTS_PER_SOL, COLLECTIONS_PER_PAGE, MAGICEDEN_IMAGE_URL } from '../utils/constants';
import './Home.css';

export default function Home(props) {
  const location = useLocation();

  const [exchangeRates, setExchangeRates] = useState();
  const [chainFilter, setChainFilter] = useState(localStorage.getItem('chainFilter') || 'solana');
  const [currency, setCurrency] = useState('Currency');
  const [isRatesLoading, setIsRatesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    localStorage.setItem('chainFilter', chainFilter);
  }, [chainFilter]);

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

  const handleChainChange = (event) => {
    setChainFilter(event.target.value);
  }

  const handleCurrencySelect = (select) => {
    setCurrency(select);
  }

  const { magicedenCollections, openseaCollections, isLoading, partner } = props;

  const updatedMagicedenCollections = magicedenCollections?.map((magicedenCollection) => {
    const { name, symbol, image, floor_price, live_floor_price, one_day_volume, one_day_price_change, live_one_day_price_change, seven_day_price_change, live_seven_day_price_change, total_supply, unique_holders, listed_count, live_listed_count } = magicedenCollection;
    const chain = 'solana';
    const floorPrice = (live_floor_price || floor_price) / LAMPORTS_PER_SOL * exchangeRates?.['solana/usd'];
    const oneDayPriceChange = live_one_day_price_change || one_day_price_change;
    const sevenDayPriceChange = live_seven_day_price_change || seven_day_price_change;
    const oneDayVolume = one_day_volume / LAMPORTS_PER_SOL * exchangeRates?.['solana/usd'] || 0;
    const maxSupply = total_supply;
    const uniqueHolders = unique_holders;
    const listedCount = live_listed_count || listed_count;
    const floorMarketCap = floorPrice * maxSupply;

    return {
      chain,
      name,
      image,
      symbol,
      floorPrice,
      oneDayPriceChange,
      sevenDayPriceChange,
      oneDayVolume,
      maxSupply,
      uniqueHolders,
      listedCount,
      floorMarketCap,
    };
  });

  const updatedOpenseaCollections = openseaCollections?.map((openseaCollection) => {
    const { name, slug, image_url, floor_price, one_day_average_price, one_day_volume, one_day_price_change, seven_day_price_change, total_supply, num_owners, listed_count } = openseaCollection;
    const chain = 'ethereum';
    const image = image_url;
    const symbol = slug;
    const floorPrice = floor_price * exchangeRates?.['ethereum/usd'];
    const oneDayPriceChange = one_day_price_change;
    const sevenDayPriceChange = seven_day_price_change;
    const oneDayVolume = one_day_volume * exchangeRates?.['ethereum/usd'];
    const maxSupply = total_supply;
    const uniqueHolders = num_owners;
    const listedCount = listed_count;
    const floorMarketCap = floorPrice * maxSupply;

    return {
      chain,
      name,
      image,
      symbol,
      floorPrice,
      oneDayPriceChange,
      sevenDayPriceChange,
      oneDayVolume,
      maxSupply,
      uniqueHolders,
      listedCount,
      floorMarketCap,
    };
  });

  const collections = updatedMagicedenCollections?.concat(updatedOpenseaCollections);

  const collectionsByMC = collections?.sort((a, b) => {
    return b.floorMarketCap - a.floorMarketCap;
  });

  const filteredResult = collectionsByMC?.filter((collection) => {
    const isChain = chainFilter === collection?.chain || chainFilter === 'all';

    return isChain && collection?.floorPrice && collection?.maxSupply && collection?.uniqueHolders > 50 && collection?.listedCount > 10;
  });

  const data = filteredResult?.map((collection, index) => {
    const { chain, name, image, symbol, floorPrice, oneDayPriceChange, sevenDayPriceChange, oneDayVolume, maxSupply, uniqueHolders, listedCount, floorMarketCap } = collection;
    const oneDayPriceChangePct = oneDayPriceChange ? oneDayPriceChange * 100 : 0;
    const sevenDayPriceChangePct = sevenDayPriceChange ? sevenDayPriceChange * 100 : 0;

    return (
      {
        id: collection.symbol,
        row: index + 1,
        chain,
        image: `${MAGICEDEN_IMAGE_URL}${image}`,
        name,
        symbol,
        floorPrice,
        oneDayPriceChangePct,
        sevenDayPriceChangePct,
        oneDayVolume,
        floorMarketCap,
        maxSupply,
        holders: uniqueHolders,
        listedCount,          
      }
    );
  });

  return (
    <div>
      <Nav className={`${partner ? 'd-none' : ''} secondary-menu px-4 border-bottom border-secondary`} variant="tabs" activeKey={location.pathname}>
        <Nav.Item>
          <Nav.Link className="d-flex" href="/watchlist"><FaStar className="me-2" size={20} style={{ height: 25 }} role="button" color="#fc6" />Watchlist</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/">Collections</Nav.Link>
        </Nav.Item>
      </Nav>
      <Container fluid>
        <h3 className="text-start pt-4 pb-2">NFT Prices by Floor Market Cap</h3>
        <div className="d-flex justify-content-between">
          <div className="btn-group mb-3" role="group">
            <input type="radio" className="btn-check" name="chainfilter" id="all" value="all" autoComplete="off" checked={!!(chainFilter === 'all')} onChange={handleChainChange} />
            <label className="btn btn-outline-secondary" htmlFor="all">All</label>
            <input type="radio" className="btn-check" name="chainfilter" id="solana" value="solana" autoComplete="off" checked={!!(chainFilter === 'solana')} onChange={handleChainChange} />
            <label className="btn btn-outline-secondary" htmlFor="solana">Solana</label>
            <input type="radio" className="btn-check" name="chainfilter" id="ethereum" value="ethereum" autoComplete="off" checked={!!(chainFilter === 'ethereum')} onChange={handleChainChange} />
            <label className="btn btn-outline-secondary" htmlFor="ethereum">Ethereum</label>
          </div>
          <DropdownButton
            variant="secondary"
            menuVariant="dark"
            title={currency}
            className="text-end mb-3"
            onSelect={handleCurrencySelect}
          >
            <Dropdown.Item eventKey="Currency" active={!!(currency === 'Currency')}>Currency</Dropdown.Item>
            {!isRatesLoading && (
              <div>
                <Dropdown.Item eventKey="SOL" active={!!(currency === 'SOL')}>SOL</Dropdown.Item>
                <Dropdown.Item eventKey="ETH" active={!!(currency === 'ETH')}>ETH</Dropdown.Item>
                <Dropdown.Item eventKey="USD" active={!!(currency === 'USD')}>USD</Dropdown.Item>
              </div>
            )}
          </DropdownButton>
        </div>
        <div className="table-responsive-sm">
          <CollectionTable
            collections={data}
            exchangeRates={exchangeRates}
            currency={currency}
            currentPage={currentPage}
            partner={partner}
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
    </div>
  )
};
