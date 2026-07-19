import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import {
  ShoppingCart, Heart, Search, X, Plus, Minus, Trash2, Package,
  LogOut, BarChart3, Edit2, Trash, CheckCircle, AlertCircle,
  ChevronRight, Eye, EyeOff, ArrowLeft, Loader2
} from "lucide-react";
import * as api from "./api";

// ─── Constants ────────────────────────────────────────────────────────────────
const TAGS = ["Best Seller","New","Sale","Premium","Bestseller","Organic"];
const TAG_COLORS = {
  "Best Seller":{bg:"#FFF0E6",c:"#C24A00"},"New":{bg:"#E6F4FF",c:"#005FAD"},
  "Sale":{bg:"#FFF0F0",c:"#C00000"},"Premium":{bg:"#F3F0FF",c:"#5B35B5"},
  "Bestseller":{bg:"#F0FFF4",c:"#00703C"},"Organic":{bg:"#F0FBF0",c:"#2D7A2D"},
};
const SORT_OPTS = [
  {v:"featured",l:"Featured"},{v:"price_asc",l:"Price ↑"},
  {v:"price_desc",l:"Price ↓"},{v:"rating",l:"Top Rated"},{v:"reviews",l:"Most Reviewed"},
];
const EMOJI_OPTS = [
  "📦","🛍️","🎁","⭐","🔥","💎","🎯","🏷️","🖥️","📱","⌚","🎧","🔌","💡","🎮","📷",
  "👕","👗","👟","🧥","👜","💍","🕶️","🧢","🍳","🧹","🪴","🕯️","🛋️","☕","🧴","💄",
  "🏋️","🎾","⚽","🧘","🚴","🎒","🥤","🪢","📚","📖","📝","✨","🌹","🧼","🫧","☀️",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt      = n => (+n).toLocaleString("tr-TR") + " ₺";
const fp       = p => p.discount ? Math.round(+p.price * (1 - +p.discount / 100)) : +p.price;
const initials = n => n?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

const Spinner = ({ size = 20, color = "#E8521A" }) => (
  <Loader2 size={size} color={color} style={{ animation: "spin 1s linear infinite" }} />
);

const Stars = ({ rating }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width="10" height="10" viewBox="0 0 10 10"
           fill={i <= Math.round(+rating) ? "#F59E0B" : "#E5E7EB"}>
        <polygon points="5,1 6.2,3.8 9.5,3.8 6.9,5.8 7.9,9 5,7 2.1,9 3.1,5.8 0.5,3.8 3.8,3.8"/>
      </svg>
    ))}
    <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 2 }}>{rating}</span>
  </span>
);

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [role,    setRole]    = useState(null);
  const [mode,    setMode]    = useState("login");
  const [email,   setEmail]   = useState("");
  const [pwd,     setPwd]     = useState("");
  const [name,    setName]    = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const prefill = (e, p) => { setEmail(e); setPwd(p); setErr(""); };

  const submit = async e => {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const data = mode === "login"
        ? await api.auth.login(email, pwd)
        : await api.auth.register(email, name, pwd, role);
      onLogin(data.user, data.token);
    } catch (err) { setErr(err.message || "An error occurred."); }
    finally { setLoading(false); }
  };

  const accent = role === "seller" ? "#7C3AED" : "#E8521A";

  if (!role) return (
    <div style={{ minHeight:"100vh", background:"#0F0F14", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth:860, width:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <div style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:-2, marginBottom:12 }}>
            Vend<span style={{ color:"#E8521A" }}>oo</span>
          </div>
          <div style={{ fontSize:18, color:"rgba(255,255,255,.4)" }}>How would you like to continue?</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          {[
            { r:"customer", icon:"🛍️", title:"Continue as Buyer", sub:"Discover products, add to cart, save favorites",
              benefits:["Saved cart and favorites","Personalized experience","Easy checkout flow"],
              col:"#E8521A", gf:"#E8521A22", gt:"#E8521A08" },
            { r:"seller", icon:"🏪", title:"Continue as Seller", sub:"Manage your products, start selling",
              benefits:["Add and edit products","Stock management","Seller dashboard"],
              col:"#7C3AED", gf:"#7C3AED22", gt:"#7C3AED08" },
          ].map(({ r, icon, title, sub, benefits, col, gf, gt }) => (
            <button key={r} onClick={() => setRole(r)}
              style={{ background:`linear-gradient(135deg,${gf},${gt})`, border:`1px solid ${col}33`, borderRadius:20, padding:40, textAlign:"left", cursor:"pointer", transition:"transform .2s,box-shadow .2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 20px 40px ${col}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
              <div style={{ fontSize:52, marginBottom:20 }}>{icon}</div>
              <div style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:8 }}>{title}</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,.4)", marginBottom:24 }}>{sub}</div>
              {benefits.map(b => (
                <div key={b} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <CheckCircle size={14} color={col}/>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,.6)" }}>{b}</span>
                </div>
              ))}
              <div style={{ marginTop:28, display:"flex", alignItems:"center", gap:6, color:col, fontWeight:600, fontSize:14 }}>
                Continue <ChevronRight size={16}/>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0F0F14", display:"flex", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Left panel */}
      <div style={{ flex:"0 0 380px", background:`linear-gradient(160deg,${accent}18,transparent)`, borderRight:"1px solid rgba(255,255,255,.07)", padding:48, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:24, fontWeight:900, color:"#fff", letterSpacing:-1, marginBottom:40 }}>
            Vend<span style={{ color:accent }}>oo</span>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:2, marginBottom:14 }}>
            {role === "customer" ? "Buyer Account" : "Seller Account"}
          </div>
          <div style={{ fontSize:28, fontWeight:700, color:"#fff", lineHeight:1.25, marginBottom:14 }}>
            {role === "customer" ? "Shopping,\nmade delightful." : "Bring your products\nto the world."}
          </div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,.4)", lineHeight:1.7 }}>
            {role === "customer"
              ? "Save your cart and favorites, and pick up right where you left off."
              : "Add your products easily, manage stock and pricing, and reach customers."}
          </div>
        </div>
        <div style={{ padding:"16px 20px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12 }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>Demo Account</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginBottom:3 }}>
            📧 {role === "customer" ? "alici@demo.com" : "satici@demo.com"}
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginBottom:12 }}>🔑 Demo1234</div>
          <button onClick={() => prefill(role === "customer" ? "alici@demo.com" : "satici@demo.com", "Demo1234")}
            style={{ width:"100%", padding:"8px", background:accent, color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Fill with Demo
          </button>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:48 }}>
        <div style={{ width:"100%", maxWidth:360 }}>
          <button onClick={() => { setRole(null); setErr(""); }}
            style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:13, marginBottom:36, padding:0 }}>
            <ArrowLeft size={16}/> Back
          </button>
          <div style={{ display:"flex", background:"rgba(255,255,255,.05)", borderRadius:12, padding:4, marginBottom:30 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }}
                style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:mode===m?"rgba(255,255,255,.1)":"transparent", color:mode===m?"#fff":"rgba(255,255,255,.35)", cursor:"pointer", fontSize:14, fontWeight:mode===m?600:400, transition:"all .2s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            {mode === "register" && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, color:"rgba(255,255,255,.4)", display:"block", marginBottom:5 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required
                  style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
              </div>
            )}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, color:"rgba(255,255,255,.4)", display:"block", marginBottom:5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div style={{ marginBottom:26 }}>
              <label style={{ fontSize:13, color:"rgba(255,255,255,.4)", display:"block", marginBottom:5 }}>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPwd?"text":"password"} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" required
                  style={{ width:"100%", padding:"11px 42px 11px 14px", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.3)", display:"flex" }}>
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            {err && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                <AlertCircle size={15} color="#DC2626"/>
                <span style={{ fontSize:13, color:"#DC2626" }}>{err}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"13px", background:loading?"rgba(255,255,255,.1)":accent, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {loading ? <><Spinner size={18} color="#fff"/> Please wait...</> : mode==="login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
const ProductCard = memo(({ p, cartQty, isFav, added, onAdd, onToggleFav, favLoading }) => {
  const price = fp(p), outOfStock = p.stock === 0, lowStock = p.stock > 0 && p.stock <= 5;
  return (
    <div style={{ background:"#fff", borderRadius:16, border:p.seller_id?"1.5px solid #7C3AED22":"1px solid #F0EDE6", overflow:"hidden", transition:"transform .2s,box-shadow .2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
      <div style={{ background:"#F8F7F4", height:160, display:"flex", alignItems:"center", justifyContent:"center", fontSize:64, position:"relative" }}>
        {p.discount > 0 && <div style={{ position:"absolute", top:10, left:10, background:"#E8521A", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20 }}>-%{p.discount}</div>}
        {p.seller_id && !p.discount && <div style={{ position:"absolute", top:10, left:10, background:"#7C3AED", color:"#fff", fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:20 }}>SELLER PRODUCT</div>}
        {outOfStock && <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,.65)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:12, fontWeight:700, color:"#9CA3AF", background:"#fff", padding:"4px 10px", borderRadius:20, border:"1px solid #E5E7EB" }}>Out of Stock</span></div>}
        <span style={{ opacity:outOfStock?.4:1 }}>{p.emoji}</span>
        <button onClick={() => onToggleFav(p.id)} disabled={favLoading} aria-label={isFav?"Remove from favorites":"Add to favorites"}
          style={{ position:"absolute", top:10, right:10, background:"rgba(255,255,255,.9)", border:"none", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:favLoading?"wait":"pointer", color:isFav?"#E8521A":"#9CA3AF" }}>
          {favLoading ? <Spinner size={14}/> : <Heart size={16} fill={isFav?"#E8521A":"none"} strokeWidth={2}/>}
        </button>
      </div>
      <div style={{ padding:14 }}>
        {p.tag && <div style={{ ...TAG_COLORS[p.tag], fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:20, display:"inline-block", marginBottom:6 }}>{p.tag}</div>}
        <div style={{ fontSize:14, fontWeight:600, marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
        <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>{p.category_name}</div>
        <div style={{ marginBottom:10 }}>
          <Stars rating={p.rating}/>
          <span style={{ fontSize:11, color:"#9CA3AF", marginLeft:4 }}>({(+p.review_count || 0).toLocaleString("tr-TR")})</span>
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:10 }}>
          <span style={{ fontSize:18, fontWeight:700 }}>{fmt(price)}</span>
          {p.discount > 0 && <span style={{ fontSize:13, color:"#9CA3AF", textDecoration:"line-through" }}>{fmt(+p.price)}</span>}
        </div>
        {lowStock && <div style={{ fontSize:11, color:"#C24A00", fontWeight:600, marginBottom:6 }}>⚡ Only {p.stock} left!</div>}
        <button onClick={() => !outOfStock && onAdd(p.id)} disabled={outOfStock || added}
          style={{ width:"100%", padding:"9px", borderRadius:10, border:"none", background:outOfStock?"#E5E7EB":added?"#16A34A":"#E8521A", color:outOfStock?"#9CA3AF":"#fff", fontSize:13, fontWeight:600, cursor:outOfStock?"not-allowed":"pointer", transition:"background .25s", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          {outOfStock ? "Out of Stock" : added ? "✓ Added" : <><Plus size={14}/>Add to Cart</>}
        </button>
        {cartQty > 0 && <div style={{ textAlign:"center", fontSize:11, color:"#6B7280", marginTop:5 }}>In cart: {cartQty}</div>}
      </div>
    </div>
  );
});

const CartDrawer = memo(({ items, total, count, onUpdate, onRemove, onClear, onClose, loading }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200, display:"flex", justifyContent:"flex-end" }}
    onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="My Cart">
    <div style={{ background:"#fff", width:380, maxWidth:"90vw", height:"100%", display:"flex", flexDirection:"column", boxShadow:"-4px 0 32px rgba(0,0,0,.12)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 16px", borderBottom:"1px solid #F0EDE6" }}>
        <h2 style={{ fontSize:18, fontWeight:700, margin:0 }}>🛒 My Cart ({count})</h2>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#6B7280", display:"flex" }}><X size={20}/></button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 0" }}>
        {loading
          ? <div style={{ display:"flex", justifyContent:"center", padding:48 }}><Spinner size={32}/></div>
          : items.length === 0
            ? <div style={{ textAlign:"center", padding:"48px 24px", color:"#9CA3AF" }}><Package size={48} style={{ margin:"0 auto 12px", display:"block" }}/><p>Your cart is empty</p></div>
            : items.map(item => (
              <div key={item.id} style={{ display:"flex", gap:12, padding:"12px 20px", alignItems:"center" }}>
                <div style={{ fontSize:32, minWidth:48, height:48, background:"#F8F7F4", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>{item.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{item.name}</div>
                  <div style={{ fontSize:13, color:"#E8521A", fontWeight:700 }}>{fmt(fp(item))}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
                    <button onClick={() => onUpdate(item.id, item.product_id, item.quantity - 1)} style={{ width:24, height:24, borderRadius:6, border:"1px solid #E8E4DC", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Minus size={12}/></button>
                    <span style={{ fontSize:14, fontWeight:600, minWidth:20, textAlign:"center" }}>{item.quantity}</span>
                    <button onClick={() => onUpdate(item.id, item.product_id, item.quantity + 1)} style={{ width:24, height:24, borderRadius:6, border:"1px solid #E8E4DC", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Plus size={12}/></button>
                    <button onClick={() => onRemove(item.id)} style={{ width:24, height:24, borderRadius:6, border:"1px solid #FCA5A5", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#EF4444", marginLeft:"auto" }}><Trash2 size={12}/></button>
                  </div>
                </div>
              </div>
            ))
        }
      </div>
      {!loading && items.length > 0 && (
        <div style={{ padding:"16px 20px", borderTop:"1px solid #F0EDE6", background:"#F8F7F4" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12, fontSize:15 }}>
            <span style={{ color:"#6B7280" }}>Total</span>
            <span style={{ fontWeight:800, fontSize:18 }}>{fmt(total)}</span>
          </div>
          <button style={{ width:"100%", padding:13, background:"#E8521A", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:8 }}>Proceed to Checkout →</button>
          <button onClick={onClear} style={{ width:"100%", padding:8, background:"none", border:"1px solid #E8E4DC", borderRadius:10, fontSize:13, color:"#9CA3AF", cursor:"pointer" }}>Clear Cart</button>
        </div>
      )}
    </div>
  </div>
));

const FavDrawer = memo(({ items, onAddToCart, onRemoveFav, onClose }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:200, display:"flex", justifyContent:"flex-end" }}
    onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
    <div style={{ background:"#fff", width:380, maxWidth:"90vw", height:"100%", display:"flex", flexDirection:"column", boxShadow:"-4px 0 32px rgba(0,0,0,.12)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 16px", borderBottom:"1px solid #F0EDE6" }}>
        <h2 style={{ fontSize:18, fontWeight:700, margin:0 }}>❤️ My Favorites ({items.length})</h2>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#6B7280", display:"flex" }}><X size={20}/></button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 0" }}>
        {items.length === 0
          ? <div style={{ textAlign:"center", padding:"48px 24px", color:"#9CA3AF" }}><Heart size={48} style={{ margin:"0 auto 12px", display:"block" }}/><p>You have no favorite products</p></div>
          : items.map(p => (
            <div key={p.id} style={{ display:"flex", gap:12, padding:"12px 20px", alignItems:"center" }}>
              <div style={{ fontSize:32, minWidth:48, height:48, background:"#F8F7F4", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>{p.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{p.name}</div>
                <div style={{ fontSize:13, color:"#E8521A", fontWeight:700, marginBottom:6 }}>{fmt(fp(p))}</div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => onAddToCart(p.id)} disabled={p.stock === 0}
                    style={{ padding:"5px 12px", background:p.stock===0?"#E5E7EB":"#E8521A", color:p.stock===0?"#9CA3AF":"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:p.stock===0?"not-allowed":"pointer" }}>
                    {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <button onClick={() => onRemoveFav(p.id)} style={{ padding:"5px 12px", background:"none", color:"#9CA3AF", border:"1px solid #E8E4DC", borderRadius:8, fontSize:12, cursor:"pointer" }}>Remove</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  </div>
));

// ─── CUSTOMER APP ─────────────────────────────────────────────────────────────
function CustomerApp({ user, token, onLogout }) {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [cartItems,   setCartItems]   = useState([]);
  const [favItems,    setFavItems]    = useState([]);
  const [cat,         setCat]         = useState("All");
  const [search,      setSearch]      = useState("");
  const [dbSearch,    setDbSearch]    = useState("");
  const [sort,        setSort]        = useState("featured");
  const [cartOpen,    setCartOpen]    = useState(false);
  const [favOpen,     setFavOpen]     = useState(false);
  const [addedMap,    setAddedMap]    = useState({});
  const [favLoading,  setFavLoading]  = useState({});
  const [cartLoading, setCartLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const timerRef = useRef({});

  useEffect(() => {
    (async () => {
      try {
        const [pd, cd, cartData, favsData] = await Promise.all([
          api.products.list({ limit: 100 }),
          api.categories.list(),
          api.cart.get(token),
          api.favorites.get(token),
        ]);
        setProducts(pd.data || []);
        setCategories(cd || []);
        setCartItems(cartData.items || []);
        setFavItems(favsData.data || []);
      } catch (e) { console.error(e); }
      finally { setInitLoading(false); }
    })();
    return () => Object.values(timerRef.current).forEach(clearTimeout);
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => setDbSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refreshCart = useCallback(async () => {
    setCartLoading(true);
    try { const d = await api.cart.get(token); setCartItems(d.items || []); }
    catch (e) { console.error(e); }
    finally { setCartLoading(false); }
  }, [token]);

  const filtered = useMemo(() => {
    let list = products;
    if (cat !== "All") list = list.filter(p => p.category_name === cat);
    if (dbSearch.trim()) {
      const q = dbSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    switch (sort) {
      case "price_asc":  return [...list].sort((a, b) => fp(a) - fp(b));
      case "price_desc": return [...list].sort((a, b) => fp(b) - fp(a));
      case "rating":     return [...list].sort((a, b) => +b.rating - +a.rating);
      case "reviews":    return [...list].sort((a, b) => +b.review_count - +a.review_count);
      default: return list;
    }
  }, [products, cat, dbSearch, sort]);

  const cartMap   = useMemo(() => Object.fromEntries(cartItems.map(i => [i.product_id, i.quantity])), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + fp(i) * i.quantity, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);
  const favIds    = useMemo(() => new Set(favItems.map(p => p.id)), [favItems]);
  const allCats   = useMemo(() => ["All", ...categories.map(c => c.name)], [categories]);

  const addToCart = useCallback(async pid => {
    setAddedMap(m => ({ ...m, [pid]: true }));
    clearTimeout(timerRef.current[pid]);
    timerRef.current[pid] = setTimeout(() => setAddedMap(m => ({ ...m, [pid]: false })), 1400);
    try { await api.cart.add(pid, 1, token); await refreshCart(); }
    catch (e) { console.error(e); }
  }, [token, refreshCart]);

  const updateCartItem = useCallback(async (itemId, productId, qty) => {
    try {
      if (qty < 1) await api.cart.remove(itemId, token);
      else         await api.cart.update(itemId, qty, token);
      await refreshCart();
    } catch (e) { console.error(e); }
  }, [token, refreshCart]);

  const removeCartItem = useCallback(async itemId => {
    try { await api.cart.remove(itemId, token); await refreshCart(); }
    catch (e) { console.error(e); }
  }, [token, refreshCart]);

  const clearCart = useCallback(async () => {
    try { await api.cart.clear(token); setCartItems([]); }
    catch (e) { console.error(e); }
  }, [token]);

  const toggleFav = useCallback(async pid => {
    setFavLoading(f => ({ ...f, [pid]: true }));
    try {
      if (favIds.has(pid)) {
        await api.favorites.remove(pid, token);
        setFavItems(f => f.filter(p => p.id !== pid));
      } else {
        await api.favorites.add(pid, token);
        const prod = products.find(p => p.id === pid);
        if (prod) setFavItems(f => [...f, prod]);
      }
    } catch (e) { console.error(e); }
    finally { setFavLoading(f => ({ ...f, [pid]: false })); }
  }, [token, favIds, products]);

  const addFromFav = useCallback(pid => { addToCart(pid); setFavOpen(false); setCartOpen(true); }, [addToCart]);

  const ICONS = { "All":"🛍️","Electronics":"💻","Clothing":"👕","Home & Living":"🏠","Sports":"⚽","Books":"📚","Beauty":"✨" };

  if (initLoading) return (
    <div style={{ minHeight:"100vh", background:"#F8F7F4", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Spinner size={40}/>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#F8F7F4", minHeight:"100vh", color:"#1A1A1A" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <header style={{ background:"#fff", borderBottom:"1px solid #E8E4DC", position:"sticky", top:0, zIndex:100, padding:"0 24px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", gap:16, height:64 }}>
          <span style={{ fontSize:22, fontWeight:900, letterSpacing:-1, whiteSpace:"nowrap" }}>Vend<span style={{ color:"#E8521A" }}>oo</span></span>
          <div style={{ flex:1, maxWidth:520, position:"relative" }}>
            <Search size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF", pointerEvents:"none" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              style={{ width:"100%", padding:"10px 16px 10px 40px", border:"1.5px solid #E8E4DC", borderRadius:12, fontSize:14, background:"#F8F7F4", outline:"none", boxSizing:"border-box" }}/>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 14px", background:"#F8F7F4", borderRadius:10, border:"1px solid #E8E4DC" }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:"#E8521A", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700 }}>{initials(user.name)}</div>
              <span style={{ fontSize:13, fontWeight:600, maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name.split(" ")[0]}</span>
            </div>
            <button onClick={() => { setFavOpen(true); setCartOpen(false); }}
              style={{ display:"flex", alignItems:"center", padding:"8px 14px", borderRadius:10, border:"1.5px solid #E8E4DC", background:"#fff", cursor:"pointer", position:"relative" }}>
              <Heart size={18} fill={favItems.length?"#E8521A":"none"} color={favItems.length?"#E8521A":"#1A1A1A"}/>
              {favItems.length > 0 && <span style={{ position:"absolute", top:-6, right:-6, background:"#E8521A", color:"#fff", borderRadius:"50%", fontSize:10, fontWeight:700, width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center" }}>{favItems.length}</span>}
            </button>
            <button onClick={() => { setCartOpen(true); setFavOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10, border:"1.5px solid #E8E4DC", background:"#fff", cursor:"pointer", fontSize:14, fontWeight:500, position:"relative" }}>
              <ShoppingCart size={18}/> Cart
              {cartCount > 0 && <span style={{ position:"absolute", top:-6, right:-6, background:"#E8521A", color:"#fff", borderRadius:"50%", fontSize:10, fontWeight:700, width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center" }}>{cartCount}</span>}
            </button>
            <button onClick={onLogout} title="Log Out"
              style={{ display:"flex", padding:"8px", borderRadius:10, border:"1.5px solid #E8E4DC", background:"#fff", cursor:"pointer", color:"#9CA3AF" }}><LogOut size={18}/></button>
          </div>
        </div>
      </header>

      <div style={{ background:"#fff", borderBottom:"1px solid #E8E4DC", padding:"0 24px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", gap:4, overflowX:"auto", padding:"8px 0" }}>
          {allCats.map(c => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:20, border:"1.5px solid "+(cat===c?"#E8521A":"#E8E4DC"), background:cat===c?"#FFF0E6":"transparent", color:cat===c?"#E8521A":"#4B5563", fontSize:13, fontWeight:cat===c?600:400, cursor:"pointer", whiteSpace:"nowrap" }}>
              <span>{ICONS[c] || "📦"}</span><span>{c}</span>
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth:1280, margin:"0 auto", padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <span style={{ fontSize:14, color:"#6B7280" }}><strong style={{ color:"#1A1A1A" }}>{filtered.length}</strong> products</span>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ padding:"8px 12px", border:"1.5px solid #E8E4DC", borderRadius:8, fontSize:13, background:"#fff", cursor:"pointer", outline:"none" }}>
            {SORT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:16 }}>
          {filtered.length === 0
            ? <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"64px 24px", color:"#9CA3AF" }}><Package size={48} style={{ margin:"0 auto 12px", display:"block" }}/><p>No products found</p></div>
            : filtered.map(p => (
              <ProductCard key={p.id} p={p} cartQty={cartMap[p.id]||0} isFav={favIds.has(p.id)}
                added={!!addedMap[p.id]} onAdd={addToCart} onToggleFav={toggleFav} favLoading={!!favLoading[p.id]}/>
            ))
          }
        </div>
      </main>

      {cartOpen && <CartDrawer items={cartItems} total={cartTotal} count={cartCount} onUpdate={updateCartItem} onRemove={removeCartItem} onClear={clearCart} onClose={() => setCartOpen(false)} loading={cartLoading}/>}
      {favOpen  && <FavDrawer items={favItems} onAddToCart={addFromFav} onRemoveFav={toggleFav} onClose={() => setFavOpen(false)}/>}
    </div>
  );
}

// ─── SELLER APP ───────────────────────────────────────────────────────────────
const EMPTY_FORM = { name:"", categoryId:"", price:"", discount:"0", stock:"", emoji:"📦", tag:"", description:"" };

function SellerApp({ user, token, onLogout }) {
  const [view,       setView]       = useState("dashboard");
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [editId,     setEditId]     = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState("");
  const [saved,      setSaved]      = useState(false);
  const [del,        setDel]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pd, cd] = await Promise.all([
          api.products.list({ sellerId: user.id, limit: 100 }),
          api.categories.list(),
        ]);
        setProducts(pd.data || []);
        setCategories(cd || []);
        if (cd?.length) setForm(f => ({ ...f, categoryId: String(cd[0].id) }));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user.id]);

  const refresh = useCallback(async () => {
    const d = await api.products.list({ sellerId: user.id, limit: 100 });
    setProducts(d.data || []);
  }, [user.id]);

  const submitForm = useCallback(async e => {
    e.preventDefault(); setFormErr(""); setSubmitting(true);
    try {
      const payload = { name:form.name.trim(), categoryId:+form.categoryId, price:+form.price, discount:+form.discount||0, stock:+form.stock, emoji:form.emoji, tag:form.tag||null, description:form.description };
      if (editId) await api.products.update(editId, payload, token);
      else        await api.products.create(payload, token);
      await refresh();
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      setForm({ ...EMPTY_FORM, categoryId: form.categoryId });
      setEditId(null); setView("products");
    } catch (e) { setFormErr(e.message || "An error occurred."); }
    finally { setSubmitting(false); }
  }, [form, editId, token, refresh]);

  const startEdit = useCallback(p => {
    setForm({ name:p.name, categoryId:String(p.category_id), price:String(p.price), discount:String(p.discount||0), stock:String(p.stock), emoji:p.emoji||"📦", tag:p.tag||"", description:p.description||"" });
    setEditId(p.id); setView("form");
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!del) return;
    try { await api.products.remove(del, token); await refresh(); setDel(null); }
    catch (e) { console.error(e); }
  }, [del, token, refresh]);

  const totalValue  = products.reduce((s, p) => s + (+p.price) * (+p.stock), 0);
  const activeCount = products.filter(p => +p.stock > 0).length;
  const fi = field => ({
    value: form[field],
    onChange: e => setForm(prev => ({ ...prev, [field]: e.target.value })),
    style: { width:"100%", padding:"10px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff" },
  });

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><Spinner size={40}/>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#F3F4F6" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <aside style={{ width:240, background:"#1F2937", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:50 }}>
        <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:-1, marginBottom:16 }}>Vend<span style={{ color:"#7C3AED" }}>oo</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"#7C3AED", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13, fontWeight:700 }}>{initials(user.name)}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{user.name}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>Seller</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"16px 12px" }}>
          {[
            { id:"dashboard", icon:<BarChart3 size={18}/>, label:"Dashboard" },
            { id:"products",  icon:<Package size={18}/>,   label:`My Products (${products.length})` },
            { id:"form",      icon:<Plus size={18}/>,       label:"New Product" },
          ].map(({ id, icon, label }) => (
            <button key={id} onClick={() => { if (id === "form") { setForm({ ...EMPTY_FORM, categoryId: categories[0]?String(categories[0].id):"" }); setEditId(null); } setView(id); }}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:"none", background:view===id?"rgba(124,58,237,.25)":"transparent", color:view===id?"#A78BFA":"rgba(255,255,255,.5)", cursor:"pointer", marginBottom:4, fontSize:14, textAlign:"left" }}>
              {icon}{label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"16px 12px", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <button onClick={onLogout} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:"none", background:"transparent", color:"rgba(255,255,255,.35)", cursor:"pointer", fontSize:14 }}>
            <LogOut size={18}/> Log Out
          </button>
        </div>
      </aside>

      <main style={{ marginLeft:240, flex:1, padding:32, overflowY:"auto" }}>

        {/* Dashboard */}
        {view === "dashboard" && (
          <div>
            <h1 style={{ fontSize:26, fontWeight:700, marginBottom:6 }}>Hello, {user.name.split(" ")[0]} 👋</h1>
            <p style={{ color:"#6B7280", marginBottom:28 }}>Seller dashboard</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:32 }}>
              {[
                { icon:"📦", label:"Total Products", value:products.length, sub:"listed",       color:"#7C3AED" },
                { icon:"✅", label:"Active Products", value:activeCount,     sub:"in stock",     color:"#10B981" },
                { icon:"💰", label:"Total Value",     value:fmt(totalValue), sub:"stock × price", color:"#F59E0B" },
              ].map(({ icon, label, value, sub, color }) => (
                <div key={label} style={{ background:"#fff", borderRadius:16, padding:24, border:"1px solid #E5E7EB" }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>{icon}</div>
                  <div style={{ fontSize:11, color:"#6B7280", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:28, fontWeight:700, color, marginBottom:2 }}>{value}</div>
                  <div style={{ fontSize:12, color:"#9CA3AF" }}>{sub}</div>
                </div>
              ))}
            </div>
            {products.length > 0 ? (
              <div>
                <h2 style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>Recently Added</h2>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
                  {products.slice(-4).reverse().map(p => (
                    <div key={p.id} style={{ background:"#fff", borderRadius:14, padding:16, border:"1px solid #E5E7EB", display:"flex", gap:12, alignItems:"center" }}>
                      <div style={{ fontSize:36, width:52, height:52, background:"#F3F4F6", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{p.emoji}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                        <div style={{ fontSize:12, color:"#6B7280", marginTop:2 }}>{fmt(+p.price)}</div>
                        <div style={{ fontSize:11, color:+p.stock>0?"#10B981":"#EF4444", marginTop:2 }}>Stock: {p.stock}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background:"#fff", borderRadius:16, padding:48, textAlign:"center", border:"1px solid #E5E7EB" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
                <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>You haven't added any products yet</div>
                <button onClick={() => { setForm({ ...EMPTY_FORM, categoryId:categories[0]?String(categories[0].id):"" }); setEditId(null); setView("form"); }}
                  style={{ padding:"12px 24px", background:"#7C3AED", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", marginTop:8 }}>
                  + Add Your First Product
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Products */}
        {view === "products" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <h1 style={{ fontSize:24, fontWeight:700 }}>My Products</h1>
              <button onClick={() => { setForm({ ...EMPTY_FORM, categoryId:categories[0]?String(categories[0].id):"" }); setEditId(null); setView("form"); }}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:"#7C3AED", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>
                <Plus size={16}/> New Product
              </button>
            </div>
            {products.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:16, padding:48, textAlign:"center", border:"1px solid #E5E7EB", color:"#9CA3AF" }}><Package size={48} style={{ margin:"0 auto 12px", display:"block" }}/><p>No products yet</p></div>
            ) : (
              <div style={{ background:"#fff", borderRadius:16, border:"1px solid #E5E7EB", overflow:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead style={{ background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                    <tr>{["Product","Category","Price","Discount","Stock","Tag","Actions"].map(h => (
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} style={{ borderBottom:"1px solid #F3F4F6" }}>
                        <td style={{ padding:"14px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:28 }}>{p.emoji}</span>
                            <div>
                              <div style={{ fontSize:14, fontWeight:500 }}>{p.name}</div>
                              {p.description && <div style={{ fontSize:12, color:"#9CA3AF", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"14px 16px", fontSize:13, color:"#6B7280", whiteSpace:"nowrap" }}>{p.category_name}</td>
                        <td style={{ padding:"14px 16px", fontSize:14, fontWeight:600, whiteSpace:"nowrap" }}>{fmt(+p.price)}</td>
                        <td style={{ padding:"14px 16px", fontSize:13 }}>{+p.discount>0?<span style={{ color:"#E8521A", fontWeight:600 }}>%{p.discount}</span>:"—"}</td>
                        <td style={{ padding:"14px 16px" }}>
                          <span style={{ fontSize:13, fontWeight:600, color:+p.stock===0?"#EF4444":+p.stock<=5?"#F59E0B":"#10B981" }}>
                            {+p.stock === 0 ? "Out of Stock" : p.stock}
                          </span>
                        </td>
                        <td style={{ padding:"14px 16px" }}>
                          {p.tag ? <span style={{ ...TAG_COLORS[p.tag], fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:20 }}>{p.tag}</span> : "—"}
                        </td>
                        <td style={{ padding:"14px 16px" }}>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => startEdit(p)}
                              style={{ padding:"6px 12px", background:"#EEF2FF", color:"#7C3AED", border:"none", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:500 }}>
                              <Edit2 size={13}/> Edit
                            </button>
                            <button onClick={() => setDel(p.id)}
                              style={{ padding:"6px 10px", background:"#FEF2F2", color:"#EF4444", border:"none", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", fontSize:12 }}>
                              <Trash size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {view === "form" && (
          <div style={{ maxWidth:700 }}>
            <h1 style={{ fontSize:24, fontWeight:700, marginBottom:24 }}>{editId ? "Edit Product" : "Add New Product"}</h1>
            {saved && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
                <CheckCircle size={16} color="#16A34A"/>
                <span style={{ fontSize:14, color:"#16A34A", fontWeight:500 }}>Saved!</span>
              </div>
            )}
            <form onSubmit={submitForm}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Product Name *</label>
                  <input {...fi("name")} placeholder="Product name" required/>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Category</label>
                  <select {...fi("categoryId")} style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:14, outline:"none", background:"#fff" }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Tag</label>
                  <select {...fi("tag")} style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:14, outline:"none", background:"#fff" }}>
                    <option value="">No tag</option>
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Price (₺) *</label>
                  <input {...fi("price")} type="number" min="0" step="0.01" placeholder="0.00" required/>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Discount (%)</label>
                  <input {...fi("discount")} type="number" min="0" max="100" placeholder="0"/>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Stock *</label>
                  <input {...fi("stock")} type="number" min="0" placeholder="0" required/>
                </div>
                {+form.discount > 0 && (
                  <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#92400E" }}>
                    💡 Discounted price: <strong>{fmt(Math.round(+form.price*(1-+form.discount/100)))}</strong>{" "}
                    <span style={{ textDecoration:"line-through", color:"#9CA3AF" }}>{fmt(+form.price)}</span>
                  </div>
                )}
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:8 }}>Choose Emoji</label>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", padding:12, border:"1.5px solid #E5E7EB", borderRadius:10, background:"#fff" }}>
                    {EMOJI_OPTS.map(em => (
                      <button key={em} type="button" onClick={() => setForm(f => ({ ...f, emoji: em }))}
                        style={{ fontSize:22, padding:4, border:"2px solid "+(form.emoji===em?"#7C3AED":"transparent"), borderRadius:8, background:form.emoji===em?"#EEF2FF":"transparent", cursor:"pointer" }}>
                        {em}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize:13, color:"#6B7280", marginTop:8 }}>Selected: <span style={{ fontSize:26 }}>{form.emoji}</span></div>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Description</label>
                  <textarea {...fi("description")} rows={3} placeholder="Short description..."
                    style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:14, outline:"none", resize:"vertical", fontFamily:"inherit", boxSizing:"border-box" }}/>
                </div>
              </div>
              {formErr && (
                <div style={{ display:"flex", alignItems:"center", gap:8, background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                  <AlertCircle size={16} color="#DC2626"/><span style={{ fontSize:13, color:"#DC2626" }}>{formErr}</span>
                </div>
              )}
              <div style={{ display:"flex", gap:12 }}>
                <button type="submit" disabled={submitting}
                  style={{ flex:1, padding:"13px", background:submitting?"#9CA3AF":"#7C3AED", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:submitting?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {submitting ? <><Spinner size={18} color="#fff"/> Saving...</> : editId ? "Save Changes" : "Publish Product 🚀"}
                </button>
                <button type="button" onClick={() => { setForm(EMPTY_FORM); setEditId(null); setView("products"); }}
                  style={{ padding:"13px 24px", background:"#F3F4F6", color:"#4B5563", border:"none", borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </main>

      {del && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e => e.target === e.currentTarget && setDel(null)}>
          <div style={{ background:"#fff", borderRadius:20, padding:32, maxWidth:360, width:"90%", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🗑️</div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Delete this product?</div>
            <div style={{ fontSize:14, color:"#6B7280", marginBottom:24 }}><strong>{products.find(p => p.id === del)?.name}</strong> will be removed.</div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => setDel(null)} style={{ flex:1, padding:"11px", background:"#F3F4F6", color:"#4B5563", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex:1, padding:"11px", background:"#EF4444", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);

  useEffect(() => {
    const t = sessionStorage.getItem("pz_token");
    const u = sessionStorage.getItem("pz_user");
    if (t && u) {
      try { setToken(t); setUser(JSON.parse(u)); } catch {}
    }
    setLoading(false);
  }, []);

  const handleLogin = useCallback((u, t) => {
    setUser(u); setToken(t);
    sessionStorage.setItem("pz_token", t);
    sessionStorage.setItem("pz_user", JSON.stringify(u));
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null); setToken(null);
    sessionStorage.removeItem("pz_token");
    sessionStorage.removeItem("pz_user");
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0F0F14", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, fontWeight:900, color:"#fff", letterSpacing:-2, marginBottom:16 }}>Vend<span style={{ color:"#E8521A" }}>oo</span></div>
        <Spinner size={28} color="rgba(255,255,255,.35)"/>
      </div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={handleLogin}/>;
  return user.role === "seller"
    ? <SellerApp  user={user} token={token} onLogout={handleLogout}/>
    : <CustomerApp user={user} token={token} onLogout={handleLogout}/>;
}
