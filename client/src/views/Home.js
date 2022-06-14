import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import CollectionTable from '../components/CollectionTable';
import Pagination from '../components/Pagination';
import { LAMPORTS_PER_SOL, COLLECTIONS_PER_PAGE, MAGICEDEN_IMAGE_URL } from '../utils/constants';
import { URLS } from '../Settings';
import './Home.css';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      exchangeRates: '',
      currency: 'SOL',
      currencyRate: 1,
      isRatesLoading: true,
      currentPage: 1,
    };
  }

  async componentDidMount() {
    document.title = 'MetricNFT';
    await this.fetchCurrencies();
  }

  fetchCurrencies = async () => {
    if (!this.state.isRatesLoading) {
      this.setState({ isRatesLoading: true });
    }

    try {
      const ids = ['solana', 'ethereum'];
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.toString()}&vs_currencies=usd`);
      const currencies = await response.json();
      const exchangeRates = ids.reduce((rates, id) => ({
        ...rates,
        [`${id}/usd`]: currencies[id]?.usd,
      }), {});

      this.setState({
        exchangeRates,
      });
    } catch (error) {
      // Do nothing
    } finally {
      this.setState({ isRatesLoading: false });
    }
  }

  handleCurrencySelect = select => {
    const { exchangeRates } = this.state;
    const USD = exchangeRates['solana/usd'];
    const ETH = USD / exchangeRates['ethereum/usd'];
    let currencyRate = 1;

    switch (select) {
      case 'USD':
        currencyRate = USD;
        break;
      case 'ETH':
        currencyRate = ETH;
        break;
    }

    this.setState({ currencyRate, currency: select });
  }

  setCurrentPage = (page) => {
    this.setState({ currentPage: page });
  }

  render() {
    const { collections, isLoading } = this.props;
    const { exchangeRates, currency, currencyRate, isRatesLoading, currentPage } = this.state;
    const collectionsByMC = collections?.sort((a, b) => {
      return (b.floor_price * b.total_supply) - (a.floor_price * a.total_supply);
    });
    const filteredResult = collectionsByMC?.filter((collection) => {
      return collection.floor_price && collection.total_supply && collection.unique_holders > 50;
    });
    const paginatedResult = filteredResult?.slice(
      (currentPage - 1) * COLLECTIONS_PER_PAGE,
      (currentPage - 1) * COLLECTIONS_PER_PAGE + COLLECTIONS_PER_PAGE
    );

    const data = paginatedResult?.map((collection, index) => {
      const { image, name, symbol, floor_price, live_floor_price, _1dfloor, _7dfloor, _24hvolume, total_supply, unique_holders, listed_count, live_listed_count } = collection;
      const floorPrice = live_floor_price || floor_price;
      const floorPriceInSOL = floorPrice / LAMPORTS_PER_SOL;
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
      const _24hChange = _1dfloor ? (floorPrice - _1dfloor) / _1dfloor * 100 : 0;
      const _7dChange = _7dfloor ? (floorPrice - _7dfloor) / _7dfloor * 100 : 0;
      const volume = `${currencySymbol}${((_24hvolume / LAMPORTS_PER_SOL || 0) * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;
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
          _24hChange,
          _7dChange,
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
          onSelect={this.handleCurrencySelect}
        >
          <Dropdown.Item eventKey="SOL" active={!!(currency == 'SOL')}>SOL</Dropdown.Item>
          {!isRatesLoading && (
            <div>
              {exchangeRates['solana/usd'] && (
                <Dropdown.Item eventKey="USD" active={!!(currency == 'USD')}>USD</Dropdown.Item>
              )}
              {exchangeRates['ethereum/usd'] && (
                <Dropdown.Item eventKey="ETH" active={!!(currency == 'ETH')}>ETH</Dropdown.Item>
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
            onPageChange={(page) => this.setCurrentPage(page)}
          />
        </div>
      </Container>
    )
  };
};
