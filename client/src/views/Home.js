import 'bootstrap/dist/css/bootstrap.min.css';
import { getPythProgramKeyForCluster, PythHttpClient } from '@pythnetwork/client';
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import React from 'react';
import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import CollectionTable from '../components/CollectionTable';
import { LAMPORTS_PER_SOL } from '../utils/constants';
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

  render() {
    const { collections, isLoading } = this.props;
    const { exchangeRates, currency, currencyRate, isRatesLoading } = this.state;
    const collectionsByMC = collections?.sort((a, b) => {
      const aMaxSupply = a.collection_max_supply || a.howrare_max_supply;
      const bMaxSupply = b.collection_max_supply || b.howrare_max_supply;
      return (b.floor_price * bMaxSupply) - (a.floor_price * aMaxSupply);
    });

    const data = collectionsByMC?.map((collection, index) => {
      const { howrare_image, collection_image, name, symbol, floor_price, _1dfloor, _7dfloor, _24hvolume, howrare_max_supply, collection_max_supply, howrare_holders, holders, listed_count } = collection;
      const floorPriceInSOL = floor_price / LAMPORTS_PER_SOL;
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

      const floorPrice = `${currencySymbol}${(floorPriceInSOL * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;
      const _24hChange = _1dfloor ? (floor_price - _1dfloor) / _1dfloor * 100 : 0;
      const _7dChange = _7dfloor ? (floor_price - _7dfloor) / _7dfloor * 100 : 0;
      const volume = `${currencySymbol}${((_24hvolume / LAMPORTS_PER_SOL || 0) * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;
      const maxSupply = collection_max_supply || howrare_max_supply;
      const floorMarketCap = `${currencySymbol}${(floorPriceInSOL * maxSupply * currencyRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`;

      return (
        {
          id: collection.id,
          row: index + 1,
          image: howrare_image ? `https://howrare.is${howrare_image}` : require(`../assets/${collection_image}`),
          name,
          symbol,
          floorPrice,
          _24hChange,
          _7dChange,
          volume,
          floorMarketCap,
          maxSupply,
          holders: howrare_holders || holders,
          listedCount: listed_count,          
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
