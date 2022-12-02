import { Nav } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

export default function SecondaryMenu(props) {
  const location = useLocation();

  return (
    <Nav className="secondary-menu d-none d-sm-block px-4 border-bottom border-secondary overflow-auto text-nowrap" variant="tabs" activeKey={location.pathname}>
      <Nav.Item>
        <Nav.Link href="/watchlist"><FaStar className="me-2" size={20} style={{ height: 20 }} role="button" color="#fc6" />Watchlist</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link href="/">Collections</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link href="/influencers">Influencers</Nav.Link>
      </Nav.Item>
    </Nav>
  )
};
