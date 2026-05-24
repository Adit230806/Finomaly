import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { authUpdateProfile, authUpdatePassword } from "@/services/authService";
import { toast } from "sonner";
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-[#00C853]" : "bg-[#E8E6E0]"}`}>
      <motion.div animate={{ x: on ? 20 : 2 }} transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow" />
    </button>
  );
}

function PasswordStrength({ pw }: { pw: string }) {
  const s = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3;
  const labels = ["", "Weak", "Medium", "Strong"];
  const colors = ["", "#FF3B30", "#FF9500", "#00C853"];
  return pw.length > 0 ? (
    <div className="mt-1.5">
      <div className="h-1.5 w-full bg-[#E8E6E0] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(s / 3) * 100}%`, backgroundColor: colors[s] }} />
      </div>
      <p className="text-xs mt-1" style={{ color: colors[s] }}>{labels[s]}</p>
    </div>
  ) : null;
}

function PillGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#6B6B6B] mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${value === o ? "bg-[#0A0A0A] text-white" : "bg-[#F0EFEA] text-[#6B6B6B] hover:bg-[#E8E6E0]"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving, saved, label }: { onClick: () => void; saving: boolean; saved: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className={`mt-5 w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
        saved ? "bg-[#E8F9EF] text-[#00A844]" : "bg-[#00C853] text-white hover:bg-[#00A844]"
      }`}>
      {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><Check size={16} /> Saved</> : label}
    </button>
  );
}

function SettingsPage() {
  const { currentUser } = useAuth();
  const { display, notifs, setDisplay, setNotifs, saveDisplay: persistDisplay, saveNotifs: persistNotifs, resetAll } = useSettings();

  const theme     = display.theme;
  const layout    = display.layout;
  const timeRange = display.timeRange;
  const setTheme     = (v: string) => setDisplay({ ...display, theme:     v as typeof display.theme });
  const setLayout    = (v: string) => setDisplay({ ...display, layout:    v as typeof display.layout });
  const setTimeRange = (v: string) => setDisplay({ ...display, timeRange: v as typeof display.timeRange });
  const [name,         setName]         = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);

  // Sync name when currentUser loads
  useEffect(() => {
    if (currentUser?.name) setName(currentUser.name);
  }, [currentUser?.name]);

  // Security
  const [curPw,   setCurPw]   = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [confPw,  setConfPw]  = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Notifications — use context
  // (notifs and setNotifs come from useSettings above)
  const [notifSaved,   setNotifSaved]   = useState(false);
  const [displaySaved, setDisplaySaved] = useState(false);

  // Danger zone
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    setProfileSaving(true);
    const err = await authUpdateProfile(name.trim());
    setProfileSaving(false);
    if (err) { toast.error(err); return; }
    setProfileSaved(true);
    toast.success("Profile updated");
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const updatePassword = async () => {
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPw !== confPw) { toast.error("Passwords don't match"); return; }
    setPwSaving(true);
    const err = await authUpdatePassword(newPw);
    setPwSaving(false);
    if (err) { toast.error(err); return; }
    toast.success("Password updated");
    setCurPw(""); setNewPw(""); setConfPw("");
  };

  const saveNotifs = () => {
    persistNotifs();
    setNotifSaved(true);
    toast.success("Notification settings saved");
    setTimeout(() => setNotifSaved(false), 2000);
  };

  const saveDisplay = () => {
    persistDisplay();
    setDisplaySaved(true);
    toast.success("Display settings saved");
    setTimeout(() => setDisplaySaved(false), 2000);
  };

  const resetToDefaults = () => {
    resetAll();
    setConfirmReset(false);
    toast.success("Settings reset to defaults");
  };

  const cardClass = "bg-white rounded-2xl border border-[#E8E6E0] p-6";
  const inputClass = "w-full h-11 rounded-xl border border-[#E8E6E0] px-4 text-sm outline-none focus:border-[#00C853] transition-colors";
  const labelClass = "block text-xs font-medium text-[#6B6B6B] mb-1.5";

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0A0A0A]">Settings</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className={cardClass}>
          <h2 className="font-semibold text-[#0A0A0A] mb-5">Profile</h2>
          <div className="flex items-center gap-4 mb-5">
            <div className="h-16 w-16 rounded-full bg-[#00C853] flex items-center justify-center text-white text-2xl font-bold">
              {name[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-semibold text-[#0A0A0A]">{name || "—"}</p>
              <p className="text-xs text-[#6B6B6B]">{currentUser?.email}</p>
              <span className="mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F9EF] text-[#00A844] capitalize">{currentUser?.role}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <div className="relative">
                <input value={currentUser?.email ?? ""} readOnly className={`${inputClass} bg-[#F8F7F4] text-[#6B6B6B] cursor-not-allowed pr-20`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F9EF] text-[#00A844]">Verified</span>
              </div>
            </div>
          </div>
          <SaveButton onClick={saveProfile} saving={profileSaving} saved={profileSaved} label="Save Changes" />
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cardClass}>
          <h2 className="font-semibold text-[#0A0A0A] mb-5">Security</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <div className="relative">
                <input type={showCur ? "text" : "password"} value={curPw} onChange={(e) => setCurPw(e.target.value)} className={`${inputClass} pr-10`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowCur((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
                  {showCur ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} className={`${inputClass} pr-10`} placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength pw={newPw} />
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input type="password" value={confPw} onChange={(e) => setConfPw(e.target.value)} className={inputClass} placeholder="••••••••" />
            </div>
          </div>
          <button onClick={updatePassword} disabled={pwSaving}
            className="mt-5 w-full h-11 rounded-xl bg-[#0A0A0A] text-white font-semibold text-sm hover:bg-[#333] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {pwSaving ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
          </button>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardClass}>
          <h2 className="font-semibold text-[#0A0A0A] mb-5">Notifications</h2>
          <div className="space-y-4">
            {([
              ["emailHighRisk", "Email alerts for high-risk transactions"],
              ["inAppAlerts",   "In-app alert popups"],
              ["liveRefresh",   "Live feed auto-refresh"],
              ["weeklyReport",  "Weekly analytics report"],
              ["soundAlerts",   "Sound notifications"],
            ] as [keyof typeof notifs, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-[#0A0A0A]">{label}</span>
                <Toggle on={notifs[key]} onChange={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))} />
              </div>
            ))}
          </div>
          <SaveButton onClick={saveNotifs} saving={false} saved={notifSaved} label="Save Notifications" />
        </motion.div>

        {/* Display */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cardClass}>
          <h2 className="font-semibold text-[#0A0A0A] mb-5">Display</h2>
          <div className="space-y-5">
            <PillGroup label="Theme" options={["Light","Dark","System"]} value={theme} onChange={(v) => setTheme(v as typeof theme)} />
            <PillGroup label="Dashboard Layout" options={["Compact","Comfortable","Spacious"]} value={layout} onChange={(v) => setLayout(v as typeof layout)} />
            <PillGroup label="Default Time Range" options={["7D","30D","90D"]} value={timeRange} onChange={(v) => setTimeRange(v as typeof timeRange)} />
            <div>
              <p className="text-xs font-medium text-[#6B6B6B] mb-1.5">Currency</p>
              <p className="text-sm font-semibold text-[#0A0A0A]">Indian Rupee (INR)</p>
            </div>
          </div>
          <SaveButton onClick={saveDisplay} saving={false} saved={displaySaved} label="Save Display Settings" />
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border-2 border-[#FF3B30]/30 p-6">
          <h2 className="font-semibold text-[#FF3B30] mb-2">Danger Zone</h2>
          <p className="text-xs text-[#6B6B6B] mb-5">These actions are irreversible. Proceed with caution.</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setConfirmReset(true)}
              className="px-5 h-10 rounded-xl border-2 border-[#FF3B30] text-[#FF3B30] text-sm font-semibold hover:bg-[#FFF0EE] transition-colors">
              Reset to defaults
            </button>
          </div>
        </motion.div>
      </div>

      <ConfirmDialog open={confirmClear} title="Clear all data?" message="This will remove all transaction and alert data. This action cannot be undone."
        confirmLabel="Clear Data" danger onConfirm={() => { setConfirmClear(false); toast.success("Data cleared"); }} onCancel={() => setConfirmClear(false)} />
      <ConfirmDialog open={confirmReset} title="Reset to defaults?" message="All your settings will be reset to their default values."
        confirmLabel="Reset" danger onConfirm={resetToDefaults} onCancel={() => setConfirmReset(false)} />
    </AppLayout>
  );
}
