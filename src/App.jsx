import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ─── THEME (Stormy Morning) ─────────────────────────────────────────────────
const C = {
  gold:       "#6A89A7",
  goldLight:  "#BDDDFC",
  goldBorder: "#88BDF2",
  crimson:    "#384959",
  crimsonLight:"#EEF5FB",
  dark:       "#384959",
  bg:         "#F0F6FB",
  card:       "#FFFFFF",
  border:     "#D4E8F8",
  text:       "#1A2633",
  sub:        "#6A89A7",
  muted:      "#9AB3C9",
  green:      "#16A34A",
  greenLight: "#F0FDF4",
  greenBorder:"#BBF7D0",
  red:        "#DC2626",
  redLight:   "#FEF2F2",
  redBorder:  "#FECACA",
};

// ─── AUTH ─────────────────────────────────────────────────────────────────
// PINs are stored in .env.local (gitignored — never in the public repo)
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "";
const USER_PIN  = import.meta.env.VITE_USER_PIN  || "";
const AUTH_SESSION_KEY = "spcc_auth_level";

// ─── DATA ─────────────────────────────────────────────────────────────────
const EXPENSE_CATS = ["Umpiring", "Food & Drinks", "Travel/Gas", "League Fees", "Equipment/Balls"];
const INCOME_CATS  = ["Membership Fees", "PayPal Transfer", "Fundraising", "Other Income"];

const CURRENT_YEAR = new Date().getFullYear();
const now = new Date();
const AVAILABLE_YEARS = [2026, ...(now >= new Date("2027-01-01") ? [2027] : [])];

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────
function txFromRow(r) {
  return { id: r.id, type: r.type, date: r.date, category: r.category, amount: Number(r.amount), note: r.note || "", paypal: r.paypal, memberName: r.member_name || "", receiptUrl: r.receipt_url || null };
}
function memberFromRow(r) {
  return { id: r.id, name: r.name, email: r.email || "", phone: r.phone || "", paid: r.paid, joinDate: r.join_date, duesAmount: r.dues_amount != null ? Number(r.dues_amount) : null };
}
function eventFromRow(r) {
  return { id: r.id, name: r.name, type: r.type, date: r.date, location: r.location || "", notes: r.notes || "", cost: Number(r.cost) || 0 };
}
async function fetchAllData(year) {
  const [txRes, memRes, evRes, catRes] = await Promise.all([
    supabase.from("transactions").select("*").eq("year", year).order("date", { ascending: false }),
    supabase.from("members").select("*").eq("year", year),
    supabase.from("events").select("*").eq("year", year).order("date", { ascending: false }),
    supabase.from("custom_categories").select("*").eq("year", year),
  ]);
  return {
    transactions: (txRes.data || []).map(txFromRow),
    members: (memRes.data || []).map(memberFromRow),
    events: (evRes.data || []).map(eventFromRow),
    customExpCats: (catRes.data || []).filter(c => c.cat_type === "expense").map(c => c.name),
    customIncCats: (catRes.data || []).filter(c => c.cat_type === "income").map(c => c.name),
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
const fmt   = (n) => `$${Math.abs(n).toFixed(2)}`;
const today = () => new Date().toISOString().split("T")[0];
const FORECAST_SETTINGS_KEY = "spcc_forecast_settings";

function loadForecastSettings() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(FORECAST_SETTINGS_KEY));
  } catch {
    return null;
  }
}

const TABS = ["Dashboard", "Finances", "Members", "Forecast"];

const AVATAR_COLORS = ["#C9973C","#9B2335","#2563EB","#059669","#7C3AED","#0891B2","#D97706","#65A30D","#DB2777","#0E7490"];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}
function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: getAvatarColor(name), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, letterSpacing: 0.5, userSelect: "none" }}>
      {getInitials(name)}
    </div>
  );
}

// ─── RECEIPT GENERATOR ───────────────────────────────────────────────────
function generateReceipt(t, year, receiptNum) {
  const w = window.open("", "_blank");
  const receiptId = `${year}-${String(receiptNum).padStart(3, "0")}`;
  const dateStr = new Date(t.date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const logoUrl = window.location.origin + "/spcc-expenses/logo.png";
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${receiptId}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:520px;margin:40px auto;padding:24px;color:#1a1a1a}
  .hdr{text-align:center;border-bottom:3px solid #C9973C;padding-bottom:20px;margin-bottom:24px}
  .logo{width:72px;height:72px;object-fit:contain;margin-bottom:8px}
  .club{font-size:20px;font-weight:bold;color:#9B2335;margin:4px 0}
  .subtitle{font-size:13px;color:#666}
  .rid{font-size:11px;color:#999;margin-top:6px;font-family:monospace}
  .row{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid #eee;font-size:14px}
  .lbl{color:#666}.val{font-weight:600}
  .total{text-align:center;margin:24px 0;font-size:22px;font-weight:bold;color:#C9973C}
  .footer{text-align:center;font-size:12px;color:#888;margin-top:24px;line-height:1.6}
  .btn{display:block;margin:20px auto;padding:10px 28px;background:#C9973C;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit}
  @media print{.btn{display:none}}
</style></head><body>
<div class="hdr">
  <img src="${logoUrl}" class="logo" onerror="this.style.display='none'" />
  <div class="club">Spokane Spartans Cricket Club</div>
  <div class="subtitle">Official Membership Receipt</div>
  <div class="rid">Receipt #${receiptId}</div>
</div>
<div class="row"><span class="lbl">Member Name</span><span class="val">${t.memberName || "—"}</span></div>
<div class="row"><span class="lbl">Date</span><span class="val">${dateStr}</span></div>
<div class="row"><span class="lbl">Description</span><span class="val">Membership Fees – ${year} Season</span></div>
<div class="row"><span class="lbl">Payment Method</span><span class="val">${t.paypal ? "PayPal" : "Cash / Other"}${t.note ? " · " + t.note : ""}</span></div>
<div class="total">Amount Paid: $${t.amount.toFixed(2)}</div>
<div class="footer">This receipt is issued by the Spokane Spartans Cricket Club.<br><br><strong>Issued:</strong> ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
<button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
</body></html>`);
  w.document.close();
}

const icons = {
  Dashboard: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Finances:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Members:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Forecast:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="3 12 9 6 13 10 21 2"/><line x1="3" y1="21" x2="21" y2="21"/></svg>,
};

// ─── PIN GATE (full-screen, blocks all access until authenticated) ─────────
function PinGate({ onAuth }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  const attempt = () => {
    if (ADMIN_PIN && pin === ADMIN_PIN) { onAuth("admin"); return; }
    if (USER_PIN  && pin === USER_PIN)  { onAuth("user");  return; }
    setErr(true); setPin(""); setTimeout(() => setErr(false), 1500);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 28px", width: "100%", maxWidth: 340, boxShadow: "0 20px 60px rgba(56,73,89,0.15)", border: `1px solid ${C.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/spcc-expenses/logo.png" alt="SPCC" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.gold}`, marginBottom: 16 }} onError={e => { e.target.style.display = "none"; }} />
          <div style={{ fontWeight: "800", fontSize: 20, color: C.dark, marginBottom: 6 }}>SPCC</div>
          <div style={{ fontSize: 14, color: C.sub }}>Enter your PIN to access finances</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Don't have a PIN? Contact the club admin.</div>
        </div>
        <input
          type="password"
          autoFocus
          placeholder="Enter PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
          style={{ ...inputStyle, textAlign: "center", fontSize: 18, letterSpacing: 4, border: `2px solid ${err ? C.red : C.border}`, transition: "border-color 0.2s" }}
        />
        {err && <div style={{ color: C.red, fontSize: 12, textAlign: "center", marginTop: 6 }}>Incorrect PIN — try again</div>}
        <button onClick={attempt} style={{ ...saveBtnStyle, marginTop: 14 }}>Access Finances</button>
      </div>
    </div>
  );
}

// ─── ADMIN PIN MODAL (viewer → admin escalation) ──────────────────────────
function AdminPinModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  const attempt = () => {
    if (pin === ADMIN_PIN) { onSuccess(); onClose(); }
    else { setErr(true); setPin(""); setTimeout(() => setErr(false), 1500); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,25,23,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
          <div style={{ fontWeight: "800", fontSize: 18, color: C.dark }}>Admin Access</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>Enter your Admin PIN to unlock editing</div>
        </div>
        <input
          type="password"
          autoFocus
          placeholder="Enter Admin PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
          style={{ ...inputStyle, textAlign: "center", fontSize: 18, letterSpacing: 4, border: `2px solid ${err ? C.red : C.border}`, transition: "border-color 0.2s" }}
        />
        {err && <div style={{ color: C.red, fontSize: 12, textAlign: "center", marginTop: 6 }}>Incorrect PIN — try again</div>}
        <button onClick={attempt} style={{ ...saveBtnStyle, marginTop: 14 }}>Unlock</button>
        <button onClick={onClose} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: C.sub, cursor: "pointer", fontSize: 13, padding: "8px 0", fontFamily: "inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

// ─── APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authLevel, setAuthLevel] = useState(() => sessionStorage.getItem(AUTH_SESSION_KEY));
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [data, setData]       = useState(null);
  const [tab, setTab]         = useState("Dashboard");
  const [showAdminPin, setShowAdminPin] = useState(false);

  const signOut = () => { sessionStorage.removeItem(AUTH_SESSION_KEY); setAuthLevel(null); };

  // 10-minute inactivity auto-logout
  useEffect(() => {
    if (!authLevel) return;
    let timer = setTimeout(signOut, INACTIVITY_MS);
    const reset = () => { clearTimeout(timer); timer = setTimeout(signOut, INACTIVITY_MS); };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [authLevel]);

  useEffect(() => {
    const reload = async () => { setData(null); setData(await fetchAllData(selectedYear)); };
    reload();
  }, [selectedYear]);

  // ── DB operations ────────────────────────────────────────────────────────
  const addTx = async (form, file) => {
    const { data: rows } = await supabase.from("transactions").insert({
      year: selectedYear, type: form.type, date: form.date,
      category: form.category, amount: form.amount,
      note: form.note || "", paypal: form.paypal || false,
      member_name: form.memberName || "",
    }).select();
    if (file && rows?.[0]) {
      const ext = file.name.split(".").pop();
      const path = `${rows[0].id}.${ext}`;
      await supabase.storage.from("receipts").upload(path, file);
      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
      await supabase.from("transactions").update({ receipt_url: urlData.publicUrl }).eq("id", rows[0].id);
    }
    setData(await fetchAllData(selectedYear));
  };
  const delTx = async (id) => {
    await supabase.from("transactions").delete().eq("id", id);
    setData(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }));
  };
  const uploadReceipt = async (id, file) => {
    const ext = file.name.split(".").pop();
    const path = `${id}.${ext}`;
    await supabase.storage.from("receipts").upload(path, file, { upsert: true });
    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
    await supabase.from("transactions").update({ receipt_url: urlData.publicUrl }).eq("id", id);
    setData(d => ({ ...d, transactions: d.transactions.map(t => t.id === id ? { ...t, receiptUrl: urlData.publicUrl } : t) }));
  };
  const addCat = async (catType, name) => {
    await supabase.from("custom_categories").insert({ year: selectedYear, cat_type: catType, name });
    setData(await fetchAllData(selectedYear));
  };
  const addMember = async (form) => {
    await supabase.from("members").insert({
      year: selectedYear, name: form.name, email: form.email || "",
      phone: form.phone || "", paid: form.paid || false,
      join_date: form.joinDate || today(),
    });
    setData(await fetchAllData(selectedYear));
  };
  const togglePaid = async (id) => {
    const member = data.members.find(m => m.id === id);
    await supabase.from("members").update({ paid: !member.paid }).eq("id", id);
    setData(d => ({ ...d, members: d.members.map(m => m.id === id ? { ...m, paid: !m.paid } : m) }));
  };
  const delMember = async (id) => {
    await supabase.from("members").delete().eq("id", id);
    setData(d => ({ ...d, members: d.members.filter(m => m.id !== id) }));
  };
  const saveAmt = async (id, val) => {
    await supabase.from("members").update({ dues_amount: val }).eq("id", id);
    setData(d => ({ ...d, members: d.members.map(m => m.id === id ? { ...m, duesAmount: val } : m) }));
  };

  if (authLevel === null) return (
    <PinGate onAuth={(level) => { sessionStorage.setItem(AUTH_SESSION_KEY, level); setAuthLevel(level); }} />
  );

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.dark, fontFamily: "system-ui, sans-serif", fontSize: 18 }}>
      Loading...
    </div>
  );

  const isAdmin = authLevel === "admin";
  const allExpCats = [...EXPENSE_CATS, ...data.customExpCats];
  const allIncCats = [...INCOME_CATS,  ...data.customIncCats];
  const balance  = data.transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const totalIn  = data.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalOut = data.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: C.text }}>
      {showAdminPin && <AdminPinModal onClose={() => setShowAdminPin(false)} onSuccess={() => { sessionStorage.setItem(AUTH_SESSION_KEY, "admin"); setAuthLevel("admin"); }} />}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #6A89A7 100%)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 16px rgba(56,73,89,0.3)", borderRadius: "0 0 28px 28px" }}>
        <img src="/spcc-expenses/logo.png" alt="Spartans"
          style={{ height: 64, width: 64, objectFit: "cover", flexShrink: 0, borderRadius: "50%", border: `3px solid ${C.gold}`, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(56,73,89,0.6)", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: "700" }}>BALANCE {selectedYear}</div>
            <div style={{ fontSize: 22, fontWeight: "800", color: balance >= 0 ? "#384959" : "#B91C1C", lineHeight: 1.1 }}>
              {balance >= 0 ? "" : "-"}{fmt(balance)}
            </div>
          </div>
          <button
              onClick={() => {
                if (isAdmin) { sessionStorage.setItem(AUTH_SESSION_KEY, "user"); setAuthLevel("user"); }
                else { setShowAdminPin(true); }
              }}
              style={{ background: isAdmin ? "rgba(56,73,89,0.15)" : "rgba(56,73,89,0.12)", border: `1.5px solid ${isAdmin ? "#384959" : "rgba(56,73,89,0.35)"}`, borderRadius: 20, padding: "5px 13px", cursor: "pointer", fontSize: 12, color: "#384959", fontFamily: "inherit", fontWeight: "700", whiteSpace: "nowrap" }}
            >
              {isAdmin ? "🔓 Admin" : "👁 Viewer"}
            </button>
        </div>
      </div>

      {/* Year Selector */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "8px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
        {AVAILABLE_YEARS.map(y => (
          <button key={y} onClick={() => setSelectedYear(y)}
            style={{ padding: "5px 16px", borderRadius: 20, border: `1.5px solid ${selectedYear === y ? C.gold : C.border}`, background: selectedYear === y ? C.goldLight : "transparent", color: selectedYear === y ? "#92672A" : C.sub, fontWeight: selectedYear === y ? "700" : "500", cursor: "pointer", fontSize: 12, fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
            {y}
          </button>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "11px 4px 10px", border: "none", background: "transparent", color: tab === t ? C.gold : C.muted, cursor: "pointer", fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", fontFamily: "inherit", fontWeight: tab === t ? "700" : "500", borderBottom: `2px solid ${tab === t ? C.gold : "transparent"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "color 0.15s" }}>
            {icons[t]}{t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 80px", maxWidth: 640, margin: "0 auto" }}>
        {tab === "Dashboard" && <Dashboard data={data} totalIn={totalIn} totalOut={totalOut} />}
        {tab === "Finances"  && <Finances  data={data} isAdmin={isAdmin} allExpCats={allExpCats} allIncCats={allIncCats} onAddTx={addTx} onDelTx={delTx} onAddCat={addCat} year={selectedYear} onUploadReceipt={uploadReceipt} />}
        {tab === "Members"   && <Members   data={data} isAdmin={isAdmin} onAddMember={addMember} onTogglePaid={togglePaid} onDelMember={delMember} onSaveAmt={saveAmt} />}
        {tab === "Forecast"  && <Forecast  data={data} isAdmin={isAdmin} />}
      </div>

      {/* Sign Out — fixed bottom left */}
      <button
        onClick={signOut}
        title="Sign out"
        style={{ position: "fixed", bottom: 20, left: 20, zIndex: 50, background: "#fff", border: "1.5px solid rgba(220,38,38,0.3)", borderRadius: 12, padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 2px 10px rgba(0,0,0,0.12)", fontFamily: "inherit" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: "700", color: "#DC2626" }}>Sign Out</span>
      </button>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard({ data, totalIn, totalOut }) {
  const recent      = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const paidMembers = data.members.filter(m => m.paid).length;
  const expByCategory = {};
  data.transactions.filter(t => t.type === "expense").forEach(t => {
    expByCategory[t.category] = (expByCategory[t.category] || 0) + t.amount;
  });
  const incByCategory = {};
  data.transactions.filter(t => t.type === "income").forEach(t => {
    incByCategory[t.category] = (incByCategory[t.category] || 0) + t.amount;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Income",   value: fmt(totalIn),  color: C.green,   bg: C.greenLight,  border: C.greenBorder },
          { label: "Expenses", value: fmt(totalOut), color: C.red,     bg: C.redLight,    border: C.redBorder },
          { label: "Members",  value: `${paidMembers}/${data.members.length}`, color: C.gold, bg: C.goldLight, border: C.goldBorder },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontWeight: "600" }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: "800", color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {Object.keys(incByCategory).length > 0 && (
        <Card title="Income Breakdown">
          {Object.entries(incByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: C.text, fontWeight: "500" }}>{cat}</span>
                <span style={{ color: C.green, fontWeight: "600" }}>{fmt(amt)}</span>
              </div>
              <div style={{ height: 5, background: "#F3F0EC", borderRadius: 3 }}>
                <div style={{ height: 5, borderRadius: 3, background: C.green, width: `${Math.min(100, (amt / totalIn) * 100)}%`, transition: "width 0.4s" }} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {Object.keys(expByCategory).length > 0 && (
        <Card title="Expense Breakdown">
          {Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: C.text, fontWeight: "500" }}>{cat}</span>
                <span style={{ color: C.crimson, fontWeight: "600" }}>{fmt(amt)}</span>
              </div>
              <div style={{ height: 5, background: "#F3F0EC", borderRadius: 3 }}>
                <div style={{ height: 5, borderRadius: 3, background: C.crimson, width: `${Math.min(100, (amt / totalOut) * 100)}%`, transition: "width 0.4s" }} />
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card title="Recent Transactions">
        {recent.length === 0 ? <EmptyState text="No transactions yet" /> : recent.map(t => <TxRow key={t.id} t={t} />)}
      </Card>

      {data.events.filter(e => new Date(e.date) >= new Date(today())).length > 0 && (
        <Card title="Upcoming Events">
          {[...data.events].sort((a, b) => new Date(a.date) - new Date(b.date)).filter(e => new Date(e.date) >= new Date(today())).slice(0, 3).map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: "600" }}>{e.name}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{e.type} · {e.date}</div>
              </div>
              {e.cost > 0 && <div style={{ fontSize: 13, color: C.crimson, fontWeight: "600" }}>{fmt(e.cost)}</div>}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── FINANCES ────────────────────────────────────────────────────────────
function Finances({ data, isAdmin, allExpCats, allIncCats, onAddTx, onDelTx, onAddCat, year, onUploadReceipt }) {
  const blank = { type: "expense", date: today(), category: allExpCats[0], amount: "", note: "", paypal: false, memberName: "" };
  const [form, setForm]       = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat]   = useState("");
  const [catType, setCatType] = useState("expense");
  const [filter, setFilter]   = useState("all");
  const [receiptFile, setReceiptFile] = useState(null);

  const addTx = async () => {
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return;
    await onAddTx({ ...form, amount: parseFloat(form.amount) }, receiptFile);
    setForm(blank); setShowForm(false); setReceiptFile(null);
  };
  const delTx = async (id) => { await onDelTx(id); };
  const addCat = async () => {
    if (!newCat.trim()) return;
    await onAddCat(catType, newCat.trim());
    setNewCat("");
  };

  const filtered = data.transactions.filter(t => filter === "all" || t.type === filter).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {isAdmin && (
        <ActionBtn onClick={() => setShowForm(!showForm)} label={showForm ? "Cancel" : "+ Add Transaction"} />
      )}
      {!isAdmin && (
        <div style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92672A", display: "flex", alignItems: "center", gap: 8 }}>
          <span>🔐</span> Sign in as Admin to add or edit transactions.
        </div>
      )}

      {isAdmin && showForm && (
        <FormCard>
          {/* form contents unchanged */}
          <div>
            <FieldLabel>Type</FieldLabel>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {["income", "expense"].map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t, category: t === "expense" ? allExpCats[0] : allIncCats[0] })}
                  style={{ flex: 1, padding: "9px 0", border: `2px solid ${form.type === t ? (t === "income" ? C.green : C.crimson) : C.border}`, borderRadius: 8, background: form.type === t ? (t === "income" ? C.greenLight : C.crimsonLight) : "#fff", color: form.type === t ? (t === "income" ? C.green : C.crimson) : C.sub, fontWeight: "700", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                  {t === "income" ? "💰 Income" : "💸 Expense"}
                </button>
              ))}
            </div>
          </div>
          {form.type === "income" && (
            <FormRow label="Member Name">
              <select value={form.memberName} onChange={e => setForm({ ...form, memberName: e.target.value })} style={inputStyle}>
                <option value="">— Select member —</option>
                {data.members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                <option value="__other__">Other…</option>
              </select>
              {form.memberName === "__other__" && (
                <input placeholder="Enter name" onChange={e => setForm({ ...form, memberName: e.target.value })} style={{ ...inputStyle, marginTop: 6 }} />
              )}
            </FormRow>
          )}
          <FormRow label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Category">
            <select value={(form.type === "expense" ? allExpCats : allIncCats).includes(form.category) ? form.category : "__custom__"}
              onChange={e => setForm({ ...form, category: e.target.value === "__custom__" ? "" : e.target.value })} style={inputStyle}>
              {(form.type === "expense" ? allExpCats : allIncCats).map(c => <option key={c}>{c}</option>)}
              <option value="__custom__">Other (type custom)…</option>
            </select>
            {!(form.type === "expense" ? allExpCats : allIncCats).includes(form.category) && (
              <input placeholder="Custom category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, marginTop: 6 }} />
            )}
          </FormRow>
          <FormRow label="Amount ($)"><input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Note"><input placeholder="Optional note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="PayPal?"><input type="checkbox" checked={form.paypal} onChange={e => setForm({ ...form, paypal: e.target.checked })} style={{ accentColor: C.gold, width: 18, height: 18 }} /></FormRow>
          {form.type === "expense" && (
            <FormRow label="Receipt (optional)">
              <input type="file" accept="image/*,application/pdf" onChange={e => setReceiptFile(e.target.files[0] || null)} style={{ ...inputStyle, padding: "6px 10px", fontSize: 13 }} />
            </FormRow>
          )}
          <button onClick={addTx} style={saveBtnStyle}>Save Transaction</button>
        </FormCard>
      )}

      <Card title="Transactions">
        {!isAdmin && <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", marginBottom: 10 }}>Need a membership receipt? Contact your admin.</div>}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["all", "income", "expense"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...pillStyle, background: filter === f ? C.goldLight : "#F9FAFB", color: filter === f ? "#92672A" : C.sub, borderColor: filter === f ? C.goldBorder : C.border, fontWeight: filter === f ? "700" : "500" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? <EmptyState text="No transactions" /> : filtered.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1 }}><TxRow t={t} /></div>
            {t.type === "income" && t.category === "Membership Fees" && isAdmin && (
              <button onClick={() => {
                const membershipTxs = data.transactions.filter(x => x.type === "income" && x.category === "Membership Fees");
                const num = membershipTxs.length - membershipTxs.findIndex(x => x.id === t.id);
                generateReceipt(t, year, num);
              }} style={{ background: "transparent", border: "none", color: C.gold, cursor: "pointer", fontSize: 18, padding: "0 4px" }} title="Download Receipt">🧾</button>
            )}
            {t.type === "expense" && t.receiptUrl && (
              <a href={t.receiptUrl} target="_blank" rel="noreferrer" style={{ color: C.gold, fontSize: 18, padding: "0 4px", textDecoration: "none" }} title="View Receipt">📎</a>
            )}
            {t.type === "expense" && !t.receiptUrl && isAdmin && (
              <label style={{ color: C.muted, fontSize: 18, padding: "0 4px", cursor: "pointer" }} title="Attach Receipt">
                📎<input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={e => e.target.files[0] && onUploadReceipt(t.id, e.target.files[0])} />
              </label>
            )}
            {isAdmin && <button onClick={() => { if (window.confirm(`Delete this ${t.type} of ${fmt(t.amount)}?`)) delTx(t.id); }} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }} title="Delete">×</button>}
          </div>
        ))}
      </Card>

      {isAdmin && (
        <Card title="Custom Categories">
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["expense", "income"].map(t => (
              <button key={t} onClick={() => setCatType(t)} style={{ ...pillStyle, background: catType === t ? (t === "expense" ? C.crimsonLight : C.greenLight) : "#F9FAFB", color: catType === t ? (t === "expense" ? C.crimson : C.green) : C.sub, borderColor: catType === t ? (t === "expense" ? C.redBorder : C.greenBorder) : C.border }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder={`New ${catType} category`} value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addCat()} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addCat} style={{ ...saveBtnStyle, padding: "9px 16px", width: "auto" }}>Add</button>
          </div>
          {(catType === "expense" ? data.customExpCats : data.customIncCats).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {(catType === "expense" ? data.customExpCats : data.customIncCats).map(c => (
                <span key={c} style={{ background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#92672A" }}>{c}</span>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── MEMBERS ─────────────────────────────────────────────────────────────
function Members({ data, isAdmin, onAddMember, onTogglePaid, onDelMember, onSaveAmt }) {
  const [form, setForm]         = useState({ name: "", email: "", phone: "", paid: false, joinDate: today() });
  const [showForm, setShowForm] = useState(false);
  const [editingAmtId, setEditingAmtId] = useState(null);
  const [editingAmt, setEditingAmt]     = useState("");

  const addMember = async () => {
    if (!form.name.trim()) return;
    await onAddMember(form);
    setForm({ name: "", email: "", phone: "", paid: false, joinDate: today() }); setShowForm(false);
  };
  const togglePaid = async (id) => { await onTogglePaid(id); };
  const delMember  = async (id) => { await onDelMember(id); };

  const saveAmt = async (id) => {
    const val = parseFloat(editingAmt);
    if (!isNaN(val) && val >= 0) { await onSaveAmt(id, val); }
    setEditingAmtId(null);
  };

  const paid = data.members.filter(m => m.paid).length;
  const amountPaidFor = (m) => m.duesAmount != null ? m.duesAmount :
    data.transactions.filter(t => t.type === "income" && t.memberName === m.name).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: C.sub, fontWeight: "500" }}>
          <span style={{ fontWeight: "800", color: C.gold, fontSize: 15 }}>{paid}</span>
          <span style={{ color: C.muted }}>/{data.members.length}</span> dues paid
        </div>
        {isAdmin && <ActionBtn onClick={() => setShowForm(!showForm)} label={showForm ? "Cancel" : "+ Add Member"} />}
      </div>

      {isAdmin && showForm && (
        <FormCard>
          {[["Name *","name","text","Full name"],["Email","email","email","email@example.com"],["Phone","phone","tel","Phone number"]].map(([label, key, type, ph]) => (
            <FormRow key={key} label={label}>
              <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
            </FormRow>
          ))}
          <FormRow label="Dues Paid?">
            <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} style={{ accentColor: C.gold, width: 18, height: 18 }} />
          </FormRow>
          <button onClick={addMember} style={saveBtnStyle}>Save Member</button>
        </FormCard>
      )}

      <Card title={`Members (${data.members.length})`}>
        {data.members.length === 0 ? <EmptyState text="No members added yet" /> : data.members.map(m => {
          const amtPaid = amountPaidFor(m);
          const isEditingAmt = editingAmtId === m.id;
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={m.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                  {isAdmin && isEditingAmt ? (
                    <>
                      <span style={{ color: C.green, fontWeight: "700" }}>$</span>
                      <input
                        type="number"
                        autoFocus
                        value={editingAmt}
                        onChange={e => setEditingAmt(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveAmt(m.id); if (e.key === "Escape") setEditingAmtId(null); }}
                        style={{ ...inputStyle, width: 90, padding: "2px 6px", fontSize: 12, display: "inline-block" }}
                      />
                      <button onClick={() => saveAmt(m.id)} style={{ fontSize: 11, color: C.green, background: "transparent", border: "none", cursor: "pointer", fontWeight: "700", fontFamily: "inherit", padding: 0 }}>✓</button>
                      <button onClick={() => setEditingAmtId(null)} style={{ fontSize: 11, color: C.muted, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>✕</button>
                    </>
                  ) : (
                    <span
                      onClick={() => { if (isAdmin) { setEditingAmtId(m.id); setEditingAmt(amtPaid.toString()); } }}
                      style={{ color: amtPaid > 0 ? C.green : C.muted, fontWeight: amtPaid > 0 ? "700" : "400", cursor: isAdmin ? "pointer" : "default", borderBottom: isAdmin ? `1px dashed ${C.muted}` : "none" }}
                    >
                      {amtPaid > 0 ? `${fmt(amtPaid)} paid` : "No payments"}
                    </span>
                  )}
                  {m.email ? <span>· {m.email}</span> : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <button
                  onClick={() => isAdmin && togglePaid(m.id)}
                  style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, border: `1px solid ${m.paid ? C.greenBorder : C.redBorder}`, background: m.paid ? C.greenLight : C.redLight, color: m.paid ? C.green : C.red, cursor: isAdmin ? "pointer" : "default", fontWeight: "700", fontFamily: "inherit" }}
                >
                  {m.paid ? "✓ PAID" : "UNPAID"}
                </button>
                {isAdmin && <button onClick={() => delMember(m.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>remove</button>}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── FORECAST ───────────────────────────────────────────────────────────
function Forecast({ data, isAdmin }) {
  const savedSettings = loadForecastSettings() || {};
  const [membershipEstimate, setMembershipEstimate] = useState(() => savedSettings.membershipEstimate ?? 4700);
  const [carryover, setCarryover] = useState(() => savedSettings.carryover ?? 0);
  const [totalGames, setTotalGames] = useState(() => savedSettings.totalGames ?? 11);
  const [homeGames, setHomeGames] = useState(() => savedSettings.homeGames ?? 5);
  const [startMonth, setStartMonth] = useState(() => savedSettings.startMonth ?? "Apr");
  const [endMonth, setEndMonth] = useState(() => savedSettings.endMonth ?? "Aug");
  const [umpireFee, setUmpireFee] = useState(() => savedSettings.umpireFee ?? 40);
  const [homeFood, setHomeFood] = useState(() => savedSettings.homeFood ?? 130);
  const [awayGas, setAwayGas] = useState(() => savedSettings.awayGas ?? 300);
  const [groundFee, setGroundFee] = useState(() => savedSettings.groundFee ?? 300);
  const [clubFees, setClubFees] = useState(() => savedSettings.clubFees ?? 500);
  const [leagueFees, setLeagueFees] = useState(() => savedSettings.leagueFees ?? 900);
  const [equipmentCost, setEquipmentCost] = useState(() => savedSettings.equipmentCost ?? 400);
  const [paintCost, setPaintCost] = useState(() => savedSettings.paintCost ?? 150);

  useEffect(() => {
    if (!isAdmin) return;
    const payload = {
      membershipEstimate, carryover, totalGames, homeGames,
      startMonth, endMonth, umpireFee, homeFood, awayGas,
      groundFee, clubFees, leagueFees, equipmentCost, paintCost,
    };
    localStorage.setItem(FORECAST_SETTINGS_KEY, JSON.stringify(payload));
  }, [isAdmin, membershipEstimate, carryover, totalGames, homeGames, startMonth, endMonth, umpireFee, homeFood, awayGas, groundFee, clubFees, leagueFees, equipmentCost, paintCost]);

  const seasonMonths = ["Apr", "May", "Jun", "Jul", "Aug"];
  const startIndex = seasonMonths.indexOf(startMonth);
  const endIndex = seasonMonths.indexOf(endMonth);
  const monthsInSeason = endIndex >= startIndex ? seasonMonths.slice(startIndex, endIndex + 1) : seasonMonths.slice(startIndex).concat(seasonMonths.slice(0, endIndex + 1));

  const awayGames = Math.max(0, totalGames - homeGames);
  const membershipIncome = Number(membershipEstimate);
  const carryoverIncome = Number(carryover);
  const projectedIncome = membershipIncome; // only membership fees are forecasted
  const totalSeasonIncome = membershipIncome + carryoverIncome;

  const oneTimeExpenses = Number(clubFees) + Number(leagueFees) + Number(equipmentCost) + Number(paintCost);
  const gameExpenses = (Number(umpireFee) * totalGames) + (Number(homeFood) * homeGames) + (Number(awayGas) * awayGames);
  const groundExpenses = Number(groundFee) * monthsInSeason.length;
  const totalExpenses = oneTimeExpenses + gameExpenses + groundExpenses;
  const seasonNet = totalSeasonIncome - totalExpenses;
  const balance = data.transactions.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);

  const distributeGames = (months, games) => {
    const allocation = months.map(() => 0);
    const aprIndex = months.indexOf("Apr");
    const augIndex = months.indexOf("Aug");

    if (aprIndex !== -1 && augIndex !== -1 && aprIndex < augIndex && months.length >= 3) {
      let remaining = games;
      if (remaining > 0) { allocation[aprIndex] = 1; remaining--; }
      if (remaining > 0) { allocation[augIndex] = 1; remaining--; }
      const middleIndexes = months.map((_, idx) => idx).filter(idx => idx !== aprIndex && idx !== augIndex);
      const base = middleIndexes.length > 0 ? Math.floor(remaining / middleIndexes.length) : 0;
      let extra = remaining % (middleIndexes.length || 1);
      middleIndexes.forEach(idx => {
        allocation[idx] = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--; 
      });
      return allocation;
    }

    const base = Math.floor(games / months.length);
    let extra = games % months.length;
    return months.map((_, idx) => base + (idx < extra ? 1 : 0));
  };

  const gameCounts = distributeGames(monthsInSeason, totalGames);
  const gameCostPerGame = totalGames > 0 ? (Number(umpireFee) + (Number(homeFood) * (homeGames / totalGames)) + (Number(awayGas) * (awayGames / totalGames))) : 0;

  const monthNumber = { Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08" };
  const actualSeries = monthsInSeason.map(label => {
    const monthKey = monthNumber[label] || "00";
    const income = data.transactions.filter(t => t.type === "income" && t.date.slice(5, 7) === monthKey).reduce((sum, t) => sum + t.amount, 0);
    const expense = data.transactions.filter(t => t.type === "expense" && t.date.slice(5, 7) === monthKey).reduce((sum, t) => sum + t.amount, 0);
    return { label, actualIncome: income, actualExpense: expense };
  });

  const monthlyForecast = monthsInSeason.map((label, index) => {
    const gameCount = gameCounts[index] ?? 0;
    const income = index === 0 ? projectedIncome : 0;
    const extraAprilFees = index === 0 ? Number(clubFees) + Number(leagueFees) : 0;
    const expense = Number(groundFee) + (gameCount * gameCostPerGame) + extraAprilFees;
    return {
      label,
      gameCount,
      projectedIncome: income,
      projectedExpense: expense,
      actualIncome: index === 0 ? actualSeries[index].actualIncome + carryoverIncome : actualSeries[index].actualIncome,
      actualExpense: actualSeries[index].actualExpense,
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {isAdmin ? (
        <>
          <Card title="Forecast Settings">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <FieldLabel>Membership fees forecast</FieldLabel>
                <input type="number" value={membershipEstimate} onChange={e => setMembershipEstimate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Carryover from last year</FieldLabel>
                <input type="number" value={carryover} onChange={e => setCarryover(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Total games</FieldLabel>
                <input type="number" min="0" value={totalGames} onChange={e => setTotalGames(Math.max(0, Number(e.target.value)))} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Home games</FieldLabel>
                <input type="number" min="0" max={totalGames} value={homeGames} onChange={e => setHomeGames(Math.min(totalGames, Math.max(0, Number(e.target.value))))} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Season start</FieldLabel>
                <select value={startMonth} onChange={e => setStartMonth(e.target.value)} style={inputStyle}>
                  {seasonMonths.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Season end</FieldLabel>
                <select value={endMonth} onChange={e => setEndMonth(e.target.value)} style={inputStyle}>
                  {seasonMonths.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
              Season is spread over {monthsInSeason.length} month(s)
            </div>
          </Card>

          <Card title="Expense Assumptions">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <FieldLabel>Club fees (one-time)</FieldLabel>
            <input type="number" value={clubFees} onChange={e => setClubFees(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>League fees (one-time)</FieldLabel>
            <input type="number" value={leagueFees} onChange={e => setLeagueFees(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Equipment / balls</FieldLabel>
            <input type="number" value={equipmentCost} onChange={e => setEquipmentCost(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Paint / ground prep</FieldLabel>
            <input type="number" value={paintCost} onChange={e => setPaintCost(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Umpiring fees per game</FieldLabel>
            <input type="number" value={umpireFee} onChange={e => setUmpireFee(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Home game food</FieldLabel>
            <input type="number" value={homeFood} onChange={e => setHomeFood(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Away game gas</FieldLabel>
            <input type="number" value={awayGas} onChange={e => setAwayGas(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <FieldLabel>Ground fee monthly</FieldLabel>
            <input type="number" value={groundFee} onChange={e => setGroundFee(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </Card>
        </>
      ) : (
        <Card title="Forecast settings">
          <div style={{ fontSize: 13, color: C.muted }}>Sign in as admin to change the season model.</div>
        </Card>
      )}

      <Card title="Season Forecast Overview">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Current balance", value: fmt(balance), color: balance >= 0 ? C.green : C.red },
            { label: "Projected season membership income", value: fmt(projectedIncome), color: C.green },
            { label: "Carryover available", value: fmt(carryoverIncome), color: C.gold },
            { label: "Total season income", value: fmt(totalSeasonIncome), color: C.green },
            { label: "Projected season expenses", value: fmt(totalExpenses), color: C.red },
            { label: "Projected ending balance", value: fmt(seasonNet), color: seasonNet >= 0 ? C.green : C.red },
            { label: "Away games", value: awayGames, color: C.gold },
          ].map(item => (
            <div key={item.label} style={{ background: item.color === C.green ? C.greenLight : item.color === C.red ? C.redLight : "#fff", border: `1px solid ${item.color === C.green ? C.greenBorder : item.color === C.red ? C.redBorder : C.border}`, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Season Breakdown">
        {(() => {
          const actualExpense = monthlyForecast.map(m => m.actualExpense);
          const projectedExpense = monthlyForecast.map(m => m.projectedExpense);
          const maxValue = Math.max(1, ...[...actualExpense, ...projectedExpense]);
          const totalActualIncome = actualSeries.reduce((sum, m) => sum + m.actualIncome, 0) + carryoverIncome;
          const totalProjectedIncome = projectedIncome + carryoverIncome;
          const maxIncomeValue = Math.max(1, totalProjectedIncome, totalActualIncome);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>Income</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 80, fontSize: 10, color: C.green }}>Projected</div>
                  <div style={{ flex: 1, height: 12, borderRadius: 999, background: "#ECFDF5", overflow: "hidden" }}>
                    <div style={{ width: `${(totalProjectedIncome / maxIncomeValue) * 100}%`, height: "100%", background: C.green }} />
                  </div>
                  <div style={{ width: 52, fontSize: 11, color: C.green, textAlign: "right" }}>{fmt(totalProjectedIncome)}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 80, fontSize: 10, color: C.gold }}>Actual</div>
                  <div style={{ flex: 1, height: 12, borderRadius: 999, background: "#FEFCE8", overflow: "hidden" }}>
                    <div style={{ width: `${(totalActualIncome / maxIncomeValue) * 100}%`, height: "100%", background: C.gold }} />
                  </div>
                  <div style={{ width: 52, fontSize: 11, color: C.gold, textAlign: "right" }}>{fmt(totalActualIncome)}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>Monthly Expenses</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "Projected expense", color: C.red },
                  { label: "Actual expense", color: C.green },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text }}>
                    <span style={{ width: 14, height: 10, borderRadius: 999, display: "inline-block", background: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>

              {monthlyForecast.map(month => {
                const projectedExpensePct = (month.projectedExpense / maxValue) * 100;
                const actualExpensePct = (month.actualExpense / maxValue) * 100;

                return (
                  <div key={month.label} style={{ display: "grid", gridTemplateColumns: "70px 1fr 120px", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, color: C.text, fontWeight: 700 }}>{month.label}</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{ width: 80, fontSize: 10, color: C.red }}>Proj exp</div>
                        <div style={{ flex: 1, height: 12, borderRadius: 999, background: "#FEF2F2", overflow: "hidden" }}>
                          <div style={{ width: `${projectedExpensePct}%`, height: "100%", background: C.red }} />
                        </div>
                        <div style={{ width: 52, fontSize: 11, color: C.red, textAlign: "right" }}>{fmt(month.projectedExpense)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <div style={{ width: 80, fontSize: 10, color: C.green }}>Actual exp</div>
                        <div style={{ flex: 1, height: 10, borderRadius: 999, background: "#DCFCE7", overflow: "hidden" }}>
                          <div style={{ width: `${actualExpensePct}%`, height: "100%", background: C.green }} />
                        </div>
                        <div style={{ width: 52, fontSize: 11, color: C.green, textAlign: "right" }}>{fmt(month.actualExpense)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: C.muted, textAlign: "right" }}>
                      <span>Games: {month.gameCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

// ─── SHARED ───────────────────────────────────────────────────────────────
function TxRow({ t }) {
  const dateStr = new Date(t.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0" }}>
      {t.memberName
        ? <Avatar name={t.memberName} size={38} />
        : <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.type === "income" ? C.greenLight : C.redLight, border: `1px solid ${t.type === "income" ? C.greenBorder : C.redBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{t.type === "income" ? "💰" : "💸"}</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.memberName || t.category}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{dateStr} · {t.category}{t.paypal ? " · PayPal" : ""}</div>
        {t.note && <div style={{ fontSize: 12, color: C.sub, marginTop: 2, fontStyle: "italic" }}>"{t.note}"</div>}
      </div>
      <div style={{ fontWeight: "700", color: t.type === "income" ? C.green : C.red, fontSize: 15, whiteSpace: "nowrap" }}>
        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12, fontWeight: "800" }}>{title}</div>
      {children}
    </div>
  );
}
function FormCard({ children }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 13, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>{children}</div>;
}
function FormRow({ label, children }) {
  return <div><FieldLabel>{label}</FieldLabel><div style={{ marginTop: 5 }}>{children}</div></div>;
}
function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, color: C.sub, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>{children}</div>;
}
function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "24px 0", color: C.muted, fontSize: 14 }}>{text}</div>;
}
function ActionBtn({ onClick, label }) {
  return <button onClick={onClick} style={actionBtnStyle}>{label}</button>;
}

const actionBtnStyle = {
  background: `linear-gradient(135deg, ${C.gold}, #A87830)`,
  border: "none", color: "#fff", padding: "10px 18px", borderRadius: 8,
  cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: "700",
  boxShadow: `0 2px 6px rgba(201,151,60,0.35)`,
};
const saveBtnStyle = {
  background: `linear-gradient(135deg, ${C.gold}, #A87830)`,
  border: "none", color: "#fff", padding: "11px 0", borderRadius: 8,
  cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: "700",
  width: "100%", boxShadow: `0 2px 6px rgba(201,151,60,0.35)`,
};
const pillStyle = {
  border: "1px solid", borderRadius: 20, padding: "5px 14px",
  cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: "500",
};
const inputStyle = {
  width: "100%", background: "#FAFAF9", border: `1px solid ${C.border}`,
  borderRadius: 8, color: C.text, padding: "9px 12px", fontSize: 14,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
