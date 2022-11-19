import { Nav } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

export default function SecondaryMenu(props) {
  const location = useLocation();

  return (
    <Nav className="secondary-menu px-4 border-bottom border-secondary" variant="tabs" activeKey={location.pathname}>
      <Nav.Item>
        <Nav.Link className="d-flex" href="/watchlist"><FaStar className="me-2" size={20} style={{ height: 25 }} role="button" color="#fc6" />Watchlist</Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link href="/">Collections</Nav.Link>
      </Nav.Item>
    </Nav>
  )
};
