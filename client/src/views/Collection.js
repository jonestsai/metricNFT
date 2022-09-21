import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { Container, OverlayTrigger, Table, Tooltip as BSTooltip } from 'react-bootstrap';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { ComposedChart, LineChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TradingView } from '../components/TradingView';
import { getListedCount, getOwnersCount, getPrice, getSalesVolume, ListedCountTooltip, OwnersCountTooltip, PriceTooltip, SalesVolumeTooltip } from '../utils/chartHelpers';
import { getTopOwnersByQuantity, getTokensPerOwner } from '../utils/helpers';
import { LAMPORTS_PER_SOL, MAGICEDEN_IMAGE_URL } from '../utils/constants';
import { URLS } from '../Settings';
import solana from '../assets/solana-symbol.png';
import ethereum from '../assets/ethereum-symbol.png';
import imageLoader from '../assets/loader.gif';
import './Collection.css';

export default function Collection(props) {
  const { symbol } = useParams();

  const [collection, setCollection] = useState();
  const [owners, setOwners] = useState();
  const [isCollectionLoading, setIsCollectionLoading] = useState(true);
  const [isOwnersLoading, setIsOwnersLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [watchlist, setWatchlist] = useState(new Set(JSON.parse(localStorage.getItem('watchlist'))));

  useEffect(() => {
    fetchCollection();
  }, [symbol]);

  useEffect(() => {
    fetchOwners();
    fetchPrice(); // Only used for updating isPriceLoading state (fetched data is not used)
  }, [collection]);

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify([...watchlist]));
  }, [watchlist]);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`${URLS.api}/collection/${symbol}`);
      const collection = await response.json();

      setCollection(collection);
    } catch (error) {
      // Do nothing
    } finally {
      setIsCollectionLoading(false);
    }
  };

  const fetchOwners = async () => {
    setIsOwnersLoading(true);

    const [collectionLatest] = collection?.slice(-1) || []; // Get the latest record
    const { chain, howrare_url } = collectionLatest || {};

    if (!howrare_url) {
      setOwners(null);
      setIsOwnersLoading(false);
      return;
    }

    try {
      const response = await fetch(`${URLS.api}/howrare/collections${howrare_url}/owners`);
      const owners = await response.json();

      setOwners(owners);
    } catch (error) {
      // Do nothing
    } finally {
      setIsOwnersLoading(false);
    }
  };

  const fetchPrice = async () => {
    const [collectionLatest] = collection?.slice(-1) || []; // Get the latest record
    const { chain } = collectionLatest || {};

    if (chain !== 'solana') {
      setIsPriceLoading(false);
      return;
    }

    try {
      const response = await fetch(`${URLS.api}/collection/${symbol}/chart/1d`);
    } catch (error) {
      // Do nothing
    } finally {
      setIsPriceLoading(false);
    }
  };

  const handleWatchlistClick = (symbol) => {
    if (watchlist.has(symbol)) {
      setWatchlist(prev => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    } else {
      setWatchlist(prev => new Set(prev).add(symbol));
    }
  }

  const [collectionLatest] = collection?.slice(-1) || []; // Get the latest record
  const { chain, name, description, image, floor_price, listed_count, howrare_holders, unique_holders, num_owners, total_supply, one_day_volume, volume_all } = collectionLatest || {};
  const currentPrice = chain === 'solana' ? floor_price / LAMPORTS_PER_SOL : floor_price;
  const currentListedCount = listed_count;
  const currentOwnersCount = chain === 'solana' ? (howrare_holders || unique_holders) : num_owners;
  const numberOfTokens = total_supply;
  const oneDayVolume = chain === 'solana' ? one_day_volume / LAMPORTS_PER_SOL : one_day_volume;
  const volumeAll = chain === 'solana' ? volume_all / LAMPORTS_PER_SOL : volume_all;

  let currencyIcon;
  let currencySymbol;
  if (chain === 'solana') {
    currencyIcon = <img className="pe-1" src={solana} alt="solana-logo" height="11" />;
    currencySymbol = 'SOL';
  }

  if (chain === 'ethereum') {
    currencyIcon = <img className="pe-1" src={ethereum} alt="ethereum-logo" height="14" />;
    currencySymbol = 'ETH';
  }

  const listedCount = getListedCount(chain, collection);
  const ownersCount = getOwnersCount(chain, collection);
  const price = getPrice(chain, collection);
  const salesVolume = getSalesVolume(chain, collection);

  const whales = owners ? getTopOwnersByQuantity(owners, 20) : {};
  const tokensPerOwner = owners ? getTokensPerOwner(owners, 20) : {};

  return (
    <Container fluid>
      <div className="row py-4 d-flex align-items-center">
        <div className="col-2 col-md-1">
          {!isCollectionLoading && (
            <img className="rounded-circle img-fluid" height="50" src={`${MAGICEDEN_IMAGE_URL}${image}`} />
          )}
          {isCollectionLoading && (
            <img className="rounded-circle img-fluid" height="50" src={imageLoader} />
          )}
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
              <span className="watchlist mx-3 border border-secondary d-flex align-items-center justify-content-center">
                {watchlist.has(symbol) ? <FaStar className="m-1" size={18} role="button" color="#fc6" onClick={()=> handleWatchlistClick(symbol)} /> : <FaRegStar className="m-1" size={18} role="button" onClick={()=> handleWatchlistClick(symbol)} />}
              </span>
            </OverlayTrigger>
          </h2>
          <h5 className="text-start text-white-50 pt-2">{description}</h5>
        </div>
      </div>
      <div className="row g-md-4 pb-4">
        <div className="col-md-4 col-lg-2">
          <div className="card bg-gray text-center">
            <div className="card-header"># of Tokens</div>
            <div className="card-body">
              {!isCollectionLoading && (
                <h4 className="card-title">{numberOfTokens}</h4>
              )}
              {isCollectionLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4 col-lg-2">
          <div className="card bg-gray text-center">
            <div className="card-header"># of Listings</div>
            <div className="card-body">
              {!isCollectionLoading && (
                <h4 className="card-title">{currentListedCount}</h4>
              )}
              {isCollectionLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4 col-lg-2">
          <div className="card bg-gray text-center">
            <div className="card-header"># of Owners</div>
            <div className="card-body">
              {!isCollectionLoading && (
                <h4 className="card-title">{currentOwnersCount}</h4>
              )}
              {isCollectionLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4 col-lg-2">
          <div className="card bg-gray text-center">
            <div className="card-header">24h Volume</div>
            <div className="card-body">
              {!isCollectionLoading && (
                <h4 className="card-title d-flex align-items-center justify-content-center">{currencyIcon}{Number(oneDayVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</h4>
              )}
              {isCollectionLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4 col-lg-2">
          <div className="card bg-gray text-center">
            <div className="card-header">Total Volume</div>
            <div className="card-body">
              {!isCollectionLoading && (
                <h4 className="card-title d-flex align-items-center justify-content-center">{currencyIcon}{Number(volumeAll).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</h4>
              )}
              {isCollectionLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-4 col-lg-2">
          <div className="card bg-gray text-center">
            <div className="card-header">Floor Mkt Cap</div>
            <div className="card-body">
              {!isCollectionLoading && (
                <h4 className="card-title d-flex align-items-center justify-content-center">{currencyIcon}{(numberOfTokens * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0} )}</h4>
              )}
              {isCollectionLoading && (
                <h4 className="card-title">
                  <div className="spinner-border text-light" role="status" />
                </h4>
              )}
            </div>
          </div>
        </div>
      </div>
      {!isCollectionLoading && (
        <div>
          {/*{!isPriceLoading && chain === 'solana' && (
            <div className="row">
              <TradingView symbolName={`${symbol}:${name}`} />
            </div>
          )}
          {isPriceLoading && chain === 'solana' && (
            <div className="row">
              <div className="mb-4">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '500px', backgroundColor: '#131722' }}>
                  <div className="spinner-border text-light" role="status" />
                </div>
              </div>
            </div>
          )}
          {chain === 'ethereum' && (*/}
            <div className="row">
              <div className="col-lg-6">
                <div className="bg-gray rounded shadow-lg mb-4">
                  <h5 className="text-start px-3 pt-3">Price</h5>
                  <h6 className="text-start px-3 pb-2">{`Current: ${Number(currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )} ${currencySymbol}`}</h6>
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
                <div className="bg-gray rounded shadow-lg mb-4">
                  <h5 className="text-start px-3 pt-3">Sales Volume</h5>
                  <h6 className="text-start px-3 pb-2">{`Last 24 hours: ${Number(oneDayVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )} ${currencySymbol}`}</h6>
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
          {/*)}*/}
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
        </div>
      )}
      {isCollectionLoading && (
        <div className="my-5 text-center">
          <div className="spinner-border text-light" role="status" />
        </div>
      )}
      <div className="row">
        <div className="col-lg-6">
          <div className="bg-gray rounded shadow-lg mb-4">
            <h5 className="text-start px-3 pt-3">Top Owners</h5>
            <div className="px-3 py-2">
              {(isCollectionLoading || isOwnersLoading) && (
                <div className="my-5 text-center">
                  <div className="spinner-border text-light" role="status" />
                </div>
              )}
              {owners && (
                <Table borderless className="top-owners">
                  <thead className="text-white">
                    <tr>
                      <th scope="col" style={{ width: '65%' }}>Address</th>
                      <th scope="col" className="text-end"># of Tokens</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {Object.keys(whales).map((address) => {
                      return (
                        <tr>
                          <td style={{ width: '65%' }}>{address}</td>
                          <td className="text-end">{whales[address]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
              {!isCollectionLoading && !isOwnersLoading && !owners && (
                <div className="pb-3">Coming Soon</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="bg-gray rounded shadow-lg mb-4">
            <h5 className="text-start px-3 pt-3"># of Tokens Per Owner</h5>
            <div className="px-3 py-2">
              {(isCollectionLoading || isOwnersLoading) && (
                <div className="my-5 text-center">
                  <div className="spinner-border text-light" role="status" />
                </div>
              )}
              {owners && (
                <Table borderless className="tokens-per-owner">
                  <thead className="text-white">
                    <tr>
                      <th scope="col"># of Tokens</th>
                      <th scope="col" className="text-end"># of Owners</th>
                      <th scope="col" className="text-end">%</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {Object.keys(tokensPerOwner).map((tokensCount) => {
                      return (
                        <tr>
                          <td>{tokensCount}</td>
                          <td className="text-end">{tokensPerOwner[tokensCount]}</td>
                          <td className="text-end">{`${(tokensPerOwner[tokensCount] / numberOfTokens * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}%`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
              {!isCollectionLoading && !isOwnersLoading && !owners && (
                <div className="pb-3">Coming Soon</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
