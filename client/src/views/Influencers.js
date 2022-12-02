import { useState, useEffect } from 'react';
import { Container, Nav } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { URLS } from '../Settings';
import InfluencersTable from '../components/InfluencersTable';
import SecondaryMenu from '../components/layout/SecondaryMenu';

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
      <SecondaryMenu />
      <Container fluid>
        <h1 className="d-sm-none pt-5 pb-4">Influencers</h1>
        <h3 className="d-none d-sm-block text-start pt-4 pb-3">Influencers by Portfolio Value</h3>
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
