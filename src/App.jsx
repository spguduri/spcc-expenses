import { useState, useEffect } from "react";

const EXPENSE_CATS = ["Umpiring", "Food & Drinks", "Travel/Gas", "League Fees", "Equipment/Balls"];
const INCOME_CATS = ["Membership Fees", "PayPal Transfer", "Fundraising", "Other Income"];

const defaultData = {
  transactions: [],
  members: [],
  events: [],
  customExpCats: [],
  customIncCats: [],
  clubName: "My Sports Club",
};

const STORAGE_KEY = "club_treasurer_data";

async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : defaultData;
  } catch {
    return defaultData;
  }
}

async function saveData(data) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

const fmt = (n) => `$${Math.abs(n).toFixed(2)}`;
const today = () => new Date().toISOString().split("T")[0];

const TABS = ["Dashboard", "Finances", "Members", "Events"];

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
    loadData().then(setData);
  }, []);

  const update = (newData) => {
    setData(newData);
    saveData(newData);
  };

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f1923", color: "#e8d5a3", fontFamily: "Georgia, serif", fontSize: 18 }}>
      Loading...
    </div>
  );

  const allExpCats = [...EXPENSE_CATS, ...data.customExpCats];
  const allIncCats = [...INCOME_CATS, ...data.customIncCats];

  const balance = data.transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const totalIn = data.transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalOut = data.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0f1923", fontFamily: "'Georgia', serif", color: "#e8d5a3" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a2d1a 0%, #0f1923 60%)", borderBottom: "1px solid #2a4a2a", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4a8c4a, #2d6b2d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚽</div>
        <div style={{ flex: 1 }}>
          {editingName ? (
            <input
              autoFocus
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onBlur={() => { update({ ...data, clubName: tempName || data.clubName }); setEditingName(false); }}
              onKeyDown={e => { if (e.key === "Enter") { update({ ...data, clubName: tempName || data.clubName }); setEditingName(false); } }}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid #4a8c4a", color: "#e8d5a3", fontSize: 17, fontFamily: "Georgia, serif", fontWeight: "bold", outline: "none", width: "100%" }}
            />
          ) : (
            <div onClick={() => { setTempName(data.clubName); setEditingName(true); }} style={{ fontWeight: "bold", fontSize: 17, cursor: "pointer", letterSpacing: 0.5 }}>{data.clubName} <span style={{ fontSize: 11, color: "#4a8c4a" }}>✏️</span></div>
          )}
          <div style={{ fontSize: 11, color: "#4a8c4a", letterSpacing: 1, textTransform: "uppercase" }}>Treasurer Portal</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#4a8c4a", letterSpacing: 1 }}>BALANCE</div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: balance >= 0 ? "#6fcf6f" : "#e07070" }}>{balance >= 0 ? "" : "-"}{fmt(balance)}</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", background: "#111e11", borderBottom: "1px solid #1e3a1e" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "12px 4px 10px", border: "none", background: "transparent",
            color: tab === t ? "#6fcf6f" : "#5a7a5a", cursor: "pointer", fontSize: 11,
            letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "Georgia, serif",
            borderBottom: tab === t ? "2px solid #6fcf6f" : "2px solid transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "color 0.2s"
          }}>
            {icons[t]}
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
        {tab === "Dashboard" && <Dashboard data={data} balance={balance} totalIn={totalIn} totalOut={totalOut} allExpCats={allExpCats} />}
        {tab === "Finances" && <Finances data={data} update={update} allExpCats={allExpCats} allIncCats={allIncCats} />}
        {tab === "Members" && <Members data={data} update={update} />}
        {tab === "Events" && <Events data={data} update={update} />}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ data, balance, totalIn, totalOut, allExpCats }) {
  const recent = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const paidMembers = data.members.filter(m => m.paid).length;

  const expByCategory = {};
  data.transactions.filter(t => t.type === "expense").forEach(t => {
    expByCategory[t.category] = (expByCategory[t.category] || 0) + t.amount;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Income", value: fmt(totalIn), color: "#6fcf6f" },
          { label: "Expenses", value: fmt(totalOut), color: "#e07070" },
          { label: "Members", value: `${paidMembers}/${data.members.length}`, color: "#e8d5a3" },
        ].map(c => (
          <div key={c.label} style={{ background: "#111e11", border: "1px solid #1e3a1e", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#4a8c4a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      {data.events.length > 0 && (
        <Section title="Upcoming Events">
          {[...data.events].sort((a, b) => new Date(a.date) - new Date(b.date)).filter(e => new Date(e.date) >= new Date(today())).slice(0, 3).map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e3a1e" }}>
              <div>
                <div style={{ fontSize: 14 }}>{e.name}</div>
                <div style={{ fontSize: 11, color: "#4a8c4a" }}>{e.type}</div>
              </div>
              <div style={{ fontSize: 12, color: "#a0b8a0" }}>{e.date}</div>
            </div>
          ))}
          {data.events.filter(e => new Date(e.date) >= new Date(today())).length === 0 && <EmptyState text="No upcoming events" />}
        </Section>
      )}

      {/* Expense Breakdown */}
      {Object.keys(expByCategory).length > 0 && (
        <Section title="Expense Breakdown">
          {Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                <span>{cat}</span><span style={{ color: "#e07070" }}>{fmt(amt)}</span>
              </div>
              <div style={{ height: 4, background: "#1e3a1e", borderRadius: 2 }}>
                <div style={{ height: 4, borderRadius: 2, background: "#4a8c4a", width: `${Math.min(100, (amt / totalOut) * 100)}%`, transition: "width 0.4s" }} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Recent Transactions */}
      <Section title="Recent Transactions">
        {recent.length === 0 ? <EmptyState text="No transactions yet" /> : recent.map(t => (
          <TxRow key={t.id} t={t} />
        ))}
      </Section>
    </div>
  );
}

// ─── FINANCES ────────────────────────────────────────────────────────────────
function Finances({ data, update, allExpCats, allIncCats }) {
  const blank = { type: "expense", date: today(), category: allExpCats[0], amount: "", note: "", paypal: false };
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn onClick={() => { setShowForm(!showForm); }} label={showForm ? "Cancel" : "+ Add Transaction"} />
      </div>

      {showForm && (
        <FormCard>
          <Row>
            <label style={labelStyle}>Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["income", "expense"].map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t, category: t === "expense" ? allExpCats[0] : allIncCats[0] })}
                  style={{ ...pillBtn, background: form.type === t ? (t === "income" ? "#2d5a2d" : "#5a2d2d") : "#1e3a1e", color: form.type === t ? "#e8d5a3" : "#6a8a6a", borderColor: form.type === t ? (t === "income" ? "#4a8c4a" : "#8c4a4a") : "#2a4a2a" }}>
                  {t === "income" ? "💰 Income" : "💸 Expense"}
                </button>
              ))}
            </div>
          </Row>
          <Row>
            <label style={labelStyle}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </Row>
          <Row>
            <label style={labelStyle}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              {(form.type === "expense" ? allExpCats : allIncCats).map(c => <option key={c}>{c}</option>)}
            </select>
          </Row>
          <Row>
            <label style={labelStyle}>Amount ($)</label>
            <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          </Row>
          <Row>
            <label style={labelStyle}>Note</label>
            <input placeholder="Optional note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={inputStyle} />
          </Row>
          <Row>
            <label style={labelStyle}>PayPal?</label>
            <input type="checkbox" checked={form.paypal} onChange={e => setForm({ ...form, paypal: e.target.checked })} style={{ accentColor: "#4a8c4a", width: 18, height: 18 }} />
          </Row>
          <button onClick={addTx} style={{ ...actionBtnStyle, marginTop: 4 }}>Save Transaction</button>
        </FormCard>
      )}

      {/* Custom Categories */}
      <Section title="Custom Categories">
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => setCatType(t)} style={{ ...pillBtn, background: catType === t ? "#2d5a2d" : "#1e3a1e", color: catType === t ? "#e8d5a3" : "#6a8a6a", borderColor: catType === t ? "#4a8c4a" : "#2a4a2a", fontSize: 12 }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder={`New ${catType} category`} value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addCat()} style={{ ...inputStyle, flex: 1 }} />
          <button onClick={addCat} style={{ ...actionBtnStyle, padding: "8px 14px" }}>Add</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {(catType === "expense" ? data.customExpCats : data.customIncCats).map(c => (
            <span key={c} style={{ background: "#1e3a1e", border: "1px solid #2a4a2a", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#a0c0a0" }}>{c}</span>
          ))}
        </div>
      </Section>

      {/* Transaction List */}
      <Section title="Transactions">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["all", "income", "expense"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...pillBtn, fontSize: 11, background: filter === f ? "#2d5a2d" : "transparent", color: filter === f ? "#e8d5a3" : "#6a8a6a", borderColor: filter === f ? "#4a8c4a" : "#2a4a2a" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? <EmptyState text="No transactions" /> : filtered.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #1e3a1e" }}>
            <div style={{ flex: 1 }}>
              <TxRow t={t} />
            </div>
            <button onClick={() => delTx(t.id)} style={{ background: "transparent", border: "none", color: "#5a3a3a", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
          </div>
        ))}
      </Section>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "#4a8c4a" }}>{paid}/{data.members.length} dues paid</div>
        <ActionBtn onClick={() => setShowForm(!showForm)} label={showForm ? "Cancel" : "+ Add Member"} />
      </div>

      {showForm && (
        <FormCard>
          {[["Name *", "name", "text", "Full name"], ["Email", "email", "email", "email@example.com"], ["Phone", "phone", "tel", "Phone number"]].map(([label, key, type, ph]) => (
            <Row key={key}>
              <label style={labelStyle}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
            </Row>
          ))}
          <Row>
            <label style={labelStyle}>Dues Paid?</label>
            <input type="checkbox" checked={form.paid} onChange={e => setForm({ ...form, paid: e.target.checked })} style={{ accentColor: "#4a8c4a", width: 18, height: 18 }} />
          </Row>
          <button onClick={addMember} style={{ ...actionBtnStyle, marginTop: 4 }}>Save Member</button>
        </FormCard>
      )}

      <Section title={`Members (${data.members.length})`}>
        {data.members.length === 0 ? <EmptyState text="No members added yet" /> : data.members.map(m => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #1e3a1e" }}>
            <div onClick={() => togglePaid(m.id)} style={{ width: 28, height: 28, borderRadius: "50%", background: m.paid ? "#2d5a2d" : "#1e2a1e", border: `2px solid ${m.paid ? "#4a8c4a" : "#2a4a2a"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
              {m.paid ? "✓" : ""}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: "bold" }}>{m.name}</div>
              {m.email && <div style={{ fontSize: 11, color: "#4a8c4a" }}>{m.email}</div>}
              {m.phone && <div style={{ fontSize: 11, color: "#5a7a5a" }}>{m.phone}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: m.paid ? "#1e3a1e" : "#2a1a1a", color: m.paid ? "#6fcf6f" : "#cf6f6f", border: `1px solid ${m.paid ? "#2a5a2a" : "#5a2a2a"}` }}>{m.paid ? "PAID" : "UNPAID"}</span>
              <button onClick={() => delMember(m.id)} style={{ background: "transparent", border: "none", color: "#5a3a3a", cursor: "pointer", fontSize: 13 }}>remove</button>
            </div>
          </div>
        ))}
      </Section>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ActionBtn onClick={() => setShowForm(!showForm)} label={showForm ? "Cancel" : "+ Add Event"} />
      </div>

      {showForm && (
        <FormCard>
          <Row>
            <label style={labelStyle}>Name *</label>
            <input placeholder="Event name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </Row>
          <Row>
            <label style={labelStyle}>Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Row>
          <Row>
            <label style={labelStyle}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          </Row>
          <Row>
            <label style={labelStyle}>Location</label>
            <input placeholder="Venue / location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} />
          </Row>
          <Row>
            <label style={labelStyle}>Est. Cost ($)</label>
            <input type="number" placeholder="0.00" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} style={inputStyle} />
          </Row>
          <Row>
            <label style={labelStyle}>Notes</label>
            <input placeholder="Any notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
          </Row>
          <button onClick={addEvent} style={{ ...actionBtnStyle, marginTop: 4 }}>Save Event</button>
        </FormCard>
      )}

      <Section title={`Events (${data.events.length})`}>
        {sorted.length === 0 ? <EmptyState text="No events added yet" /> : sorted.map(e => {
          const isPast = new Date(e.date) < new Date(today());
          return (
            <div key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid #1e3a1e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: "bold", color: isPast ? "#6a8a6a" : "#e8d5a3" }}>{e.name}</span>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "#1e3a1e", color: "#4a8c4a", border: "1px solid #2a5a2a" }}>{e.type}</span>
                    {isPast && <span style={{ fontSize: 10, color: "#5a6a5a" }}>past</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#4a8c4a", marginTop: 2 }}>{e.date}{e.location ? ` · ${e.location}` : ""}</div>
                  {e.notes && <div style={{ fontSize: 11, color: "#5a7a5a", marginTop: 2 }}>{e.notes}</div>}
                  {e.cost > 0 && <div style={{ fontSize: 11, color: "#e07070", marginTop: 2 }}>Est. cost: {fmt(e.cost)}</div>}
                </div>
                <button onClick={() => delEvent(e.id)} style={{ background: "transparent", border: "none", color: "#5a3a3a", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function TxRow({ t }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 13 }}>{t.category} {t.paypal && <span style={{ fontSize: 10, color: "#4a8c4a" }}>· PayPal</span>}</div>
        <div style={{ fontSize: 11, color: "#4a8c4a" }}>{t.date}{t.note ? ` · ${t.note}` : ""}</div>
      </div>
      <div style={{ fontWeight: "bold", color: t.type === "income" ? "#6fcf6f" : "#e07070", fontSize: 14 }}>
        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: "#111e11", border: "1px solid #1e3a1e", borderRadius: 12, padding: "14px 14px 6px" }}>
      <div style={{ fontSize: 11, color: "#4a8c4a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function FormCard({ children }) {
  return (
    <div style={{ background: "#0d1a0d", border: "1px solid #2a4a2a", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{children}</div>;
}

function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "20px 0", color: "#3a5a3a", fontSize: 13 }}>{text}</div>;
}

function ActionBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={actionBtnStyle}>{label}</button>
  );
}

const actionBtnStyle = {
  background: "linear-gradient(135deg, #2d5a2d, #1e3a1e)",
  border: "1px solid #4a8c4a",
  color: "#e8d5a3",
  padding: "9px 16px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "Georgia, serif",
  letterSpacing: 0.3,
};

const pillBtn = {
  border: "1px solid",
  borderRadius: 20,
  padding: "5px 12px",
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "Georgia, serif",
};

const inputStyle = {
  flex: 1,
  background: "#0d1a0d",
  border: "1px solid #2a4a2a",
  borderRadius: 6,
  color: "#e8d5a3",
  padding: "7px 10px",
  fontSize: 13,
  fontFamily: "Georgia, serif",
  outline: "none",
  width: "100%",
};

const labelStyle = {
  fontSize: 12,
  color: "#4a8c4a",
  minWidth: 80,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};
