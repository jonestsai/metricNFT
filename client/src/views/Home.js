import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Container, Dropdown, DropdownButton, Nav } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import CollectionTable from '../components/CollectionTable';
import Pagination from '../components/Pagination';
import { LAMPORTS_PER_SOL, COLLECTIONS_PER_PAGE, MAGICEDEN_IMAGE_URL } from '../utils/constants';
import solana from '../assets/solana-symbol.png';
import ethereum from '../assets/ethereum-symbol.png';
import './Home.css';

export default function Home(props) {
  const location = useLocation();

  const [exchangeRates, setExchangeRates] = useState();
  const [chainFilter, setChainFilter] = useState('all');
  const [currency, setCurrency] = useState('Currency');
  const [isRatesLoading, setIsRatesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
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
    const floorPrice = (live_floor_price || floor_price) / LAMPORTS_PER_SOL;
    const oneDayPriceChange = live_one_day_price_change || one_day_price_change;
    const sevenDayPriceChange = live_seven_day_price_change || seven_day_price_change;
    const oneDayVolume = one_day_volume / LAMPORTS_PER_SOL || 0;
    const maxSupply = total_supply;
    const uniqueHolders = unique_holders;
    const listedCount = live_listed_count || listed_count;
    const floorMarketCap = floorPrice * maxSupply * exchangeRates?.['solana/usd'];

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
    const { name, slug, image_url, floor_price, one_day_average_price, one_day_volume, total_supply, num_owners, listed_count } = openseaCollection;
    const chain = 'ethereum';
    const image = image_url;
    const symbol = slug;
    const floorPrice = floor_price || one_day_average_price;
    const oneDayVolume = one_day_volume;
    const maxSupply = total_supply;
    const uniqueHolders = num_owners;
    const listedCount = listed_count;
    const floorMarketCap = floorPrice * maxSupply * exchangeRates?.['ethereum/usd'];

    return {
      chain,
      name,
      image,
      symbol,
      floorPrice,
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
    if (collection?.symbol === 'cryptopunks') {
      return true;
    }

    return collection?.floorPrice && collection?.maxSupply && collection?.uniqueHolders > 50 && collection?.listedCount > 10;
  });

  const paginatedResult = filteredResult?.slice(
    (currentPage - 1) * COLLECTIONS_PER_PAGE,
    (currentPage - 1) * COLLECTIONS_PER_PAGE + COLLECTIONS_PER_PAGE
  );

  const data = paginatedResult?.map((collection, index) => {
    const { chain, name, image, symbol, floorPrice, oneDayPriceChange, sevenDayPriceChange, oneDayVolume, maxSupply, uniqueHolders, listedCount, floorMarketCap } = collection;
    let currencySymbol;
    let currencyRate = 1;
    let marketCapCurrencyRate = 1;
    switch (currency) {
      case 'SOL':
        currencySymbol = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;

        if (chain === 'solana') {
          currencyRate = 1;
        }

        if (chain === 'ethereum') {
          currencyRate = exchangeRates?.['ethereum/usd'] / exchangeRates?.['solana/usd'];
        }
        
        marketCapCurrencyRate = 1 / exchangeRates?.['solana/usd'];

        break;
      case 'ETH':
        currencySymbol = <img className="pe-1" src={ethereum} alt="ethereum-logo" height="14" />;

        if (chain === 'solana') {
          currencyRate = exchangeRates?.['solana/usd'] / exchangeRates?.['ethereum/usd'];
        }

        if (chain === 'ethereum') {
          currencyRate = 1;
        }

        marketCapCurrencyRate = 1 / exchangeRates?.['ethereum/usd'];

        break;
      case 'USD':
        currencySymbol = '$';

        if (chain === 'solana') {
          currencyRate = exchangeRates?.['solana/usd'];
        }

        if (chain === 'ethereum') {
          currencyRate = exchangeRates?.['ethereum/usd'];
        }

        marketCapCurrencyRate = 1;

        break;
      default:
        if (chain === 'solana') {
          currencySymbol = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;
        }

        if (chain === 'ethereum') {
          currencySymbol = <img className="pe-1" src={ethereum} alt="ethereum-logo" height="14" />;
        }
    }

    const floorPriceText = <div className="text-nowrap d-flex align-items-center justify-content-end">{currencySymbol}{(floorPrice * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
    const oneDayPriceChangePct = oneDayPriceChange ? oneDayPriceChange * 100 : 0;
    const sevenDayPriceChangePct = sevenDayPriceChange ? sevenDayPriceChange * 100 : 0;
    const volume = <span className="text-nowrap d-flex align-items-center justify-content-end">{currencySymbol}{(oneDayVolume * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</span>;
    const marketCapCurrencySymbol = currency === 'Currency' ? '$' : currencySymbol;
    const floorMarketCapText = <span className="text-nowrap d-flex align-items-center justify-content-end">{marketCapCurrencySymbol}{(floorMarketCap * marketCapCurrencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</span>;

    return (
      {
        id: collection.symbol,
        row: (currentPage - 1) * COLLECTIONS_PER_PAGE + index + 1,
        image: `${MAGICEDEN_IMAGE_URL}${image}`,
        name,
        symbol,
        floorPrice: floorPriceText,
        oneDayPriceChangePct,
        sevenDayPriceChangePct,
        volume,
        floorMarketCap: floorMarketCapText,
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
