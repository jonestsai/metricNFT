import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
      const response = await fetch(`${URLS.api}/${collectionAPI}`);
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
        const { starttime, listedcount } = detail;
        const datetime = new Date(starttime);
        const date = datetime.getDate();
        const month = datetime.toLocaleString('default', { month: 'short' });

        return { date: `${date}. ${month}`, 'Total Listed': Number(listedcount) };
      })
      : null;
  };

  getOwnersCount = (collection) => {
    return collection.length > 0
      ? collection.map((detail) => {
        const { starttime, ownerscount } = detail;
        const datetime = new Date(starttime);
        const date = datetime.getDate();
        const month = datetime.toLocaleString('default', { month: 'short' });

        return { date: `${date}. ${month}`, 'Total Owners': Number(ownerscount) };
      })
      : null;
  };

  getPrice = (collection) => {
    let lastPrice;
    let updatedPrice;
    return collection.length > 0
      ? collection.map((detail) => {
        const { starttime, floorprice, price } = detail;
        const datetime = new Date(starttime);
        const date = datetime.getDate();
        const month = datetime.toLocaleString('default', { month: 'short' });
        updatedPrice = floorprice ? Number(Number(floorprice)?.toFixed(2)) : Number(Number(price)?.toFixed(2));

        if (updatedPrice == 0) {
          updatedPrice = lastPrice;
        }

        lastPrice = updatedPrice;

        return { date: `${date}. ${month}`, 'Price': updatedPrice };
      })
      : null;
  };

  render() {
    const { name } = this.props;
    const { isLoading, collection } = this.state;

    const listedCount = this.getListedCount(collection);
    const currentListedCount = listedCount ? listedCount[listedCount.length - 1] : null;
    const ownersCount = this.getOwnersCount(collection);
    const currentOwnersCount = ownersCount ? ownersCount[ownersCount.length - 1] : null;
    const price = this.getPrice(collection);
    const currentPrice = price ? price[price.length - 1] : null;

    return (
      <Container fluid>
        <h3 className="text-start py-4">{name}</h3>
        {!isLoading && (
          <div>
            <div className="row">
              <div className="col-lg-6">
                <div className="chart rounded shadow-lg mb-4">
                  <h5 className="text-start px-3 pt-3">Number of Tokens Listed</h5>
                  <h6 className="text-start px-3 pb-2">{`Current: ${currentListedCount['Total Listed']}`}</h6>
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
                <div className="chart rounded shadow-lg mb-4">
                  <h5 className="text-start px-3 pt-3">Number of Owners</h5>
                  <h6 className="text-start px-3 pb-2">{`Current: ${currentOwnersCount['Total Owners']}`}</h6>
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
            <div className="chart rounded shadow-lg mb-5">
              <h5 className="text-start px-3 pt-3">Price</h5>
              <h6 className="text-start px-3 pb-2">{`Current: ${currentPrice['Price']}`}</h6>
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