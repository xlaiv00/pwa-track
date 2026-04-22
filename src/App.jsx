import { useState, useMemo, useRef, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis, CartesianGrid } from "recharts";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const BRANDS = [
  {n:"Rolex",f:"🇨🇭"},{n:"Patek Philippe",f:"🇨🇭"},{n:"Audemars Piguet",f:"🇨🇭"},
  {n:"Vacheron Constantin",f:"🇨🇭"},{n:"Jaeger-LeCoultre",f:"🇨🇭"},{n:"A. Lange & Söhne",f:"🇩🇪"},
  {n:"IWC Schaffhausen",f:"🇨🇭"},{n:"Panerai",f:"🇮🇹"},{n:"Breguet",f:"🇨🇭"},
  {n:"Blancpain",f:"🇨🇭"},{n:"Cartier",f:"🇫🇷"},{n:"Chopard",f:"🇨🇭"},
  {n:"Girard-Perregaux",f:"🇨🇭"},{n:"F.P. Journe",f:"🇨🇭"},{n:"Richard Mille",f:"🇨🇭"},
  {n:"Hublot",f:"🇨🇭"},{n:"TAG Heuer",f:"🇨🇭"},{n:"Heuer",f:"🇨🇭"},
  {n:"Breitling",f:"🇨🇭"},{n:"Zenith",f:"🇨🇭"},{n:"Longines",f:"🇨🇭"},
  {n:"Omega",f:"🇨🇭"},{n:"Tudor",f:"🇨🇭"},{n:"Tissot",f:"🇨🇭"},
  {n:"Oris",f:"🇨🇭"},{n:"Mido",f:"🇨🇭"},{n:"Hamilton",f:"🇨🇭"},
  {n:"Doxa",f:"🇨🇭"},{n:"Vulcain",f:"🇨🇭"},{n:"Eterna",f:"🇨🇭"},
  {n:"Universal Genève",f:"🇨🇭"},{n:"Movado",f:"🇨🇭"},{n:"Enicar",f:"🇨🇭"},
  {n:"Nomos Glashütte",f:"🇩🇪"},{n:"Glashütte Original",f:"🇩🇪"},
  {n:"Seiko",f:"🇯🇵"},{n:"Grand Seiko",f:"🇯🇵"},{n:"Citizen",f:"🇯🇵"},
  {n:"Orient",f:"🇯🇵"},{n:"Casio",f:"🇯🇵"},{n:"G-Shock",f:"🇯🇵"},
  {n:"Credor",f:"🇯🇵"},{n:"Alba",f:"🇯🇵"},{n:"Pulsar",f:"🇯🇵"},
  {n:"Bulova",f:"🇺🇸"},{n:"Elgin",f:"🇺🇸"},{n:"Waltham",f:"🇺🇸"},
  {n:"Gruen",f:"🇺🇸"},{n:"Benrus",f:"🇺🇸"},{n:"Ball Watch",f:"🇺🇸"},
  {n:"Accutron",f:"🇺🇸"},{n:"Lip",f:"🇫🇷"},{n:"Other",f:"🌍"},
];

const BCOLORS = {
  "Rolex":"#c9a84c","Patek Philippe":"#8e4ec6","Audemars Piguet":"#e85d04",
  "Omega":"#3a7bd5","Tudor":"#2d6a4f","Seiko":"#e11d48","Grand Seiko":"#be123c",
  "Cartier":"#b45309","IWC Schaffhausen":"#0e7490","Heuer":"#b91c1c",
  "Breitling":"#0f766e","Longines":"#1d4ed8","Citizen":"#047857",
};
const bc = b => BCOLORS[b] || "#6366f1";

const CONDITIONS  = ["Poor","Fair","Good","Very Good","Excellent","NOS"];
const STATUSES    = ["listed","sold","holding","in service"];
const MONTHS      = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NAV         = ["Overview","Inventory","P&L","Suppliers","Sales","Intelligence","Wishlist","Pipeline"];

const fmt  = n => "€" + Number(n).toLocaleString("de-DE");
const pct  = n => (n * 100).toFixed(1) + "%";
const prof = w => w.askingPrice - w.cost;
const marg = w => w.cost > 0 ? (w.askingPrice - w.cost) / w.cost : 0;
const days = (a, b) => a && b ? Math.round((new Date(b) - new Date(a)) / 86400000) : null;
const holdDays = w => {
  if (w.bought && w.soldDate) return days(w.bought, w.soldDate);
  if (w.bought) return Math.round((Date.now() - new Date(w.bought)) / 86400000);
  return null;
};

const SC = {
  sold:       { bg:"#1a2f3a", fg:"#3a7bd5" },
  listed:     { bg:"#2a1a0e", fg:"#c9a84c" },
  holding:    { bg:"#1a2a1a", fg:"#5de08a" },
  "in service":{ bg:"#1e1230", fg:"#9333ea" },
};

const INP = { width:"100%", background:"#0e0e18", border:"1px solid #2a2a38", borderRadius:8, padding:"9px 12px", color:"#f0ebe0", fontSize:14, outline:"none", boxSizing:"border-box" };
const LBL = { display:"block", fontSize:10, color:"#555", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5, fontFamily:"'DM Sans',sans-serif" };
const NUM = { fontFamily:"'IBM Plex Mono',monospace", fontWeight:500 };
const H1  = { fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, margin:"0 0 20px" };
const SH  = { fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, color:"#c9a84c", marginBottom:14 };
const CARD = { background:"#13131a", border:"1px solid #2a2a38", borderRadius:14, padding:"20px 20px 14px" };

// ── SEED DATA ─────────────────────────────────────────────────────────────────
const WATCHES0 = [
  // Seiko vintage on top
  {id:10,brand:"Seiko",model:"Dolce",ref:"8N41-9000",year:"1992",condition:"Excellent",cost:320,askingPrice:680,status:"sold",bought:"2024-01-10",soldDate:"2024-02-05",supplierId:3,serviceCost:0,marketValue:700,notes:"Gold-tone, box and papers",tags:["JDM","dress"]},
  {id:11,brand:"Seiko",model:"Exceline",ref:"1E20-6010",year:"1988",condition:"Very Good",cost:480,askingPrice:920,status:"sold",bought:"2024-01-22",soldDate:"2024-03-01",supplierId:3,serviceCost:60,marketValue:950,notes:"Diamond markers, original bracelet",tags:["JDM","luxury"]},
  {id:12,brand:"Seiko",model:"62MAS",ref:"J13070",year:"1965",condition:"Good",cost:1800,askingPrice:2600,status:"listed",bought:"2024-03-05",soldDate:"",supplierId:3,serviceCost:120,marketValue:2800,notes:"First diver, rare, unpolished",tags:["diver","vintage"]},
  {id:13,brand:"Seiko",model:"King Seiko",ref:"4402-8000",year:"1969",condition:"Very Good",cost:650,askingPrice:1100,status:"holding",bought:"2024-04-02",soldDate:"",supplierId:3,serviceCost:80,marketValue:1200,notes:"KS emblem dial, cal. 4402",tags:["JDM","dress"]},
  // Swiss vintage
  {id:1,brand:"Rolex",model:"Submariner Date",ref:"1680",year:"1972",condition:"Good",cost:5800,askingPrice:7900,status:"listed",bought:"2024-01-15",soldDate:"",supplierId:1,serviceCost:0,marketValue:8200,notes:"Tritium dial, original bracelet",tags:["diver","sport"]},
  {id:2,brand:"Rolex",model:"Datejust 36",ref:"1601",year:"1968",condition:"Very Good",cost:3200,askingPrice:4600,status:"sold",bought:"2024-02-03",soldDate:"2024-03-12",supplierId:2,serviceCost:200,marketValue:4800,notes:"Silver dial, pie-pan",tags:["dress"]},
  {id:3,brand:"Omega",model:"Speedmaster Pre-Moon",ref:"105.003",year:"1965",condition:"Fair",cost:4100,askingPrice:5900,status:"sold",bought:"2024-01-28",soldDate:"2024-02-20",supplierId:1,serviceCost:350,marketValue:6200,notes:"Cal. 321",tags:["chrono","sport"]},
  {id:5,brand:"Heuer",model:"Carrera 12",ref:"2447N",year:"1970",condition:"Very Good",cost:6200,askingPrice:8900,status:"listed",bought:"2024-03-18",soldDate:"",supplierId:2,serviceCost:0,marketValue:9100,notes:"Cal. 11, manual wind",tags:["chrono"]},
  {id:6,brand:"Tudor",model:"Submariner",ref:"7928",year:"1967",condition:"Good",cost:2900,askingPrice:3800,status:"sold",bought:"2024-02-14",soldDate:"2024-04-01",supplierId:1,serviceCost:180,marketValue:4000,notes:"Chapter ring, gilt dial",tags:["diver"]},
  {id:7,brand:"Omega",model:"Seamaster 300",ref:"165.024",year:"1969",condition:"Good",cost:2400,askingPrice:3500,status:"in service",bought:"2024-04-10",soldDate:"",supplierId:3,serviceCost:280,marketValue:3600,notes:"Bullseye dial",tags:["diver"]},
  {id:8,brand:"Rolex",model:"GMT-Master",ref:"1675",year:"1971",condition:"Fair",cost:7200,askingPrice:9800,status:"sold",bought:"2024-03-22",soldDate:"2024-05-08",supplierId:2,serviceCost:420,marketValue:10200,notes:"Pepsi bezel, original",tags:["sport","tool"]},
];

const SUPPLIERS0 = [
  {id:1,name:"Marco Rossi",type:"Private Collector",country:"Italy",city:"Milan",email:"marco@example.com",phone:"+39 02 1234567",reliability:5,avgDiscount:12,notes:"Italian-market Rolexes. Always has papers.",tags:["rolex","omega","papers"]},
  {id:2,name:"Watch Hunters GmbH",type:"Dealer",country:"Germany",city:"Munich",email:"info@wh.de",phone:"+49 89 9876543",reliability:4,avgDiscount:8,notes:"Sport watches. Negotiable on price.",tags:["sport","chrono","vintage"]},
  {id:3,name:"Kenji Watanabe",type:"Private Collector",country:"Japan",city:"Tokyo",email:"kenji@example.jp",phone:"+81 3 1234 5678",reliability:5,avgDiscount:15,notes:"JDM pieces. Very honest condition reports.",tags:["JDM","seiko","citizen"]},
];

const WISHLIST0 = [
  {id:1,brand:"Seiko",model:"Seiko 5 Sports",ref:"6119-8400",year:"1970s",targetBuy:400,marketEst:650,priority:"high",notes:"Rally dial preferred",found:false},
  {id:2,brand:"Grand Seiko",model:"Snowflake",ref:"SBGA211",year:"2010s",targetBuy:3200,marketEst:4000,priority:"medium",notes:"White dial only",found:false},
  {id:3,brand:"Omega",model:"Constellation Pie-Pan",ref:"2852",year:"1960s",targetBuy:1800,marketEst:2400,priority:"high",notes:"Original bracelet a bonus",found:true},
];

const PIPELINE0 = [
  {id:1,brand:"Heuer",model:"Autavia",ref:"2446",year:"1965",askingPrice:8500,offerMade:7200,status:"negotiating",supplierId:2,notes:"Seller wants 8k, pushing back",lastContact:"2024-05-10"},
  {id:2,brand:"Seiko",model:"Laurel",ref:"J14050",year:"1960",askingPrice:1200,offerMade:900,status:"interested",supplierId:3,notes:"Need photos of caseback",lastContact:"2024-05-08"},
  {id:3,brand:"Rolex",model:"Explorer",ref:"1016",year:"1969",askingPrice:12000,offerMade:0,status:"tracking",supplierId:1,notes:"Too expensive now, monitor",lastContact:"2024-04-30"},
];

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function BrandSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = BRANDS.filter(b => b.n.toLowerCase().includes(q.toLowerCase()));
  const sel = BRANDS.find(b => b.n === value);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={() => setOpen(o => !o)} style={{ ...INP, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", color: value ? "#f0ebe0" : "#555" }}>
        <span>{sel ? `${sel.f} ${sel.n}` : "Select brand…"}</span>
        <span style={{ color:"#444", fontSize:10 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:999, background:"#13131a", border:"1px solid #2a2a38", borderRadius:10, boxShadow:"0 20px 50px rgba(0,0,0,0.7)", overflow:"hidden" }}>
          <div style={{ padding:"8px 10px", borderBottom:"1px solid #1e1e2e" }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ ...INP, fontSize:13, padding:"6px 10px" }} />
          </div>
          <div style={{ maxHeight:220, overflowY:"auto" }}>
            {filtered.map(b => (
              <div key={b.n} onClick={() => { onChange(b.n); setOpen(false); setQ(""); }}
                style={{ padding:"9px 14px", cursor:"pointer", fontSize:13, display:"flex", gap:8, color: value===b.n?"#c9a84c":"#ccc" }}
                onMouseEnter={e => e.currentTarget.style.background="#1a1a28"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <span>{b.f}</span><span>{b.n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, accent, small, highlight }) {
  return (
    <div style={{ ...CARD, padding:"18px 20px", background: highlight ? "#1a1808" : "#13131a", borderColor: highlight ? "#3a3010" : "#2a2a38" }}>
      <div style={{ fontSize:10, color:"#444", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:7 }}>{label}</div>
      <div style={{ ...NUM, fontSize: small?17:22, color: accent||"#f0ebe0", lineHeight:1, letterSpacing:"-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#444", marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function Stars({ n }) {
  return <span>{[1,2,3,4,5].map(i => <span key={i} style={{ color:i<=n?"#c9a84c":"#222", fontSize:12 }}>★</span>)}</span>;
}

function Badge({ status }) {
  const s = SC[status] || SC.listed;
  return <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:s.bg, color:s.fg, whiteSpace:"nowrap" }}>{status}</span>;
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#13131a", border:"1px solid #2a2a38", borderRadius:10, padding:"10px 14px", fontSize:12 }}>
      {label && <div style={{ color:"#555", marginBottom:4 }}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{ ...NUM, color:p.color||"#c9a84c" }}>
          {p.name}: {typeof p.value==="number" && Math.abs(p.value)>100 ? fmt(p.value) : p.value+(p.name?.includes("%")?"%" :"")}
        </div>
      ))}
    </div>
  );
}

function WatchModal({ data, suppliers, onClose, onSave }) {
  const [f, setF] = useState(data || { brand:"",model:"",ref:"",year:"",condition:"Good",cost:"",askingPrice:"",status:"listed",bought:"",soldDate:"",supplierId:"",serviceCost:"",marketValue:"",notes:"",tags:"" });
  const u = (k,v) => setF(p=>({...p,[k]:v}));
  const pv = f.cost && f.askingPrice ? Number(f.askingPrice)-Number(f.cost)-Number(f.serviceCost||0) : null;
  const mv = pv!==null && Number(f.cost)>0 ? pv/Number(f.cost) : null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#13131a", border:"1px solid #2a2a38", borderRadius:18, padding:"28px", width:560, maxWidth:"100%", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:600 }}>{data?"Edit Watch":"Add Watch"}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#444", fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ marginBottom:12 }}><label style={LBL}>Brand</label><BrandSelect value={f.brand} onChange={v=>u("brand",v)}/></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
          {[["model","Model"],["ref","Reference"],["year","Year"]].map(([k,l])=>(
            <div key={k}><label style={LBL}>{l}</label><input value={f[k]||""} onChange={e=>u(k,e.target.value)} style={INP}/></div>
          ))}
          <div><label style={LBL}>Condition</label><select value={f.condition} onChange={e=>u("condition",e.target.value)} style={INP}>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:11, marginTop:11 }}>
          <div><label style={LBL}>Cost (€)</label><input value={f.cost||""} onChange={e=>u("cost",e.target.value)} type="number" style={INP}/></div>
          <div><label style={LBL}>Asking Price (€)</label><input value={f.askingPrice||""} onChange={e=>u("askingPrice",e.target.value)} type="number" style={INP}/></div>
          <div><label style={LBL}>Service Cost (€)</label><input value={f.serviceCost||""} onChange={e=>u("serviceCost",e.target.value)} type="number" style={INP} placeholder="0"/></div>
        </div>
        <div style={{ marginTop:11 }}><label style={LBL}>Current Market Value (€)</label><input value={f.marketValue||""} onChange={e=>u("marketValue",e.target.value)} type="number" style={INP} placeholder="Your market estimate"/></div>
        {pv!==null && (
          <div style={{ background:"#0e0e18", border:"1px solid #2a2a38", borderRadius:8, padding:"10px 14px", marginTop:10, display:"flex", gap:20 }}>
            <span style={{ fontSize:12, color:"#555" }}>Net profit: <strong style={{ ...NUM, color:pv>=0?"#5de08a":"#e85d04" }}>{fmt(pv)}</strong></span>
            <span style={{ fontSize:12, color:"#555" }}>Margin: <strong style={{ ...NUM, color:"#c9a84c" }}>{mv!==null?pct(mv):"—"}</strong></span>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginTop:11 }}>
          <div><label style={LBL}>Status</label><select value={f.status} onChange={e=>u("status",e.target.value)} style={INP}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={LBL}>Supplier</label><select value={f.supplierId||""} onChange={e=>u("supplierId",Number(e.target.value))} style={INP}><option value="">— none —</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label style={LBL}>Date Bought</label><input value={f.bought||""} onChange={e=>u("bought",e.target.value)} type="date" style={INP}/></div>
          {f.status==="sold"&&<div><label style={LBL}>Date Sold</label><input value={f.soldDate||""} onChange={e=>u("soldDate",e.target.value)} type="date" style={INP}/></div>}
        </div>
        <div style={{ marginTop:11 }}><label style={LBL}>Tags (comma separated)</label><input value={f.tags||""} onChange={e=>u("tags",e.target.value)} style={INP} placeholder="diver, JDM, papers…"/></div>
        <div style={{ marginTop:11 }}><label style={LBL}>Notes</label><textarea value={f.notes||""} onChange={e=>u("notes",e.target.value)} rows={2} style={{ ...INP, resize:"vertical", fontFamily:"inherit" }}/></div>
        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #2a2a38", borderRadius:8, padding:"8px 18px", color:"#666", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>onSave({...f,cost:Number(f.cost),askingPrice:Number(f.askingPrice),serviceCost:Number(f.serviceCost||0),marketValue:Number(f.marketValue||0),id:f.id||Date.now(),tags:typeof f.tags==="string"?f.tags.split(",").map(t=>t.trim()).filter(Boolean):f.tags})}
            style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"8px 22px", color:"#0a0a0e", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function SupplierModal({ data, onClose, onSave }) {
  const [f, setF] = useState(data?{...data,tags:data.tags?.join(", ")||""}:{name:"",type:"Private Collector",country:"",city:"",email:"",phone:"",reliability:3,avgDiscount:0,notes:"",tags:""});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#13131a", border:"1px solid #2a2a38", borderRadius:18, padding:"28px", width:500, maxWidth:"100%", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:600 }}>{data?"Edit Supplier":"Add Supplier"}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#444", fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
          <div style={{ gridColumn:"span 2" }}><label style={LBL}>Name / Company</label><input value={f.name} onChange={e=>u("name",e.target.value)} style={INP}/></div>
          <div><label style={LBL}>Type</label><select value={f.type} onChange={e=>u("type",e.target.value)} style={INP}>{["Private Collector","Dealer","Auction House","Estate Sale","Online Marketplace","Pawnshop","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={LBL}>Country</label><input value={f.country} onChange={e=>u("country",e.target.value)} style={INP}/></div>
          <div><label style={LBL}>City</label><input value={f.city} onChange={e=>u("city",e.target.value)} style={INP}/></div>
          <div><label style={LBL}>Email</label><input value={f.email} onChange={e=>u("email",e.target.value)} type="email" style={INP}/></div>
          <div><label style={LBL}>Phone</label><input value={f.phone} onChange={e=>u("phone",e.target.value)} style={INP}/></div>
          <div><label style={LBL}>Reliability (1–5)</label><input value={f.reliability} onChange={e=>u("reliability",Math.min(5,Math.max(1,Number(e.target.value))))} type="number" min={1} max={5} style={INP}/></div>
          <div><label style={LBL}>Avg Discount %</label><input value={f.avgDiscount} onChange={e=>u("avgDiscount",Number(e.target.value))} type="number" style={INP}/></div>
          <div style={{ gridColumn:"span 2" }}><label style={LBL}>Tags</label><input value={f.tags} onChange={e=>u("tags",e.target.value)} style={INP} placeholder="rolex, papers, JDM…"/></div>
          <div style={{ gridColumn:"span 2" }}><label style={LBL}>Notes</label><textarea value={f.notes} onChange={e=>u("notes",e.target.value)} rows={3} style={{ ...INP, resize:"vertical", fontFamily:"inherit" }}/></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #2a2a38", borderRadius:8, padding:"8px 18px", color:"#666", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>onSave({...f,reliability:Number(f.reliability),avgDiscount:Number(f.avgDiscount),id:f.id||Date.now(),tags:f.tags.split(",").map(t=>t.trim()).filter(Boolean)})}
            style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"8px 22px", color:"#0a0a0e", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── TABLE HELPERS ─────────────────────────────────────────────────────────────
function TH({ children }) {
  return <th style={{ padding:"10px 14px", textAlign:"left", color:"#333", fontWeight:500, fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em" }}>{children}</th>;
}
function TD({ children, mono, accent, dim, bold }) {
  return <td style={{ padding:"10px 14px", ...( mono?NUM:{}), color: accent||( dim?"#444":"#ccc"), fontWeight: bold?600:400, fontSize: mono?11:12 }}>{children}</td>;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function PWATrack() {
  const [watches,   setWatches]   = useState(WATCHES0);
  const [suppliers, setSuppliers] = useState(SUPPLIERS0);
  const [wishlist,  setWishlist]  = useState(WISHLIST0);
  const [pipeline,  setPipeline]  = useState(PIPELINE0);
  const [tab,       setTab]       = useState("Overview");
  const [wm,        setWm]        = useState(null);
  const [sm,        setSm]        = useState(null);
  const [search,    setSearch]    = useState("");
  const [fStatus,   setFStatus]   = useState("all");
  const [period,    setPeriod]    = useState("all");

  const sold   = useMemo(()=>watches.filter(w=>w.status==="sold"),   [watches]);
  const active = useMemo(()=>watches.filter(w=>w.status!=="sold"),   [watches]);
  const listed = useMemo(()=>watches.filter(w=>w.status==="listed"), [watches]);

  // real profit = gross - service costs
  const netProf = w => prof(w) - (w.serviceCost||0);
  const netMarg = w => w.cost>0 ? netProf(w)/w.cost : 0;

  const totalNetProfit  = useMemo(()=>sold.reduce((a,w)=>a+netProf(w),0),  [sold]);
  const totalRevenue    = useMemo(()=>sold.reduce((a,w)=>a+w.askingPrice,0),[sold]);
  const totalServiceCost= useMemo(()=>watches.reduce((a,w)=>a+(w.serviceCost||0),0),[watches]);
  const avgNetMargin    = useMemo(()=>sold.length?sold.reduce((a,w)=>a+netMarg(w),0)/sold.length:0,[sold]);
  const capRisk         = useMemo(()=>active.reduce((a,w)=>a+w.cost,0),[active]);
  const unrealisedPnl   = useMemo(()=>active.reduce((a,w)=>a+(w.marketValue||w.askingPrice)-w.cost-(w.serviceCost||0),0),[active]);
  const avgHold         = useMemo(()=>{const ws=sold.filter(w=>w.bought&&w.soldDate);return ws.length?Math.round(ws.reduce((a,w)=>a+days(w.bought,w.soldDate),0)/ws.length):0;},[sold]);
  const winRate         = useMemo(()=>sold.length?sold.filter(w=>netMarg(w)>=0.1).length/sold.length:0,[sold]);
  const bestFlip        = useMemo(()=>sold.length?sold.reduce((a,b)=>netProf(a)>netProf(b)?a:b):null,[sold]);
  const worstFlip       = useMemo(()=>sold.length?sold.reduce((a,b)=>netProf(a)<netProf(b)?a:b):null,[sold]);

  const monthly = useMemo(()=>{
    const map={};
    sold.forEach(w=>{
      if(!w.soldDate)return;
      const d=new Date(w.soldDate);
      const k=`${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
      if(!map[k])map[k]={label:MONTHS[d.getMonth()]+"'"+String(d.getFullYear()).slice(2),profit:0,cost:0,month:d.getMonth(),year:d.getFullYear(),count:0};
      map[k].profit+=netProf(w);map[k].cost+=w.cost;map[k].count++;
    });
    let cum=0;
    return Object.values(map).sort((a,b)=>a.year-b.year||a.month-b.month)
      .map(m=>({...m,cumulative:(cum+=m.profit),marginPct:m.cost?+((m.profit/m.cost)*100).toFixed(1):0}));
  },[sold]);

  const brandStats = useMemo(()=>{
    const map={};
    watches.forEach(w=>{
      if(!map[w.brand])map[w.brand]={brand:w.brand,profit:0,cost:0,sold:0,active:0};
      if(w.status==="sold"){map[w.brand].profit+=netProf(w);map[w.brand].cost+=w.cost;map[w.brand].sold++;}
      else map[w.brand].active++;
    });
    return Object.values(map).map(b=>({...b,avgMarginPct:b.cost?+((b.profit/b.cost)*100).toFixed(1):0})).sort((a,b)=>b.profit-a.profit);
  },[watches]);

  const supStats = useMemo(()=>suppliers.map(s=>{
    const sw=watches.filter(w=>w.supplierId===s.id);
    const ss=sw.filter(w=>w.status==="sold");
    return{...s,wCount:sw.length,sCount:ss.length,totalP:ss.reduce((a,w)=>a+netProf(w),0),avgM:ss.length?ss.reduce((a,w)=>a+netMarg(w),0)/ss.length:0};
  }),[suppliers,watches]);

  const pnlWatches = useMemo(()=>{
    if(period==="all")return sold;
    const c=new Date();c.setMonth(c.getMonth()-Number(period));
    return sold.filter(w=>w.soldDate&&new Date(w.soldDate)>=c);
  },[sold,period]);

  // Intelligence data
  const scatterData = useMemo(()=>sold.filter(w=>w.bought&&w.soldDate).map(w=>({
    x: days(w.bought,w.soldDate),
    y: +(netMarg(w)*100).toFixed(1),
    z: w.cost,
    name:`${w.brand} ${w.model}`,
    brand:w.brand,
  })),[sold]);

  const monthlyCount = useMemo(()=>{
    const map={};
    sold.forEach(w=>{if(!w.soldDate)return;const d=new Date(w.soldDate);const k=MONTHS[d.getMonth()];if(!map[k])map[k]={month:k,count:0,profit:0};map[k].count++;map[k].profit+=netProf(w);});
    return MONTHS.filter(m=>map[m]).map(m=>map[m]);
  },[sold]);

  const filtered = watches.filter(w=>{
    const q=search.toLowerCase();
    return(!q||`${w.brand} ${w.model} ${w.ref} ${w.year}`.toLowerCase().includes(q))&&(fStatus==="all"||w.status===fStatus);
  });

  const saveWatch    = f=>{setWatches(ws=>f.id&&ws.find(x=>x.id===f.id)?ws.map(x=>x.id===f.id?f:x):[...ws,f]);setWm(null);};
  const saveSupplier = f=>{setSuppliers(ss=>f.id&&ss.find(x=>x.id===f.id)?ss.map(x=>x.id===f.id?f:x):[...ss,f]);setSm(null);};

  const recentActivity = useMemo(()=>[...watches].filter(w=>w.bought||w.soldDate).sort((a,b)=>new Date(b.soldDate||b.bought)-new Date(a.soldDate||a.bought)).slice(0,5),[watches]);

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0e", color:"#f0ebe0", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;} input,select,textarea{color-scheme:dark;}
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:#0a0a0e} ::-webkit-scrollbar-thumb{background:#252535;border-radius:3px}
        input::placeholder,textarea::placeholder{color:#333}
        .row:hover td{background:#0f0f1c !important}
        .ghost{background:none;border:1px solid #2a2a38;border-radius:8px;padding:5px 12px;color:#555;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif}
        .ghost:hover{border-color:#3a3a4a;color:#888}
        .pill-btn{border:1px solid #2a2a38;border-radius:8px;padding:5px 12px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.1s}
      `}</style>

      {/* NAV */}
      <nav style={{ borderBottom:"1px solid #141420", padding:"0 24px", display:"flex", alignItems:"center", gap:1, height:54, position:"sticky", top:0, background:"rgba(10,10,14,0.97)", backdropFilter:"blur(20px)", zIndex:200, overflowX:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginRight:18, flexShrink:0 }}>
          <div style={{ width:20, height:20, borderRadius:"50%", border:"1.5px solid #c9a84c", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#c9a84c" }}/>
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#c9a84c", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>PWA TRACK</span>
        </div>
        {NAV.map(n=>(
          <button key={n} onClick={()=>setTab(n)} style={{ background:tab===n?"#141420":"none", border:"none", borderRadius:7, padding:"5px 11px", color:tab===n?"#f0ebe0":"#444", fontSize:12, cursor:"pointer", fontWeight:tab===n?600:400, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", flexShrink:0 }}>{n}</button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, flexShrink:0 }}>
          <button onClick={()=>setSm("new")} className="ghost">+ Supplier</button>
          <button onClick={()=>setWm("new")} style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"6px 16px", color:"#0a0a0e", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Watch</button>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"26px 24px" }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab==="Overview" && <>
          <h1 style={H1}>Overview</h1>

          {/* Zone 1: What you've made */}
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:10, color:"#444", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Realised</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
              <Kpi label="Net P&L"     value={fmt(totalNetProfit)} sub={`${sold.length} flips closed`} accent="#c9a84c" highlight/>
              <Kpi label="Win Rate"    value={pct(winRate)}        sub="Deals ≥10% margin"             accent="#5de08a"/>
              <Kpi label="Avg Margin"  value={pct(avgNetMargin)}   sub="After service costs"           accent="#5de08a"/>
              <Kpi label="Avg Hold"    value={avgHold+"d"}         sub="Days to sell"                  accent="#f0ebe0"/>
            </div>
          </div>

          {/* Zone 2: What's active */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, color:"#444", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Active</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              <Kpi label="Capital Deployed" value={fmt(capRisk)}      sub={`${active.length} watches`}/>
              <Kpi label="Unrealised P&L"   value={fmt(unrealisedPnl)} sub="vs market value"   accent={unrealisedPnl>=0?"#3a7bd5":"#e85d04"}/>
              <Kpi label="Service Spend"    value={fmt(totalServiceCost)} sub="Total across all watches"/>
              <Kpi label="Pipeline"         value={pipeline.length+""}    sub="Deals being tracked" accent="#9333ea"/>
            </div>
          </div>

          {/* Best / worst + recent */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={{ ...CARD }}>
              <div style={SH}>Best Flip</div>
              {bestFlip ? <>
                <div style={{ fontSize:13, color:"#ccc", marginBottom:4 }}>{bestFlip.brand} {bestFlip.model}</div>
                <div style={{ ...NUM, fontSize:22, color:"#5de08a" }}>{fmt(netProf(bestFlip))}</div>
                <div style={{ fontSize:11, color:"#444", marginTop:4 }}>{pct(netMarg(bestFlip))} margin · {bestFlip.year}</div>
              </> : <div style={{ color:"#444", fontSize:12 }}>No sales yet</div>}
            </div>
            <div style={{ ...CARD }}>
              <div style={SH}>Worst Flip</div>
              {worstFlip ? <>
                <div style={{ fontSize:13, color:"#ccc", marginBottom:4 }}>{worstFlip.brand} {worstFlip.model}</div>
                <div style={{ ...NUM, fontSize:22, color: netProf(worstFlip)<0?"#e85d04":"#c9a84c" }}>{fmt(netProf(worstFlip))}</div>
                <div style={{ fontSize:11, color:"#444", marginTop:4 }}>{pct(netMarg(worstFlip))} margin · {worstFlip.year}</div>
              </> : <div style={{ color:"#444", fontSize:12 }}>No sales yet</div>}
            </div>
            <div style={{ ...CARD }}>
              <div style={SH}>Recent Activity</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {recentActivity.map(w=>(
                  <div key={w.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:bc(w.brand), flexShrink:0 }}/>
                    <span style={{ fontSize:11, color:"#888", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{w.brand} {w.model}</span>
                    <Badge status={w.status}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Monthly Net P&L</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={monthly} barSize={18}>
                  <XAxis dataKey="label" tick={{fill:"#444",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1000).toFixed(0)+"k"}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="profit" name="Net Profit" fill="#c9a84c" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={SH}>Inventory Mix</div>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={[
                    {name:"Listed",value:listed.length,color:"#c9a84c"},
                    {name:"Sold",value:sold.length,color:"#3a7bd5"},
                    {name:"Holding",value:watches.filter(w=>w.status==="holding").length,color:"#5de08a"},
                    {name:"Service",value:watches.filter(w=>w.status==="in service").length,color:"#9333ea"},
                  ].filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={40} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {[0,1,2,3].map(i=><Cell key={i} fill={["#c9a84c","#3a7bd5","#5de08a","#9333ea"][i]}/>)}
                  </Pie>
                  <Legend iconType="circle" iconSize={6} formatter={v=><span style={{color:"#555",fontSize:10}}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active inventory table */}
          <div style={CARD}>
            <div style={SH}>Active Inventory — What's Sitting</div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ borderBottom:"1px solid #1a1a28" }}>
                {["Watch","Year","Condition","Cost","Ask","Unreal. P&L","Days Held","Status"].map(h=><TH key={h}>{h}</TH>)}
              </tr></thead>
              <tbody>
                {active.sort((a,b)=>holdDays(b)-holdDays(a)).map(w=>{
                  const unreal=(w.marketValue||w.askingPrice)-w.cost-(w.serviceCost||0);
                  const hd=holdDays(w);
                  return (
                    <tr key={w.id} className="row" style={{ borderBottom:"1px solid #0d0d18" }}>
                      <td style={{ padding:"10px 14px" }}><span style={{ display:"flex",alignItems:"center",gap:6 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand),flexShrink:0 }}/><span style={{ color:"#ccc" }}>{w.brand} {w.model}</span></span></td>
                      <TD mono dim>{w.year}</TD>
                      <TD dim>{w.condition}</TD>
                      <TD mono>{fmt(w.cost)}</TD>
                      <TD mono>{fmt(w.askingPrice)}</TD>
                      <td style={{ padding:"10px 14px", ...NUM, color:unreal>=0?"#3a7bd5":"#e85d04", fontWeight:600 }}>{fmt(unreal)}</td>
                      <td style={{ padding:"10px 14px", ...NUM, fontSize:11, color: hd>90?"#e85d04":hd>30?"#c9a84c":"#5de08a" }}>{hd}d</td>
                      <td style={{ padding:"10px 14px" }}><Badge status={w.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>}

        {/* ── INVENTORY ─────────────────────────────────────────────────────── */}
        {tab==="Inventory" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Inventory</h1>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ ...INP, width:170 }}/>
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{ ...INP, width:130 }}>
              <option value="all">All statuses</option>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ ...CARD, padding:0, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ borderBottom:"1px solid #1a1a28" }}>
                {["Year","Brand","Model","Ref","Cond.","Cost","Ask","Service","Net Profit","Margin","Days","Market Val.","Status",""].map(h=><TH key={h}>{h}</TH>)}
              </tr></thead>
              <tbody>
                {filtered.map(w=>{
                  const np=netProf(w),nm=netMarg(w),mv=w.marketValue;
                  return (
                    <tr key={w.id} className="row" style={{ borderBottom:"1px solid #0d0d18" }}>
                      <TD mono dim>{w.year}</TD>
                      <td style={{ padding:"10px 14px" }}><span style={{ display:"flex",alignItems:"center",gap:6 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand),flexShrink:0 }}/>{w.brand}</span></td>
                      <td style={{ padding:"10px 14px", color:"#bbb" }}>{w.model}</td>
                      <TD mono dim>{w.ref}</TD>
                      <TD dim>{w.condition}</TD>
                      <TD mono>{fmt(w.cost)}</TD>
                      <TD mono>{fmt(w.askingPrice)}</TD>
                      <td style={{ padding:"10px 14px", ...NUM, fontSize:11, color: w.serviceCost?"#9333ea":"#333" }}>{w.serviceCost?fmt(w.serviceCost):"—"}</td>
                      <td style={{ padding:"10px 14px", ...NUM, color:np>=0?"#5de08a":"#e85d04", fontWeight:600 }}>{fmt(np)}</td>
                      <td style={{ padding:"10px 14px", ...NUM, color:nm>=0.15?"#5de08a":nm>=0.05?"#c9a84c":"#e85d04" }}>{pct(nm)}</td>
                      <TD mono dim>{holdDays(w)??"-"}</TD>
                      <td style={{ padding:"10px 14px", ...NUM, fontSize:11, color: mv?(mv>w.cost?"#3a7bd5":"#e85d04"):"#333" }}>{mv?fmt(mv):"—"}</td>
                      <td style={{ padding:"10px 14px" }}><Badge status={w.status}/></td>
                      <td style={{ padding:"10px 14px" }}><button className="ghost" onClick={()=>setWm(w)}>Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>}

        {/* ── P&L ───────────────────────────────────────────────────────────── */}
        {tab==="P&L" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>P&L Analysis</h1>
            <div style={{ display:"flex", gap:4 }}>
              {[["all","All Time"],["3","3M"],["6","6M"],["12","12M"]].map(([v,l])=>(
                <button key={v} onClick={()=>setPeriod(v)} className="pill-btn" style={{ background:period===v?"#c9a84c":"#13131a", color:period===v?"#0a0a0e":"#555", fontWeight:period===v?700:400 }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:16 }}>
            {[
              ["Net P&L",    fmt(pnlWatches.reduce((a,w)=>a+netProf(w),0)),"#c9a84c"],
              ["Revenue",    fmt(pnlWatches.reduce((a,w)=>a+w.askingPrice,0)),"#f0ebe0"],
              ["Cost Basis", fmt(pnlWatches.reduce((a,w)=>a+w.cost,0)),"#666"],
              ["Service",    fmt(pnlWatches.reduce((a,w)=>a+(w.serviceCost||0),0)),"#9333ea"],
              ["Avg Margin", pnlWatches.length?pct(pnlWatches.reduce((a,w)=>a+netMarg(w),0)/pnlWatches.length):"—","#5de08a"],
              ["Deals",      pnlWatches.length,"#aaa"],
            ].map(([l,v,a])=><Kpi key={l} label={l} value={v} accent={a} small/>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Cumulative Net P&L</div>
              <ResponsiveContainer width="100%" height={175}>
                <LineChart data={monthly}>
                  <XAxis dataKey="label" tick={{fill:"#444",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1000).toFixed(0)+"k"}/>
                  <Tooltip content={<Tip/>}/>
                  <Line type="monotone" dataKey="cumulative" name="Cumulative P&L" stroke="#c9a84c" strokeWidth={2} dot={{fill:"#c9a84c",r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={SH}>Monthly Margin %</div>
              <ResponsiveContainer width="100%" height={175}>
                <BarChart data={monthly} barSize={16}>
                  <XAxis dataKey="label" tick={{fill:"#444",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="marginPct" name="Margin %" fill="#3a7bd5" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>P&L by Brand</div>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={brandStats.filter(b=>b.sold>0)} layout="vertical" barSize={12}>
                  <XAxis type="number" tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1000).toFixed(0)+"k"}/>
                  <YAxis dataKey="brand" type="category" tick={{fill:"#aaa",fontSize:11}} axisLine={false} tickLine={false} width={88}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="profit" name="Net Profit" radius={[0,4,4,0]}>{brandStats.map((b,i)=><Cell key={i} fill={bc(b.brand)}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={SH}>Margin % by Brand</div>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={brandStats.filter(b=>b.sold>0)} layout="vertical" barSize={12}>
                  <XAxis type="number" tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
                  <YAxis dataKey="brand" type="category" tick={{fill:"#aaa",fontSize:11}} axisLine={false} tickLine={false} width={88}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="avgMarginPct" name="Avg Margin %" radius={[0,4,4,0]}>{brandStats.map((b,i)=><Cell key={i} fill={bc(b.brand)}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ ...CARD, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid #1a1a28" }}><span style={SH}>Deal Breakdown</span></div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ borderBottom:"1px solid #1a1a28" }}>
                {["Date","Watch","Year","Cost","Service","Sold For","Net Profit","Margin","Hold Days","Supplier"].map(h=><TH key={h}>{h}</TH>)}
              </tr></thead>
              <tbody>
                {[...pnlWatches].sort((a,b)=>new Date(b.soldDate)-new Date(a.soldDate)).map(w=>{
                  const np=netProf(w),nm=netMarg(w),sup=suppliers.find(s=>s.id===w.supplierId);
                  return (
                    <tr key={w.id} className="row" style={{ borderBottom:"1px solid #0d0d18" }}>
                      <TD mono dim>{w.soldDate}</TD>
                      <td style={{ padding:"10px 14px", color:"#bbb" }}><span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand),flexShrink:0 }}/>{w.brand} {w.model}</span></td>
                      <TD mono dim>{w.year}</TD>
                      <TD mono>{fmt(w.cost)}</TD>
                      <td style={{ padding:"10px 14px", ...NUM, fontSize:11, color:w.serviceCost?"#9333ea":"#333" }}>{w.serviceCost?fmt(w.serviceCost):"—"}</td>
                      <TD mono>{fmt(w.askingPrice)}</TD>
                      <td style={{ padding:"10px 14px", ...NUM, fontWeight:600, color:np>=0?"#5de08a":"#e85d04" }}>{fmt(np)}</td>
                      <td style={{ padding:"10px 14px", ...NUM, color:nm>=0.15?"#5de08a":nm>=0.05?"#c9a84c":"#e85d04" }}>{pct(nm)}</td>
                      <TD mono dim>{holdDays(w)??"-"}</TD>
                      <TD dim>{sup?.name||"—"}</TD>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr style={{ borderTop:"1px solid #2a2a38", background:"#0e0e18" }}>
                <td colSpan={3} style={{ padding:"10px 14px", color:"#333", fontSize:10, textTransform:"uppercase", letterSpacing:"0.07em" }}>Total / Avg</td>
                <td style={{ padding:"10px 14px", ...NUM }}>{fmt(pnlWatches.reduce((a,w)=>a+w.cost,0))}</td>
                <td style={{ padding:"10px 14px", ...NUM, color:"#9333ea" }}>{fmt(pnlWatches.reduce((a,w)=>a+(w.serviceCost||0),0))}</td>
                <td style={{ padding:"10px 14px", ...NUM }}>{fmt(pnlWatches.reduce((a,w)=>a+w.askingPrice,0))}</td>
                <td style={{ padding:"10px 14px", ...NUM, fontWeight:600, color:"#c9a84c" }}>{fmt(pnlWatches.reduce((a,w)=>a+netProf(w),0))}</td>
                <td style={{ padding:"10px 14px", ...NUM, color:"#5de08a" }}>{pnlWatches.length?pct(pnlWatches.reduce((a,w)=>a+netMarg(w),0)/pnlWatches.length):"—"}</td>
                <td colSpan={2}/>
              </tr></tfoot>
            </table>
          </div>
        </>}

        {/* ── SUPPLIERS ─────────────────────────────────────────────────────── */}
        {tab==="Suppliers" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Suppliers</h1>
            <button onClick={()=>setSm("new")} style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"7px 18px", color:"#0a0a0e", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Add Supplier</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
            <Kpi label="Total Suppliers"  value={suppliers.length}/>
            <Kpi label="Top Source"       value={[...supStats].sort((a,b)=>b.totalP-a.totalP)[0]?.name.split(" ")[0]||"—"} accent="#c9a84c"/>
            <Kpi label="Avg Reliability"  value={(suppliers.reduce((a,s)=>a+s.reliability,0)/Math.max(1,suppliers.length)).toFixed(1)+" / 5"} accent="#5de08a"/>
            <Kpi label="Sourced Watches"  value={watches.filter(w=>w.supplierId).length}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
            {supStats.map(s=>(
              <div key={s.id} style={{ ...CARD, display:"flex", gap:16, alignItems:"flex-start", padding:"18px 20px" }}>
                <div style={{ width:40,height:40,borderRadius:"50%",background:`${bc(s.name)}18`,border:`1.5px solid ${bc(s.name)}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:bc(s.name),flexShrink:0 }}>{s.name[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600 }}>{s.name}</span>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#1a1a28", color:"#555" }}>{s.type}</span>
                    <span style={{ fontSize:11, color:"#333" }}>{[s.city,s.country].filter(Boolean).join(", ")}</span>
                  </div>
                  <Stars n={s.reliability}/>
                  <div style={{ fontSize:12, color:"#444", marginTop:4, marginBottom:5 }}>{s.notes}</div>
                  {s.tags?.length>0&&<div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>{s.tags.map(t=><span key={t} style={{ fontSize:10,padding:"2px 8px",borderRadius:20,background:"#141420",color:"#444",border:"1px solid #1e1e2e" }}>{t}</span>)}</div>}
                  <div style={{ display:"flex", gap:14, marginTop:7 }}>
                    {s.email&&<span style={{ fontSize:11,color:"#3a7bd5" }}>✉ {s.email}</span>}
                    {s.phone&&<span style={{ fontSize:11,color:"#444" }}>☎ {s.phone}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:14, alignItems:"center", flexShrink:0 }}>
                  {[["Net P&L",fmt(s.totalP),s.totalP>0?"#5de08a":"#666"],["Avg Margin",s.avgM>0?pct(s.avgM):"—","#c9a84c"],["Watches",s.wCount,"#aaa"],["Disc.",s.avgDiscount+"%","#aaa"]].map(([l,v,c])=>(
                    <div key={l} style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10,color:"#333",marginBottom:2,textTransform:"uppercase",letterSpacing:"0.07em" }}>{l}</div>
                      <div style={{ ...NUM,fontSize:14,color:c }}>{v}</div>
                    </div>
                  ))}
                  <button className="ghost" onClick={()=>setSm(s)}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ── SALES ─────────────────────────────────────────────────────────── */}
        {tab==="Sales" && <>
          <h1 style={H1}>Sales History</h1>
          <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Cumulative Net Profit</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthly}>
                  <XAxis dataKey="label" tick={{fill:"#444",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1000).toFixed(0)+"k"}/>
                  <Tooltip content={<Tip/>}/>
                  <Line type="monotone" dataKey="cumulative" name="Cumulative P&L" stroke="#c9a84c" strokeWidth={2} dot={{fill:"#c9a84c",r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={SH}>Margin Bands</div>
              {[["0–10%",0,0.1],["10–20%",0.1,0.2],["20–30%",0.2,0.3],["30%+",0.3,Infinity]].map(([range,lo,hi])=>{
                const cnt=sold.filter(w=>{const m=netMarg(w);return m>=lo&&m<hi;}).length;
                const p=sold.length?(cnt/sold.length)*100:0;
                return (
                  <div key={range} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                    <span style={{ ...NUM, fontSize:11, color:"#444", width:50 }}>{range}</span>
                    <div style={{ flex:1, height:7, background:"#161622", borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:p+"%", background:"#c9a84c", borderRadius:4 }}/>
                    </div>
                    <span style={{ ...NUM, fontSize:12, color:"#888", width:16, textAlign:"right" }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ ...CARD, padding:0, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ borderBottom:"1px solid #1a1a28" }}>
                {["Date","Brand","Model","Year","Cond.","Cost","Service","Sold For","Net Profit","Margin","Hold Days"].map(h=><TH key={h}>{h}</TH>)}
              </tr></thead>
              <tbody>
                {[...sold].sort((a,b)=>new Date(b.soldDate)-new Date(a.soldDate)).map(w=>(
                  <tr key={w.id} className="row" style={{ borderBottom:"1px solid #0d0d18" }}>
                    <TD mono dim>{w.soldDate}</TD>
                    <td style={{ padding:"10px 14px" }}><span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand) }}/>{w.brand}</span></td>
                    <td style={{ padding:"10px 14px", color:"#bbb" }}>{w.model}</td>
                    <TD mono dim>{w.year}</TD>
                    <TD dim>{w.condition}</TD>
                    <TD mono>{fmt(w.cost)}</TD>
                    <td style={{ padding:"10px 14px", ...NUM, fontSize:11, color:w.serviceCost?"#9333ea":"#333" }}>{w.serviceCost?fmt(w.serviceCost):"—"}</td>
                    <TD mono>{fmt(w.askingPrice)}</TD>
                    <td style={{ padding:"10px 14px", ...NUM, fontWeight:600, color:netProf(w)>=0?"#5de08a":"#e85d04" }}>{fmt(netProf(w))}</td>
                    <td style={{ padding:"10px 14px", ...NUM, color:netMarg(w)>=0.15?"#5de08a":netMarg(w)>=0.05?"#c9a84c":"#e85d04" }}>{pct(netMarg(w))}</td>
                    <TD mono dim>{holdDays(w)??"-"}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}

        {/* ── INTELLIGENCE ──────────────────────────────────────────────────── */}
        {tab==="Intelligence" && <>
          <h1 style={H1}>Business Intelligence</h1>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Margin vs Hold Days — Speed vs Profit</div>
              <div style={{ fontSize:11, color:"#444", marginBottom:10 }}>Each dot = one flip. Bigger = higher cost basis.</div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid stroke="#1a1a28" strokeDasharray="3 3"/>
                  <XAxis type="number" dataKey="x" name="Hold Days" tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false} label={{ value:"Hold Days", position:"insideBottom", fill:"#444", fontSize:10, dy:10 }}/>
                  <YAxis type="number" dataKey="y" name="Margin %" tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
                  <ZAxis dataKey="z" range={[40,200]}/>
                  <Tooltip cursor={{stroke:"#2a2a38"}} content={({active,payload})=>{
                    if(!active||!payload?.length)return null;
                    const d=payload[0].payload;
                    return <div style={{ background:"#13131a", border:"1px solid #2a2a38", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
                      <div style={{ color:"#888", marginBottom:3 }}>{d.name}</div>
                      <div style={{ ...NUM, color:"#c9a84c" }}>{d.y}% margin · {d.x}d hold</div>
                    </div>;
                  }}/>
                  <Scatter data={scatterData} fill="#c9a84c" fillOpacity={0.8}>
                    {scatterData.map((d,i)=><Cell key={i} fill={bc(d.brand)}/>)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={SH}>Sales Volume by Month</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyCount} barSize={20}>
                  <XAxis dataKey="month" tick={{fill:"#444",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#444",fontSize:10,...NUM}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="count" name="Watches Sold" fill="#3a7bd5" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Capital Efficiency by Brand</div>
              <div style={{ fontSize:11, color:"#444", marginBottom:10 }}>Net profit per €1 of cost deployed</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {brandStats.filter(b=>b.sold>0).map(b=>{
                  const eff=b.cost?b.profit/b.cost:0;
                  const maxEff=Math.max(...brandStats.filter(x=>x.sold>0).map(x=>x.cost?x.profit/x.cost:0));
                  return (
                    <div key={b.brand} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ width:6,height:6,borderRadius:"50%",background:bc(b.brand),flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:"#888", width:90, flexShrink:0 }}>{b.brand}</span>
                      <div style={{ flex:1, height:7, background:"#161622", borderRadius:4, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(eff/maxEff)*100}%`, background:bc(b.brand), borderRadius:4 }}/>
                      </div>
                      <span style={{ ...NUM, fontSize:12, color:"#c9a84c", width:50, textAlign:"right" }}>{pct(eff)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={CARD}>
              <div style={SH}>Supplier ROI Ranking</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[...supStats].sort((a,b)=>b.avgM-a.avgM).map((s,i)=>(
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#0e0e18", borderRadius:10 }}>
                    <span style={{ ...NUM, fontSize:13, color:"#333", width:18 }}>#{i+1}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:"#ccc" }}>{s.name}</div>
                      <div style={{ fontSize:10, color:"#444" }}>{s.sCount} sold · {s.avgDiscount}% avg disc</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ ...NUM, fontSize:15, color:"#5de08a" }}>{s.avgM>0?pct(s.avgM):"—"}</div>
                      <div style={{ fontSize:10, color:"#444" }}>avg margin</div>
                    </div>
                    <Stars n={s.reliability}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={CARD}>
            <div style={SH}>Condition vs Margin — What Condition is Worth Buying</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
              {CONDITIONS.map(c=>{
                const ws=sold.filter(w=>w.condition===c);
                const avg=ws.length?ws.reduce((a,w)=>a+netMarg(w),0)/ws.length:null;
                return (
                  <div key={c} style={{ background:"#0e0e18", borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                    <div style={{ fontSize:10, color:"#444", marginBottom:6 }}>{c}</div>
                    <div style={{ ...NUM, fontSize:17, color:avg===null?"#333":avg>=0.15?"#5de08a":avg>=0.05?"#c9a84c":"#e85d04" }}>{avg!==null?pct(avg):"—"}</div>
                    <div style={{ fontSize:10, color:"#444", marginTop:4 }}>{ws.length} sold</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>}

        {/* ── WISHLIST ──────────────────────────────────────────────────────── */}
        {tab==="Wishlist" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Wishlist</h1>
            <button onClick={()=>setWishlist(w=>[...w,{id:Date.now(),brand:"",model:"",ref:"",year:"",targetBuy:0,marketEst:0,priority:"medium",notes:"",found:false}])}
              style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"7px 18px", color:"#0a0a0e", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Add to Wishlist</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {wishlist.map(item=>(
              <div key={item.id} style={{ ...CARD, padding:"16px 20px", display:"flex", gap:16, alignItems:"center", opacity:item.found?0.5:1 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600, color: item.found?"#555":"#f0ebe0" }}>{item.brand||"—"} {item.model||"—"}</span>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background: item.priority==="high"?"#2a1a0e":item.priority==="medium"?"#1a1a28":"#1a2a1a", color: item.priority==="high"?"#c9a84c":item.priority==="medium"?"#888":"#5de08a" }}>{item.priority}</span>
                    {item.found&&<span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#1a2f3a", color:"#3a7bd5" }}>found</span>}
                  </div>
                  <div style={{ fontSize:11, color:"#444" }}>{item.year} · {item.ref} · {item.notes}</div>
                </div>
                <div style={{ display:"flex", gap:20, alignItems:"center", flexShrink:0 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"#333", marginBottom:2 }}>Target Buy</div>
                    <div style={{ ...NUM, fontSize:15, color:"#c9a84c" }}>{item.targetBuy?fmt(item.targetBuy):"—"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"#333", marginBottom:2 }}>Market Est.</div>
                    <div style={{ ...NUM, fontSize:15, color:"#888" }}>{item.marketEst?fmt(item.marketEst):"—"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"#333", marginBottom:2 }}>Upside</div>
                    <div style={{ ...NUM, fontSize:15, color: item.marketEst&&item.targetBuy?(item.marketEst-item.targetBuy)>0?"#5de08a":"#e85d04":"#333" }}>
                      {item.marketEst&&item.targetBuy?fmt(item.marketEst-item.targetBuy):"—"}
                    </div>
                  </div>
                  <button onClick={()=>setWishlist(w=>w.map(x=>x.id===item.id?{...x,found:!x.found}:x))} className="ghost">{item.found?"Unmark":"Mark Found"}</button>
                  <button onClick={()=>setWishlist(w=>w.filter(x=>x.id!==item.id))} className="ghost" style={{ color:"#e85d04", borderColor:"#3a1a1a" }}>×</button>
                </div>
              </div>
            ))}
            {!wishlist.length&&<div style={{ color:"#333", fontSize:13, textAlign:"center", padding:"40px 0" }}>No watches on your wishlist yet</div>}
          </div>
        </>}

        {/* ── PIPELINE ─────────────────────────────────────────────────────── */}
        {tab==="Pipeline" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Deal Pipeline</h1>
            <button onClick={()=>setPipeline(p=>[...p,{id:Date.now(),brand:"",model:"",ref:"",year:"",askingPrice:0,offerMade:0,status:"interested",supplierId:"",notes:"",lastContact:""}])}
              style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"7px 18px", color:"#0a0a0e", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Add Deal</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
            {[["tracking","Tracking",pipeline.filter(p=>p.status==="tracking").length],["interested","Interested",pipeline.filter(p=>p.status==="interested").length],["negotiating","Negotiating",pipeline.filter(p=>p.status==="negotiating").length]].map(([s,l,c])=>(
              <div key={s} style={{ ...CARD, textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#444", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{l}</div>
                <div style={{ ...NUM, fontSize:28, color: s==="negotiating"?"#c9a84c":s==="interested"?"#3a7bd5":"#666" }}>{c}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {pipeline.map(item=>{
              const gap=item.askingPrice&&item.offerMade?item.askingPrice-item.offerMade:null;
              const sup=suppliers.find(s=>s.id===item.supplierId);
              return (
                <div key={item.id} style={{ ...CARD, padding:"16px 20px", display:"flex", gap:16, alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600 }}>{item.brand||"—"} {item.model||"—"}</span>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background: item.status==="negotiating"?"#2a1a0e":item.status==="interested"?"#1a2f3a":"#1a2a1a", color: item.status==="negotiating"?"#c9a84c":item.status==="interested"?"#3a7bd5":"#5de08a" }}>{item.status}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#444" }}>{item.year} · {item.ref} {sup?`· ${sup.name}`:""}</div>
                    <div style={{ fontSize:11, color:"#555", marginTop:4 }}>{item.notes}</div>
                    {item.lastContact&&<div style={{ fontSize:10, color:"#333", marginTop:4 }}>Last contact: {item.lastContact}</div>}
                  </div>
                  <div style={{ display:"flex", gap:18, alignItems:"center", flexShrink:0 }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:"#333", marginBottom:2 }}>Asking</div>
                      <div style={{ ...NUM, fontSize:14, color:"#888" }}>{item.askingPrice?fmt(item.askingPrice):"—"}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:"#333", marginBottom:2 }}>Our Offer</div>
                      <div style={{ ...NUM, fontSize:14, color:"#c9a84c" }}>{item.offerMade?fmt(item.offerMade):"—"}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:"#333", marginBottom:2 }}>Gap</div>
                      <div style={{ ...NUM, fontSize:14, color: gap!==null?(gap>0?"#e85d04":"#5de08a"):"#333" }}>{gap!==null?fmt(gap):"—"}</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {["tracking","interested","negotiating"].map(s=>(
                        <button key={s} onClick={()=>setPipeline(p=>p.map(x=>x.id===item.id?{...x,status:s}:x))}
                          className="pill-btn" style={{ background:item.status===s?"#c9a84c":"#13131a", color:item.status===s?"#0a0a0e":"#555", fontWeight:item.status===s?700:400, fontSize:10, padding:"4px 9px" }}>
                          {s}
                        </button>
                      ))}
                      <button onClick={()=>setPipeline(p=>p.filter(x=>x.id!==item.id))} className="ghost" style={{ color:"#e85d04", borderColor:"#3a1a1a" }}>×</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!pipeline.length&&<div style={{ color:"#333", fontSize:13, textAlign:"center", padding:"40px 0" }}>No deals in the pipeline</div>}
          </div>
        </>}

      </div>

      {wm&&<WatchModal data={wm==="new"?null:wm} suppliers={suppliers} onClose={()=>setWm(null)} onSave={saveWatch}/>}
      {sm&&<SupplierModal data={sm==="new"?null:sm} onClose={()=>setSm(null)} onSave={saveSupplier}/>}
    </div>
  );
}
