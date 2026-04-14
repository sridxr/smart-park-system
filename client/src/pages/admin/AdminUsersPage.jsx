import { useOutletContext } from "react-router-dom";

function AdminUsersPage() {
  const workspace = useOutletContext();

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
      <h3 className="text-2xl font-semibold text-white">Users</h3>
      <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-slate-950/80 text-white/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-white/[0.03]">
            {workspace.users.map((row) => (
              <tr key={row._id}>
                <td className="px-4 py-3 text-white">{row.name}</td>
                <td className="px-4 py-3 text-white/65">{row.email}</td>
                <td className="px-4 py-3 text-white/65">{row.role}</td>
                <td className="px-4 py-3 text-white/65">{row.status}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => workspace.toggleUserStatus(row)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                      {row.status === "blocked" ? "Unblock" : "Block"}
                    </button>
                    <button type="button" onClick={() => workspace.deleteUser(row._id)} className="rounded-2xl bg-violet-300 px-3 py-2 text-xs font-semibold text-slate-950">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;
