import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Table } from 'react-bootstrap';
import Collection from '../components/Collection';
import { URLS } from '../Settings';
import './Home.css';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collections: [],
      isLoading: true,
    };
  }

  async componentDidMount() {
    await this.fetchCollections();
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

  render() {
    const collections = this.state.collections.map((collection, index) => {
      return (
        <Collection
          key={collection.id}
          row={index + 1}
          collection={collection}
        />
      );
    });

    return (
      <Container fluid>
        <h3 className="text-start pt-5 pb-3">NFT Prices by Floor Market Cap</h3>
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
              {collections}
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
