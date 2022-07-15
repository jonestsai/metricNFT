import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, OverlayTrigger, Tooltip as BSTooltip } from 'react-bootstrap';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { ComposedChart, LineChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getListedCount, getOwnersCount, getPrice, getSalesVolume, ListedCountTooltip, OwnersCountTooltip, PriceTooltip, SalesVolumeTooltip } from '../utils/chartHelpers';
import { MAGICEDEN_IMAGE_URL } from '../utils/constants';
import { URLS } from '../Settings';
import solana from '../assets/solana-symbol.png';
import ethereum from '../assets/ethereum-symbol.png';
import './Collection.css';

export default class Collection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: '',
      isLoading: true,
      watchlist: new Set(JSON.parse(localStorage.getItem('watchlist'))),
    };
  }

  async componentDidMount() {
    await this.fetchCollection();
  };

  async componentDidUpdate(prevProps) {
    if (this.props.name !== prevProps.name) {
      await this.fetchCollection();
    }
  };

  fetchCollection = async () => {
    if (!this.state.isLoading) {
      this.setState({ isLoading: true });
    }

    const { symbol } = this.props;

    try {
      const response = await fetch(`${URLS.api}/dev/${symbol}`);
      const collection = await response.json();

      this.setState({
        collection,
      });
    } catch (error) {
      // Do nothing
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handleWatchlistClick = (symbol) => {
    const { watchlist } = this.state;

    if (watchlist.has(symbol)) {
      const newWatchlist = new Set(watchlist);
      newWatchlist.delete(symbol);
      localStorage.setItem('watchlist', JSON.stringify([...newWatchlist]));
      this.setState({ watchlist: new Set(newWatchlist) });
    } else {
      const newWatchlist = new Set(watchlist).add(symbol);
      localStorage.setItem('watchlist', JSON.stringify([...newWatchlist]));
      this.setState({ watchlist: new Set(watchlist).add(symbol) });
    }
  }

  render() {
    const { chain, name, symbol, image, currentPrice, currentListedCount, currentOwnersCount, numberOfTokens, oneDayVolume, volumeAll, partner } = this.props;
    const { isLoading, collection, watchlist } = this.state;

    let currencySymbol;
    if (chain === 'solana') {
      currencySymbol = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;
    }

    if (chain === 'ethereum') {
      currencySymbol = <img className="pe-1" src={ethereum} alt="ethereum-logo" height="14" />;
    }

    const listedCount = getListedCount(chain, collection);
    const ownersCount = getOwnersCount(chain, collection);
    const price = getPrice(chain, collection);
    const salesVolume = getSalesVolume(chain, collection);

    return (
      <Container fluid>
        <div className="row py-4 d-flex align-items-center">
          <div className="col-2 col-md-1">
            <img className = "rounded-circle img-fluid" height="50" src={`${MAGICEDEN_IMAGE_URL}${image}`} />
          </div>
          <div className="col-10 col-md-11">
            <h2 className="text-start d-flex align-items-center">
              {name}
              <OverlayTrigger
                placement="top"
                overlay={
                  <BSTooltip>
                    {watchlist.has(symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </BSTooltip>
                }
              >
                <span className={`${partner ? 'd-none' : ''} watchlist mx-3 border border-secondary d-flex align-items-center justify-content-center`}>
                  {watchlist.has(symbol) ? <FaStar className="m-1" size={18} role="button" color="#fc6" onClick={()=> this.handleWatchlistClick(symbol)} /> : <FaRegStar className="m-1" size={18} role="button" onClick={()=> this.handleWatchlistClick(symbol)} />}
                </span>
              </OverlayTrigger>
            </h2>
            <h4 className="text-start">{currentPrice} {chain === 'solana' ? 'SOL' : 'ETH'}</h4>
          </div>
        </div>
        <div className="row g-md-4 pb-4">
          <div className="col-md-4 col-lg-2">
            <div className="card bg-gray text-center">
              <div className="card-header"># of Tokens</div>
              <div className="card-body">
                <h4 className="card-title">{numberOfTokens}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-lg-2">
            <div className="card bg-gray text-center">
              <div className="card-header"># of Listings</div>
              <div className="card-body">
                <h4 className="card-title">{currentListedCount}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-lg-2">
            <div className="card bg-gray text-center">
              <div className="card-header"># of Owners</div>
              <div className="card-body">
                <h4 className="card-title">{currentOwnersCount}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-lg-2">
            <div className="card bg-gray text-center">
              <div className="card-header">24h Volume</div>
              <div className="card-body">
                <h4 className="card-title d-flex align-items-center justify-content-center">{currencySymbol}{Number(oneDayVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-lg-2">
            <div className="card bg-gray text-center">
              <div className="card-header">Total Volume</div>
              <div className="card-body">
                <h4 className="card-title d-flex align-items-center justify-content-center">{currencySymbol}{Number(volumeAll).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-lg-2">
            <div className="card bg-gray text-center">
              <div className="card-header">Floor Mkt Cap</div>
              <div className="card-body">
                <h4 className="card-title d-flex align-items-center justify-content-center">{currencySymbol}{(numberOfTokens * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0} )}</h4>
              </div>
            </div>
          </div>
        </div>
        {!isLoading && (
          <div>
            <div className="row">
              <div className="col-lg-6">
                <div className="bg-gray rounded shadow-lg mb-4">
                  <h5 className="text-start px-3 pt-3">Number of Tokens Listed</h5>
                  <h6 className="text-start px-3 pb-2">{`Current: ${currentListedCount}`}</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      width={500}
                      height={300}
                      data={listedCount}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" interval={1} angle={-35} dx={-15} dy={10} tick={{ fontSize: 14 }} height={60} />
                      <YAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 14 }} />
                      <Tooltip content={<ListedCountTooltip />} />
                      <Line dataKey="Total Listed" connectNulls dot={{ stroke: '#61cdbb', strokeWidth: 2 }} type="monotone" isAnimationActive={false} stroke="#61cdbb" strokeWidth={2} fill="#2b3035" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="bg-gray rounded shadow-lg mb-4">
                  <h5 className="text-start px-3 pt-3">Number of Owners</h5>
                  <h6 className="text-start px-3 pb-2">{`Current: ${currentOwnersCount}`}</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      width={500}
                      height={300}
                      data={ownersCount}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" interval={1} angle={-35} dx={-15} dy={10} tick={{ fontSize: 14 }} height={60} />
                      <YAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 14 }} />
                      <Tooltip content={<OwnersCountTooltip />} />
                      <Line dataKey="Total Owners" connectNulls dot={{ stroke: '#61cdbb', strokeWidth: 2 }} type="monotone" isAnimationActive={false} stroke="#61cdbb" strokeWidth={2} fill="#2b3035" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6">
                <div className="bg-gray rounded shadow-lg mb-5">
                  <h5 className="text-start px-3 pt-3">Price</h5>
                  <h6 className="text-start px-3 pb-2">{`Current: ${currentPrice} SOL`}</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      width={500}
                      height={300}
                      data={price}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" interval={1} angle={-35} dx={-15} dy={10} tick={{ fontSize: 14 }} height={60} />
                      <YAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 14 }} />
                      <Tooltip content={<PriceTooltip />} />
                      <Line dataKey="Price" connectNulls dot={{ stroke: '#61cdbb', strokeWidth: 2 }} type="monotone" isAnimationActive={false} stroke="#61cdbb" strokeWidth={2} fill="#2b3035" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="bg-gray rounded shadow-lg mb-5">
                  <h5 className="text-start px-3 pt-3">Sales Volume</h5>
                  <h6 className="text-start px-3 pb-2">{`Last 24 hours: ${Number(oneDayVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )} SOL`}</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart
                      width={500}
                      height={300}
                      data={salesVolume}
                      barCategoryGap="28%"
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" interval={1} angle={-35} dx={-15} dy={10} tick={{ fontSize: 14 }} height={60} />
                      {/*<YAxis yAxisId="sales" type="number" domain={['auto', 'auto']} tick={{ fontSize: 14 }} />*/}
                      <YAxis yAxisId="volume" type="number" domain={['auto', 'auto']} tick={{ fontSize: 14 }} />
                      <Tooltip content={<SalesVolumeTooltip />} />
                      <Area yAxisId="volume" dataKey="Volume" type="monotone" isAnimationActive={false} fill="#4b95d1" stroke="#4b95d1" />
                      {/*<Bar yAxisId="sales" dataKey="Sales" isAnimationActive={false} fill="#61cdbb" />*/}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="my-5 text-center">
            <div className="spinner-border text-light" role="status" />
          </div>
        )}
      </Container>
    );
  }
}
