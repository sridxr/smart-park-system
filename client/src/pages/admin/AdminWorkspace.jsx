import AppShell from "../../components/layout/AppShell";
import { useAdminWorkspace } from "../../hooks/useAdminWorkspace";

function AdminWorkspace() {
  const workspace = useAdminWorkspace();
  return <AppShell role="admin" context={workspace} />;
}

export default AdminWorkspace;
