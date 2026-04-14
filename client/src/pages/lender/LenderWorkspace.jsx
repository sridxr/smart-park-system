import AppShell from "../../components/layout/AppShell";
import { useLenderWorkspace } from "../../hooks/useLenderWorkspace";

function LenderWorkspace() {
  const workspace = useLenderWorkspace();
  return <AppShell role="lender" context={workspace} />;
}

export default LenderWorkspace;
