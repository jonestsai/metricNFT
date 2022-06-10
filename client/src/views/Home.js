import 'bootstrap/dist/css/bootstrap.min.css';
import { getPythProgramKeyForCluster, PythHttpClient } from '@pythnetwork/client';
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import React from 'react';
import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import CollectionTable from '../components/CollectionTable';
import Pagination from '../components/Pagination';
import { LAMPORTS_PER_SOL, COLLECTIONS_PER_PAGE, MAGICEDEN_IMAGE_URL } from '../utils/constants';
import { URLS } from '../Settings';
import './Home.css';

const anchor = require('@project-serum/anchor');

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
      const anchorConnection = new anchor.web3.Connection(
        'https://solana-api.projectserum.com'
      );
      const pythPublicKey = getPythProgramKeyForCluster('mainnet-beta');
      const pythClient = new PythHttpClient(anchorConnection, pythPublicKey);
      const data = await pythClient.getData();
      const { productPrice } = data;
      const symbols = ['Crypto.SOL/USD', 'Crypto.BTC/USD', 'Crypto.ETH/USD', 'FX.EUR/USD', 'FX.USD/CAD'];
      const exchangeRates = symbols.reduce((rates, symbol) => ({
        ...rates,
        [symbol]: productPrice.get(symbol).price,
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
    const USD = exchangeRates['Crypto.SOL/USD'];
    const BTC = USD / exchangeRates['Crypto.BTC/USD'];
    const ETH = USD / exchangeRates['Crypto.ETH/USD'];
    const EUR = USD / exchangeRates['FX.EUR/USD'];
    const CAD = USD * exchangeRates['FX.USD/CAD'];
    let currencyRate = 1;

    switch (select) {
      case 'USD':
        currencyRate = USD;
        break;
      case 'BTC':
        currencyRate = BTC;
        break;
      case 'ETH':
        currencyRate = ETH;
        break;
      case 'EUR':
        currencyRate = EUR;
        break;
      case 'CAD':
        currencyRate = CAD;
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
    const filteredResult = collectionsByMC?.slice(
      (currentPage - 1) * COLLECTIONS_PER_PAGE,
      (currentPage - 1) * COLLECTIONS_PER_PAGE + COLLECTIONS_PER_PAGE
    );

    const data = filteredResult?.map((collection, index) => {
      const { image, name, symbol, floor_price, live_floor_price, _1dfloor, _7dfloor, _24hvolume, total_supply, unique_holders, listed_count, live_listed_count } = collection;
      const floorPrice = live_floor_price || floor_price;
      const floorPriceInSOL = floorPrice / LAMPORTS_PER_SOL;
      let currencySymbol = '';
      switch (currency) {
        case 'BTC':
          currencySymbol = '₿';
          break;
        case 'ETH':
          currencySymbol = 'Ξ';
          break;
        case 'USD':
          currencySymbol = '$';
          break;
        case 'CAD':
          currencySymbol = '$';
          break;
        case 'EUR':
          currencySymbol = '€';
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
              {exchangeRates['Crypto.SOL/USD'] && (
                <Dropdown.Item eventKey="USD" active={!!(currency == 'USD')}>USD</Dropdown.Item>
              )}
              {exchangeRates['FX.EUR/USD'] && (
                <Dropdown.Item eventKey="EUR" active={!!(currency == 'EUR')}>EUR</Dropdown.Item>
              )}
              {exchangeRates['FX.USD/CAD'] && (
                <Dropdown.Item eventKey="CAD" active={!!(currency == 'CAD')}>CAD</Dropdown.Item>
              )}
              {exchangeRates['Crypto.BTC/USD'] && (
                <Dropdown.Item eventKey="BTC" active={!!(currency == 'BTC')}>BTC</Dropdown.Item>
              )}
              {exchangeRates['Crypto.ETH/USD'] && (
                <Dropdown.Item eventKey="ETH" active={!!(currency == 'ETH')}>ETH</Dropdown.Item>
              )}
            </div>
          )}
        </DropdownButton>
        <div className="table-responsive-sm">
          <CollectionTable
            collections={data}
          />
          <div className="pt-3">
            <Pagination
              total={collections?.length}
              itemsPerPage={COLLECTIONS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={(page) => this.setCurrentPage(page)}
            />
          </div>
          {isLoading && (
            <div className="my-5 text-center">
              <div className="spinner-border text-light" role="status" />
            </div>
          )}
        </div>
      </Container>
    )
  };
};
