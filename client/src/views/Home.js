import 'bootstrap/dist/css/bootstrap.min.css';
import { getPythProgramKeyForCluster, PythHttpClient } from '@pythnetwork/client';
import { Cluster, clusterApiUrl, Connection } from '@solana/web3.js';
import React from 'react';
import { Container, Dropdown, DropdownButton, Table } from 'react-bootstrap';
import CollectionRow from '../components/CollectionRow';
import { URLS } from '../Settings';
import './Home.css';

const anchor = require('@project-serum/anchor');

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collections: [],
      exchangeRates: '',
      currency: 'SOL',
      currencyRate: 1,
      isLoading: true,
      isRatesLoading: true,
    };
  }

  async componentDidMount() {
    document.title = 'MetricNFT';
    await this.fetchCollections();
    await this.fetchCurrencies();
  }

  fetchCollections = async () => {
    if (!this.state.isLoading) {
      this.setState({ isLoading: true });
    }

    try {
      const response = await fetch(`${URLS.api}`);
      const collections = await response.json();

      this.setState({
        collections,
      });
    } catch (error) {
      // Do nothing
    } finally {
      this.setState({ isLoading: false });
    }
  }

  fetchCurrencies = async () => {
    if (!this.state.isLoading) {
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
    const { exchangeRates, currency, currencyRate, isRatesLoading } = this.state;
    const collectionsByMC = this.state.collections.sort((a, b) => {
      return (b.floorprice * b.maxsupply) - (a.floorprice * a.maxsupply);
    });
    const collectionRows = collectionsByMC.map((collection, index) => {
      return (
        <CollectionRow
          key={collection.id}
          row={index + 1}
          collection={collection}
          currency={currency}
          currencyRate={currencyRate}
        />
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
          <Table variant="dark" hover>
            <thead>
              <tr className="table-secondary">
                <th scope="col">#</th>
                <th scope="col"></th>
                <th scope="col" className="text-start">Collection</th>
                <th scope="col" className="text-end">Floor</th>
                <th scope="col" className="text-end">24h</th>
                <th scope="col" className="text-end pe-3">7d</th>
                <th scope="col" className="text-end pe-1">24h Volume</th>
                <th scope="col" className="text-end pe-1">Floor Market Cap</th>
                <th scope="col" className="text-end pe-1">Tokens</th>
                <th scope="col" className="text-end pe-1">Owners</th>
                <th scope="col" className="text-end pe-4">Listed</th>
              </tr>
            </thead>
            <tbody>
              {collectionRows}
            </tbody>
          </Table>
          {this.state.isLoading && (
            <div className="my-5 text-center">
              <div className="spinner-border text-light" role="status" />
            </div>
          )}
        </div>
      </Container>
    )
  };
};
