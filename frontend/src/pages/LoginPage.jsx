import { Navigate, useLocation } from 'react-router-dom';

export default function LoginPage() {
  const location = useLocation();
  const search = location.search ? `&${location.search.slice(1)}` : '';
  return <Navigate to={`/?login=true${search}`} replace />;
}
