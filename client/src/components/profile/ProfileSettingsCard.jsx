import { useEffect, useState } from "react";
import { Save, Settings2 } from "lucide-react";

import { useToast } from "../ui/ToastProvider";
import { useAuth } from "../../context/AuthContext";

function ProfileSettingsCard() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    avatar: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      avatar: user?.avatar || "",
    });
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await updateProfile(form);
      showToast({
        tone: "success",
        title: "Profile updated",
        description: "Your account settings were saved successfully.",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Update failed",
        description: error.response?.data?.msg || "We could not save your profile settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <Settings2 className="text-emerald-200" />
        <div>
          <h3 className="text-xl font-semibold text-white">Profile settings</h3>
          <p className="text-sm text-white/55">
            Update your identity details here. Theme and workspace mode stay available from the top bar.
          </p>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm text-white/55">Display name</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
            placeholder="Your name"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-white/55">Phone number</span>
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
            placeholder="+91 98765 43210"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-white/55">Avatar URL</span>
          <input
            value={form.avatar}
            onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
            placeholder="https://..."
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}

export default ProfileSettingsCard;
