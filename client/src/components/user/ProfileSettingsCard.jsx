import { useEffect, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/ToastProvider";

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
  }, [user?.avatar, user?.name, user?.phone]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      await updateProfile(form);
      showToast({
        tone: "success",
        title: "Profile updated",
        description: "Your account settings were saved successfully.",
      });
    } catch (err) {
      showToast({
        tone: "error",
        title: "Update failed",
        description: err.response?.data?.msg || "Profile settings could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
      <h3 className="text-xl font-semibold text-white">Profile settings</h3>
      <p className="mt-2 text-sm text-white/55">Update your contact and account presentation details.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
          placeholder="Full name"
        />
        <input
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
          placeholder="Phone number"
        />
        <input
          value={form.avatar}
          onChange={(event) => setForm((prev) => ({ ...prev, avatar: event.target.value }))}
          className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
          placeholder="Avatar image URL"
        />
      </div>
      <button
        type="button"
        onClick={saveProfile}
        disabled={saving}
        className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}

export default ProfileSettingsCard;
