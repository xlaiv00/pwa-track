import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis, CartesianGrid } from "recharts";

// ── CURRENCIES ────────────────────────────────────────────────────────────────
const CURRENCIES = {
  EUR: { symbol:"€", rate:1,     locale:"de-DE" },
  CZK: { symbol:"Kč",rate:25.2,  locale:"cs-CZ" },
  USD: { symbol:"$", rate:1.08,  locale:"en-US" },
  GBP: { symbol:"£", rate:0.86,  locale:"en-GB" },
};

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

const CONDITIONS = ["Poor","Fair","Good","Very Good","Excellent","NOS"];
const STATUSES   = ["listed","sold","holding","in service"];
const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NAV        = ["Overview","Inventory","Logistics","P&L","Suppliers","Sales","Intelligence","Wishlist","Pipeline","Calculator"];

const pct     = n => (n * 100).toFixed(1) + "%";
const profRaw = w => w.askingPrice - w.cost;
const margRaw = w => w.cost > 0 ? (w.askingPrice - w.cost) / w.cost : 0;
const daysBetween = (a,b) => a && b ? Math.round((new Date(b)-new Date(a))/86400000) : null;
const holdDays = w => {
  if (w.bought && w.soldDate) return daysBetween(w.bought, w.soldDate);
  if (w.bought) return Math.round((Date.now()-new Date(w.bought))/86400000);
  return null;
};

const SC = {
  sold:          { bg:"#1a2f3a", fg:"#3a7bd5" },
  listed:        { bg:"#2a1a0e", fg:"#c9a84c" },
  holding:       { bg:"#1a2a1a", fg:"#5de08a" },
  "in service":  { bg:"#1e1230", fg:"#9333ea" },
  preparing:     { bg:"#222222", fg:"#888" },
  "in transit":  { bg:"#2a1a0e", fg:"#c9a84c" },
  delivered:     { bg:"#1a2f3a", fg:"#3a7bd5" },
};

const BASE_INP  = { width:"100%", background:"#121212", border:"1px solid #2e2e2e", borderRadius:8, padding:"9px 12px", color:"#f0ebe0", fontSize:14, outline:"none", boxSizing:"border-box" };
const BASE_LBL  = { display:"block", fontSize:10, color:"#777", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:5, fontFamily:"'DM Sans',sans-serif" };
const NUM       = { fontFamily:"'IBM Plex Mono',monospace", fontWeight:500 };
const CARD      = { background:"#181818", border:"1px solid #2e2e2e", borderRadius:14, padding:"20px 20px 14px" };
const SH_STYLE  = { fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, color:"#c9a84c", marginBottom:14 };

// ── SEED DATA ─────────────────────────────────────────────────────────────────
const WATCHES0 = [
  {id:10,brand:"Seiko",model:"Dolce",ref:"8N41-9000",year:"1992",condition:"Excellent",cost:320,askingPrice:680,status:"sold",bought:"2024-01-10",soldDate:"2024-02-05",supplierId:3,serviceCost:0,marketValue:700,notes:"Gold-tone, box and papers",tags:["JDM","dress"],photos:[],timeline:[{date:"2024-01-10",type:"bought",note:"Bought from Kenji, excellent shape"},{date:"2024-02-03",type:"offer",note:"Offer received €650, declined"},{date:"2024-02-05",type:"sold",note:"Sold for €680 to Prague buyer"}]},
  {id:11,brand:"Seiko",model:"Exceline",ref:"1E20-6010",year:"1988",condition:"Very Good",cost:480,askingPrice:920,status:"sold",bought:"2024-01-22",soldDate:"2024-03-01",supplierId:3,serviceCost:60,marketValue:950,notes:"Diamond markers, original bracelet",tags:["JDM","luxury"],photos:[],timeline:[{date:"2024-01-22",type:"bought",note:"Bought from Kenji"},{date:"2024-02-10",type:"service",note:"Sent for service, €60"},{date:"2024-03-01",type:"sold",note:"Sold €920"}]},
  {id:12,brand:"Seiko",model:"62MAS",ref:"J13070",year:"1965",condition:"Good",cost:1800,askingPrice:2600,status:"listed",bought:"2024-03-05",soldDate:"",supplierId:3,serviceCost:120,marketValue:2800,notes:"First diver, rare, unpolished",tags:["diver","vintage"],photos:[],timeline:[{date:"2024-03-05",type:"bought",note:"Sourced from Japan"},{date:"2024-03-20",type:"service",note:"Movement service €120"},{date:"2024-04-01",type:"offer",note:"Offer €2200 received, too low"}]},
  {id:13,brand:"Seiko",model:"King Seiko",ref:"4402-8000",year:"1969",condition:"Very Good",cost:650,askingPrice:1100,status:"holding",bought:"2024-04-02",soldDate:"",supplierId:3,serviceCost:80,marketValue:1200,notes:"KS emblem dial, cal. 4402",tags:["JDM","dress"],photos:[],timeline:[{date:"2024-04-02",type:"bought",note:"Great buy from Kenji"}]},
  {id:1,brand:"Rolex",model:"Submariner Date",ref:"1680",year:"1972",condition:"Good",cost:5800,askingPrice:7900,status:"listed",bought:"2024-01-15",soldDate:"",supplierId:1,serviceCost:0,marketValue:8200,notes:"Tritium dial, original bracelet",tags:["diver","sport"],photos:[],timeline:[{date:"2024-01-15",type:"bought",note:"From Marco, includes papers"}]},
  {id:2,brand:"Rolex",model:"Datejust 36",ref:"1601",year:"1968",condition:"Very Good",cost:3200,askingPrice:4600,status:"sold",bought:"2024-02-03",soldDate:"2024-03-12",supplierId:2,serviceCost:200,marketValue:4800,notes:"Silver dial, pie-pan",tags:["dress"],photos:[],timeline:[{date:"2024-02-03",type:"bought",note:"Watch Hunters deal"},{date:"2024-03-12",type:"sold",note:"Sold quickly, good margin"}]},
  {id:3,brand:"Omega",model:"Speedmaster Pre-Moon",ref:"105.003",year:"1965",condition:"Fair",cost:4100,askingPrice:5900,status:"sold",bought:"2024-01-28",soldDate:"2024-02-20",supplierId:1,serviceCost:350,marketValue:6200,notes:"Cal. 321",tags:["chrono","sport"],photos:[],timeline:[{date:"2024-01-28",type:"bought",note:"From Marco"},{date:"2024-02-05",type:"service",note:"Cal. 321 service €350"},{date:"2024-02-20",type:"sold",note:"Sold to German collector"}]},
  {id:5,brand:"Heuer",model:"Carrera 12",ref:"2447N",year:"1970",condition:"Very Good",cost:6200,askingPrice:8900,status:"listed",bought:"2024-03-18",soldDate:"",supplierId:2,serviceCost:0,marketValue:9100,notes:"Cal. 11, manual wind",tags:["chrono"],photos:[],timeline:[{date:"2024-03-18",type:"bought",note:"Excellent find from Watch Hunters"}]},
  {id:6,brand:"Tudor",model:"Submariner",ref:"7928",year:"1967",condition:"Good",cost:2900,askingPrice:3800,status:"sold",bought:"2024-02-14",soldDate:"2024-04-01",supplierId:1,serviceCost:180,marketValue:4000,notes:"Chapter ring, gilt dial",tags:["diver"],photos:[],timeline:[{date:"2024-02-14",type:"bought",note:"From Marco"},{date:"2024-04-01",type:"sold",note:"Sold"}]},
  {id:7,brand:"Omega",model:"Seamaster 300",ref:"165.024",year:"1969",condition:"Good",cost:2400,askingPrice:3500,status:"in service",bought:"2024-04-10",soldDate:"",supplierId:3,serviceCost:280,marketValue:3600,notes:"Bullseye dial",tags:["diver"],photos:[],timeline:[{date:"2024-04-10",type:"bought",note:"From Kenji"},{date:"2024-04-15",type:"service",note:"Sent to watchmaker"}]},
  {id:8,brand:"Rolex",model:"GMT-Master",ref:"1675",year:"1971",condition:"Fair",cost:7200,askingPrice:9800,status:"sold",bought:"2024-03-22",soldDate:"2024-05-08",supplierId:2,serviceCost:420,marketValue:10200,notes:"Pepsi bezel, original",tags:["sport","tool"],photos:[],timeline:[{date:"2024-03-22",type:"bought",note:"Watch Hunters"},{date:"2024-05-08",type:"sold",note:"Best flip this quarter"}]},
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

const LOGISTICS0 = [
  {id:1,watchId:2,brand:"Rolex",model:"Datejust 36",carrier:"DHL Express",trackingNo:"1234567890",from:"Milan, Italy",to:"Prague, CZ",status:"delivered",sent:"2024-02-05",eta:"2024-02-08",arrived:"2024-02-08",cost:28,insured:true,insuredValue:4600,notes:"Signature required"},
  {id:2,watchId:6,brand:"Tudor",model:"Submariner",carrier:"FedEx",trackingNo:"9876543210",from:"Prague, CZ",to:"Amsterdam, NL",status:"delivered",sent:"2024-03-28",eta:"2024-03-31",arrived:"2024-04-01",cost:34,insured:true,insuredValue:3800,notes:"Sold to buyer in NL"},
  {id:3,watchId:8,brand:"Rolex",model:"GMT-Master",carrier:"UPS",trackingNo:"5544332211",from:"Munich, Germany",to:"Prague, CZ",status:"delivered",sent:"2024-03-24",eta:"2024-03-26",arrived:"2024-03-25",cost:42,insured:true,insuredValue:9800,notes:"Express, fragile label"},
  {id:4,watchId:12,brand:"Seiko",model:"62MAS",carrier:"Japan Post EMS",trackingNo:"EM123456789JP",from:"Tokyo, Japan",to:"Prague, CZ",status:"in transit",sent:"2024-04-08",eta:"2024-04-18",arrived:"",cost:55,insured:true,insuredValue:2600,notes:"EMS tracking updates slowly"},
  {id:5,watchId:7,brand:"Omega",model:"Seamaster 300",carrier:"PPL",trackingNo:"PPL88776655",from:"Prague, CZ",to:"Brno, CZ",status:"in transit",sent:"2024-04-12",eta:"2024-04-13",arrived:"",cost:8,insured:false,insuredValue:0,notes:"To watchmaker for service"},
];

// ── PASSWORD AUTH ─────────────────────────────────────────────────────────────
const ADMIN_PASS  = "Bichviet9339";
const VIEWER_PASS = "pwaview";

function LoginScreen({ onAuth }) {
  const [pw,    setPw]    = useState("");
  const [err,   setErr]   = useState("");
  const [shake, setShake] = useState(false);
  const [show,  setShow]  = useState(false);

  function tryLogin() {
    if (pw === ADMIN_PASS)  { onAuth("admin");  return; }
    if (pw === VIEWER_PASS) { onAuth("viewer"); return; }
    setShake(true); setErr("Incorrect password"); setPw("");
    setTimeout(() => setShake(false), 500);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0d0d0d", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:28 }}>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
      `}</style>

      <div style={{ textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center", marginBottom:6 }}>
          <div style={{ width:22, height:22, borderRadius:"50%", border:"1.5px solid #c9a84c", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#c9a84c" }}/>
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:"#c9a84c", letterSpacing:"0.06em" }}>PWA TRACK</span>
        </div>
        <div style={{ fontSize:12, color:"#444" }}>Prague Watch Archive</div>
      </div>

      <div style={{ animation: shake?"shake 0.4s ease":"none", display:"flex", flexDirection:"column", gap:12, width:280 }}>
        <div style={{ position:"relative" }}>
          <input
            type={show?"text":"password"}
            value={pw}
            onChange={e=>{ setPw(e.target.value); setErr(""); }}
            onKeyDown={e=>e.key==="Enter"&&tryLogin()}
            autoFocus
            placeholder="Password"
            style={{ width:"100%", background:"#181818", border:`1px solid ${err?"#e85d04":"#2e2e2e"}`, borderRadius:10, padding:"12px 44px 12px 16px", color:"#f0ebe0", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }}
          />
          <button onClick={()=>setShow(s=>!s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:14, padding:0 }}>
            {show?"🙈":"👁"}
          </button>
        </div>

        {err && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"#e85d04", textAlign:"center" }}>{err}</div>}

        <button onClick={tryLogin}
          style={{ background:"#c9a84c", border:"none", borderRadius:10, padding:"11px", color:"#0d0d0d", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Syne',sans-serif", letterSpacing:"0.04em" }}>
          Enter
        </button>
      </div>
    </div>
  );
}

// ── WATCH DETAIL DRAWER ───────────────────────────────────────────────────────
function WatchDrawer({ watch, suppliers, onClose, onEdit, onDuplicate, onDelete }) {
  const sup = suppliers.find(s => s.id === watch.supplierId);
  const np  = watch.askingPrice - watch.cost - (watch.serviceCost||0);
  const nm  = watch.cost > 0 ? np / watch.cost : 0;
  const hd  = holdDays(watch);
  const TYPE_COLORS = { note:"#666", offer:"#c9a84c", bought:"#3a7bd5", sold:"#5de08a", service:"#9333ea", photo:"#e85d04", negotiation:"#f59e0b" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex" }} onClick={onClose}>
      <div style={{ flex:1 }}/>
      <div onClick={e=>e.stopPropagation()} style={{ width:420, maxWidth:"95vw", height:"100vh", background:"#141414", borderLeft:"1px solid #2e2e2e", overflowY:"auto", display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid #1e1e1e", position:"sticky", top:0, background:"#141414", zIndex:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:bc(watch.brand), flexShrink:0 }}/>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700 }}>{watch.brand}</span>
              </div>
              <div style={{ fontSize:15, color:"#bbb", marginBottom:3 }}>{watch.model}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"#666" }}>{watch.ref}</span>
                <span style={{ fontSize:11, color:"#555" }}>·</span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:"#666" }}>{watch.year}</span>
                <span style={{ fontSize:11, color:"#555" }}>·</span>
                <span style={{ fontSize:11, color:"#777" }}>{watch.condition}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:22, cursor:"pointer" }}>×</button>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button onClick={onEdit} style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"6px 14px", color:"#0d0d0d", fontWeight:700, fontSize:12, cursor:"pointer" }}>Edit</button>
            <button onClick={onDuplicate} style={{ background:"none", border:"1px solid #2e2e2e", borderRadius:8, padding:"6px 14px", color:"#888", fontSize:12, cursor:"pointer" }}>Duplicate</button>
            <button onClick={onDelete} style={{ background:"none", border:"1px solid #3a1a1a", borderRadius:8, padding:"6px 14px", color:"#e85d04", fontSize:12, cursor:"pointer", marginLeft:"auto" }}>🗑 Delete</button>
          </div>
        </div>

        <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:20 }}>
          {/* Photos */}
          {watch.photos?.length > 0 && (
            <div>
              <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Photos</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {watch.photos.map((p,i) => (
                  <img key={i} src={p.data} alt={p.name} style={{ width:90, height:90, objectFit:"cover", borderRadius:8, border:"1px solid #2e2e2e" }}/>
                ))}
              </div>
            </div>
          )}

          {/* Financials */}
          <div>
            <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Financials</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                ["Cost",          `€${watch.cost.toLocaleString("de-DE")}`,          "#f0ebe0"],
                ["Asking Price",  `€${watch.askingPrice.toLocaleString("de-DE")}`,   "#c9a84c"],
                ["Service Cost",  watch.serviceCost ? `€${watch.serviceCost.toLocaleString("de-DE")}` : "—", "#9333ea"],
                ["Net Profit",    `€${np.toLocaleString("de-DE")}`,                  np>=0?"#5de08a":"#e85d04"],
                ["Margin",        pct(nm),                                            nm>=0.15?"#5de08a":nm>=0.05?"#c9a84c":"#e85d04"],
                ["Market Value",  watch.marketValue ? `€${watch.marketValue.toLocaleString("de-DE")}` : "—", "#3a7bd5"],
              ].map(([l,v,c])=>(
                <div key={l} style={{ background:"#1a1a1a", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, color:"#555", marginBottom:4 }}>{l}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:14, color:c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Details</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[
                ["Supplier",    sup?.name || "—"],
                ["Date Bought", watch.bought || "—"],
                ["Date Sold",   watch.soldDate || "—"],
                ["Hold Days",   hd ? hd+"d" : "—"],
                ["Tags",        (Array.isArray(watch.tags)?watch.tags:watch.tags?.split(",")||[]).filter(Boolean).join(", ") || "—"],
              ].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1a1a1a" }}>
                  <span style={{ fontSize:12, color:"#555" }}>{l}</span>
                  <span style={{ fontSize:12, color:"#ccc", fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {watch.notes && (
            <div>
              <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Notes</div>
              <div style={{ fontSize:13, color:"#aaa", lineHeight:1.6, background:"#1a1a1a", borderRadius:8, padding:"12px 14px" }}>{watch.notes}</div>
            </div>
          )}

          {/* Timeline */}
          {watch.timeline?.length > 0 && (
            <div>
              <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Timeline</div>
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {[...watch.timeline].reverse().map((e,i,arr)=>(
                  <div key={i} style={{ display:"flex", gap:12, paddingBottom:14 }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                      <div style={{ width:9, height:9, borderRadius:"50%", background:TYPE_COLORS[e.type]||"#555", marginTop:2 }}/>
                      {i<arr.length-1&&<div style={{ width:1, flex:1, background:"#1e1e1e", marginTop:4 }}/>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:2 }}>
                        <span style={{ fontSize:10, padding:"1px 7px", borderRadius:20, background:"#1e1e1e", color:TYPE_COLORS[e.type]||"#555" }}>{e.type}</span>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"#444" }}>{e.date}</span>
                      </div>
                      <div style={{ fontSize:12, color:"#bbb" }}>{e.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BRAND DROPDOWN ─────────────────────────────────────────────────────────────
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
      <div onClick={() => setOpen(o => !o)} style={{ ...BASE_INP, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", color:value?"#f0ebe0":"#555" }}>
        <span>{sel ? `${sel.f} ${sel.n}` : "Select brand…"}</span>
        <span style={{ color:"#555", fontSize:10 }}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:999, background:"#181818", border:"1px solid #2e2e2e", borderRadius:10, boxShadow:"0 20px 50px rgba(0,0,0,0.7)", overflow:"hidden" }}>
          <div style={{ padding:"8px 10px", borderBottom:"1px solid #222" }}>
            <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" style={{ ...BASE_INP, fontSize:13, padding:"6px 10px" }}/>
          </div>
          <div style={{ maxHeight:220, overflowY:"auto" }}>
            {filtered.map(b => (
              <div key={b.n} onClick={() => { onChange(b.n); setOpen(false); setQ(""); }}
                style={{ padding:"9px 14px", cursor:"pointer", fontSize:13, display:"flex", gap:8, color:value===b.n?"#c9a84c":"#ccc" }}
                onMouseEnter={e=>e.currentTarget.style.background="#222"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span>{b.f}</span><span>{b.n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI CARD ──────────────────────────────────────────────────────────────────
function Kpi({ label, value, sub, accent, small, highlight }) {
  return (
    <div style={{ ...CARD, padding:"18px 20px", background:highlight?"#1a1808":"#181818", borderColor:highlight?"#3a3010":"#2e2e2e" }}>
      <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:7 }}>{label}</div>
      <div style={{ ...NUM, fontSize:small?17:22, color:accent||"#f0ebe0", lineHeight:1, letterSpacing:"-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#555", marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function Stars({ n }) {
  return <span>{[1,2,3,4,5].map(i=><span key={i} style={{ color:i<=n?"#c9a84c":"#222", fontSize:12 }}>★</span>)}</span>;
}

function Badge({ status }) {
  const s = SC[status] || SC.listed;
  return <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:s.bg, color:s.fg, whiteSpace:"nowrap" }}>{status}</span>;
}

function TH({ children }) {
  return <th style={{ padding:"10px 14px", textAlign:"left", color:"#555", fontWeight:500, fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em" }}>{children}</th>;
}
function TD({ children, mono, accent, dim, bold }) {
  return <td style={{ padding:"10px 14px", ...(mono?NUM:{}), color:accent||(dim?"#666":"#ccc"), fontWeight:bold?600:400, fontSize:mono?11:12 }}>{children}</td>;
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#181818", border:"1px solid #2e2e2e", borderRadius:10, padding:"10px 14px", fontSize:12 }}>
      {label && <div style={{ color:"#555", marginBottom:4 }}>{label}</div>}
      {payload.map((p,i) => <div key={i} style={{ ...NUM, color:p.color||"#c9a84c" }}>{p.name}: {typeof p.value==="number"&&Math.abs(p.value)>100?"€"+Number(p.value).toLocaleString("de-DE"):p.value+(p.name?.includes("%")?"%":"")}</div>)}
    </div>
  );
}

// ── TIMELINE MODAL ────────────────────────────────────────────────────────────
function TimelineModal({ watch, onClose, onSave }) {
  const [timeline, setTimeline] = useState(watch.timeline||[]);
  const [newNote, setNewNote]   = useState("");
  const [newType, setNewType]   = useState("note");
  const [newDate, setNewDate]   = useState(new Date().toISOString().slice(0,10));
  const TYPES = ["note","offer","bought","sold","service","photo","negotiation"];

  const addEntry = () => {
    if (!newNote.trim()) return;
    const entry = { date:newDate, type:newType, note:newNote.trim() };
    const updated = [...timeline, entry].sort((a,b)=>new Date(a.date)-new Date(b.date));
    setTimeline(updated);
    setNewNote("");
  };

  const TYPE_COLORS = { note:"#666", offer:"#c9a84c", bought:"#3a7bd5", sold:"#5de08a", service:"#9333ea", photo:"#e85d04", negotiation:"#f59e0b" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#181818", border:"1px solid #2e2e2e", borderRadius:18, padding:"28px", width:560, maxWidth:"100%", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:600 }}>Note Timeline</div>
            <div style={{ fontSize:11, color:"#666", marginTop:2 }}>{watch.brand} {watch.model} · {watch.year}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:22, cursor:"pointer" }}>×</button>
        </div>

        {/* Timeline */}
        <div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:20, position:"relative" }}>
          {timeline.length===0 && <div style={{ color:"#555", fontSize:12, padding:"20px 0" }}>No entries yet. Add your first note below.</div>}
          {[...timeline].reverse().map((e,i)=>(
            <div key={i} style={{ display:"flex", gap:14, paddingBottom:16 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:TYPE_COLORS[e.type]||"#666", marginTop:3 }}/>
                {i < timeline.length-1 && <div style={{ width:1, flex:1, background:"#222", marginTop:4 }}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:10, padding:"1px 7px", borderRadius:20, background:"#222", color:TYPE_COLORS[e.type]||"#666" }}>{e.type}</span>
                  <span style={{ ...NUM, fontSize:10, color:"#555" }}>{e.date}</span>
                </div>
                <div style={{ fontSize:13, color:"#ddd" }}>{e.note}</div>
              </div>
              <button onClick={()=>setTimeline(t=>t.filter((_,j)=>j!==timeline.length-1-i))}
                style={{ background:"none", border:"none", color:"#3a3a3a", fontSize:16, cursor:"pointer", alignSelf:"flex-start" }}>×</button>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div style={{ borderTop:"1px solid #2e2e2e", paddingTop:16 }}>
          <div style={{ fontSize:11, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Add Entry</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <div>
              <label style={BASE_LBL}>Type</label>
              <select value={newType} onChange={e=>setNewType(e.target.value)} style={BASE_INP}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={BASE_LBL}>Date</label>
              <input value={newDate} onChange={e=>setNewDate(e.target.value)} type="date" style={BASE_INP}/>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={BASE_LBL}>Note</label>
            <input value={newNote} onChange={e=>setNewNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEntry()}
              placeholder="Offer received €1200, buyer from Berlin…" style={BASE_INP}/>
          </div>
          <button onClick={addEntry} style={{ background:"#222", border:"1px solid #2e2e2e", borderRadius:8, padding:"8px 16px", color:"#c9a84c", fontSize:13, cursor:"pointer", width:"100%" }}>+ Add Entry</button>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #2e2e2e", borderRadius:8, padding:"8px 18px", color:"#666", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>onSave({...watch, timeline})} style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"8px 22px", color:"#0d0d0d", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save Timeline</button>
        </div>
      </div>
    </div>
  );
}

// ── WATCH MODAL ───────────────────────────────────────────────────────────────
function WatchModal({ data, suppliers, onClose, onSave }) {
  const [f, setF] = useState(data||{brand:"",model:"",ref:"",year:"",condition:"Good",cost:"",askingPrice:"",status:"listed",bought:"",soldDate:"",supplierId:"",serviceCost:"",marketValue:"",notes:"",tags:"",photos:[],timeline:[]});
  const u = (k,v) => setF(p=>({...p,[k]:v}));
  const fileRef = useRef();
  const pv = f.cost&&f.askingPrice ? Number(f.askingPrice)-Number(f.cost)-Number(f.serviceCost||0) : null;
  const mv = pv!==null&&Number(f.cost)>0 ? pv/Number(f.cost) : null;

  const handlePhoto = e => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setF(p=>({...p, photos:[...(p.photos||[]), {name:file.name, data:ev.target.result}]}));
      reader.readAsDataURL(file);
    });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#181818", border:"1px solid #2e2e2e", borderRadius:18, padding:"28px", width:580, maxWidth:"100%", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:600 }}>{data?"Edit Watch":"Add Watch"}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ marginBottom:12 }}><label style={BASE_LBL}>Brand</label><BrandSelect value={f.brand} onChange={v=>u("brand",v)}/></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
          {[["model","Model"],["ref","Reference"],["year","Year"]].map(([k,l])=>(
            <div key={k}><label style={BASE_LBL}>{l}</label><input value={f[k]||""} onChange={e=>u(k,e.target.value)} style={BASE_INP}/></div>
          ))}
          <div><label style={BASE_LBL}>Condition</label><select value={f.condition} onChange={e=>u("condition",e.target.value)} style={BASE_INP}>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:11, marginTop:11 }}>
          <div><label style={BASE_LBL}>Cost (€)</label><input value={f.cost||""} onChange={e=>u("cost",e.target.value)} type="number" style={BASE_INP}/></div>
          <div><label style={BASE_LBL}>Asking Price (€)</label><input value={f.askingPrice||""} onChange={e=>u("askingPrice",e.target.value)} type="number" style={BASE_INP}/></div>
          <div><label style={BASE_LBL}>Service Cost (€)</label><input value={f.serviceCost||""} onChange={e=>u("serviceCost",e.target.value)} type="number" style={BASE_INP} placeholder="0"/></div>
        </div>
        <div style={{ marginTop:11 }}><label style={BASE_LBL}>Market Value (€)</label><input value={f.marketValue||""} onChange={e=>u("marketValue",e.target.value)} type="number" style={BASE_INP} placeholder="Your estimate"/></div>
        {pv!==null && (
          <div style={{ background:"#121212", border:"1px solid #2e2e2e", borderRadius:8, padding:"10px 14px", marginTop:10, display:"flex", gap:20 }}>
            <span style={{ fontSize:12, color:"#777" }}>Net profit: <strong style={{ ...NUM, color:pv>=0?"#5de08a":"#e85d04" }}>€{Number(pv).toLocaleString("de-DE")}</strong></span>
            <span style={{ fontSize:12, color:"#777" }}>Margin: <strong style={{ ...NUM, color:"#c9a84c" }}>{mv!==null?pct(mv):"—"}</strong></span>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginTop:11 }}>
          <div><label style={BASE_LBL}>Status</label><select value={f.status} onChange={e=>u("status",e.target.value)} style={BASE_INP}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={BASE_LBL}>Supplier</label><select value={f.supplierId||""} onChange={e=>u("supplierId",Number(e.target.value))} style={BASE_INP}><option value="">— none —</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label style={BASE_LBL}>Date Bought</label><input value={f.bought||""} onChange={e=>u("bought",e.target.value)} type="date" style={BASE_INP}/></div>
          {f.status==="sold"&&<div><label style={BASE_LBL}>Date Sold</label><input value={f.soldDate||""} onChange={e=>u("soldDate",e.target.value)} type="date" style={BASE_INP}/></div>}
        </div>
        <div style={{ marginTop:11 }}><label style={BASE_LBL}>Tags</label><input value={typeof f.tags==="string"?f.tags:(f.tags||[]).join(", ")} onChange={e=>u("tags",e.target.value)} style={BASE_INP} placeholder="diver, JDM, papers…"/></div>
        <div style={{ marginTop:11 }}><label style={BASE_LBL}>Notes</label><textarea value={f.notes||""} onChange={e=>u("notes",e.target.value)} rows={2} style={{ ...BASE_INP, resize:"vertical", fontFamily:"inherit" }}/></div>

        {/* Photo upload */}
        <div style={{ marginTop:14 }}>
          <label style={BASE_LBL}>Photos</label>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:8 }}>
            {(f.photos||[]).map((p,i)=>(
              <div key={i} style={{ position:"relative" }}>
                <img src={p.data} alt={p.name} style={{ width:72, height:72, objectFit:"cover", borderRadius:8, border:"1px solid #2e2e2e" }}/>
                <button onClick={()=>setF(pr=>({...pr,photos:pr.photos.filter((_,j)=>j!==i)}))}
                  style={{ position:"absolute", top:-6, right:-6, background:"#e85d04", border:"none", borderRadius:"50%", width:18, height:18, color:"#fff", fontSize:11, cursor:"pointer", lineHeight:"18px", textAlign:"center" }}>×</button>
              </div>
            ))}
            <button onClick={()=>fileRef.current?.click()}
              style={{ width:72, height:72, borderRadius:8, border:"1px dashed #2e2e2e", background:"#121212", color:"#555", fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} style={{ display:"none" }}/>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #2e2e2e", borderRadius:8, padding:"8px 18px", color:"#666", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>onSave({...f,cost:Number(f.cost),askingPrice:Number(f.askingPrice),serviceCost:Number(f.serviceCost||0),marketValue:Number(f.marketValue||0),id:f.id||Date.now(),tags:typeof f.tags==="string"?f.tags.split(",").map(t=>t.trim()).filter(Boolean):f.tags})}
            style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"8px 22px", color:"#0d0d0d", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── SUPPLIER MODAL ────────────────────────────────────────────────────────────
function SupplierModal({ data, onClose, onSave }) {
  const [f,setF]=useState(data?{...data,tags:data.tags?.join(", ")||""}:{name:"",type:"Private Collector",country:"",city:"",email:"",phone:"",reliability:3,avgDiscount:0,notes:"",tags:""});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#181818", border:"1px solid #2e2e2e", borderRadius:18, padding:"28px", width:500, maxWidth:"100%", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:600 }}>{data?"Edit Supplier":"Add Supplier"}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#555", fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11 }}>
          <div style={{ gridColumn:"span 2" }}><label style={BASE_LBL}>Name</label><input value={f.name} onChange={e=>u("name",e.target.value)} style={BASE_INP}/></div>
          <div><label style={BASE_LBL}>Type</label><select value={f.type} onChange={e=>u("type",e.target.value)} style={BASE_INP}>{["Private Collector","Dealer","Auction House","Estate Sale","Online Marketplace","Pawnshop","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={BASE_LBL}>Country</label><input value={f.country} onChange={e=>u("country",e.target.value)} style={BASE_INP}/></div>
          <div><label style={BASE_LBL}>City</label><input value={f.city} onChange={e=>u("city",e.target.value)} style={BASE_INP}/></div>
          <div><label style={BASE_LBL}>Email</label><input value={f.email} onChange={e=>u("email",e.target.value)} type="email" style={BASE_INP}/></div>
          <div><label style={BASE_LBL}>Phone</label><input value={f.phone} onChange={e=>u("phone",e.target.value)} style={BASE_INP}/></div>
          <div><label style={BASE_LBL}>Reliability (1–5)</label><input value={f.reliability} onChange={e=>u("reliability",Math.min(5,Math.max(1,Number(e.target.value))))} type="number" min={1} max={5} style={BASE_INP}/></div>
          <div><label style={BASE_LBL}>Avg Discount %</label><input value={f.avgDiscount} onChange={e=>u("avgDiscount",Number(e.target.value))} type="number" style={BASE_INP}/></div>
          <div style={{ gridColumn:"span 2" }}><label style={BASE_LBL}>Tags</label><input value={f.tags} onChange={e=>u("tags",e.target.value)} style={BASE_INP} placeholder="rolex, JDM, papers…"/></div>
          <div style={{ gridColumn:"span 2" }}><label style={BASE_LBL}>Notes</label><textarea value={f.notes} onChange={e=>u("notes",e.target.value)} rows={3} style={{ ...BASE_INP, resize:"vertical", fontFamily:"inherit" }}/></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #2e2e2e", borderRadius:8, padding:"8px 18px", color:"#666", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>onSave({...f,reliability:Number(f.reliability),avgDiscount:Number(f.avgDiscount),id:f.id||Date.now(),tags:f.tags.split(",").map(t=>t.trim()).filter(Boolean)})}
            style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"8px 22px", color:"#0d0d0d", fontWeight:700, fontSize:13, cursor:"pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── CSV EXPORT ────────────────────────────────────────────────────────────────
function exportCSV(watches, suppliers) {
  const headers = ["ID","Brand","Model","Ref","Year","Condition","Cost (EUR)","Asking Price (EUR)","Service Cost (EUR)","Net Profit (EUR)","Margin %","Status","Bought","Sold Date","Hold Days","Market Value","Supplier","Tags","Notes"];
  const rows = watches.map(w => {
    const np = (w.askingPrice - w.cost - (w.serviceCost||0));
    const nm = w.cost > 0 ? ((np/w.cost)*100).toFixed(1) : "";
    const sup = suppliers.find(s=>s.id===w.supplierId);
    const hd = holdDays(w);
    return [w.id,w.brand,w.model,w.ref,w.year,w.condition,w.cost,w.askingPrice,w.serviceCost||0,np,nm,w.status,w.bought,w.soldDate||"",hd||"",w.marketValue||"",sup?.name||"",( Array.isArray(w.tags)?w.tags.join(";"):w.tags||""),w.notes||""].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="pwa-track-export.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── MARKET CALCULATOR ─────────────────────────────────────────────────────────
function MarketCalculator({ watches, sold, netProf, netMarg, fmtC, pct, currency }) {
  const [query,      setQuery]   = useState("");
  const [buyCost,    setBuy]     = useState("");
  const [svcCost,    setSvc]     = useState("");
  const [targetPct,  setTarget]  = useState("20");
  const [loading,    setLoading] = useState(false);
  const [result,     setResult]  = useState(null);
  const [error,      setError]   = useState("");
  const [searched,   setSearched]= useState(false);

  const totalCost  = (Number(buyCost)||0)+(Number(svcCost)||0);
  const targetSell = totalCost>0 ? totalCost*(1+Number(targetPct)/100) : 0;

  const comparables = useMemo(()=>{
    if(!query.trim()) return [];
    const q=query.toLowerCase();
    return watches.filter(w=>`${w.brand} ${w.model} ${w.ref}`.toLowerCase().includes(q)).slice(0,6);
  },[query,watches]);

  async function search() {
    if(!query.trim()) return;
    setLoading(true); setError(""); setResult(null); setSearched(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1200,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          system:`You are a vintage watch market analyst. Search for current market prices for the given watch. Look at eBay sold listings, Chrono24, WatchUSeek, Reddit r/Watchexchange, Catawiki, and vintage watch dealer websites. Return ONLY a valid JSON object, no other text, no markdown:
{"watchName":"string","priceRange":{"low":number,"high":number},"avgPrice":number,"confidence":"low|medium|high","sources":[{"name":"string","price":number,"condition":"string","url":"string","date":"string"}],"marketNotes":"string","conditionPremiums":{"Poor":-40,"Fair":-20,"Good":0,"Very Good":15,"Excellent":30,"NOS":60}}
All prices in EUR. If insufficient data, use best estimates with low confidence.`,
          messages:[{role:"user",content:`Search vintage watch market prices: ${query}. Find recent sold prices on eBay, Chrono24, Reddit r/Watchexchange, WatchUSeek, Catawiki. Return only the JSON object.`}]
        })
      });
      const data = await res.json();
      const text = data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
      const match = text.match(/\{[\s\S]*\}/);
      if(match) setResult(JSON.parse(match[0]));
      else setError("Could not parse results. Try a more specific reference number.");
    } catch(e) { setError("Search failed. Check connection and try again."); }
    setLoading(false);
  }

  const condAdj = (base,cond) => result?.conditionPremiums?.[cond] !== undefined ? Math.round(base*(1+(result.conditionPremiums[cond]/100))) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, margin:"0 0 6px" }}>Market Calculator</h1>
        <div style={{ fontSize:12, color:"#666" }}>Search live market prices across eBay, Chrono24, Reddit & dealer sites. Compare against your costs.</div>
      </div>

      {/* Input */}
      <div style={CARD}>
        <div style={SH_STYLE}>Watch + Cost</div>
        <div style={{ display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={BASE_LBL}>Reference or Model Name</label>
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}
              placeholder="Seiko Dolce 8N41, Rolex 1680, Omega 105.003…" style={BASE_INP}/>
          </div>
          <div>
            <label style={BASE_LBL}>Buy Cost ({currency})</label>
            <input value={buyCost} onChange={e=>setBuy(e.target.value)} type="number" placeholder="0" style={BASE_INP}/>
          </div>
          <div>
            <label style={BASE_LBL}>Service ({currency})</label>
            <input value={svcCost} onChange={e=>setSvc(e.target.value)} type="number" placeholder="0" style={BASE_INP}/>
          </div>
          <div>
            <label style={BASE_LBL}>Target Margin %</label>
            <input value={targetPct} onChange={e=>setTarget(e.target.value)} type="number" placeholder="20" style={BASE_INP}/>
          </div>
        </div>
        <button onClick={search} disabled={!query.trim()||loading}
          style={{ background:loading||!query.trim()?"#222":"#c9a84c", border:"none", borderRadius:8, padding:"9px 22px", color:loading||!query.trim()?"#555":"#0d0d0d", fontWeight:700, fontSize:13, cursor:loading?"default":"pointer", display:"inline-flex", alignItems:"center", gap:8 }}>
          {loading?<><span style={{ display:"inline-block",width:13,height:13,border:"2px solid #555",borderTopColor:"#c9a84c",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>Searching markets…</>:"🔍 Search Market Prices"}
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* Cost breakdown */}
      {totalCost>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[["Total Cost In",totalCost,"#888"],["Break Even",totalCost,"#666"],["Target Sell",targetSell,"#c9a84c"],["Target Profit",targetSell-totalCost,"#5de08a"]].map(([l,v,c])=>(
            <div key={l} style={{ ...CARD, padding:"16px 18px" }}>
              <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{l}</div>
              <div style={{ ...NUM, fontSize:18, color:c }}>€{Number(v).toLocaleString("de-DE")}</div>
            </div>
          ))}
        </div>
      )}

      {/* Your own data */}
      {comparables.length>0 && (
        <div style={CARD}>
          <div style={SH_STYLE}>From Your Inventory ({comparables.length} matches)</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead><tr style={{ borderBottom:"1px solid #222" }}>
              {["Watch","Year","Ref","Cond.","Cost","Ask/Sold","Net Profit","Margin","Status"].map(h=><TH key={h}>{h}</TH>)}
            </tr></thead>
            <tbody>
              {comparables.map(w=>(
                <tr key={w.id} style={{ borderBottom:"1px solid #161616" }}>
                  <td style={{ padding:"9px 12px" }}><span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand),flexShrink:0 }}/>{w.brand} {w.model}</span></td>
                  <TD mono dim>{w.year}</TD>
                  <TD mono dim>{w.ref}</TD>
                  <TD dim>{w.condition}</TD>
                  <TD mono>€{w.cost.toLocaleString("de-DE")}</TD>
                  <td style={{ padding:"9px 12px", ...NUM, color:"#c9a84c" }}>€{w.askingPrice.toLocaleString("de-DE")}</td>
                  <td style={{ padding:"9px 12px", ...NUM, color:netProf(w)>=0?"#5de08a":"#e85d04", fontWeight:600 }}>€{netProf(w).toLocaleString("de-DE")}</td>
                  <td style={{ padding:"9px 12px", ...NUM, color:netMarg(w)>=0.15?"#5de08a":netMarg(w)>=0.05?"#c9a84c":"#e85d04" }}>{pct(netMarg(w))}</td>
                  <td style={{ padding:"9px 12px" }}><Badge status={w.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Error */}
      {error && <div style={{ ...CARD, borderColor:"#3a1010", background:"#1a0808", color:"#e85d04", fontSize:13 }}>{error}</div>}

      {/* Results */}
      {result && (
        <>
          <div style={CARD}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:600, marginBottom:4 }}>{result.watchName}</div>
                <div style={{ fontSize:12, color:"#777", lineHeight:1.5 }}>{result.marketNotes}</div>
              </div>
              <span style={{ fontSize:10, padding:"3px 10px", borderRadius:20, background:result.confidence==="high"?"#1a2a1a":result.confidence==="medium"?"#2a1a0e":"#222", color:result.confidence==="high"?"#5de08a":result.confidence==="medium"?"#c9a84c":"#888", flexShrink:0, marginLeft:12 }}>{result.confidence} confidence</span>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}>
              {[["Market Low",result.priceRange?.low||0,"#888"],["Avg Price",result.avgPrice||0,"#c9a84c"],["Market High",result.priceRange?.high||0,"#5de08a"]].map(([l,v,c])=>(
                <div key={l} style={{ background:"#121212", borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#555", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>{l}</div>
                  <div style={{ ...NUM, fontSize:20, color:c }}>€{Number(v).toLocaleString("de-DE")}</div>
                </div>
              ))}
            </div>

            {totalCost>0&&result.avgPrice&&(
              <div style={{ background:"#121212", borderRadius:10, padding:"14px 16px", marginBottom:14, display:"flex", gap:24, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, color:"#777" }}>At market avg: <strong style={{ ...NUM, color:(result.avgPrice-totalCost)>=0?"#5de08a":"#e85d04" }}>€{(result.avgPrice-totalCost).toLocaleString("de-DE")} profit</strong></span>
                <span style={{ fontSize:12, color:"#777" }}>Margin: <strong style={{ ...NUM, color:"#c9a84c" }}>{totalCost>0?pct((result.avgPrice-totalCost)/totalCost):"—"}</strong></span>
                <span style={{ fontSize:12, color:"#777" }}>vs target: <strong style={{ color:result.avgPrice>=targetSell?"#5de08a":"#e85d04" }}>{result.avgPrice>=targetSell?"✓ target achievable":"✗ below target"}</strong></span>
              </div>
            )}

            {result.conditionPremiums&&(
              <div>
                <div style={{ fontSize:11, color:"#666", marginBottom:8 }}>Price by condition (from avg €{(result.avgPrice||0).toLocaleString("de-DE")}):</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
                  {CONDITIONS.map(c=>{
                    const adj=condAdj(result.avgPrice,c);
                    const m=totalCost>0&&adj?((adj-totalCost)/totalCost):null;
                    return (
                      <div key={c} style={{ background:"#121212", borderRadius:8, padding:"10px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:9, color:"#555", marginBottom:4, textTransform:"uppercase" }}>{c}</div>
                        <div style={{ ...NUM, fontSize:13, color:"#ddd" }}>{adj?`€${adj.toLocaleString("de-DE")}`:"—"}</div>
                        {m!==null&&<div style={{ fontSize:10, color:m>=0.15?"#5de08a":m>=0.05?"#c9a84c":"#e85d04", marginTop:3 }}>{pct(m)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {result.sources?.length>0&&(
            <div style={CARD}>
              <div style={SH_STYLE}>Market Sources</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {result.sources.map((s,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 12px", background:"#121212", borderRadius:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:"#ccc", fontWeight:500 }}>{s.name}</div>
                      <div style={{ fontSize:11, color:"#666", marginTop:2 }}>{s.condition}{s.date?` · ${s.date}`:""}</div>
                    </div>
                    <div style={{ ...NUM, fontSize:16, color:"#c9a84c" }}>€{Number(s.price||0).toLocaleString("de-DE")}</div>
                    {s.url&&s.url.startsWith("http")&&<a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#3a7bd5", textDecoration:"none", padding:"3px 8px", border:"1px solid #1a2f3a", borderRadius:6 }}>View →</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {searched&&!loading&&!result&&!error&&(
        <div style={{ ...CARD, color:"#555", fontSize:13, textAlign:"center", padding:"30px" }}>No results found. Try a more specific search like "Seiko 62MAS J13070" or "Rolex 1680 Submariner".</div>
      )}
    </div>
  );
}

// ── PERSISTENCE ───────────────────────────────────────────────────────────────
const LS = "pwatrack_data_v1";

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(LS);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed[key] ?? fallback;
  } catch { return fallback; }
}

function usePersisted(key, fallback) {
  const [val, setVal] = useState(() => loadData(key, fallback));
  const set = useCallback(updater => {
    setVal(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        const raw = localStorage.getItem(LS);
        const all = raw ? JSON.parse(raw) : {};
        // strip large photo data if storage gets full
        const toSave = key === "watches"
          ? (Array.isArray(next) ? next : next).map(w => ({
              ...w,
              photos: (w.photos||[]).slice(0, 5) // max 5 photos per watch
            }))
          : next;
        localStorage.setItem(LS, JSON.stringify({ ...all, [key]: toSave }));
      } catch(e) {
        // if storage full, save without photos
        try {
          const raw = localStorage.getItem(LS);
          const all = raw ? JSON.parse(raw) : {};
          const stripped = key === "watches"
            ? (Array.isArray(next) ? next : next).map(w => ({ ...w, photos: [] }))
            : next;
          localStorage.setItem(LS, JSON.stringify({ ...all, [key]: stripped }));
        } catch { console.warn("Storage full"); }
      }
      return next;
    });
  }, [key]);
  return [val, set];
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function PWATrack() {
  const [watches,   setWatches]   = usePersisted("watches",   WATCHES0);
  const [suppliers, setSuppliers] = usePersisted("suppliers", SUPPLIERS0);
  const [wishlist,  setWishlist]  = usePersisted("wishlist",  WISHLIST0);
  const [pipeline,  setPipeline]  = usePersisted("pipeline",  PIPELINE0);
  const [logistics, setLogistics] = usePersisted("logistics", LOGISTICS0);
  const [tab,       setTab]       = useState("Overview");
  const [role,      setRole]      = useState(null); // null | "admin" | "viewer"
  const [currency,  setCurrency]  = useState("EUR");
  const [wm,        setWm]        = useState(null);
  const [sm,        setSm]        = useState(null);
  const [tlm,       setTlm]       = useState(null);
  const [drawer,    setDrawer]    = useState(null); // watch detail drawer
  const [mobileNav, setMobileNav] = useState(false);
  const [search,    setSearch]    = useState("");
  const [fStatus,   setFStatus]   = useState("all");
  const [fBrand,    setFBrand]    = useState("all");
  const [fCond,     setFCond]     = useState("all");
  const [fMargin,   setFMargin]   = useState("0");
  const [fSupplier, setFSupplier] = useState("all");
  const [period,    setPeriod]    = useState("all");
  const [sortCol,   setSortCol]   = useState("bought");
  const [sortDir,   setSortDir]   = useState("desc");
  const [selected,  setSelected]  = useState(new Set()); // bulk select
  const [bulkStatus,setBulkStatus]= useState("");

  const CUR = CURRENCIES[currency];
  const fmtC = useCallback(n => {
    const converted = Math.round(Number(n) * CUR.rate);
    return CUR.symbol + converted.toLocaleString(CUR.locale);
  }, [currency, CUR]);

  const netProf = useCallback(w => profRaw(w) - (w.serviceCost||0), []);
  const netMarg = useCallback(w => w.cost>0 ? netProf(w)/w.cost : 0, [netProf]);

  const sold   = useMemo(()=>watches.filter(w=>w.status==="sold"),   [watches]);
  const active = useMemo(()=>watches.filter(w=>w.status!=="sold"),   [watches]);
  const listed = useMemo(()=>watches.filter(w=>w.status==="listed"), [watches]);

  const totalNetProfit   = useMemo(()=>sold.reduce((a,w)=>a+netProf(w),0),  [sold,netProf]);
  const totalRevenue     = useMemo(()=>sold.reduce((a,w)=>a+w.askingPrice,0),[sold]);
  const totalServiceCost = useMemo(()=>watches.reduce((a,w)=>a+(w.serviceCost||0),0),[watches]);
  const avgNetMargin     = useMemo(()=>sold.length?sold.reduce((a,w)=>a+netMarg(w),0)/sold.length:0,[sold,netMarg]);
  const capRisk          = useMemo(()=>active.reduce((a,w)=>a+w.cost,0),[active]);
  const unrealisedPnl    = useMemo(()=>active.reduce((a,w)=>a+(w.marketValue||w.askingPrice)-w.cost-(w.serviceCost||0),0),[active]);
  const avgHold          = useMemo(()=>{const ws=sold.filter(w=>w.bought&&w.soldDate);return ws.length?Math.round(ws.reduce((a,w)=>a+daysBetween(w.bought,w.soldDate),0)/ws.length):0;},[sold]);
  const winRate          = useMemo(()=>sold.length?sold.filter(w=>netMarg(w)>=0.1).length/sold.length:0,[sold,netMarg]);
  const bestFlip         = useMemo(()=>sold.length?sold.reduce((a,b)=>netProf(a)>netProf(b)?a:b):null,[sold,netProf]);
  const worstFlip        = useMemo(()=>sold.length?sold.reduce((a,b)=>netProf(a)<netProf(b)?a:b):null,[sold,netProf]);
  const recentActivity   = useMemo(()=>[...watches].filter(w=>w.bought||w.soldDate).sort((a,b)=>new Date(b.soldDate||b.bought)-new Date(a.soldDate||a.bought)).slice(0,5),[watches]);

  const monthly = useMemo(()=>{
    const map={};
    sold.forEach(w=>{
      if(!w.soldDate)return;
      const d=new Date(w.soldDate);
      const k=`${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
      if(!map[k])map[k]={label:MONTHS[d.getMonth()]+"'"+String(d.getFullYear()).slice(2),profit:0,cost:0,month:d.getMonth(),year:d.getFullYear()};
      map[k].profit+=netProf(w);map[k].cost+=w.cost;
    });
    let cum=0;
    return Object.values(map).sort((a,b)=>a.year-b.year||a.month-b.month).map(m=>({...m,cumulative:(cum+=m.profit),marginPct:m.cost?+((m.profit/m.cost)*100).toFixed(1):0}));
  },[sold,netProf]);

  const brandStats = useMemo(()=>{
    const map={};
    watches.forEach(w=>{
      if(!map[w.brand])map[w.brand]={brand:w.brand,profit:0,cost:0,sold:0};
      if(w.status==="sold"){map[w.brand].profit+=netProf(w);map[w.brand].cost+=w.cost;map[w.brand].sold++;}
    });
    return Object.values(map).map(b=>({...b,avgMarginPct:b.cost?+((b.profit/b.cost)*100).toFixed(1):0})).sort((a,b)=>b.profit-a.profit);
  },[watches,netProf]);

  const supStats = useMemo(()=>suppliers.map(s=>{
    const sw=watches.filter(w=>w.supplierId===s.id);
    const ss=sw.filter(w=>w.status==="sold");
    return{...s,wCount:sw.length,sCount:ss.length,totalP:ss.reduce((a,w)=>a+netProf(w),0),avgM:ss.length?ss.reduce((a,w)=>a+netMarg(w),0)/ss.length:0};
  }),[suppliers,watches,netProf,netMarg]);

  const pnlWatches = useMemo(()=>{
    if(period==="all")return sold;
    const c=new Date();c.setMonth(c.getMonth()-Number(period));
    return sold.filter(w=>w.soldDate&&new Date(w.soldDate)>=c);
  },[sold,period]);

  const scatterData = useMemo(()=>sold.filter(w=>w.bought&&w.soldDate).map(w=>({x:daysBetween(w.bought,w.soldDate),y:+(netMarg(w)*100).toFixed(1),z:w.cost,name:`${w.brand} ${w.model}`,brand:w.brand})),[sold,netMarg]);
  const monthlyCount= useMemo(()=>{const map={};sold.forEach(w=>{if(!w.soldDate)return;const m=MONTHS[new Date(w.soldDate).getMonth()];if(!map[m])map[m]={month:m,count:0,profit:0};map[m].count++;map[m].profit+=netProf(w);});return MONTHS.filter(m=>map[m]).map(m=>map[m]);},[sold,netProf]);

  const filtered = useMemo(()=>watches.filter(w=>{
    const q=search.toLowerCase();
    const margin = w.cost > 0 ? netMarg(w) : 0; // treat no-cost watches as 0% margin
    const marginOk = fMargin === "0" || margin >= Number(fMargin);
    const supplierOk = fSupplier === "all" || String(w.supplierId) === String(fSupplier);
    return(
      (!q||`${w.brand} ${w.model} ${w.ref} ${w.year} ${w.notes||""}`.toLowerCase().includes(q))&&
      (fStatus==="all"||w.status===fStatus)&&
      (fBrand==="all"||w.brand===fBrand)&&
      (fCond==="all"||w.condition===fCond)&&
      marginOk &&
      supplierOk
    );
  }),[watches,search,fStatus,fBrand,fCond,fMargin,fSupplier,netMarg]);

  const saveWatch    = f=>{setWatches(ws=>f.id&&ws.find(x=>x.id===f.id)?ws.map(x=>x.id===f.id?f:x):[...ws,{...f,timeline:[],photos:[]}]);setWm(null);};
  const saveSupplier = f=>{setSuppliers(ss=>f.id&&ss.find(x=>x.id===f.id)?ss.map(x=>x.id===f.id?f:x):[...ss,f]);setSm(null);};
  const saveTimeline = f=>{setWatches(ws=>ws.map(w=>w.id===f.id?f:w));setTlm(null);};

  const deleteWatch = (id, skipConfirm=false) => {
    if (!skipConfirm && !window.confirm("Delete this watch? This cannot be undone.")) return;
    setWatches(ws => ws.filter(w => w.id !== id));
    if (drawer?.id === id) setDrawer(null);
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} watch${selected.size>1?"es":""}? This cannot be undone.`)) return;
    setWatches(ws => ws.filter(w => !selected.has(w.id)));
    setSelected(new Set());
  };

  const deleteSupplier = (id) => {
    if (!window.confirm("Delete this supplier? Their watches will remain but won't be linked.")) return;
    setSuppliers(ss => ss.filter(s => s.id !== id));
  };

  const duplicateWatch = w => {
    const dup = { ...w, id:Date.now(), status:"listed", bought:new Date().toISOString().slice(0,10), soldDate:"", timeline:[], photos:[] };
    setWatches(ws=>[...ws, dup]);
  };

  const applyBulkStatus = () => {
    if (!bulkStatus || selected.size === 0) return;
    setWatches(ws => ws.map(w => selected.has(w.id) ? { ...w, status:bulkStatus, soldDate: bulkStatus==="sold" ? new Date().toISOString().slice(0,10) : w.soldDate } : w));
    setSelected(new Set()); setBulkStatus("");
  };

  const toggleSelect = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = ids => setSelected(s => s.size===ids.length ? new Set() : new Set(ids));

  // Sort logic for inventory
  const SORT_FNS = {
    year:       (a,b) => (a.year||"").localeCompare(b.year||""),
    brand:      (a,b) => a.brand.localeCompare(b.brand),
    model:      (a,b) => a.model.localeCompare(b.model),
    condition:  (a,b) => CONDITIONS.indexOf(a.condition)-CONDITIONS.indexOf(b.condition),
    cost:       (a,b) => a.cost-b.cost,
    askingPrice:(a,b) => a.askingPrice-b.askingPrice,
    netProfit:  (a,b) => netProf(a)-netProf(b),
    margin:     (a,b) => netMarg(a)-netMarg(b),
    days:       (a,b) => (holdDays(a)||0)-(holdDays(b)||0),
    bought:     (a,b) => new Date(a.bought||0)-new Date(b.bought||0),
    status:     (a,b) => a.status.localeCompare(b.status),
  };

  const sortedFiltered = useMemo(() => {
    const fn = SORT_FNS[sortCol] || SORT_FNS.bought;
    return [...filtered].sort((a,b) => sortDir==="asc" ? fn(a,b) : fn(b,a));
  }, [filtered, sortCol, sortDir]);

  const setSort = col => {
    if (sortCol === col) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const SortIcon = ({ col }) => sortCol===col ? (sortDir==="asc"?"↑":"↓") : <span style={{ color:"#333" }}>↕</span>;

  // Keyboard shortcut: N = new watch (admin only)
  useEffect(() => {
    const h = e => {
      if (role !== "admin") return;
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        setWm("new");
      }
      if (e.key === "Escape") { setWm(null); setSm(null); setTlm(null); setDrawer(null); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [role]);

  // ── All hooks above this line ─────────────────────────────────────────────
  if (!role) return <LoginScreen onAuth={r => setRole(r)} />;
  const isAdmin = role === "admin";

  const INP  = BASE_INP;
  const LBL  = BASE_LBL;
  const SH   = SH_STYLE;
  const H1   = { fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, margin:"0 0 20px" };

  return (
    <div style={{ minHeight:"100vh", background:"#0d0d0d", color:"#f0ebe0", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;} input,select,textarea{color-scheme:dark;}
        ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:#0d0d0d} ::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}
        input::placeholder,textarea::placeholder{color:#333}
        .row:hover td{background:#111 !important}
        .ghost{background:none;border:1px solid #2e2e2e;border-radius:8px;padding:5px 12px;color:#666;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.1s}
        .ghost:hover{border-color:#444;color:#aaa}
        .pill{border:1px solid #2e2e2e;border-radius:8px;padding:5px 11px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.1s}
        @media(max-width:768px){
          .desktop-nav{display:none!important}
          .mobile-menu-btn{display:flex!important}
          .page-pad{padding:16px!important}
          .kpi-grid-4{grid-template-columns:1fr 1fr!important}
          .kpi-grid-5{grid-template-columns:1fr 1fr!important}
          .kpi-grid-6{grid-template-columns:1fr 1fr!important}
          .two-col{grid-template-columns:1fr!important}
          .three-col{grid-template-columns:1fr!important}
          .filter-grid{grid-template-columns:1fr 1fr!important}
          .hide-mobile{display:none!important}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ borderBottom:"1px solid #1e1e1e", padding:"0 24px", display:"flex", alignItems:"center", height:54, position:"sticky", top:0, background:"rgba(13,13,13,0.97)", backdropFilter:"blur(20px)", zIndex:200 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, marginRight:16, flexShrink:0 }}>
          <div style={{ width:20, height:20, borderRadius:"50%", border:"1.5px solid #c9a84c", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#c9a84c" }}/>
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#c9a84c", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>PWA TRACK</span>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display:"flex", gap:1, overflowX:"auto", flex:1 }}>
          {NAV.map(n=>(
            <button key={n} onClick={()=>setTab(n)} style={{ background:tab===n?"#1c1c1c":"none", border:"none", borderRadius:7, padding:"5px 11px", color:tab===n?"#f0ebe0":"#555", fontSize:12, cursor:"pointer", fontWeight:tab===n?600:400, whiteSpace:"nowrap", flexShrink:0 }}>{n}</button>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={()=>setMobileNav(o=>!o)}
          style={{ display:"none", background:"none", border:"1px solid #2e2e2e", borderRadius:8, padding:"5px 10px", color:"#888", fontSize:18, cursor:"pointer", marginLeft:8, flexShrink:0 }}>☰</button>

        <div style={{ marginLeft:"auto", display:"flex", gap:8, flexShrink:0 }}>
          {/* Currency selector */}
          <select value={currency} onChange={e=>setCurrency(e.target.value)}
            style={{ background:"#1c1c1c", border:"1px solid #2e2e2e", borderRadius:8, padding:"5px 10px", color:"#888", fontSize:11, cursor:"pointer", outline:"none" }}>
            {Object.keys(CURRENCIES).map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          {/* Export CSV */}
          <button onClick={()=>exportCSV(watches,suppliers)} className="ghost" style={{ fontSize:11 }}>↓ CSV</button>
          <button onClick={()=>setSm("new")} className="ghost">+ Supplier</button>
          <button onClick={()=>setWm("new")} style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"6px 16px", color:"#0d0d0d", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Watch</button>
          <div style={{ width:1, height:20, background:"#222", margin:"0 4px" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", background:"#1a1a1a", borderRadius:8, border:"1px solid #2e2e2e" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background: isAdmin?"#5de08a":"#3a7bd5" }}/>
            <span style={{ fontSize:11, color: isAdmin?"#5de08a":"#3a7bd5" }}>{isAdmin?"Admin":"View only"}</span>
            <button onClick={()=>setRole(null)} style={{ background:"none", border:"none", color:"#444", fontSize:11, cursor:"pointer", padding:0, marginLeft:4 }}>↩</button>
          </div>
          {isAdmin && (
            <button onClick={()=>{ if(window.confirm("Reset all data to demo? This cannot be undone.")){localStorage.removeItem(LS);window.location.reload();}}}
              className="ghost" style={{ color:"#e85d04", borderColor:"#3a1a1a", fontSize:10 }}>Reset</button>
          )}
        </div>
      </nav>

      {/* Mobile nav dropdown */}
      {mobileNav && (
        <div style={{ position:"fixed", top:54, left:0, right:0, background:"#181818", borderBottom:"1px solid #2e2e2e", zIndex:190, display:"flex", flexDirection:"column", padding:8 }}>
          {NAV.map(n=>(
            <button key={n} onClick={()=>{setTab(n);setMobileNav(false);}}
              style={{ background:tab===n?"#222":"none", border:"none", borderRadius:8, padding:"10px 16px", color:tab===n?"#f0ebe0":"#888", fontSize:14, cursor:"pointer", textAlign:"left" }}>{n}</button>
          ))}
        </div>
      )}

      <div className="page-pad" style={{ maxWidth:1200, margin:"0 auto", padding:"26px 24px" }}>

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {tab==="Overview" && <>
          <h1 style={H1}>Overview</h1>
          <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Realised</div>
          <div className="kpi-grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
            <Kpi label="Net P&L"    value={fmtC(totalNetProfit)} sub={`${sold.length} flips closed`} accent="#c9a84c" highlight/>
            <Kpi label="Win Rate"   value={pct(winRate)}         sub="Deals ≥10% margin"             accent="#5de08a"/>
            <Kpi label="Avg Margin" value={pct(avgNetMargin)}    sub="After service costs"           accent="#5de08a"/>
            <Kpi label="Avg Hold"   value={avgHold+"d"}          sub="Days to sell"                  accent="#f0ebe0"/>
          </div>
          <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Active</div>
          <div className="kpi-grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
            <Kpi label="Stock Value"     value={fmtC(capRisk)}          sub={`${active.length} watches`}/>
            <Kpi label="Unrealised P&L" value={fmtC(unrealisedPnl)}    sub="vs market value"            accent={unrealisedPnl>=0?"#3a7bd5":"#e85d04"}/>
            <Kpi label="Service Spend"  value={fmtC(totalServiceCost)} sub="Total all watches"/>
            <Kpi label="Pipeline"       value={pipeline.length+""}      sub="Deals tracked"              accent="#9333ea"/>
          </div>

          <div className="two-col" style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Recent Activity</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {recentActivity.map(w=>{
                  const hd=holdDays(w);
                  return (
                    <div key={w.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"#121212", borderRadius:10 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:bc(w.brand), flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:"#ddd", fontWeight:500 }}>{w.brand} {w.model}</div>
                        <div style={{ fontSize:11, color:"#666", marginTop:2 }}>{w.year} · {w.condition}{hd?` · ${hd}d held`:""}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ ...NUM, fontSize:13, color:w.status==="sold"?"#5de08a":"#c9a84c" }}>{fmtC(w.askingPrice)}</div>
                        <div style={{ marginTop:3 }}><Badge status={w.status}/></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={CARD}>
                <div style={SH}>Monthly P&L</div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={monthly} barSize={14}>
                    <XAxis dataKey="label" tick={{fill:"#555",fontSize:9}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#555",fontSize:9,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1000).toFixed(0)+"k"}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Bar dataKey="profit" name="Net Profit" fill="#c9a84c" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={{ ...CARD, padding:"14px 16px" }}>
                  <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Best Flip</div>
                  {bestFlip?<>
                    <div style={{ fontSize:11, color:"#888", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{bestFlip.brand} {bestFlip.model}</div>
                    <div style={{ ...NUM, fontSize:16, color:"#5de08a" }}>{fmtC(netProf(bestFlip))}</div>
                    <div style={{ fontSize:10, color:"#555", marginTop:2 }}>{pct(netMarg(bestFlip))}</div>
                  </>:<div style={{ color:"#555", fontSize:11 }}>No sales yet</div>}
                </div>
                <div style={{ ...CARD, padding:"14px 16px" }}>
                  <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Worst Flip</div>
                  {worstFlip?<>
                    <div style={{ fontSize:11, color:"#888", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{worstFlip.brand} {worstFlip.model}</div>
                    <div style={{ ...NUM, fontSize:16, color:netProf(worstFlip)<0?"#e85d04":"#c9a84c" }}>{fmtC(netProf(worstFlip))}</div>
                    <div style={{ fontSize:10, color:"#555", marginTop:2 }}>{pct(netMarg(worstFlip))}</div>
                  </>:<div style={{ color:"#555", fontSize:11 }}>No sales yet</div>}
                </div>
              </div>
            </div>
          </div>

          <div style={CARD}>
            <div style={SH}>Active Inventory — What's Sitting</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr style={{ borderBottom:"1px solid #222" }}>
                  {["Watch","Year","Condition","Cost","Ask","Unreal. P&L","Days Held","Status"].map(h=><TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {active.sort((a,b)=>(holdDays(b)||0)-(holdDays(a)||0)).map(w=>{
                    const unreal=(w.marketValue||w.askingPrice)-w.cost-(w.serviceCost||0);
                    const hd=holdDays(w);
                    return (
                      <tr key={w.id} className="row" style={{ borderBottom:"1px solid #161616" }}>
                        <td style={{ padding:"10px 14px" }}><span style={{ display:"flex",alignItems:"center",gap:6 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand),flexShrink:0 }}/><span style={{ color:"#ccc" }}>{w.brand} {w.model}</span></span></td>
                        <TD mono dim>{w.year}</TD>
                        <TD dim>{w.condition}</TD>
                        <TD mono>{fmtC(w.cost)}</TD>
                        <TD mono>{fmtC(w.askingPrice)}</TD>
                        <td style={{ padding:"10px 14px",...NUM,color:unreal>=0?"#3a7bd5":"#e85d04",fontWeight:600 }}>{fmtC(unreal)}</td>
                        <td style={{ padding:"10px 14px",...NUM,fontSize:11,color:hd>90?"#e85d04":hd>30?"#c9a84c":"#5de08a" }}>{hd}d</td>
                        <td style={{ padding:"10px 14px" }}><Badge status={w.status}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ── INVENTORY ──────────────────────────────────────────────────────── */}
        {tab==="Inventory" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Inventory</h1>
            <button onClick={()=>exportCSV(watches,suppliers)} className="ghost">↓ Export CSV</button>
            <button onClick={()=>setWm("new")} style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"7px 16px", color:"#0d0d0d", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Watch</button>
          </div>
          <div style={{ ...CARD, padding:"14px 16px", marginBottom:14 }}>
            <div className="filter-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
              <div><label style={LBL}>Search</label><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Brand, model, ref, year…" style={INP}/></div>
              <div><label style={LBL}>Status</label><select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={INP}><option value="all">All</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label style={LBL}>Brand</label><select value={fBrand} onChange={e=>setFBrand(e.target.value)} style={INP}><option value="all">All</option>{[...new Set(watches.map(w=>w.brand))].sort().map(b=><option key={b}>{b}</option>)}</select></div>
              <div><label style={LBL}>Condition</label><select value={fCond} onChange={e=>setFCond(e.target.value)} style={INP}><option value="all">All</option>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label style={LBL}>Min Margin</label><select value={fMargin} onChange={e=>setFMargin(e.target.value)} style={INP}><option value="0">Any</option><option value="0.05">5%+</option><option value="0.10">10%+</option><option value="0.20">20%+</option><option value="0.30">30%+</option></select></div>
              <div><label style={LBL}>Supplier</label><select value={fSupplier} onChange={e=>setFSupplier(e.target.value)} style={INP}><option value="all">All</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name.split(" ")[0]}</option>)}</select></div>
              <button onClick={()=>{setSearch("");setFStatus("all");setFBrand("all");setFCond("all");setFMargin("0");setFSupplier("all");}} className="ghost" style={{ padding:"9px 14px", alignSelf:"flex-end" }}>Reset</button>
            </div>
          </div>
          <div style={{ fontSize:11, color:"#555", marginBottom:10 }}>{filtered.length} watches{filtered.length!==watches.length?` (filtered from ${watches.length})`:""}</div>

          {/* Bulk actions bar */}
          {selected.size > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", background:"#1e1a0e", border:"1px solid #3a2a0e", borderRadius:10, marginBottom:12 }}>
              <span style={{ fontSize:12, color:"#c9a84c", fontWeight:600 }}>{selected.size} selected</span>
              <select value={bulkStatus} onChange={e=>setBulkStatus(e.target.value)}
                style={{ ...BASE_INP, width:140, padding:"6px 10px", fontSize:12 }}>
                <option value="">Set status…</option>
                {STATUSES.map(s=><option key={s}>{s}</option>)}
              </select>
              <button onClick={applyBulkStatus} disabled={!bulkStatus}
                style={{ background:bulkStatus?"#c9a84c":"#333", border:"none", borderRadius:8, padding:"6px 16px", color:bulkStatus?"#0d0d0d":"#555", fontSize:12, fontWeight:700, cursor:bulkStatus?"pointer":"default" }}>Apply</button>
              <div style={{ width:1, height:18, background:"#3a2a0e" }}/>
              <button onClick={deleteSelected}
                style={{ background:"none", border:"1px solid #5a1a1a", borderRadius:8, padding:"6px 14px", color:"#e85d04", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                🗑 Delete {selected.size}
              </button>
              <button onClick={()=>setSelected(new Set())} className="ghost" style={{ marginLeft:"auto" }}>Clear</button>
            </div>
          )}

          <div style={{ ...CARD, padding:0, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid #222" }}>
                    {isAdmin && <th style={{ padding:"10px 14px", width:36 }}>
                      <input type="checkbox" checked={selected.size===sortedFiltered.length&&sortedFiltered.length>0} onChange={()=>toggleSelectAll(sortedFiltered.map(w=>w.id))} style={{ cursor:"pointer" }}/>
                    </th>}
                    {[["year","Year"],["brand","Brand"],["","Model"],["","Ref"],["condition","Cond."],["cost","Cost"],["askingPrice","Ask"],["","Service"],["netProfit","Net Profit"],["margin","Margin"],["days","Days"],["","Mkt Val."],["status","Status"],["",""],["",""]].map(([col,label],i)=>(
                      <th key={i} onClick={()=>col&&setSort(col)}
                        style={{ padding:"10px 14px", textAlign:"left", color: col&&sortCol===col?"#c9a84c":"#555", fontWeight:500, fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", cursor:col?"pointer":"default", userSelect:"none", whiteSpace:"nowrap" }}>
                        {label} {col&&<SortIcon col={col}/>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map(w=>{
                    const np=netProf(w),nm=netMarg(w),mv=w.marketValue;
                    const photos=w.photos||[];
                    const isSel = selected.has(w.id);
                    return (
                      <tr key={w.id} className="row" onClick={()=>setDrawer(w)}
                        style={{ borderBottom:"1px solid #161616", cursor:"pointer", background:isSel?"#1a1a0a":"transparent" }}>
                        {isAdmin && <td style={{ padding:"10px 14px" }} onClick={e=>{e.stopPropagation();toggleSelect(w.id);}}>
                          <input type="checkbox" checked={isSel} onChange={()=>toggleSelect(w.id)} style={{ cursor:"pointer" }}/>
                        </td>}
                        <TD mono dim>{w.year}</TD>
                        <td style={{ padding:"10px 14px" }}><span style={{ display:"flex",alignItems:"center",gap:6 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand),flexShrink:0 }}/>{w.brand}</span></td>
                        <td style={{ padding:"10px 14px", color:"#bbb" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            {photos.length>0&&<img src={photos[0].data} alt="" style={{ width:24,height:24,borderRadius:4,objectFit:"cover",border:"1px solid #2e2e2e",flexShrink:0 }}/>}
                            {w.model}
                          </div>
                        </td>
                        <TD mono dim>{w.ref}</TD>
                        <TD dim>{w.condition}</TD>
                        <TD mono>{fmtC(w.cost)}</TD>
                        <TD mono>{fmtC(w.askingPrice)}</TD>
                        <td style={{ padding:"10px 14px",...NUM,fontSize:11,color:w.serviceCost?"#9333ea":"#444" }}>{w.serviceCost?fmtC(w.serviceCost):"—"}</td>
                        <td style={{ padding:"10px 14px",...NUM,color:np>=0?"#5de08a":"#e85d04",fontWeight:600 }}>{fmtC(np)}</td>
                        <td style={{ padding:"10px 14px",...NUM,color:nm>=0.15?"#5de08a":nm>=0.05?"#c9a84c":"#e85d04" }}>{pct(nm)}</td>
                        <TD mono dim>{holdDays(w)??"-"}</TD>
                        <td style={{ padding:"10px 14px",...NUM,fontSize:11,color:mv?(mv>w.cost?"#3a7bd5":"#e85d04"):"#444" }}>{mv?fmtC(mv):"—"}</td>
                        <td style={{ padding:"10px 14px" }}><Badge status={w.status}/></td>
                        {isAdmin && <td style={{ padding:"10px 14px" }} onClick={e=>e.stopPropagation()}><button className="ghost" onClick={()=>setWm(w)}>Edit</button></td>}
                        {isAdmin && <td style={{ padding:"10px 14px" }} onClick={e=>e.stopPropagation()}><button className="ghost" style={{ color:"#9333ea",borderColor:"#2e1e40" }} onClick={()=>setTlm(w)}>Log</button></td>}
                        {isAdmin && <td style={{ padding:"10px 14px" }} onClick={e=>e.stopPropagation()}><button className="ghost" style={{ color:"#e85d04",borderColor:"#3a1a1a" }} onClick={()=>deleteWatch(w.id)}>🗑</button></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ── LOGISTICS ──────────────────────────────────────────────────────── */}
        {tab==="Logistics" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Logistics</h1>
            <button onClick={()=>setLogistics(l=>[...l,{id:Date.now(),watchId:"",brand:"",model:"",carrier:"",trackingNo:"",from:"",to:"",status:"preparing",sent:"",eta:"",arrived:"",cost:0,insured:false,insuredValue:0,notes:""}])}
              style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"7px 18px", color:"#0d0d0d", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Add Shipment</button>
          </div>
          <div className="kpi-grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
            <Kpi label="Total Shipments" value={logistics.length}/>
            <Kpi label="In Transit"      value={logistics.filter(l=>l.status==="in transit").length} accent="#c9a84c"/>
            <Kpi label="Delivered"       value={logistics.filter(l=>l.status==="delivered").length}  accent="#5de08a"/>
            <Kpi label="Shipping Spend"  value={fmtC(logistics.reduce((a,l)=>a+(l.cost||0),0))}     accent="#9333ea"/>
          </div>
          {logistics.filter(l=>l.status!=="delivered").length>0&&<>
            <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>In Transit</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
              {logistics.filter(l=>l.status!=="delivered").map(s=>(
                <div key={s.id} style={{ ...CARD, padding:"16px 20px", display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600 }}>{s.brand} {s.model}</span>
                      <Badge status={s.status}/>
                      {s.insured&&<span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#1a2a1a", color:"#5de08a" }}>insured</span>}
                    </div>
                    <div style={{ display:"flex", gap:16, fontSize:11, color:"#666", flexWrap:"wrap" }}>
                      <span>📦 {s.carrier||"—"}</span><span>📍 {s.from||"—"} → {s.to||"—"}</span>
                      {s.eta&&<span>🕐 ETA: {s.eta}</span>}
                    </div>
                    {s.trackingNo&&<div style={{ ...NUM, fontSize:11, color:"#666", marginTop:5 }}>{s.trackingNo}</div>}
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:"#555", marginBottom:2 }}>Cost</div>
                      <div style={{ ...NUM, fontSize:13, color:"#aaa" }}>{fmtC(s.cost||0)}</div>
                    </div>
                    {["preparing","in transit","delivered"].map(st=>(
                      <button key={st} onClick={()=>setLogistics(ls=>ls.map(x=>x.id===s.id?{...x,status:st,arrived:st==="delivered"?new Date().toISOString().slice(0,10):x.arrived}:x))}
                        className="pill" style={{ background:s.status===st?"#c9a84c":"#181818", color:s.status===st?"#0d0d0d":"#666", fontWeight:s.status===st?700:400, fontSize:10, padding:"4px 8px" }}>
                        {st}
                      </button>
                    ))}
                    <button onClick={()=>{ if(window.confirm('Delete this shipment?')) setLogistics(ls=>ls.filter(x=>x.id!==s.id)); }} className="ghost" style={{ color:"#e85d04", borderColor:"#3a1a1a" }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </>}
          <div style={{ fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>All Shipments</div>
          <div style={{ ...CARD, padding:0, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr style={{ borderBottom:"1px solid #222" }}>
                  {["Watch","Carrier","Tracking","Route","Sent","ETA / Arrived","Cost","Insured","Status"].map(h=><TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {[...logistics].sort((a,b)=>new Date(b.sent||0)-new Date(a.sent||0)).map(s=>(
                    <tr key={s.id} className="row" style={{ borderBottom:"1px solid #161616" }}>
                      <td style={{ padding:"10px 14px", color:"#ccc" }}>{s.brand} {s.model}</td>
                      <TD dim>{s.carrier||"—"}</TD>
                      <td style={{ padding:"10px 14px",...NUM,fontSize:11,color:"#666" }}>{s.trackingNo||"—"}</td>
                      <td style={{ padding:"10px 14px",fontSize:11,color:"#777" }}>{s.from&&s.to?`${s.from} → ${s.to}`:"—"}</td>
                      <TD mono dim>{s.sent||"—"}</TD>
                      <TD mono dim>{s.arrived||s.eta||"—"}</TD>
                      <TD mono>{s.cost?fmtC(s.cost):"—"}</TD>
                      <td style={{ padding:"10px 14px",fontSize:11,color:s.insured?"#5de08a":"#555" }}>{s.insured?fmtC(s.insuredValue):"No"}</td>
                      <td style={{ padding:"10px 14px" }}><Badge status={s.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ── P&L ───────────────────────────────────────────────────────────── */}
        {tab==="P&L" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, flexWrap:"wrap" }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>P&L Analysis</h1>
            <div style={{ display:"flex", gap:4 }}>
              {[["all","All Time"],["3","3M"],["6","6M"],["12","12M"]].map(([v,l])=>(
                <button key={v} onClick={()=>setPeriod(v)} className="pill" style={{ background:period===v?"#c9a84c":"#181818", color:period===v?"#0d0d0d":"#666", fontWeight:period===v?700:400 }}>{l}</button>
              ))}
            </div>
          </div>
          <div className="kpi-grid-6" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:16 }}>
            {[
              ["Net P&L",    fmtC(pnlWatches.reduce((a,w)=>a+netProf(w),0)),"#c9a84c"],
              ["Revenue",    fmtC(pnlWatches.reduce((a,w)=>a+w.askingPrice,0)),"#f0ebe0"],
              ["Cost Basis", fmtC(pnlWatches.reduce((a,w)=>a+w.cost,0)),"#666"],
              ["Service",    fmtC(pnlWatches.reduce((a,w)=>a+(w.serviceCost||0),0)),"#9333ea"],
              ["Avg Margin", pnlWatches.length?pct(pnlWatches.reduce((a,w)=>a+netMarg(w),0)/pnlWatches.length):"—","#5de08a"],
              ["Deals",      pnlWatches.length,"#aaa"],
            ].map(([l,v,a])=><Kpi key={l} label={l} value={v} accent={a} small/>)}
          </div>
          <div className="two-col" style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Cumulative Net P&L</div>
              <ResponsiveContainer width="100%" height={175}>
                <LineChart data={monthly}>
                  <XAxis dataKey="label" tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#555",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1000).toFixed(0)+"k"}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Line type="monotone" dataKey="cumulative" name="Cumulative P&L" stroke="#c9a84c" strokeWidth={2} dot={{fill:"#c9a84c",r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={SH}>Monthly Margin %</div>
              <ResponsiveContainer width="100%" height={175}>
                <BarChart data={monthly} barSize={16}>
                  <XAxis dataKey="label" tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#555",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="marginPct" name="Margin %" fill="#3a7bd5" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>P&L by Brand</div>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={brandStats.filter(b=>b.sold>0)} layout="vertical" barSize={12}>
                  <XAxis type="number" tick={{fill:"#555",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1000).toFixed(0)+"k"}/>
                  <YAxis dataKey="brand" type="category" tick={{fill:"#aaa",fontSize:11}} axisLine={false} tickLine={false} width={88}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="profit" name="Net Profit" radius={[0,4,4,0]}>{brandStats.map((b,i)=><Cell key={i} fill={bc(b.brand)}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={SH}>Margin % by Brand</div>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={brandStats.filter(b=>b.sold>0)} layout="vertical" barSize={12}>
                  <XAxis type="number" tick={{fill:"#555",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
                  <YAxis dataKey="brand" type="category" tick={{fill:"#aaa",fontSize:11}} axisLine={false} tickLine={false} width={88}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="avgMarginPct" name="Avg Margin %" radius={[0,4,4,0]}>{brandStats.map((b,i)=><Cell key={i} fill={bc(b.brand)}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ ...CARD, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid #222" }}><span style={SH}>Deal Breakdown</span></div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr style={{ borderBottom:"1px solid #222" }}>
                  {["Date","Watch","Year","Cost","Service","Sold For","Net Profit","Margin","Hold Days","Supplier"].map(h=><TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {[...pnlWatches].sort((a,b)=>new Date(b.soldDate)-new Date(a.soldDate)).map(w=>{
                    const np=netProf(w),nm=netMarg(w),sup=suppliers.find(s=>s.id===w.supplierId);
                    return (
                      <tr key={w.id} className="row" style={{ borderBottom:"1px solid #161616" }}>
                        <TD mono dim>{w.soldDate}</TD>
                        <td style={{ padding:"10px 14px",color:"#bbb" }}><span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand),flexShrink:0 }}/>{w.brand} {w.model}</span></td>
                        <TD mono dim>{w.year}</TD>
                        <TD mono>{fmtC(w.cost)}</TD>
                        <td style={{ padding:"10px 14px",...NUM,fontSize:11,color:w.serviceCost?"#9333ea":"#555" }}>{w.serviceCost?fmtC(w.serviceCost):"—"}</td>
                        <TD mono>{fmtC(w.askingPrice)}</TD>
                        <td style={{ padding:"10px 14px",...NUM,fontWeight:600,color:np>=0?"#5de08a":"#e85d04" }}>{fmtC(np)}</td>
                        <td style={{ padding:"10px 14px",...NUM,color:nm>=0.15?"#5de08a":nm>=0.05?"#c9a84c":"#e85d04" }}>{pct(nm)}</td>
                        <TD mono dim>{holdDays(w)??"-"}</TD>
                        <TD dim>{sup?.name||"—"}</TD>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr style={{ borderTop:"1px solid #2e2e2e", background:"#121212" }}>
                  <td colSpan={3} style={{ padding:"10px 14px",color:"#444",fontSize:10,textTransform:"uppercase",letterSpacing:"0.07em" }}>Total / Avg</td>
                  <TD mono>{fmtC(pnlWatches.reduce((a,w)=>a+w.cost,0))}</TD>
                  <td style={{ padding:"10px 14px",...NUM,color:"#9333ea" }}>{fmtC(pnlWatches.reduce((a,w)=>a+(w.serviceCost||0),0))}</td>
                  <TD mono>{fmtC(pnlWatches.reduce((a,w)=>a+w.askingPrice,0))}</TD>
                  <td style={{ padding:"10px 14px",...NUM,fontWeight:600,color:"#c9a84c" }}>{fmtC(pnlWatches.reduce((a,w)=>a+netProf(w),0))}</td>
                  <td style={{ padding:"10px 14px",...NUM,color:"#5de08a" }}>{pnlWatches.length?pct(pnlWatches.reduce((a,w)=>a+netMarg(w),0)/pnlWatches.length):"—"}</td>
                  <td colSpan={2}/>
                </tr></tfoot>
              </table>
            </div>
          </div>
        </>}

        {/* ── SUPPLIERS ──────────────────────────────────────────────────────── */}
        {tab==="Suppliers" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Suppliers</h1>
            <button onClick={()=>setSm("new")} style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"7px 18px", color:"#0d0d0d", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Add Supplier</button>
          </div>
          <div className="kpi-grid-4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
            <Kpi label="Total Suppliers"  value={suppliers.length}/>
            <Kpi label="Top Source"       value={[...supStats].sort((a,b)=>b.totalP-a.totalP)[0]?.name.split(" ")[0]||"—"} accent="#c9a84c"/>
            <Kpi label="Avg Reliability"  value={(suppliers.reduce((a,s)=>a+s.reliability,0)/Math.max(1,suppliers.length)).toFixed(1)+" / 5"} accent="#5de08a"/>
            <Kpi label="Sourced Watches"  value={watches.filter(w=>w.supplierId).length}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:18 }}>
            {supStats.map(s=>(
              <div key={s.id} style={{ ...CARD, display:"flex", gap:16, alignItems:"flex-start", padding:"18px 20px", flexWrap:"wrap" }}>
                <div style={{ width:40,height:40,borderRadius:"50%",background:`${bc(s.name)}18`,border:`1.5px solid ${bc(s.name)}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:bc(s.name),flexShrink:0 }}>{s.name[0]}</div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600 }}>{s.name}</span>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#222", color:"#666" }}>{s.type}</span>
                    <span style={{ fontSize:11, color:"#444" }}>{[s.city,s.country].filter(Boolean).join(", ")}</span>
                  </div>
                  <Stars n={s.reliability}/>
                  <div style={{ fontSize:12, color:"#555", marginTop:4, marginBottom:5 }}>{s.notes}</div>
                  {s.tags?.length>0&&<div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>{s.tags.map(t=><span key={t} style={{ fontSize:10,padding:"2px 8px",borderRadius:20,background:"#161616",color:"#555",border:"1px solid #222" }}>{t}</span>)}</div>}
                  <div style={{ display:"flex", gap:14, marginTop:7 }}>
                    {s.email&&<span style={{ fontSize:11,color:"#3a7bd5" }}>✉ {s.email}</span>}
                    {s.phone&&<span style={{ fontSize:11,color:"#555" }}>☎ {s.phone}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                  {[["Net P&L",fmtC(s.totalP),s.totalP>0?"#5de08a":"#666"],["Avg Margin",s.avgM>0?pct(s.avgM):"—","#c9a84c"],["Watches",s.wCount,"#aaa"],["Disc.",s.avgDiscount+"%","#aaa"]].map(([l,v,c])=>(
                    <div key={l} style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10,color:"#444",marginBottom:2,textTransform:"uppercase",letterSpacing:"0.07em" }}>{l}</div>
                      <div style={{ ...NUM,fontSize:14,color:c }}>{v}</div>
                    </div>
                  ))}
                  <button className="ghost" onClick={()=>setSm(s)}>Edit</button>
                  {isAdmin && <button className="ghost" style={{ color:"#e85d04", borderColor:"#3a1a1a" }} onClick={()=>deleteSupplier(s.id)}>🗑</button>}
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ── SALES ──────────────────────────────────────────────────────────── */}
        {tab==="Sales" && <>
          <h1 style={H1}>Sales History</h1>
          <div className="two-col" style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Cumulative Profit</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthly}>
                  <XAxis dataKey="label" tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#555",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>"€"+(v/1000).toFixed(0)+"k"}/>
                  <Tooltip content={<ChartTip/>}/>
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
                  <div key={range} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <span style={{ ...NUM, fontSize:11, color:"#555", width:50 }}>{range}</span>
                    <div style={{ flex:1, height:7, background:"#1e1e1e", borderRadius:4, overflow:"hidden" }}><div style={{ height:"100%", width:p+"%", background:"#c9a84c", borderRadius:4 }}/></div>
                    <span style={{ ...NUM, fontSize:12, color:"#888", width:16, textAlign:"right" }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ ...CARD, padding:0, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead><tr style={{ borderBottom:"1px solid #222" }}>
                  {["Date","Brand","Model","Year","Cond.","Cost","Service","Sold For","Net Profit","Margin","Hold Days"].map(h=><TH key={h}>{h}</TH>)}
                </tr></thead>
                <tbody>
                  {[...sold].sort((a,b)=>new Date(b.soldDate)-new Date(a.soldDate)).map(w=>(
                    <tr key={w.id} className="row" style={{ borderBottom:"1px solid #161616" }}>
                      <TD mono dim>{w.soldDate}</TD>
                      <td style={{ padding:"10px 14px" }}><span style={{ display:"flex",alignItems:"center",gap:5 }}><span style={{ width:6,height:6,borderRadius:"50%",background:bc(w.brand) }}/>{w.brand}</span></td>
                      <td style={{ padding:"10px 14px",color:"#bbb" }}>{w.model}</td>
                      <TD mono dim>{w.year}</TD>
                      <TD dim>{w.condition}</TD>
                      <TD mono>{fmtC(w.cost)}</TD>
                      <td style={{ padding:"10px 14px",...NUM,fontSize:11,color:w.serviceCost?"#9333ea":"#555" }}>{w.serviceCost?fmtC(w.serviceCost):"—"}</td>
                      <TD mono>{fmtC(w.askingPrice)}</TD>
                      <td style={{ padding:"10px 14px",...NUM,fontWeight:600,color:netProf(w)>=0?"#5de08a":"#e85d04" }}>{fmtC(netProf(w))}</td>
                      <td style={{ padding:"10px 14px",...NUM,color:netMarg(w)>=0.15?"#5de08a":netMarg(w)>=0.05?"#c9a84c":"#e85d04" }}>{pct(netMarg(w))}</td>
                      <TD mono dim>{holdDays(w)??"-"}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ── INTELLIGENCE ──────────────────────────────────────────────────── */}
        {tab==="Intelligence" && <>
          <h1 style={H1}>Business Intelligence</h1>
          <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Margin vs Hold Days</div>
              <div style={{ fontSize:11, color:"#555", marginBottom:10 }}>Each dot = one flip. Bigger = higher cost basis. Line = trend.</div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3"/>
                  <XAxis type="number" dataKey="x" name="Hold Days" tick={{fill:"#555",fontSize:10,...NUM}} axisLine={false} tickLine={false}/>
                  <YAxis type="number" dataKey="y" name="Margin %" tick={{fill:"#555",fontSize:10,...NUM}} axisLine={false} tickLine={false} tickFormatter={v=>v+"%"}/>
                  <ZAxis dataKey="z" range={[40,200]}/>
                  <Tooltip cursor={{stroke:"#2e2e2e"}} content={({active,payload})=>{
                    if(!active||!payload?.length)return null;
                    const d=payload[0].payload;
                    return <div style={{ background:"#181818",border:"1px solid #2e2e2e",borderRadius:8,padding:"8px 12px",fontSize:12 }}>
                      <div style={{ color:"#888",marginBottom:3 }}>{d.name}</div>
                      <div style={{ ...NUM,color:"#c9a84c" }}>{d.y}% margin · {d.x}d</div>
                    </div>;
                  }}/>
                  <Scatter data={scatterData} fillOpacity={0.85}>{scatterData.map((d,i)=><Cell key={i} fill={bc(d.brand)}/>)}</Scatter>
                  {/* Trendline */}
                  {scatterData.length >= 2 && (() => {
                    const n=scatterData.length, sx=scatterData.reduce((a,d)=>a+d.x,0), sy=scatterData.reduce((a,d)=>a+d.y,0);
                    const sxy=scatterData.reduce((a,d)=>a+d.x*d.y,0), sxx=scatterData.reduce((a,d)=>a+d.x*d.x,0);
                    const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx||1), intercept=(sy-slope*sx)/n;
                    const xs=[Math.min(...scatterData.map(d=>d.x)),Math.max(...scatterData.map(d=>d.x))];
                    const trendPoints=xs.map(x=>({x,y:+(slope*x+intercept).toFixed(1)}));
                    return <Line data={trendPoints} type="linear" dataKey="y" stroke="#c9a84c44" strokeWidth={1.5} strokeDasharray="4 3" dot={false} legendType="none"/>;
                  })()}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={CARD}>
              <div style={SH}>Sales by Month</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyCount} barSize={20}>
                  <XAxis dataKey="month" tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#555",fontSize:10,...NUM}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="count" name="Watches Sold" fill="#3a7bd5" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="two-col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <div style={CARD}>
              <div style={SH}>Capital Efficiency by Brand</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {brandStats.filter(b=>b.sold>0).map(b=>{
                  const eff=b.cost?b.profit/b.cost:0;
                  const maxEff=Math.max(...brandStats.filter(x=>x.sold>0).map(x=>x.cost?x.profit/x.cost:0));
                  return (
                    <div key={b.brand} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ width:6,height:6,borderRadius:"50%",background:bc(b.brand),flexShrink:0 }}/>
                      <span style={{ fontSize:11, color:"#888", width:90, flexShrink:0 }}>{b.brand}</span>
                      <div style={{ flex:1, height:7, background:"#1e1e1e", borderRadius:4, overflow:"hidden" }}><div style={{ height:"100%", width:`${(eff/maxEff)*100}%`, background:bc(b.brand), borderRadius:4 }}/></div>
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
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#121212", borderRadius:10 }}>
                    <span style={{ ...NUM,fontSize:13,color:"#444",width:18 }}>#{i+1}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:"#ccc" }}>{s.name}</div>
                      <div style={{ fontSize:10, color:"#555" }}>{s.sCount} sold · {s.avgDiscount}% disc</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ ...NUM, fontSize:15, color:"#5de08a" }}>{s.avgM>0?pct(s.avgM):"—"}</div>
                      <div style={{ fontSize:10, color:"#555" }}>avg margin</div>
                    </div>
                    <Stars n={s.reliability}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={CARD}>
            <div style={SH}>Condition vs Margin — What Grade is Worth Buying</div>
            <div className="three-col" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
              {CONDITIONS.map(c=>{
                const ws=sold.filter(w=>w.condition===c);
                const avg=ws.length?ws.reduce((a,w)=>a+netMarg(w),0)/ws.length:null;
                return (
                  <div key={c} style={{ background:"#121212",borderRadius:10,padding:"14px 12px",textAlign:"center" }}>
                    <div style={{ fontSize:10,color:"#555",marginBottom:6 }}>{c}</div>
                    <div style={{ ...NUM,fontSize:17,color:avg===null?"#333":avg>=0.15?"#5de08a":avg>=0.05?"#c9a84c":"#e85d04" }}>{avg!==null?pct(avg):"—"}</div>
                    <div style={{ fontSize:10,color:"#444",marginTop:4 }}>{ws.length} sold</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>}

        {/* ── WISHLIST ───────────────────────────────────────────────────────── */}
        {tab==="Wishlist" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Wishlist</h1>
            <button onClick={()=>setWishlist(w=>[...w,{id:Date.now(),brand:"",model:"",ref:"",year:"",targetBuy:0,marketEst:0,priority:"medium",notes:"",found:false}])}
              style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"7px 18px", color:"#0d0d0d", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Add</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {wishlist.map(item=>(
              <div key={item.id} style={{ ...CARD, padding:"16px 20px", display:"flex", gap:16, alignItems:"center", flexWrap:"wrap", opacity:item.found?0.5:1 }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600, color:item.found?"#666":"#f0ebe0" }}>{item.brand||"—"} {item.model||"—"}</span>
                    <span style={{ fontSize:10,padding:"2px 8px",borderRadius:20,background:item.priority==="high"?"#2a1a0e":item.priority==="medium"?"#222":"#1a2a1a",color:item.priority==="high"?"#c9a84c":item.priority==="medium"?"#888":"#5de08a" }}>{item.priority}</span>
                    {item.found&&<span style={{ fontSize:10,padding:"2px 8px",borderRadius:20,background:"#1a2f3a",color:"#3a7bd5" }}>found</span>}
                  </div>
                  <div style={{ fontSize:11, color:"#555" }}>{item.year} · {item.ref} · {item.notes}</div>
                </div>
                <div style={{ display:"flex", gap:18, alignItems:"center", flexWrap:"wrap" }}>
                  {[["Target Buy",item.targetBuy,"#c9a84c"],["Market Est.",item.marketEst,"#888"],["Upside",item.marketEst&&item.targetBuy?item.marketEst-item.targetBuy:null,(item.marketEst-item.targetBuy)>0?"#5de08a":"#e85d04"]].map(([l,v,c])=>(
                    <div key={l} style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10,color:"#444",marginBottom:2 }}>{l}</div>
                      <div style={{ ...NUM,fontSize:15,color:v?c:"#444" }}>{v?fmtC(v):"—"}</div>
                    </div>
                  ))}
                  <button onClick={()=>setWishlist(w=>w.map(x=>x.id===item.id?{...x,found:!x.found}:x))} className="ghost">{item.found?"Unmark":"Mark Found"}</button>
                  <button onClick={()=>{ if(window.confirm('Remove from wishlist?')) setWishlist(w=>w.filter(x=>x.id!==item.id)); }} className="ghost" style={{ color:"#e85d04",borderColor:"#3a1a1a" }}>×</button>
                </div>
              </div>
            ))}
            {!wishlist.length&&<div style={{ color:"#444",fontSize:13,textAlign:"center",padding:"40px 0" }}>No watches on wishlist yet</div>}
          </div>
        </>}

        {/* ── PIPELINE ───────────────────────────────────────────────────────── */}
        {tab==="Pipeline" && <>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <h1 style={{ ...H1, margin:0, flex:1 }}>Deal Pipeline</h1>
            <button onClick={()=>setPipeline(p=>[...p,{id:Date.now(),brand:"",model:"",ref:"",year:"",askingPrice:0,offerMade:0,status:"interested",supplierId:"",notes:"",lastContact:""}])}
              style={{ background:"#c9a84c", border:"none", borderRadius:8, padding:"7px 18px", color:"#0d0d0d", fontWeight:700, fontSize:12, cursor:"pointer" }}>+ Add Deal</button>
          </div>
          <div className="three-col" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
            {[["tracking","Tracking","#666"],["interested","Interested","#3a7bd5"],["negotiating","Negotiating","#c9a84c"]].map(([s,l,c])=>(
              <div key={s} style={{ ...CARD, textAlign:"center" }}>
                <div style={{ fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6 }}>{l}</div>
                <div style={{ ...NUM,fontSize:28,color:c }}>{pipeline.filter(p=>p.status===s).length}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {pipeline.map(item=>{
              const gap=item.askingPrice&&item.offerMade?item.askingPrice-item.offerMade:null;
              const sup=suppliers.find(s=>s.id===item.supplierId);
              return (
                <div key={item.id} style={{ ...CARD, padding:"16px 20px", display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600 }}>{item.brand||"—"} {item.model||"—"}</span>
                      <Badge status={item.status}/>
                    </div>
                    <div style={{ fontSize:11, color:"#555" }}>{item.year} · {item.ref}{sup?` · ${sup.name}`:""}</div>
                    <div style={{ fontSize:11, color:"#666", marginTop:4 }}>{item.notes}</div>
                    {item.lastContact&&<div style={{ fontSize:10, color:"#444", marginTop:4 }}>Last contact: {item.lastContact}</div>}
                  </div>
                  <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
                    {[["Asking",item.askingPrice,"#888"],["Offer",item.offerMade,"#c9a84c"],["Gap",gap,gap>0?"#e85d04":"#5de08a"]].map(([l,v,c])=>(
                      <div key={l} style={{ textAlign:"right" }}>
                        <div style={{ fontSize:10,color:"#444",marginBottom:2 }}>{l}</div>
                        <div style={{ ...NUM,fontSize:14,color:v?c:"#444" }}>{v?fmtC(v):"—"}</div>
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:5 }}>
                      {["tracking","interested","negotiating"].map(s=>(
                        <button key={s} onClick={()=>setPipeline(p=>p.map(x=>x.id===item.id?{...x,status:s}:x))}
                          className="pill" style={{ background:item.status===s?"#c9a84c":"#181818", color:item.status===s?"#0d0d0d":"#666", fontWeight:item.status===s?700:400, fontSize:10, padding:"4px 8px" }}>
                          {s}
                        </button>
                      ))}
                      <button onClick={()=>{ if(window.confirm('Remove from pipeline?')) setPipeline(p=>p.filter(x=>x.id!==item.id)); }} className="ghost" style={{ color:"#e85d04",borderColor:"#3a1a1a" }}>×</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!pipeline.length&&<div style={{ color:"#444",fontSize:13,textAlign:"center",padding:"40px 0" }}>No deals in pipeline</div>}
          </div>
        </>}

        {/* ── CALCULATOR ─────────────────────────────────────────────────────── */}
        {tab==="Calculator" && <MarketCalculator watches={watches} sold={sold} netProf={netProf} netMarg={netMarg} fmtC={fmtC} pct={pct} currency={CUR.symbol}/>}

      </div>

      {wm&&isAdmin&&<WatchModal data={wm==="new"?null:wm} suppliers={suppliers} onClose={()=>setWm(null)} onSave={saveWatch}/>}
      {sm&&isAdmin&&<SupplierModal data={sm==="new"?null:sm} onClose={()=>setSm(null)} onSave={saveSupplier}/>}
      {tlm&&isAdmin&&<TimelineModal watch={tlm} onClose={()=>setTlm(null)} onSave={saveTimeline}/>}
      {drawer&&<WatchDrawer watch={drawer} suppliers={suppliers} onClose={()=>setDrawer(null)} onEdit={()=>{if(isAdmin){setWm(drawer);setDrawer(null);}}} onDuplicate={()=>{if(isAdmin){duplicateWatch(drawer);setDrawer(null);}}} onDelete={()=>{if(isAdmin){deleteWatch(drawer.id);}}}/>}
      {isAdmin&&!wm&&!sm&&!tlm&&!drawer&&(
        <div style={{ position:"fixed", bottom:16, right:20, fontSize:10, color:"#333", fontFamily:"'IBM Plex Mono',monospace", pointerEvents:"none" }}>
          Press <span style={{ color:"#555" }}>N</span> to add watch · <span style={{ color:"#555" }}>Esc</span> to close
        </div>
      )}
    </div>
  );
}
