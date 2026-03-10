// PanelTalent.jsx — Conecta Lagoa
import { useState, useEffect } from 'react';

const V = {
  bg:'#f4f6fb', surface:'#ffffff', surface2:'#f0f3fa', border:'#e2e8f4',
  accent:'#1a3a8f', accent2:'#2d52c4', accent3:'#e07b00',
  green:'#10b981', orange:'#e07b00', red:'#ef4444',
  text:'#1a1f36', muted:'#6b7280', muted2:'#9ca3af',
};

const TALENTS_INIT = [
  { id:1,  name:'Ana Lima',       role:'Dev Sênior Backend',  city:'São Paulo',      area:'Tecnologia', tags:['Node.js','AWS','Python'],         fav:true,  score:92, color:V.accent  },
  { id:2,  name:'Carlos Mota',    role:'UX Designer Sênior',  city:'Rio de Janeiro', area:'Design',     tags:['Figma','Prototyping','Research'], fav:false, score:85, color:V.accent3 },
  { id:3,  name:'Sofia Ramos',    role:'Dev Frontend',         city:'Curitiba',       area:'Tecnologia', tags:['React','TypeScript','CSS'],       fav:true,  score:94, color:V.accent2 },
  { id:4,  name:'Juliana Rocha',  role:'Product Manager',      city:'Belo Horizonte', area:'Produto',    tags:['Agile','OKRs','Analytics'],      fav:false, score:78, color:'#c96a00'  },
  { id:5,  name:'Rafael Souza',   role:'Dev Backend',          city:'Porto Alegre',   area:'Tecnologia', tags:['Java','Spring','Docker'],         fav:true,  score:91, color:V.green   },
  { id:6,  name:'Fernanda Costa', role:'Data Analyst',         city:'Florianópolis',  area:'Data',       tags:['SQL','Python','Tableau'],         fav:false, score:67, color:V.red     },
];

function ModalConvidar({ talent, onClose }) {
  const [msg, setMsg]         = useState(`Olá ${talent?.name?.split(' ')[0]}, temos uma oportunidade alinhada ao seu perfil. Podemos conversar?`);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const enviar = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
      await fetch(`${BASE}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ destinatario_id: talent.id, conteudo: msg }),
      });
      setSent(true);
      setTimeout(onClose, 1600);
    } catch { setSending(false); }
  };

  if (!talent) return null;
  const initials = talent.name.split(' ').map(n=>n[0]).join('').slice(0,2);
  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:420, maxWidth:'95vw' }}>
        {sent ? (
          <div style={{ textAlign:'center', padding:'16px 0' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
            <div style={{ fontWeight:700, fontSize:15, color:V.text }}>Convite enviado!</div>
            <div style={{ fontSize:12, color:V.muted, marginTop:4 }}>{talent.name} receberá sua mensagem no dashboard.</div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:44, height:44, borderRadius:11, background:`${talent.color}22`, color:talent.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700 }}>{initials}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:V.text }}>{talent.name}</div>
                <div style={{ fontSize:12, color:V.muted }}>{talent.role} · {talent.city}</div>
              </div>
            </div>
            <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:8 }}>Mensagem</label>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4}
              style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'10px 12px', color:V.text, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }}
              onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
              <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
              <button onClick={enviar} disabled={sending}
                style={{ background:V.accent, border:'none', color:'white', padding:'9px 20px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                {sending ? 'Enviando...' : '📨 Enviar Convite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PanelTalent() {
  const [talents, setTalents]       = useState(TALENTS_INIT);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState('');
  const [filterArea, setFilterArea] = useState('Todos');
  const [sortBy, setSortBy]         = useState('score');
  const [scoreMin, setScoreMin]     = useState(0);
  const [convidar, setConvidar]     = useState(null);

  const BASE  = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE}/talentos`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data ?? []);
        if (list.length > 0) setTalents(list.map(t => ({
          id:    t.id,
          name:  t.nome || t.name,
          role:  t.cargo || t.role || 'Candidato',
          city:  t.cidade || t.city || '—',
          area:  t.area   || 'Outros',
          tags:  Array.isArray(t.habilidades) ? t.habilidades : (t.tags || []),
          fav:   t.favorito ?? t.fav ?? false,
          score: t.score_ia ?? t.score ?? 70,
          color: [V.accent,V.accent2,V.accent3,V.green,'#c96a00','#7c3aed'][(t.nome||t.name||'').charCodeAt(0)%6],
          favAt: t.fav_at || null,
        })));
      } catch { /* mantém mocks */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const toggleFav = async (id) => {
    const t = talents.find(t => t.id === id);
    const novoFav = !t.fav;
    setTalents(prev => prev.map(t => t.id === id ? { ...t, fav: novoFav, favAt: novoFav ? new Date().toISOString() : null } : t));
    try {
      await fetch(`${BASE}/talentos/${id}/favorito`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ favorito: novoFav }),
      });
    } catch { }
  };

  const displayed = talents
    .filter(t => {
      const q = query.toLowerCase();
      const matchQ = !q || (t.name+t.role+t.city+(t.tags||[]).join(' ')).toLowerCase().includes(q);
      const matchA = filterArea==='Todos' ? true : filterArea==='Favoritos' ? t.fav : t.area===filterArea;
      return matchQ && matchA && t.score >= scoreMin;
    })
    .sort((a,b) => {
      if (sortBy==='score')     return b.score - a.score;
      if (sortBy==='nome')      return a.name.localeCompare(b.name);
      if (sortBy==='favoritos') return (b.fav?1:0) - (a.fav?1:0);
      if (sortBy==='recente')   return new Date(b.favAt||0) - new Date(a.favAt||0);
      return 0;
    });

  const favCount = talents.filter(t=>t.fav).length;
  const sel = { padding:'7px 12px', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, color:V.text, fontSize:12, outline:'none', cursor:'pointer' };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:V.text }}>Banco de Talentos</div>
          <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{talents.length} cadastrados · {favCount} favoritos · {displayed.length} exibidos</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:V.muted }}>Ordenar:</span>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={sel}>
            <option value="score">Maior Score</option>
            <option value="nome">Nome A–Z</option>
            <option value="favoritos">Favoritos primeiro</option>
            <option value="recente">Favoritado recentemente</option>
          </select>
        </div>
      </div>

      <input value={query} onChange={e=>setQuery(e.target.value)}
        placeholder="🔍  Buscar por nome, cargo, cidade, habilidade..."
        style={{ width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:10, padding:'10px 16px', color:V.text, fontSize:13, outline:'none', marginBottom:14 }}
        onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {['Todos','Tecnologia','Design','Produto','Data','Favoritos'].map(f => (
          <button key={f} onClick={()=>setFilterArea(f)}
            style={{ padding:'6px 14px', borderRadius:20, fontSize:11, fontWeight:500, cursor:'pointer',
              border:`1px solid ${filterArea===f?V.accent:V.border}`,
              background: filterArea===f ? V.accent : 'none',
              color: filterArea===f ? 'white' : V.muted2, transition:'all 0.15s',
              ...(f==='Favoritos' && favCount>0 ? { borderColor:V.orange, color:filterArea===f?'white':V.orange } : {}) }}>
            {f}{f==='Favoritos' && favCount>0 ? ` (${favCount})` : ''}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:V.muted, whiteSpace:'nowrap' }}>Score mín: <strong style={{color:V.text}}>{scoreMin}</strong></span>
          <input type="range" min={0} max={100} step={5} value={scoreMin} onChange={e=>setScoreMin(Number(e.target.value))} style={{ width:100, accentColor:V.accent }}/>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:V.muted }}>
          <div style={{ width:32, height:32, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite', margin:'0 auto 12px' }}/>
          Carregando talentos...
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:V.muted2 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
          Nenhum talento encontrado.
          <br/>
          <button onClick={()=>{ setQuery(''); setFilterArea('Todos'); setScoreMin(0); }}
            style={{ marginTop:12, background:V.accent, border:'none', color:'white', padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {displayed.map((t,i) => {
            const initials   = t.name.split(' ').map(n=>n[0]).join('').slice(0,2);
            const scoreColor = t.score>=85 ? V.green : t.score>=70 ? V.orange : V.red;
            return (
              <div key={t.id}
                style={{ background:V.surface, border:`1px solid ${t.fav?'rgba(224,123,0,0.3)':V.border}`, borderRadius:12, padding:18, transition:'all 0.2s', cursor:'pointer', animation:`fadeUp 0.35s ease ${i*0.03}s both`, position:'relative' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(26,58,143,0.1)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                <button onClick={e=>{e.stopPropagation();toggleFav(t.id);}}
                  style={{ position:'absolute', top:12, right:12, background:'none', border:'none', cursor:'pointer', fontSize:16, opacity:t.fav?1:0.3, transition:'all 0.2s' }}>
                  {t.fav ? '⭐' : '☆'}
                </button>
                <div style={{ width:44, height:44, borderRadius:12, background:`${t.color}22`, color:t.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, marginBottom:12 }}>{initials}</div>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:2, paddingRight:24 }}>{t.name}</div>
                <div style={{ fontSize:11, color:V.muted, marginBottom:10 }}>{t.role} · {t.city}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
                  {(t.tags||[]).slice(0,3).map(tg=><span key={tg} style={{ fontSize:9, padding:'2px 7px', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:4, color:V.muted2 }}>{tg}</span>)}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ flex:1, height:4, background:V.surface2, borderRadius:2 }}>
                      <div style={{ width:`${t.score}%`, height:'100%', background:scoreColor, borderRadius:2 }}/>
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:scoreColor, minWidth:22 }}>{t.score}</span>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setConvidar(t);}}
                    style={{ background:V.accent, border:'none', color:'white', padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:500 }}>
                    Convidar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {convidar && <ModalConvidar talent={convidar} onClose={()=>setConvidar(null)}/>}
    </div>
  );
}
