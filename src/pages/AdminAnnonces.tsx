import { Navigate } from "react-router-dom";
export default function AdminAnnonces() {
  return <Navigate to="/admin/control-center?tab=listings" replace />;
}
