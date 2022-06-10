import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container } from 'react-bootstrap';
import { ComposedChart, LineChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LAMPORTS_PER_SOL } from '../utils/constants';
import { URLS } from '../Settings';
import './Collection.css';

export default class Collection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: '',
      isLoading: true,
    };
  }

  async componentDidMount() {
    await this.fetchCollection();
  };

  fetchCollection = async () => {
    if (!this.state.isLoading) {
      this.setState({ isLoading: true });
    }

    const { collectionAPI } = this.props;

    try {
      const response = await fetch(`${URLS.api}/dev/${collectionAPI}`);
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

  getListedCount = (collection) => {
    return collection.length > 0
      ? collection.map((detail) => {
        const { start_time, listed_count } = detail;
        const datetime = new Date(start_time);
        const date = datetime.getUTCDate();
        const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });

        return { date: `${date}. ${month}`, 'Total Listed': Number(listed_count) };
      })
      : null;
  };

  getOwnersCount = (collection) => {
    return collection.length > 0
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

  getPrice = (collection) => {
    let lastPrice;
    let updatedPrice;
    return collection.length > 0
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

  getSalesVolume = (collection) => {
    return collection.length > 0
      ? collection.map((detail) => {
        const { start_time, _24hvolume } = detail;
        const datetime = new Date(start_time);
        const date = datetime.getUTCDate();
        const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        return { date: `${date}. ${month}`, 'Volume': Number(_24hvolume / LAMPORTS_PER_SOL) };
      })
      : null;
  };

  render() {
    const { name, image, currentPrice, currentListedCount, currentOwnersCount, numberOfTokens, _24hVolume, volumeAll } = this.props;
    const { isLoading, collection } = this.state;

    const listedCount = this.getListedCount(collection);
    const ownersCount = this.getOwnersCount(collection);
    const price = this.getPrice(collection);
    const salesVolume = this.getSalesVolume(collection);

    return (
      <Container fluid>
        <div className="row py-4 d-flex align-items-center">
          <div className="col-2 col-md-1">
            <img className = "rounded-circle img-fluid" height="50" src={image} />
          </div>
          <div className="col-10 col-md-11">
            <h3 className="text-start">{name}</h3>
            <h4 className="text-start">{currentPrice} SOL</h4>
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
                <h4 className="card-title">{Number(_24hVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-lg-2">
            <div className="card bg-gray text-center">
              <div className="card-header">Total Volume</div>
              <div className="card-body">
                <h4 className="card-title">{Number(volumeAll).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-lg-2">
            <div className="card bg-gray text-center">
              <div className="card-header">Floor Mkt Cap</div>
              <div className="card-body">
                <h4 className="card-title">{(numberOfTokens * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0} )}</h4>
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
                  <h6 className="text-start px-3 pb-2">{`Last 24 hours: ${Number(_24hVolume).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )} SOL`}</h6>
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
