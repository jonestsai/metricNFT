import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Table } from 'react-bootstrap';
import Collection from '../components/Collection';
import Top from '../components/layout/Top';
import { URLS } from '../Settings';

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
        <Top />
        <h3 className="text-start pt-5 pb-3">NFT Prices by Total Floor Value</h3>
        <Table variant="dark" hover>
          <thead>
            <tr className="table-secondary">
              <th scope="col">#</th>
              <th scope="col">Collection</th>
              <th scope="col">Floor</th>
              <th scope="col">24h</th>
              <th scope="col">7d</th>
              <th scope="col">24h Volume</th>
              <th scope="col">Total Floor Value</th>
              <th scope="col">Tokens</th>
              <th scope="col">Owners</th>
              <th scope="col">Listed</th>
            </tr>
          </thead>
          <tbody>
            {collections}
          </tbody>
        </Table>
      </Container>
    )
  };
};
