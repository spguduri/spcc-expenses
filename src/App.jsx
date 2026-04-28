import { useState, useEffect } from "react";

// ─── THEME (Spokane Spartans: gold + crimson) ─────────────────────────────
const C = {
  gold:       "#C9973C",
  goldLight:  "#F5E6C8",
  goldBorder: "#E6C87A",
  crimson:    "#9B2335",
  crimsonLight:"#FBEAEC",
  dark:       "#1C1917",
  bg:         "#F8F5F0",
  card:       "#FFFFFF",
  border:     "#EDE8DF",
  text:       "#1A1714",
  sub:        "#78716C",
  muted:      "#A8A29E",
  green:      "#16A34A",
  greenLight: "#F0FDF4",
  greenBorder:"#BBF7D0",
  red:        "#DC2626",
  redLight:   "#FEF2F2",
  redBorder:  "#FECACA",
};

// ─── AUTH ─────────────────────────────────────────────────────────────────
// PIN is stored in .env.local (gitignored — never in the public repo)
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "";

// ─── DATA ─────────────────────────────────────────────────────────────────
const EXPENSE_CATS = ["Umpiring", "Food & Drinks", "Travel/Gas", "League Fees", "Equipment/Balls"];
const INCOME_CATS  = ["Membership Fees", "PayPal Transfer", "Fundraising", "Other Income"];

const SEED_DATA = {
  transactions: [
    { id: 1, type: "income", date: "2026-04-11", category: "Membership Fees", amount: 400, note: "For Bhagat club fees 2026", paypal: false, memberName: "Krishnaswamy Jayaraman" },
    { id: 2, type: "income", date: "2026-04-11", category: "Membership Fees", amount: 250, note: "", paypal: false, memberName: "Bilal Hasan" },
    { id: 3, type: "income", date: "2026-04-10", category: "Membership Fees", amount: 200, note: "Paying half the amount now and half next week. Glen Coelho", paypal: false, memberName: "Glen Coelho" },
    { id: 4, type: "income", date: "2026-04-10", category: "Membership Fees", amount: 400, note: "Spokane Spartans Membership", paypal: false, memberName: "Pavan Pativada" },
    { id: 5, type: "income", date: "2026-04-08", category: "Membership Fees", amount: 400, note: "Cricket season 2026🏏", paypal: false, memberName: "Paramjot Singh" },
    { id: 6, type: "income", date: "2026-04-08", category: "Membership Fees", amount: 400, note: "", paypal: false, memberName: "Dhruv Kumar" },
    { id: 7, type: "income", date: "2026-04-07", category: "Membership Fees", amount: 400, note: "", paypal: false, memberName: "Hrishikesh Joshi" },
    { id: 8, type: "income", date: "2026-04-07", category: "Membership Fees", amount: 400, note: "Club dues 2026", paypal: false, memberName: "Krishnaswamy Jayaraman" },
    { id: 9, type: "income", date: "2026-04-06", category: "Membership Fees", amount: 400, note: "", paypal: false, memberName: "Sankaralingam Piramanayagam" },
  ],
  members: [
    { id: 1, name: "Krishnaswamy Jayaraman", email: "", phone: "", paid: true,  joinDate: "2026-04-07" },
    { id: 2, name: "Bilal Hasan",             email: "", phone: "", paid: true,  joinDate: "2026-04-11" },
    { id: 3, name: "Glen Coelho",              email: "", phone: "", paid: false, joinDate: "2026-04-10" },
    { id: 4, name: "Pavan Pativada",           email: "", phone: "", paid: true,  joinDate: "2026-04-10" },
    { id: 5, name: "Paramjot Singh",           email: "", phone: "", paid: true,  joinDate: "2026-04-08" },
    { id: 6, name: "Dhruv Kumar",              email: "", phone: "", paid: true,  joinDate: "2026-04-08" },
    { id: 7, name: "Hrishikesh Joshi",         email: "", phone: "", paid: true,  joinDate: "2026-04-07" },
    { id: 8, name: "Sankaralingam Piramanayagam", email: "", phone: "", paid: true, joinDate: "2026-04-06" },
  ],
  events: [],
  customExpCats: [],
  customIncCats: [],
};

const STORAGE_KEY = "spcc_treasurer_data";

function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : SEED_DATA;
  } catch { return SEED_DATA; }
}

function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
const fmt   = (n) => `$${Math.abs(n).toFixed(2)}`;
const today = () => new Date().toISOString().split("T")[0];

const TABS = ["Dashboard", "Finances", "Members", "Events"];

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

const icons = {
  Dashboard: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Finances:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Members:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Events:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

// ─── PIN MODAL ────────────────────────────────────────────────────────────
function PinModal({ onClose, onSuccess }) {
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
          <div style={{ fontWeight: "800", fontSize: 18, color: C.dark }}>Treasurer Access</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>Enter your PIN to unlock editing</div>
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
        <button onClick={attempt} style={{ ...saveBtnStyle, marginTop: 14 }}>Unlock</button>
        <button onClick={onClose} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none", color: C.sub, cursor: "pointer", fontSize: 13, padding: "8px 0", fontFamily: "inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData]       = useState(null);
  const [tab, setTab]         = useState("Dashboard");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const d = loadData();
    setData(d);
    saveData(d);
  }, []);

  const update = (newData) => { setData(newData); saveData(newData); };

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.dark, fontFamily: "system-ui, sans-serif", fontSize: 18 }}>
      Loading...
    </div>
  );

  const allExpCats = [...EXPENSE_CATS, ...data.customExpCats];
  const allIncCats = [...INCOME_CATS,  ...data.customIncCats];
  const balance  = data.transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const totalIn  = data.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalOut = data.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: C.text }}>
      {showPin && <PinModal onClose={() => setShowPin(false)} onSuccess={() => setIsAdmin(true)} />}

      {/* Header */}
      <div style={{ background: C.dark, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.35)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "800", fontSize: 19, color: C.gold, letterSpacing: 0.5 }}>spcc.expenses</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase" }}>BALANCE</div>
            <div style={{ fontSize: 20, fontWeight: "800", color: balance >= 0 ? "#86EFAC" : "#FCA5A5", lineHeight: 1.1 }}>{balance >= 0 ? "" : "-"}{fmt(balance)}</div>
          </div>
          <button
            onClick={() => isAdmin ? setIsAdmin(false) : setShowPin(true)}
            style={{ background: isAdmin ? "rgba(201,151,60,0.18)" : "rgba(255,255,255,0.07)", border: `1px solid ${isAdmin ? C.gold : "rgba(255,255,255,0.14)"}`, borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: isAdmin ? C.gold : "rgba(255,255,255,0.5)", fontFamily: "inherit", fontWeight: "600", whiteSpace: "nowrap" }}
          >
            {isAdmin ? "🔓 Treasurer" : "🔐 Sign In"}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "11px 4px 9px", border: "none", background: "transparent", color: tab === t ? C.gold : C.muted, cursor: "pointer", fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", fontFamily: "inherit", fontWeight: tab === t ? "700" : "500", borderBottom: `2px solid ${tab === t ? C.gold : "transparent"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "color 0.15s" }}>
            {icons[t]}{t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px", maxWidth: 640, margin: "0 auto" }}>
        {tab === "Dashboard" && <Dashboard data={data} totalIn={totalIn} totalOut={totalOut} />}
        {tab === "Finances"  && <Finances  data={data} update={update} allExpCats={allExpCats} allIncCats={allIncCats} isAdmin={isAdmin} />}
        {tab === "Members"   && <Members   data={data} update={update} isAdmin={isAdmin} />}
        {tab === "Events"    && <Events    data={data} update={update} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard({ data, totalIn, totalOut }) {
  const recent      = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  const paidMembers = data.members.filter(m => m.paid).length;
  const expByCategory = {};
  data.transactions.filter(t => t.type === "expense").forEach(t => {
    expByCategory[t.category] = (expByCategory[t.category] || 0) + t.amount;
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
function Finances({ data, update, allExpCats, allIncCats, isAdmin }) {
  const blank = { type: "expense", date: today(), category: allExpCats[0], amount: "", note: "", paypal: false, memberName: "" };
  const [form, setForm]       = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat]   = useState("");
  const [catType, setCatType] = useState("expense");
  const [filter, setFilter]   = useState("all");

  const addTx = () => {
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return;
    update({ ...data, transactions: [{ ...form, id: Date.now(), amount: parseFloat(form.amount) }, ...data.transactions] });
    setForm(blank); setShowForm(false);
  };
  const delTx = (id) => update({ ...data, transactions: data.transactions.filter(t => t.id !== id) });
  const addCat = () => {
    if (!newCat.trim()) return;
    if (catType === "expense") update({ ...data, customExpCats: [...data.customExpCats, newCat.trim()] });
    else update({ ...data, customIncCats: [...data.customIncCats, newCat.trim()] });
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
          <span>🔐</span> Sign in as Treasurer to add or edit transactions.
        </div>
      )}

      {isAdmin && showForm && (
        <FormCard>
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
          {form.type === "income" && <FormRow label="Member Name"><input placeholder="Who paid?" value={form.memberName} onChange={e => setForm({ ...form, memberName: e.target.value })} style={inputStyle} /></FormRow>}
          <FormRow label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Category">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              {(form.type === "expense" ? allExpCats : allIncCats).map(c => <option key={c}>{c}</option>)}
            </select>
          </FormRow>
          <FormRow label="Amount ($)"><input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Note"><input placeholder="Optional note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="PayPal?"><input type="checkbox" checked={form.paypal} onChange={e => setForm({ ...form, paypal: e.target.checked })} style={{ accentColor: C.gold, width: 18, height: 18 }} /></FormRow>
          <button onClick={addTx} style={saveBtnStyle}>Save Transaction</button>
        </FormCard>
      )}

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

      <Card title="Transactions">
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
            {isAdmin && <button onClick={() => delTx(t.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }} title="Delete">×</button>}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── MEMBERS ─────────────────────────────────────────────────────────────
function Members({ data, update, isAdmin }) {
  const [form, setForm]         = useState({ name: "", email: "", phone: "", paid: false, joinDate: today() });
  const [showForm, setShowForm] = useState(false);

  const addMember  = () => {
    if (!form.name.trim()) return;
    update({ ...data, members: [...data.members, { ...form, id: Date.now() }] });
    setForm({ name: "", email: "", phone: "", paid: false, joinDate: today() }); setShowForm(false);
  };
  const togglePaid = (id) => update({ ...data, members: data.members.map(m => m.id === id ? { ...m, paid: !m.paid } : m) });
  const delMember  = (id) => update({ ...data, members: data.members.filter(m => m.id !== id) });

  const paid = data.members.filter(m => m.paid).length;
  const amountPaidFor = (name) => data.transactions.filter(t => t.type === "income" && t.memberName === name).reduce((s, t) => s + t.amount, 0);

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
          const amtPaid = amountPaidFor(m.name);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={m.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: "600", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                  {amtPaid > 0 ? <span style={{ color: C.green, fontWeight: "700" }}>{fmt(amtPaid)} paid</span> : <span>No payments</span>}
                  {m.email ? ` · ${m.email}` : ""}
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

// ─── EVENTS ──────────────────────────────────────────────────────────────
function Events({ data, update, isAdmin }) {
  const [form, setForm]         = useState({ name: "", type: "Game", date: today(), location: "", notes: "", cost: "" });
  const [showForm, setShowForm] = useState(false);
  const EVENT_TYPES = ["Game", "Practice", "Tournament", "Meeting", "Fundraiser", "Other"];

  const addEvent = () => {
    if (!form.name.trim()) return;
    update({ ...data, events: [...data.events, { ...form, id: Date.now(), cost: form.cost ? parseFloat(form.cost) : 0 }] });
    setForm({ name: "", type: "Game", date: today(), location: "", notes: "", cost: "" }); setShowForm(false);
  };
  const delEvent = (id) => update({ ...data, events: data.events.filter(e => e.id !== id) });
  const sorted = [...data.events].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ActionBtn onClick={() => setShowForm(!showForm)} label={showForm ? "Cancel" : "+ Add Event"} />
        </div>
      )}

      {isAdmin && showForm && (
        <FormCard>
          <FormRow label="Name *"><input placeholder="Event name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Type">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormRow>
          <FormRow label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Location"><input placeholder="Venue / location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Est. Cost ($)"><input type="number" placeholder="0.00" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Notes"><input placeholder="Any notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} /></FormRow>
          <button onClick={addEvent} style={saveBtnStyle}>Save Event</button>
        </FormCard>
      )}

      <Card title={`Events (${data.events.length})`}>
        {sorted.length === 0 ? <EmptyState text="No events added yet" /> : sorted.map(e => {
          const isPast = new Date(e.date) < new Date(today());
          return (
            <div key={e.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: "600", color: isPast ? C.muted : C.text }}>{e.name}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: C.goldLight, color: "#92672A", border: `1px solid ${C.goldBorder}` }}>{e.type}</span>
                    {isPast && <span style={{ fontSize: 11, color: C.muted }}>past</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{e.date}{e.location ? ` · ${e.location}` : ""}</div>
                  {e.notes && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{e.notes}</div>}
                  {e.cost > 0 && <div style={{ fontSize: 12, color: C.crimson, marginTop: 2, fontWeight: "600" }}>Est. cost: {fmt(e.cost)}</div>}
                </div>
                {isAdmin && <button onClick={() => delEvent(e.id)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>×</button>}
              </div>
            </div>
          );
        })}
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
