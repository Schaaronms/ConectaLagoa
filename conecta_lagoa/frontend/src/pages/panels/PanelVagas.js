// ── PanelVagas.js — Conecta Lagoa ────────────────────────────
// Painel interno da empresa para gestão completa de vagas.
// Acessado pelo card "Vagas Ativas" no PanelOverview.
//
// Funcionalidades:
//   • Listar vagas com métricas reais (candidatos, conversão, tempo)
//   • Ativar / Pausar / Encerrar vaga
//   • Editar vaga (modal completo)
//   • Criar nova vaga
//   • Excluir com confirmação
//   • Drawer lateral com candidatos da vaga
//   • Filtro por status + busca por título
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || 'https://conectalagoa.onrender.com/api';
const tok  = () => localStorage.getItem('token') || localStorage.getItem('cl_token');
const hdr  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` });

const V = {
  bg:'#f4f6fb', surface:'#ffffff', s2:'#f7f8fc', border:'#e4e8f0',
  text:'#1a1d2e', muted:'#8a93b2', muted2:'#5a6380',
  accent:'#1a3a8f', accent2:'#2d52c4',
  green:'#10b981', orange:'#e07b00', red:'#ef4444',
};

const fmtDate = d => d
  ? new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })
  : '—';

const statusPill = (ativa, encerrada) =>
  encerrada ? { bg:'rgba(90,99,128,0.1)',   color:V.muted2,  label:'Encerrada' } :
  ativa     ? { bg:'rgba(16,185,129,0.12)', color:'#059669', label:'Ativa'     } :
              { bg:'rgba(239,68,68,0.1)',   color:V.red,     label:'Pausada'   };

const inp = {
  width:'100%', background:V.s2, border:`1px solid ${V.border}`,
  borderRadius:8, padding:'9px 12px', color:V.text,
  fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif",
};
const lbl = {
  fontSize:11, color:V.muted, textTransform:'uppercase',
  letterSpacing:'0.05em', display:'block', marginBottom:5,
};
const fi = e => { e.target.style.borderColor = V.accent; };
const fo = e => { e.target.style.borderColor = V.border; };

// ── Toast ─────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
      background: type === 'error' ? V.red : V.green, color:'#fff',
      padding:'10px 24px', borderRadius:30, fontSize:13, fontWeight:600,
      zIndex:2000, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
      {msg}
    </div>
  );
}

// ── Modal criar / editar vaga ─────────────────────────────
const EMPTY = {
  titulo:'', descricao:'', requisitos:'', salario:'',
  cidade:'', estado:'', tipo_contrato:'CLT', modalidade:'Presencial',
  area:'', pcd:false,
};

function ModalVaga({ open, onClose, onSaved, vagaParaEditar }) {
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const isEdit = !!vagaParaEditar;

  useEffect(() => {
    if (open) setForm(vagaParaEditar ? { ...EMPTY, ...vagaParaEditar } : EMPTY);
  }, [open, vagaParaEditar]);

  const set  = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setB = k => e => setForm(p => ({ ...p, [k]: e.target.checked }));

  const salvar = async () => {
    if (!form.titulo.trim()) { setErr('Título é obrigatório'); return; }
    setSaving(true); setErr('');
    try {
      const url    = isEdit ? `${BASE}/empresa/vagas/${vagaParaEditar.id}` : `${BASE}/empresa/vagas`;
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers:hdr(), body:JSON.stringify(form) });
      const data   = await res.json();
      if (res.ok) { onSaved(); onClose(); }
      else setErr(data.message || 'Erro ao salvar');
    } catch { setErr('Sem conexão'); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)',
        backdropFilter:'blur(6px)', zIndex:1000, display:'flex',
        alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16,
        padding:28, width:620, maxWidth:'100%', maxHeight:'92vh', overflowY:'auto', position:'relative' }}>

        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4 }}>
          {isEdit ? '✏️ Editar Vaga' : '+ Nova Vaga'}
        </div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:22 }}>
          {isEdit ? vagaParaEditar.titulo : 'Preencha os dados da nova vaga'}
        </div>

        {err && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:V.red,
            padding:'8px 14px', borderRadius:8, fontSize:12, marginBottom:14 }}>
            {err}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12, marginBottom:14 }}>
          <div><label style={lbl}>Título *</label>
            <input value={form.titulo} onChange={set('titulo')}
              placeholder="Ex: Dev Frontend React Sênior" style={inp} onFocus={fi} onBlur={fo}/></div>
          <div><label style={lbl}>Área</label>
            <input value={form.area} onChange={set('area')}
              placeholder="Tecnologia" style={inp} onFocus={fi} onBlur={fo}/></div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:14 }}>
          <div><label style={lbl}>Cidade</label>
            <input value={form.cidade} onChange={set('cidade')}
              placeholder="Lagoa Vermelha" style={inp} onFocus={fi} onBlur={fo}/></div>
          <div><label style={lbl}>Estado</label>
            <input value={form.estado} onChange={set('estado')}
              placeholder="RS" style={inp} onFocus={fi} onBlur={fo}/></div>
          <div><label style={lbl}>Contrato</label>
            <select value={form.tipo_contrato} onChange={set('tipo_contrato')} style={inp}>
              {['CLT','PJ','Estágio','Temporário','Freelance'].map(t=><option key={t}>{t}</option>)}
            </select></div>
          <div><label style={lbl}>Modalidade</label>
            <select value={form.modalidade} onChange={set('modalidade')} style={inp}>
              {['Presencial','Remoto','Híbrido'].map(m=><option key={m}>{m}</option>)}
            </select></div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'end', marginBottom:14 }}>
          <div><label style={lbl}>Salário / Faixa</label>
            <input value={form.salario} onChange={set('salario')}
              placeholder="Ex: R$ 5.000 – R$ 7.000" style={inp} onFocus={fi} onBlur={fo}/></div>
          <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:2 }}>
            <input type="checkbox" id="pcd" checked={!!form.pcd} onChange={setB('pcd')}
              style={{ width:16, height:16 }}/>
            <label htmlFor="pcd" style={{ fontSize:13, color:V.muted2, cursor:'pointer' }}>Vaga PcD</label>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Descrição</label>
          <textarea value={form.descricao} onChange={set('descricao')} rows={4}
            placeholder="Responsabilidades, contexto da equipe, benefícios..."
            style={{ ...inp, resize:'vertical' }} onFocus={fi} onBlur={fo}/>
        </div>
        <div style={{ marginBottom:24 }}>
          <label style={lbl}>Requisitos</label>
          <textarea value={form.requisitos} onChange={set('requisitos')} rows={3}
            placeholder="Habilidades técnicas e comportamentais esperadas..."
            style={{ ...inp, resize:'vertical' }} onFocus={fi} onBlur={fo}/>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose}
            style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2,
              padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={saving}
            style={{ background:saving?V.muted:V.accent, border:'none', color:'#fff',
              padding:'9px 22px', borderRadius:8, cursor:saving?'default':'pointer',
              fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
            {saving ? 'Salvando...' : isEdit ? '✓ Salvar Alterações' : '+ Criar Vaga'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal confirmação ─────────────────────────────────────
function ModalConfirm({ open, onClose, onConfirm, title, msg, confirmLabel, confirmColor }) {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)',
        backdropFilter:'blur(6px)', zIndex:1001, display:'flex',
        alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, borderRadius:14, padding:28,
        width:400, maxWidth:'90vw', border:`1px solid ${V.border}` }}>
        <div style={{ fontSize:36, textAlign:'center', marginBottom:12 }}>⚠️</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700,
          textAlign:'center', marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:13, color:V.muted2, textAlign:'center',
          lineHeight:1.6, marginBottom:24 }} dangerouslySetInnerHTML={{ __html: msg }}/>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={onClose}
            style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2,
              padding:'9px 22px', borderRadius:8, cursor:'pointer', fontSize:13 }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            style={{ background:confirmColor||V.red, border:'none', color:'#fff',
              padding:'9px 22px', borderRadius:8, cursor:'pointer',
              fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
            {confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drawer candidatos da vaga ─────────────────────────────
const STAGE_LABELS = ['','Recebido','Triagem','Entrevista','Teste Técnico','Proposta','Contratado'];
const STAGE_COLORS = ['','#64748b','#2d52c4','#e07b00','#8b5cf6','#0891b2','#10b981'];

function DrawerCandidatos({ vaga, onClose }) {
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!vaga) return;
    setLoading(true);
    fetch(`${BASE}/vagas/${vaga.id}/candidatos`, { headers:hdr() })
      .then(r => r.json())
      .then(d => setCandidatos(Array.isArray(d) ? d : d.candidatos || []))
      .catch(() => setCandidatos([]))
      .finally(() => setLoading(false));
  }, [vaga]);

  if (!vaga) return null;
  const p = statusPill(vaga.ativa, vaga.encerrada);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.2)',
        backdropFilter:'blur(4px)', zIndex:990, display:'flex', justifyContent:'flex-end' }}>
      <div style={{ width:460, maxWidth:'100vw', height:'100%', background:V.surface,
        borderLeft:`1px solid ${V.border}`, overflowY:'auto', display:'flex', flexDirection:'column' }}>

        <div style={{ padding:'20px 24px 16px', borderBottom:`1px solid ${V.border}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15,
                fontWeight:700, color:V.text, marginBottom:6 }}>{vaga.titulo}</div>
              <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20,
                fontWeight:600, background:p.bg, color:p.color }}>{p.label}</span>
            </div>
            <button onClick={onClose}
              style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted,
                width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16,
                display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:14 }}>
            {[
              { label:'Candidatos',  val:vaga.total_candidatos??0,               color:V.accent  },
              { label:'Contratados', val:vaga.total_contratados??0,              color:V.green   },
              { label:'Conversão',   val:`${vaga.taxa_conversao??0}%`,           color:V.orange  },
              { label:'Tempo médio', val:vaga.tempo_medio?`${vaga.tempo_medio}d`:'—', color:V.muted2 },
            ].map(m => (
              <div key={m.label} style={{ background:V.s2, border:`1px solid ${V.border}`,
                borderRadius:9, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18,
                  fontWeight:800, color:m.color }}>{m.val}</div>
                <div style={{ fontSize:9, color:V.muted, textTransform:'uppercase', marginTop:2 }}>
                  {m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          <div style={{ fontSize:12, color:V.muted, fontWeight:600,
            textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
            Candidatos ({candidatos.length})
          </div>

          {loading && (
            <div style={{ textAlign:'center', padding:40, color:V.muted }}>
              <div style={{ width:28, height:28, border:`2px solid ${V.border}`,
                borderTopColor:V.accent, borderRadius:'50%',
                animation:'clSpin 0.7s linear infinite', margin:'0 auto 12px' }}/>
              Carregando...
            </div>
          )}
          {!loading && candidatos.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 20px', color:V.muted }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
              <div style={{ fontSize:13 }}>Nenhum candidato ainda.</div>
            </div>
          )}
          {!loading && candidatos.map((c, i) => {
            const stage      = c.stage || 1;
            const stageLabel = STAGE_LABELS[stage] || 'Recebido';
            const stageColor = STAGE_COLORS[stage] || V.muted;
            const initials   = (c.nome||c.candidato_nome||'?')
              .split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
            return (
              <div key={i}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                  background:V.s2, border:`1px solid ${V.border}`, borderRadius:10,
                  marginBottom:8, transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(26,58,143,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=V.border; }}>
                <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
                  background:`linear-gradient(135deg,${V.accent},${V.accent2})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, fontWeight:700, color:'#fff' }}>
                  {initials}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:V.text,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.nome || c.candidato_nome || '—'}
                  </div>
                  <div style={{ fontSize:11, color:V.muted }}>
                    {c.cidade || c.candidato_cidade || ''}
                    {c.score_ia ? ` · Score IA: ${c.score_ia}` : ''}
                  </div>
                </div>
                <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:600,
                  background:`${stageColor}18`, color:stageColor, whiteSpace:'nowrap' }}>
                  {stageLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Card de linha de vaga ─────────────────────────────────
function VagaRow({ vaga, onEdit, onToggleAtiva, onEncerrar, onDelete, onVerCandidatos }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const p = statusPill(vaga.ativa, vaga.encerrada);

  const ABtn = ({ label, icon, onClick, color = V.muted2, danger = false }) => (
    <button onClick={() => { setMenuOpen(false); onClick(); }}
      style={{ display:'flex', alignItems:'center', gap:8, width:'100%',
        padding:'8px 14px', background:'none', border:'none', cursor:'pointer',
        fontSize:12, color:danger ? V.red : color,
        fontFamily:"'DM Sans',sans-serif", textAlign:'left',
        borderRadius:6, transition:'background 0.1s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? '#fef2f2' : V.s2; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
      <span style={{ fontSize:14 }}>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:12,
      padding:'16px 18px', display:'flex', alignItems:'center', gap:14,
      transition:'all 0.2s', animation:'fadeUp 0.35s ease both' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(26,58,143,0.25)'; e.currentTarget.style.boxShadow='0 2px 16px rgba(26,58,143,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=V.border; e.currentTarget.style.boxShadow='none'; }}>

      <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0, marginTop:2,
        background: vaga.encerrada ? V.muted : vaga.ativa ? V.green : V.orange }}/>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14,
            fontWeight:700, color:V.text }}>{vaga.titulo}</span>
          <span style={{ fontSize:10, padding:'2px 9px', borderRadius:20,
            fontWeight:600, background:p.bg, color:p.color }}>{p.label}</span>
          {vaga.pcd && (
            <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20,
              background:'rgba(139,92,246,0.1)', color:'#7c3aed', fontWeight:600 }}>
              ♿ PcD
            </span>
          )}
        </div>
        <div style={{ fontSize:11, color:V.muted, marginTop:3,
          display:'flex', gap:10, flexWrap:'wrap' }}>
          {vaga.cidade && <span>📍 {vaga.cidade}{vaga.estado ? `, ${vaga.estado}` : ''}</span>}
          {vaga.modalidade && <span>🏢 {vaga.modalidade}</span>}
          {vaga.tipo_contrato && <span>📄 {vaga.tipo_contrato}</span>}
          {vaga.salario && <span>💰 {vaga.salario}</span>}
          <span>📅 {fmtDate(vaga.created_at)}</span>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display:'flex', gap:20, flexShrink:0 }}>
        {[
          { label:'Candidatos',  val:vaga.total_candidatos??0,              color:V.accent  },
          { label:'Contratados', val:vaga.total_contratados??0,             color:V.green   },
          { label:'Conversão',   val:`${vaga.taxa_conversao??0}%`,          color:V.orange  },
        ].map(m => (
          <div key={m.label} style={{ textAlign:'center', minWidth:58 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18,
              fontWeight:800, color:m.color }}>{m.val}</div>
            <div style={{ fontSize:9, color:V.muted, textTransform:'uppercase' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <button onClick={() => onVerCandidatos(vaga)}
        style={{ background:V.s2, border:`1px solid ${V.border}`, color:V.muted2,
          padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:11,
          fontWeight:500, fontFamily:"'DM Sans',sans-serif", flexShrink:0,
          transition:'all 0.15s', whiteSpace:'nowrap' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=V.accent; e.currentTarget.style.color=V.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor=V.border; e.currentTarget.style.color=V.muted2; }}>
        👥 Ver candidatos
      </button>

      <div style={{ position:'relative', flexShrink:0 }}>
        <button onClick={() => setMenuOpen(o => !o)}
          style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted,
            width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:18,
            display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=V.accent; e.currentTarget.style.color=V.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=V.border; e.currentTarget.style.color=V.muted; }}>
          ⋯
        </button>
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)}
              style={{ position:'fixed', inset:0, zIndex:98 }}/>
            <div style={{ position:'absolute', right:0, top:36, background:V.surface,
              border:`1px solid ${V.border}`, borderRadius:10, padding:6, zIndex:99,
              minWidth:185, boxShadow:'0 8px 24px rgba(26,58,143,0.12)' }}>
              <ABtn icon="✏️" label="Editar vaga" onClick={() => onEdit(vaga)}/>
              {!vaga.encerrada && (
                <ABtn icon={vaga.ativa?'⏸':'▶️'}
                  label={vaga.ativa?'Pausar vaga':'Ativar vaga'}
                  color={vaga.ativa ? V.orange : V.green}
                  onClick={() => onToggleAtiva(vaga)}/>
              )}
              {!vaga.encerrada && (
                <ABtn icon="🔒" label="Encerrar vaga" onClick={() => onEncerrar(vaga)}/>
              )}
              <div style={{ height:1, background:V.border, margin:'4px 6px' }}/>
              <ABtn icon="🗑️" label="Excluir vaga" onClick={() => onDelete(vaga)} danger/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── PAINEL PRINCIPAL ──────────────────────────────────────
export default function PanelVagas() {
  const [vagas, setVagas]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState('todas');
  const [busca, setBusca]         = useState('');
  const [toast, setToast]         = useState({ msg:'', type:'success' });

  const [modalVaga, setModalVaga]   = useState(false);
  const [vagaEdit, setVagaEdit]     = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmEnc, setConfirmEnc] = useState(null);
  const [drawerVaga, setDrawerVaga] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 3000);
  };

  const carregarVagas = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/empresa/vagas`, { headers:hdr() });
      const data = await res.json();
      setVagas(Array.isArray(data) ? data : data.vagas || []);
    } catch { showToast('Erro ao carregar vagas', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregarVagas(); }, [carregarVagas]);

  const handleToggleAtiva = async (vaga) => {
    try {
      const res = await fetch(`${BASE}/empresa/vagas/${vaga.id}`, {
        method:'PUT', headers:hdr(),
        body:JSON.stringify({ ...vaga, ativa:!vaga.ativa }),
      });
      if (res.ok) { showToast(vaga.ativa ? '⏸ Vaga pausada' : '▶️ Vaga ativada'); carregarVagas(); }
    } catch { showToast('Erro ao atualizar', 'error'); }
  };

  const handleEncerrar = async () => {
    const vaga = confirmEnc; setConfirmEnc(null);
    try {
      const res = await fetch(`${BASE}/empresa/vagas/${vaga.id}`, {
        method:'PUT', headers:hdr(),
        body:JSON.stringify({ ...vaga, ativa:false, encerrada:true }),
      });
      if (res.ok) { showToast('🔒 Vaga encerrada'); carregarVagas(); }
    } catch { showToast('Erro ao encerrar', 'error'); }
  };

  const handleDelete = async () => {
    const vaga = confirmDel; setConfirmDel(null);
    try {
      const res = await fetch(`${BASE}/empresa/vagas/${vaga.id}`, { method:'DELETE', headers:hdr() });
      if (res.ok) { showToast('🗑️ Vaga excluída'); carregarVagas(); }
      else showToast('Erro ao excluir', 'error');
    } catch { showToast('Erro ao excluir', 'error'); }
  };

  const counts = {
    todas:      vagas.length,
    ativas:     vagas.filter(v =>  v.ativa && !v.encerrada).length,
    pausadas:   vagas.filter(v => !v.ativa && !v.encerrada).length,
    encerradas: vagas.filter(v =>  v.encerrada).length,
  };

  const vagasFiltradas = vagas.filter(v => {
    const okBusca  = v.titulo?.toLowerCase().includes(busca.toLowerCase());
    const okFiltro =
      filtro === 'todas'      ? true :
      filtro === 'ativas'     ? (v.ativa && !v.encerrada) :
      filtro === 'pausadas'   ? (!v.ativa && !v.encerrada) :
      filtro === 'encerradas' ? v.encerrada : true;
    return okBusca && okFiltro;
  });

  return (
    <div>
      <Toast msg={toast.msg} type={toast.type}/>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
        marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:4 }}>
            Gestão de Vagas
          </div>
          <div style={{ fontSize:12, color:V.muted }}>
            {counts.ativas} ativa{counts.ativas !== 1 ? 's' : ''} ·{' '}
            {counts.pausadas} pausada{counts.pausadas !== 1 ? 's' : ''} ·{' '}
            {counts.encerradas} encerrada{counts.encerradas !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={() => { setVagaEdit(null); setModalVaga(true); }}
          style={{ background:V.accent, border:'none', color:'#fff',
            padding:'9px 20px', borderRadius:10, cursor:'pointer',
            fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif",
            display:'flex', alignItems:'center', gap:7, transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background=V.accent2; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background=V.accent;  e.currentTarget.style.transform='none'; }}>
          + Nova Vaga
        </button>
      </div>

      {/* Busca + filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200, maxWidth:320 }}>
          <span style={{ position:'absolute', left:11, top:'50%',
            transform:'translateY(-50%)', color:V.muted, fontSize:14 }}>🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar vaga..." style={{ ...inp, paddingLeft:34 }}
            onFocus={fi} onBlur={fo}/>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[['todas','Todas'],['ativas','Ativas'],['pausadas','Pausadas'],['encerradas','Encerradas']].map(([id,label]) => (
            <button key={id} onClick={() => setFiltro(id)}
              style={{ padding:'7px 14px', borderRadius:8, cursor:'pointer',
                fontSize:12, fontWeight:500, fontFamily:"'DM Sans',sans-serif",
                border:`1px solid ${filtro===id ? V.accent : V.border}`,
                background: filtro===id ? 'rgba(26,58,143,0.08)' : V.surface,
                color: filtro===id ? V.accent : V.muted2, transition:'all 0.15s' }}>
              {label}
              <span style={{ marginLeft:6, fontSize:10, fontWeight:700,
                background: filtro===id ? V.accent : V.border,
                color: filtro===id ? '#fff' : V.muted,
                padding:'1px 7px', borderRadius:20 }}>
                {counts[id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:V.muted }}>
          <div style={{ width:32, height:32, border:`3px solid ${V.border}`,
            borderTopColor:V.accent, borderRadius:'50%',
            animation:'clSpin 0.7s linear infinite', margin:'0 auto 14px' }}/>
          <p style={{ fontSize:13 }}>Carregando vagas...</p>
        </div>
      ) : vagasFiltradas.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:V.muted }}>
          <div style={{ fontSize:40, marginBottom:14 }}>{vagas.length === 0 ? '📋' : '🔍'}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15,
            fontWeight:700, color:V.text, marginBottom:8 }}>
            {vagas.length === 0 ? 'Nenhuma vaga criada ainda' : 'Nenhuma vaga encontrada'}
          </div>
          <div style={{ fontSize:13, marginBottom:20 }}>
            {vagas.length === 0
              ? 'Crie sua primeira vaga e comece a receber candidatos.'
              : 'Tente ajustar os filtros ou a busca.'}
          </div>
          {vagas.length === 0 && (
            <button onClick={() => { setVagaEdit(null); setModalVaga(true); }}
              style={{ background:V.accent, border:'none', color:'#fff',
                padding:'10px 24px', borderRadius:10, cursor:'pointer',
                fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              + Criar primeira vaga
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {vagasFiltradas.map(v => (
            <VagaRow key={v.id} vaga={v}
              onEdit={vaga => { setVagaEdit(vaga); setModalVaga(true); }}
              onToggleAtiva={handleToggleAtiva}
              onEncerrar={vaga => setConfirmEnc(vaga)}
              onDelete={vaga => setConfirmDel(vaga)}
              onVerCandidatos={vaga => setDrawerVaga(vaga)}/>
          ))}
        </div>
      )}

      <ModalVaga
        open={modalVaga}
        onClose={() => { setModalVaga(false); setVagaEdit(null); }}
        onSaved={() => { carregarVagas(); showToast('✓ Vaga salva com sucesso!'); }}
        vagaParaEditar={vagaEdit}
      />

      <ModalConfirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        title="Excluir esta vaga?"
        msg={`<strong>"${confirmDel?.titulo}"</strong> será removida permanentemente. Candidaturas vinculadas também serão excluídas.`}
        confirmLabel="Sim, excluir"
        confirmColor={V.red}
      />

      <ModalConfirm
        open={!!confirmEnc}
        onClose={() => setConfirmEnc(null)}
        onConfirm={handleEncerrar}
        title="Encerrar esta vaga?"
        msg={`<strong>"${confirmEnc?.titulo}"</strong> não aparecerá mais para candidatos. Os dados do funil serão mantidos.`}
        confirmLabel="Encerrar Vaga"
        confirmColor={V.muted2}
      />

      <DrawerCandidatos
        vaga={drawerVaga}
        onClose={() => setDrawerVaga(null)}
      />
    </div>
  );
}
