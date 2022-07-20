import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap/js/src/collapse.js";
import React, { useState, useEffect } from 'react';
import { Container, Nav, OverlayTrigger, Table, Tooltip as BSTooltip } from 'react-bootstrap';
import { FaStar, FaRegStar, FaChevronDown } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { ComposedChart, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import solana from '../assets/solana-symbol.png';
import ethereum from '../assets/ethereum-symbol.png';
import { getListedCount, getOwnersCount, getPrice, getSalesVolume, ListedCountTooltip, OwnersCountTooltip, PriceTooltip, SalesVolumeTooltip } from '../utils/chartHelpers';
import { LAMPORTS_PER_SOL, MAGICEDEN_IMAGE_URL } from '../utils/constants';

export default function Home(props) {
  const location = useLocation();

  const [collections, setCollections] = useState();
  const [watchlist, setWatchlist] = useState(new Set(JSON.parse(localStorage.getItem('watchlist'))));
  const [isLoading, setIsLoading] = useState(false);
  const [collapse, setCollapse] = useState(true);
  const symbols = [...watchlist].map(symbol => `symbol='${symbol}'`).join('&');

  useEffect(() => {
    if (symbols) {
      fetchWatchlist();
    }
  }, []);

  const fetchWatchlist = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`https://metricnft.com/api/users/watchlist?${symbols}`);
      const data = await response.json();
      const collections = groupBySymbol(data);

      setCollections(collections);
    } catch (error) {
      // Do nothing
    } finally {
      setIsLoading(false);
    }
  };

  const groupBySymbol = (data) => {
    return data.reduce((storage, item) => {
      // get the first instance of the key by which we're grouping
      const key = item.symbol ? 'symbol' : 'slug';
      const group = item[key];
    
      // set 'storage' for this instance of group to the outer scope (if not empty) or initialize it
      storage[group] = storage[group] || [];
    
      // add this item to its group within 'storage'
      storage[group].push(item);
    
      return storage; 
    }, {});
  };

  const handleWatchlistClick = (symbol) => {
    if (watchlist.has(symbol)) {
      const newWatchlist = new Set(watchlist);
      newWatchlist.delete(symbol);
      localStorage.setItem('watchlist', JSON.stringify([...newWatchlist]));
      setWatchlist(new Set(newWatchlist));
    } else {
      const newWatchlist = new Set(watchlist).add(symbol);
      localStorage.setItem('watchlist', JSON.stringify([...newWatchlist]));
      setWatchlist(new Set(newWatchlist).add(symbol));
    }
  }

  return (
    <div>
      <Nav className="secondary-menu px-4 border-bottom border-secondary" variant="tabs" activeKey={location.pathname}>
        <Nav.Item>
          <Nav.Link className="d-flex" href="/watchlist"><FaStar className="me-2" size={20} style={{ height: 25 }} role="button" color="#fc6" />Watchlist</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/">Collections</Nav.Link>
        </Nav.Item>
      </Nav>
      <Container fluid>
        <div className="text-end">
          <button className="btn btn-secondary mt-4" type="button" onClick={() => setCollapse(!collapse)}>{collapse ? 'Expand All' : 'Collapse All'}<FaChevronDown className="ms-2" size={20} role="button" /></button>
        </div>
        <Table variant="dark" className="my-4">
          <thead>
            <tr className="table-secondary">
              <th scope="col" className="ps-3"></th>
              <th scope="col" className="ps-0">#</th>
              <th scope="col"></th>
              <th scope="col" className={`text-start`}>Collection</th>
              <th scope="col" className={`text-end`}>Floor</th>
              <th scope="col" className={`text-end`}>24h</th>
              <th scope="col" className={`text-end`}>7d</th>
              <th scope="col" className={`text-end pe-1`}>24h Volume</th>
              <th scope="col" className={`text-end pe-1`}>Floor Mkt Cap</th>
              <th scope="col" className={`text-end pe-1`}>Tokens</th>
              <th scope="col" className={`text-end pe-1`}>Owners</th>
              <th scope="col" className={`text-end pe-1`}>Listed</th>
              <th scope="col" className="text-end pe-3"></th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && collections && (Object.keys(collections).map((symbol, index) => {
              const [collection] = collections[symbol].slice(-1); // Get the latest record
              const image = collection.image || collection.image_url;
              const currencySymbol = collection.chain === 'solana' ? <img className="pe-1" src={solana} alt="solana-logo" height="11" /> : <img className="pe-1" src={ethereum} alt="ethereum-logo" height="14" />;
              const floorPrice = collection.chain === 'solana' ? collection.floor_price / LAMPORTS_PER_SOL : collection.floor_price;
              const floorPriceText = <div className="text-nowrap d-flex align-items-center justify-content-end">{currencySymbol}{Number(floorPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</div>;
              const oneDayPriceChangePct = collection.one_day_price_change ? collection.one_day_price_change * 100 : 0;
              const _24hChangeColor = oneDayPriceChangePct < 0 ? 'text-danger' : 'text-success';
              const sevenDayPriceChangePct = collection.seven_day_price_change ? collection.seven_day_price_change * 100 : 0;
              const _7dChangeColor = sevenDayPriceChangePct < 0 ? 'text-danger' : 'text-success';
              const maxSupply = collection.total_supply;
              const holders = collection.chain === 'solana' ? collection.unique_holders : collection.num_owners;
              const listedCount = collection.listed_count;
              const oneDayVolume = collection.chain === 'solana' ? collection.one_day_volume / LAMPORTS_PER_SOL : collection.one_day_volume;
              const volume = <span className="text-nowrap d-flex align-items-center justify-content-end">{currencySymbol}{Number(oneDayVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</span>;
              const floorMarketCapText = <span className="text-nowrap d-flex align-items-center justify-content-end">{currencySymbol}{Number(floorPrice * maxSupply).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</span>;

              return (
                <React.Fragment key={symbol}>
                  <tr key={symbol} role="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${symbol}`}>
                    <td className={`text-white-50 ps-3 align-middle`}>
                      {watchlist.has(symbol) ? <FaStar className="d-flex" size={20} role="button" color="#fc6" onClick={()=> handleWatchlistClick(symbol)} /> : <FaRegStar className="d-flex" size={20} role="button" onClick={()=> handleWatchlistClick(symbol)} />}
                    </td>
                    <td className={`ps-1 text-white-50 align-middle`}>{index + 1}</td>
                    <td className="align-middle"><img className = "rounded-circle" height="40" width="40" src={image} role="button" /></td>
                    <td className="text-start align-middle"><u role="button">{collection.name}</u></td>
                    <td className="text-white-50 text-end align-middle">{floorPriceText}</td>
                    <td className={`${_24hChangeColor} text-end align-middle`}>{(oneDayPriceChangePct).toFixed(1)}%</td>
                    <td className={`${_7dChangeColor} text-end align-middle`}>{(sevenDayPriceChangePct).toFixed(1)}%</td>
                    <td className="text-white-50 text-end align-middle">{volume}</td>
                    <td className="text-white-50 text-end align-middle">{floorMarketCapText}</td>
                    <td className="text-white-50 text-end align-middle">{maxSupply}</td>
                    <td className="text-white-50 text-end align-middle">{holders}</td>
                    <td className="text-white-50 text-end align-middle">{listedCount}<br/><span className="text-secondary">{(listedCount/maxSupply * 100).toFixed(1)}%</span></td>
                    <td className="text-white-50 text-end pe-3 align-middle">
                      <FaChevronDown size={20} role="button" />
                    </td>
                  </tr>
                  <tr key={`${symbol}-detail`} className={`collapse ${collapse ? '' : 'show'}`} id={`collapse-${symbol}`}>
                    <td colSpan="13">
                      <div className="row my-4">
                        <div className="col-lg-6">
                          <div className="bg-gray rounded shadow-lg">
                            <h5 className="text-start px-3 pt-3">Number of Tokens Listed</h5>
                            <ResponsiveContainer width="100%" height={200}>
                              <LineChart
                                width={500}
                                height={300}
                                data={getListedCount(collection.chain, collections[symbol])}
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
                          <div className="bg-gray rounded shadow-lg">
                            <h5 className="text-start px-3 pt-3">Number of Owners</h5>
                            <ResponsiveContainer width="100%" height={200}>
                              <LineChart
                                width={500}
                                height={300}
                                data={getOwnersCount(collection.chain, collections[symbol])}
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
                      <div className="row my-4">
                        <div className="col-lg-6">
                          <div className="bg-gray rounded shadow-lg">
                            <h5 className="text-start px-3 pt-3">Price</h5>
                            <ResponsiveContainer width="100%" height={200}>
                              <LineChart
                                width={500}
                                height={300}
                                data={getPrice(collection.chain, collections[symbol])}
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
                          <div className="bg-gray rounded shadow-lg">
                            <h5 className="text-start px-3 pt-3">Sales Volume</h5>
                            <ResponsiveContainer width="100%" height={200}>
                              <ComposedChart
                                width={500}
                                height={300}
                                data={getSalesVolume(collection.chain, collections[symbol])}
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
                                <YAxis yAxisId="volume" type="number" domain={['auto', 'auto']} tick={{ fontSize: 14 }} />
                                <Tooltip content={<SalesVolumeTooltip />} />
                                <Area yAxisId="volume" dataKey="Volume" type="monotone" isAnimationActive={false} fill="#4b95d1" stroke="#4b95d1" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              )
            }))}
          </tbody>
        </Table>
        {isLoading && (
          <div className="my-5 text-center">
            <div className="spinner-border text-light" role="status" />
          </div>
        )}
      </Container>
    </div>
  )
};