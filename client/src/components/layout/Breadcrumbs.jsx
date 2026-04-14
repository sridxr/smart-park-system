import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { roleNavigation } from "../../lib/navigation";

function Breadcrumbs({ role, pathname }) {
  const currentItem = (roleNavigation[role] || []).find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)
  );

  const crumbs = [
    { label: role.charAt(0).toUpperCase() + role.slice(1), to: `/${role}/dashboard` },
    currentItem ? { label: currentItem.label, to: currentItem.to } : null,
  ].filter(Boolean);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/45">
      {crumbs.map((crumb, index) => (
        <div key={crumb.to} className="flex items-center gap-2">
          {index > 0 ? <ChevronRight size={12} className="text-white/30" /> : null}
          <Link to={crumb.to} className="hover:text-white/75">
            {crumb.label}
          </Link>
        </div>
      ))}
    </div>
  );
}

export default Breadcrumbs;
