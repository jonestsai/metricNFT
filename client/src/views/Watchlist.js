import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { Container, Nav, OverlayTrigger, Tooltip as BSTooltip } from 'react-bootstrap';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { ComposedChart, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LAMPORTS_PER_SOL, MAGICEDEN_IMAGE_URL } from '../utils/constants';

export default function Home(props) {
  const location = useLocation();

  const [collections, setCollections] = useState();
  const [watchlist, setWatchlist] = useState(new Set(JSON.parse(localStorage.getItem('watchlist'))));
  const [isLoading, setIsLoading] = useState(false);
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
      const collections = groupBy(data, 'symbol');

      setCollections(collections);
    } catch (error) {
      // Do nothing
    } finally {
      setIsLoading(false);
    }
  };

  const groupBy = (data, key) => {
    return data.reduce((storage, item) => {
      // get the first instance of the key by which we're grouping
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

  const getListedCount = (collection) => {
    return collection?.length > 0
      ? collection.map((detail) => {
        const { start_time, listed_count } = detail;
        const datetime = new Date(start_time);
        const date = datetime.getUTCDate();
        const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });

        return { date: `${date}. ${month}`, 'Total Listed': Number(listed_count) };
      })
      : null;
  };

  const getOwnersCount = (collection) => {
    return collection?.length > 0
      ? collection.map((detail) => {
        const { start_time, unique_holders, howrare_holders } = detail;
        const datetime = new Date(start_time);
        const date = datetime.getUTCDate();
        const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        const ownersCount = howrare_holders || unique_holders;

        return { date: `${date}. ${month}`, 'Total Owners': Number(ownersCount) };
      })
      : null;
  };

  const getPrice = (collection) => {
    let lastPrice;
    let updatedPrice;
    return collection?.length > 0
      ? collection.map((detail) => {
        const { start_time, floor_price } = detail;
        const datetime = new Date(start_time);
        const date = datetime.getUTCDate();
        const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        updatedPrice = Number(Number(floor_price / LAMPORTS_PER_SOL)?.toFixed(2));

        if (updatedPrice == 0) {
          updatedPrice = lastPrice;
        }

        lastPrice = updatedPrice;

        return { date: `${date}. ${month}`, 'Price': updatedPrice };
      })
      : null;
  };

  const getSalesVolume = (collection) => {
    return collection?.length > 0
      ? collection.map((detail) => {
        const { start_time, _24hvolume } = detail;
        const datetime = new Date(start_time);
        const date = datetime.getUTCDate();
        const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        const oneDayVolume = _24hvolume < 0 ? 0 : _24hvolume;
        return { date: `${date}. ${month}`, 'Volume': Number(oneDayVolume / LAMPORTS_PER_SOL) };
      })
      : null;
  };

  const ListedCountTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-light text-dark rounded opacity-75 p-2">
          <div className="text-start">{label}</div>
          <div className="text-start">{`Total Listed: ${payload[0].value}`}</div>
        </div>
      );
    }

    return null;
  };

  const OwnersCountTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-light text-dark rounded opacity-75 p-2">
          <div className="text-start">{label}</div>
          <div className="text-start">{`Total Owners: ${payload[0].value}`}</div>
        </div>
      );
    }

    return null;
  };

  const PriceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-light text-dark rounded opacity-75 p-2">
          <div className="text-start">{label}</div>
          <div className="text-start">{`Floor Price: ${payload[0].value}`}</div>
        </div>
      );
    }

    return null;
  };

  const SalesVolumeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-light text-dark rounded opacity-75 p-2">
          <div className="text-start">{label}</div>
          <div className="text-start">{`Volume: ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`}</div>
        </div>
      );
    }

    return null;
  };

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
        {!isLoading && collections && (Object.keys(collections).map((symbol) => 
          <div key={symbol}>
            <div className="row py-4 d-flex align-items-center">
              <div className="col-2 col-md-1">
                <img className = "rounded-circle img-fluid" height="50" src={`${MAGICEDEN_IMAGE_URL}${collections[symbol][0].image}`} />
              </div>
              <div className="col-10 col-md-11">
                <h2 className="text-start d-flex align-items-center">
                  {collections[symbol][0].name}
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
                <h4 className="text-start">{collections[symbol].slice(-1)[0].floor_price / LAMPORTS_PER_SOL} SOL</h4>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6">
                <div className="bg-gray rounded shadow-lg mb-4">
                  <h5 className="text-start px-3 pt-3">Number of Tokens Listed</h5>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      width={500}
                      height={300}
                      data={getListedCount(collections[symbol])}
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
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      width={500}
                      height={300}
                      data={getOwnersCount(collections[symbol])}
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
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      width={500}
                      height={300}
                      data={getPrice(collections[symbol])}
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
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart
                      width={500}
                      height={300}
                      data={getSalesVolume(collections[symbol])}
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
          </div>
        ))}
        {isLoading && (
          <div className="my-5 text-center">
            <div className="spinner-border text-light" role="status" />
          </div>
        )}
      </Container>
    </div>
  )
};
