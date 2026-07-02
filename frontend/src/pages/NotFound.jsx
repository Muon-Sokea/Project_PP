import { Link } from 'react-router-dom';
import '../../assets/css/1_global.css';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-code">404</div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn-primary">
          <i className="ri-home-line" /> Back to Home
        </Link>
      </div>
    </div>
  );
}
