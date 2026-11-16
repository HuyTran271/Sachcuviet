import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';

export default function PrivateRoute() {
  const context = useOutletContext();
  const location = useLocation();
  return context.user
    ? <Outlet context={context} />
    : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}
