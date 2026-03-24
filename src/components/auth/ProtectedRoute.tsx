import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAdminLoggedIn } from '@/auth/adminAuth'

export default function ProtectedRoute() {
  const location = useLocation()

  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
