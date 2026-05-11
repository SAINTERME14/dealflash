import { Navigate } from "react-router-dom";
export default function AdminServices() {
  return <Navigate to="/admin/control-center?tab=services" replace />;
}
