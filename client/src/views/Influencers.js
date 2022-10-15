import { useState, useEffect } from 'react';
import { Container, Nav } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { URLS } from '../Settings';
import InfluencersTable from '../components/InfluencersTable';

export default function Influencers(props) {
  const location = useLocation();

  const [influencers, setInfluencers] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      const response = await fetch(`${URLS.api}/influencers`);
      const influencers = await response.json();

      setInfluencers(influencers);
    } catch (error) {
      // Do nothing
    } finally {
      setIsLoading(false);
    }
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
        <h3 className="text-start pt-4 pb-3">Influencers by Portfolio Value</h3>
        <div className="table-responsive-sm">
          <InfluencersTable
            influencers={influencers}
          />
          {isLoading && (
            <div className="my-5 text-center">
              <div className="spinner-border text-light" role="status" />
            </div>
          )}
        </div>
      </Container>
    </div>
  )
};
