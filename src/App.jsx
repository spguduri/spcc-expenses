import { useState, useEffect } from "react";

const EXPENSE_CATS = ["Umpiring", "Food & Drinks", "Travel/Gas", "League Fees", "Equipment/Balls"];
const INCOME_CATS = ["Membership Fees", "PayPal Transfer", "Fundraising", "Other Income"];

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
    { id: 1, name: "Krishnaswamy Jayaraman", email: "", phone: "", paid: true, joinDate: "2026-04-07" },
    { id: 2, name: "Bilal Hasan", email: "", phone: "", paid: true, joinDate: "2026-04-11" },
    { id: 3, name: "Glen Coelho", email: "", phone: "", paid: false, joinDate: "2026-04-10" },
    { id: 4, name: "Pavan Pativada", email: "", phone: "", paid: true, joinDate: "2026-04-10" },
    { id: 5, name: "Paramjot Singh", email: "", phone: "", paid: true, joinDate: "2026-04-08" },
    { id: 6, name: "Dhruv Kumar", email: "", phone: "", paid: true, joinDate: "2026-04-08" },
    { id: 7, name: "Hrishikesh Joshi", email: "", phone: "", paid: true, joinDate: "2026-04-07" },
    { id: 8, name: "Sankaralingam Piramanayagam", email: "", phone: "", paid: true, joinDate: "2026-04-06" },
  ],
  events: [],
  customExpCats: [],
  customIncCats: [],
  clubName: "My Sports Club",
};

const STORAGE_KEY = "club_treasurer_data";

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : SEED_DATA;
  } catch {
    return SEED_DATA;
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

const fmt = (n) => `$${Math.abs(n).toFixed(2)}`;
const today = () => new Date().toISOString().split("T")[0];

const TABS = ["Dashboard", "Finances", "Members", "Events"];

// ─── AVATAR ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#E11D48", "#7C3AED", "#2563EB", "#059669", "#D97706",
  "#0891B2", "#DC2626", "#65A30D", "#DB2777", "#9333EA",
];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: getAvatarColor(name),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.36, fontWeight: 700,
      flexShrink: 0, letterSpacing: 0.5, userSelect: "none",
    }}>
      {getInitials(name)}
    </div>
  );
}

const icons = {
  Dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  ),
  Finances: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  Members: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Events: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
};

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("Dashboard");
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    const d = loadData();
    setData(d);
    saveData(d);
  }, []);

  const update = (newData) => {
    setData(newData);
    saveData(newData);
  };

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F9FAFB", color: "#111827", fontFamily: "system-ui, sans-serif", fontSize: 18 }}>
      Loading...
    </div>
  );

  const allExpCats = [...EXPENSE_CATS, ...data.customExpCats];
  const allIncCats = [...INCOME_CATS, ...data.customIncCats];

  const balance = data.transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const totalIn = data.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalOut = data.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#111827" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #14532D 0%, #15803D 100%)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⚽</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <input
              autoFocus
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onBlur={() => { update({ ...data, clubName: tempName || data.clubName }); setEditingName(false); }}
              onKeyDown={e => { if (e.key === "Enter") { update({ ...data, clubName: tempName || data.clubName }); setEditingName(false); } }}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.5)", color: "#fff", fontSize: 17, fontWeight: "700", outline: "none", width: "100%", fontFamily: "inherit" }}
            />
          ) : (
            <div onClick={() => { setTempName(data.clubName); setEditingName(true); }} style={{ fontWeight: "700", fontSize: 17, cursor: "pointer", color: "#fff" }}>
              {data.clubName} <span style={{ fontSize: 13, opacity: 0.6 }}>✏️</span>
            </div>
          )}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>Treasurer Portal</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase" }}>BALANCE</div>
          <div style={{ fontSize: 22, fontWeight: "800", color: balance >= 0 ? "#86EFAC" : "#FCA5A5" }}>{balance >= 0 ? "" : "-"}{fmt(balance)}</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "12px 4px 10px", border: "none", background: "transparent",
            color: tab === t ? "#15803D" : "#6B7280", cursor: "pointer", fontSize: 11,
            letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "inherit",
            fontWeight: tab === t ? "700" : "500",
            borderBottom: tab === t ? "2px solid #15803D" : "2px solid transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            transition: "color 0.15s",
          }}>
            {icons[t]}
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px", maxWidth: 640, margin: "0 auto" }}>
        {tab === "Dashboard" && <Dashboard data={data} balance={balance} totalIn={totalIn} totalOut={totalOut} />}
        {tab === "Finances" && <Finances data={data} update={update} allExpCats={allExpCats} allIncCats={allIncCats} />}
        {tab === "Members" && <Members data={data} update={update} />}
        {tab === "Events" && <Events data={data} update={update} />}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ data, totalIn, totalOut }) {
  const recent = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  const paidMembers = data.members.filter(m => m.paid).length;

  const expByCategory = {};
  data.transactions.filter(t => t.type === "expense").forEach(t => {
    expByCategory[t.category] = (expByCategory[t.category] || 0) + t.amount;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Income", value: fmt(totalIn), color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
          { label: "Expenses", value: fmt(totalOut), color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
          { label: "Members", value: `${paidMembers}/${data.members.length}`, color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontWeight: "600" }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: "800", color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Expense Breakdown */}
      {Object.keys(expByCategory).length > 0 && (
        <Card title="Expense Breakdown">
          {Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "#374151", fontWeight: "500" }}>{cat}</span>
                <span style={{ color: "#DC2626", fontWeight: "600" }}>{fmt(amt)}</span>
              </div>
              <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3 }}>
                <div style={{ height: 5, borderRadius: 3, background: "#DC2626", width: `${Math.min(100, (amt / totalOut) * 100)}%`, transition: "width 0.4s" }} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Recent Transactions */}
      <Card title="Recent Transactions">
        {recent.length === 0 ? <EmptyState text="No transactions yet" /> : recent.map(t => (
          <TxRow key={t.id} t={t} />
        ))}
      </Card>

      {/* Upcoming Events */}
      {data.events.filter(e => new Date(e.date) >= new Date(today())).length > 0 && (
        <Card title="Upcoming Events">
          {[...data.events].sort((a, b) => new Date(a.date) - new Date(b.date))
            .filter(e => new Date(e.date) >= new Date(today())).slice(0, 3).map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #F3F4F6" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: "600" }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{e.type} · {e.date}</div>
                </div>
                {e.cost > 0 && <div style={{ fontSize: 13, color: "#DC2626", fontWeight: "600" }}>{fmt(e.cost)}</div>}
              </div>
            ))}
        </Card>
      )}
    </div>
  );
}

// ─── FINANCES ────────────────────────────────────────────────────────────────
function Finances({ data, update, allExpCats, allIncCats }) {
  const blank = { type: "expense", date: today(), category: allExpCats[0], amount: "", note: "", paypal: false, memberName: "" };
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [catType, setCatType] = useState("expense");
  const [filter, setFilter] = useState("all");

  const addTx = () => {
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) return;
    const tx = { ...form, id: Date.now(), amount: parseFloat(form.amount) };
    update({ ...data, transactions: [tx, ...data.transactions] });
    setForm(blank);
    setShowForm(false);
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
      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn onClick={() => setShowForm(!showForm)} label={showForm ? "Cancel" : "+ Add Transaction"} />
      </div>

      {showForm && (
        <FormCard>
          <div>
            <FieldLabel>Type</FieldLabel>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {["income", "expense"].map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t, category: t === "expense" ? allExpCats[0] : allIncCats[0] })}
                  style={{ flex: 1, padding: "9px 0", border: `2px solid ${form.type === t ? (t === "income" ? "#16A34A" : "#DC2626") : "#E5E7EB"}`, borderRadius: 8, background: form.type === t ? (t === "income" ? "#F0FDF4" : "#FEF2F2") : "#fff", color: form.type === t ? (t === "income" ? "#16A34A" : "#DC2626") : "#6B7280", fontWeight: "700", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                  {t === "income" ? "💰 Income" : "💸 Expense"}
                </button>
              ))}
            </div>
          </div>
          {form.type === "income" && (
            <FormRow label="Member Name">
              <input placeholder="Who paid?" value={form.memberName} onChange={e => setForm({ ...form, memberName: e.target.value })} style={inputStyle} />
            </FormRow>
          )}
          <FormRow label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Category">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              {(form.type === "expense" ? allExpCats : allIncCats).map(c => <option key={c}>{c}</option>)}
            </select>
          </FormRow>
          <FormRow label="Amount ($)"><input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="Note"><input placeholder="Optional note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={inputStyle} /></FormRow>
          <FormRow label="PayPal?"><input type="checkbox" checked={form.paypal} onChange={e => setForm({ ...form, paypal: e.target.checked })} style={{ accentColor: "#15803D", width: 18, height: 18 }} /></FormRow>
          <button onClick={addTx} style={saveBtnStyle}>Save Transaction</button>
        </FormCard>
      )}

      {/* Custom Categories */}
      <Card title="Custom Categories">
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => setCatType(t)} style={{ ...pillStyle, background: catType === t ? (t === "expense" ? "#FEF2F2" : "#F0FDF4") : "#F9FAFB", color: catType === t ? (t === "expense" ? "#DC2626" : "#16A34A") : "#6B7280", borderColor: catType === t ? (t === "expense" ? "#FECACA" : "#BBF7D0") : "#E5E7EB" }}>
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
              <span key={c} style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#374151" }}>{c}</span>
            ))}
          </div>
        )}
      </Card>

      {/* Transaction List */}
      <Card title="Transactions">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["all", "income", "expense"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...pillStyle, background: filter === f ? "#F0FDF4" : "#F9FAFB", color: filter === f ? "#15803D" : "#6B7280", borderColor: filter === f ? "#BBF7D0" : "#E5E7EB", fontWeight: filter === f ? "700" : "500" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? <EmptyState text="No transactions" /> : filtered.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ flex: 1 }}><TxRow t={t} /></div>
            <button onClick={() => delTx(t.id)} style={{ background: "transparent", border: "none", color: "#D1D5DB", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }} title="Delete">×</button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── MEMBERS ─────────────────────────────────────────────────────────────────
function Members({ data, update }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", paid: false, joinDate: today() });
  const [showForm, setShowForm] = useState(false);

  const addMember = () => {
    if (!form.name.trim()) return;
    update({ ...data, members: [...data.members, { ...form, id: Date.now() }] });
    setForm({ name: "", email: "", phone: "", paid: false, joinDate: today() });
    setShowForm(false);
  };

  const togglePaid = (id) => update({ ...data, members: data.members.map(m => m.id === id ? { ...m, paid: !m.paid } : m) });
  const delMember = (id) => update({ ...data, members: data.members.filter(m => m.id !== id) });

  const paid = data.members.filter(m => m.paid).length;
  const amountPaidFor = (name) => data.transactions
    .filter(t => t.type === "income" && t.memberName === name)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, color: "#6B7280", fontWeight: "500" }}>
          <span style={{ fontWeight: "800", color: "#15803D", fontSize: 15 }}>{paid}</span>
          <span style={{ color: "#9CA3AF" }}>/{data.members.length}</span>
          {" "}dues paid
        </div>
        <ActionBtn onClick={() => setShowForm(!showForm)} label={showForm ? "Cancel" : "+ Add Member"} />
      </div>

      {showForm && (
        <FormCard>
          {[["Name *", "name", "text", "Full name"], ["Email", "email", "email", "email@example.com"], ["Phone", "phone", "tel", "Phone number"]].map(([label, key, type, ph]) => (
            <FormRow key={key} label={label}>
              <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
            </FormRow>
          ))}
          <FormRow label="Dues Paid?">
            <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} style={{ accentColor: "#15803D", width: 18, height: 18 }} />
          </FormRow>
          <button onClick={addMember} style={saveBtnStyle}>Save Member</button>
        </FormCard>
      )}

      <Card title={`Members (${data.members.length})`}>
        {data.members.length === 0 ? <EmptyState text="No members added yet" /> : data.members.map(m => {
          const amtPaid = amountPaidFor(m.name);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
              <Avatar name={m.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: "600", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>
                  {amtPaid > 0
                    ? <span style={{ color: "#16A34A", fontWeight: "700" }}>{fmt(amtPaid)} paid</span>
                    : <span>No payments recorded</span>
                  }
                  {m.email ? ` · ${m.email}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <button onClick={() => togglePaid(m.id)} style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, border: `1px solid ${m.paid ? "#BBF7D0" : "#FECACA"}`, background: m.paid ? "#F0FDF4" : "#FEF2F2", color: m.paid ? "#16A34A" : "#DC2626", cursor: "pointer", fontWeight: "700", fontFamily: "inherit" }}>
                  {m.paid ? "✓ PAID" : "UNPAID"}
                </button>
                <button onClick={() => delMember(m.id)} style={{ background: "transparent", border: "none", color: "#D1D5DB", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>remove</button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────
function Events({ data, update }) {
  const [form, setForm] = useState({ name: "", type: "Game", date: today(), location: "", notes: "", cost: "" });
  const [showForm, setShowForm] = useState(false);

  const EVENT_TYPES = ["Game", "Practice", "Tournament", "Meeting", "Fundraiser", "Other"];

  const addEvent = () => {
    if (!form.name.trim()) return;
    update({ ...data, events: [...data.events, { ...form, id: Date.now(), cost: form.cost ? parseFloat(form.cost) : 0 }] });
    setForm({ name: "", type: "Game", date: today(), location: "", notes: "", cost: "" });
    setShowForm(false);
  };

  const delEvent = (id) => update({ ...data, events: data.events.filter(e => e.id !== id) });
  const sorted = [...data.events].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionBtn onClick={() => setShowForm(!showForm)} label={showForm ? "Cancel" : "+ Add Event"} />
      </div>

      {showForm && (
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
            <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: "600", color: isPast ? "#9CA3AF" : "#111827" }}>{e.name}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }}>{e.type}</span>
                    {isPast && <span style={{ fontSize: 11, color: "#9CA3AF" }}>past</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{e.date}{e.location ? ` · ${e.location}` : ""}</div>
                  {e.notes && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{e.notes}</div>}
                  {e.cost > 0 && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 2, fontWeight: "600" }}>Est. cost: {fmt(e.cost)}</div>}
                </div>
                <button onClick={() => delEvent(e.id)} style={{ background: "transparent", border: "none", color: "#D1D5DB", cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1 }}>×</button>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function TxRow({ t }) {
  const dateObj = new Date(t.date + "T00:00:00");
  const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0" }}>
      {t.memberName ? (
        <Avatar name={t.memberName} size={38} />
      ) : (
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.type === "income" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${t.type === "income" ? "#BBF7D0" : "#FECACA"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
          {t.type === "income" ? "💰" : "💸"}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: "600", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t.memberName || t.category}
        </div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
          {dateStr} · {t.category}{t.paypal ? " · PayPal" : ""}
        </div>
        {t.note && <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2, fontStyle: "italic" }}>"{t.note}"</div>}
      </div>
      <div style={{ fontWeight: "700", color: t.type === "income" ? "#16A34A" : "#DC2626", fontSize: 15, whiteSpace: "nowrap" }}>
        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: "700" }}>{title}</div>
      {children}
    </div>
  );
}

function FormCard({ children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 13, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      {children}
    </div>
  );
}

function FormRow({ label, children }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ marginTop: 5 }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, color: "#374151", fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>{children}</div>;
}

function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 14 }}>{text}</div>;
}

function ActionBtn({ onClick, label }) {
  return <button onClick={onClick} style={actionBtnStyle}>{label}</button>;
}

const actionBtnStyle = {
  background: "linear-gradient(135deg, #15803D, #166534)",
  border: "none",
  color: "#fff",
  padding: "10px 18px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "inherit",
  fontWeight: "700",
  boxShadow: "0 1px 4px rgba(21,128,61,0.3)",
};

const saveBtnStyle = {
  background: "linear-gradient(135deg, #15803D, #166534)",
  border: "none",
  color: "#fff",
  padding: "11px 0",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  fontFamily: "inherit",
  fontWeight: "700",
  width: "100%",
  boxShadow: "0 1px 4px rgba(21,128,61,0.3)",
};

const pillStyle = {
  border: "1px solid",
  borderRadius: 20,
  padding: "5px 14px",
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "inherit",
  fontWeight: "500",
};

const inputStyle = {
  width: "100%",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  color: "#111827",
  padding: "9px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

