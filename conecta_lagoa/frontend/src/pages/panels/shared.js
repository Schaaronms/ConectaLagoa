// shared.js — Paleta, helpers e componentes compartilhados entre os painéis

export const V = {
  bg:       '#f4f6fb',
  surface:  '#ffffff',
  surface2: '#f0f3fa',
  border:   '#e2e8f4',
  accent:   '#1a3a8f',
  accent2:  '#2d52c4',
  accent3:  '#e07b00',
  green:    '#10b981',
  orange:   '#e07b00',
  red:      '#ef4444',
  text:     '#1a1f36',
  muted:    '#6b7280',
  muted2:   '#9ca3af',
};

export const PILL = {
  'pill-blue':   { bg:'rgba(26,58,143,0.1)',   color:'#1a3a8f' },
  'pill-green':  { bg:'rgba(16,185,129,0.12)', color:'#10b981' },
  'pill-orange': { bg:'rgba(224,123,0,0.12)',  color:'#e07b00' },
  'pill-red':    { bg:'rgba(239,68,68,0.12)',  color:'#ef4444' },
  'pill-purple': { bg:'rgba(224,123,0,0.12)',  color:'#c96a00' },
  'pill-cyan':   { bg:'rgba(45,82,196,0.12)',  color:'#2d52c4' },
};

export const PILL_LABEL = {
  'pill-green':  'Aprovado',
  'pill-red':    'Reprovado',
  'pill-purple': 'Entrevista',
  'pill-orange': 'Triagem',
  'pill-blue':   'Triagem',
  'pill-cyan':   'Recebido',
};

export const BASE_URL = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
export const getToken = () => localStorage.getItem('token');
export const authHeader = () => ({ 'Authorization': `Bearer ${getToken()}` });

export function Pill({ cls, children, style = {} }) {
  const p = PILL[cls] || PILL['pill-blue'];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:500, background:p.bg, color:p.color, ...style }}>
      {children}
    </span>
  );
}

export function ScoreBar({ val }) {
  const color = val >= 85 ? V.green : val >= 70 ? V.orange : V.muted;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:4, background:V.border, borderRadius:2, minWidth:60 }}>
        <div style={{ width:`${val}%`, height:'100%', background:color, borderRadius:2 }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:V.muted2, minWidth:28 }}>{val}</span>
    </div>
  );
}

export function MiniAvatar({ initials, size = 20, color = V.accent }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${color},${V.accent2})`, fontSize:size*0.38, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0 }}>
      {initials}
    </div>
  );
}

export function Card({ title, sub, badge, badgeColor = 'blue', children, style = {} }) {
  const bc = badgeColor === 'green'
    ? { bg:'rgba(16,185,129,0.12)', color:V.green }
    : badgeColor === 'orange'
    ? { bg:'rgba(224,123,0,0.12)', color:V.orange }
    : { bg:'rgba(26,58,143,0.1)', color:V.accent };
  return (
    <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22, animation:'fadeUp 0.5s ease both', ...style }}>
      {(title || badge) && (
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            {title && <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:V.text }}>{title}</div>}
            {sub   && <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{sub}</div>}
          </div>
          {badge && (
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:600, background:bc.bg, color:bc.color, marginLeft:12, flexShrink:0 }}>
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function KpiCard({ icon, label, value, delta, deltaUp = true, color, delay = 0 }) {
  return (
    <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:20, position:'relative', overflow:'hidden', animation:`fadeUp 0.5s ease ${delay}s both`, transition:'all 0.3s', cursor:'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(26,58,143,0.12)'; e.currentTarget.style.borderColor = 'rgba(26,58,143,0.25)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = V.border; }}>
      <div style={{ position:'absolute', top:-30, right:-30, width:80, height:80, borderRadius:'50%', background:color, opacity:0.08, pointerEvents:'none' }}/>
      <div style={{ width:36, height:36, borderRadius:9, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:14 }}>{icon}</div>
      <div style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, lineHeight:1, color:V.text }}>{value ?? '—'}</div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:500, marginTop:8, padding:'2px 8px', borderRadius:20, background:deltaUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color:deltaUp ? V.green : V.red }}>
        {deltaUp ? '▲' : '▼'} {delta}
      </div>
    </div>
  );
}

export function Spinner({ size = 36 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, flexDirection:'column', gap:16 }}>
      <div style={{ width:size, height:size, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
      <p style={{ color:V.muted, fontSize:14 }}>Carregando...</p>
    </div>
  );
}
