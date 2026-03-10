// PanelColaboradores.jsx — Conecta Lagoa
import { useState, useEffect } from 'react';
import { V, BASE_URL, getToken } from './shared';

// ─── RADAR CHART ─────────────────────────────────────────────────
function RadarChart({ data, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36, n = data.length;
  const angleOf = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point   = (i, radius) => ({ x: cx + radius * Math.cos(angleOf(i)), y: cy + radius * Math.sin(angleOf(i)) });
  const polyPoints = (frac) => data.map((_, i) => { const p = point(i, r * frac); return `${p.x},${p.y}`; }).join(' ');
  const dataPoints = data.map((d, i) => { const p = point(i, r * (d.value / 10)); return `${p.x},${p.y}`; }).join(' ');
  return (
    <svg width={size} height={size} style={{ overflow:'visible' }}>
      {[0.25,0.5,0.75,1].map((f, li) => <polygon key={li} points={polyPoints(f)} fill="none" stroke={V.border} strokeWidth="1"/>)}
      {data.map((_, i) => { const p = point(i, r); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={V.border} strokeWidth="1"/>; })}
      <polygon points={dataPoints} fill={`${V.accent}22`} stroke={V.accent} strokeWidth="2" strokeLinejoin="round"/>
      {data.map((d, i) => {
        const lp = point(i, r * 1.22);
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={V.muted} fontFamily="'DM Sans',sans-serif">
            {d.label}<tspan x={lp.x} dy="12" fontSize="11" fontWeight="700" fill={V.text}>{d.value}</tspan>
          </text>
        );
      })}
      {data.map((d, i) => { const p = point(i, r * (d.value / 10)); return <circle key={i} cx={p.x} cy={p.y} r="4" fill={V.accent}/>; })}
    </svg>
  );
}

// ─── MODAL COLABORADOR ────────────────────────────────────────────
function ModalColaborador({ open, onClose, onSaved, colaborador = null }) {
  const EMPTY = { nome:'', genero:'', data_nascimento:'', departamento:'', cargo:'', data_admissao:'', salario:'', email:'', telefone:'', observacao:'' };
  const [form, setForm]     = useState(colaborador ? { ...EMPTY, ...colaborador, salario: colaborador.salario || '' } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');
  const [toastOk, setToastOk] = useState(true);

  useEffect(() => {
    if (colaborador) setForm({ ...EMPTY, ...colaborador, salario: colaborador.salario || '' });
    else setForm(EMPTY);
  }, [colaborador, open]);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const showToast = (msg, ok = true) => { setToast(msg); setToastOk(ok); setTimeout(() => setToast(''), ok ? 1800 : 3000); };

  const handleSalvar = async () => {
    if (!form.nome.trim())   { showToast('Nome é obrigatório', false); return; }
    if (!form.data_admissao) { showToast('Data de admissão é obrigatória', false); return; }
    setSaving(true);
    try {
      const url    = colaborador ? `${BASE_URL}/colaboradores/${colaborador.id}` : `${BASE_URL}/colaboradores`;
      const method = colaborador ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, salario: form.salario ? parseFloat(String(form.salario).replace(',', '.')) : null }),
      });
      if (res.ok) {
        const saved = await res.json();
        showToast(colaborador ? 'Colaborador atualizado ✓' : 'Colaborador cadastrado ✓');
        setTimeout(() => { onSaved(saved); onClose(); }, 1400);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Erro ao salvar', false);
      }
    } catch { showToast('Sem conexão', false); }
    finally  { setSaving(false); }
  };

  if (!open) return null;
  const inp = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" };
  const lbl = { fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 };
  const row2 = { display:'flex', gap:12, marginBottom:14 };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:520, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        {toast && <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', background:toastOk ? V.accent : V.red, color:'white', padding:'6px 18px', borderRadius:20, fontSize:12, fontWeight:500, whiteSpace:'nowrap', zIndex:10 }}>{toast}</div>}
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4, color:V.text }}>{colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:22 }}>{colaborador ? 'Atualize os dados' : 'Preencha para cadastrar'}</div>
        <div style={{ marginBottom:14 }}>
          <label style={lbl}>Nome completo *</label>
          <input value={form.nome} onChange={set('nome')} placeholder="ex: Ana Paula Silva" style={inp} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>
        <div style={row2}>
          <div style={{ flex:1 }}><label style={lbl}>Gênero</label>
            <select value={form.genero} onChange={set('genero')} style={inp}>
              <option value="">Não informado</option><option>Feminino</option><option>Masculino</option><option>Outro</option>
            </select>
          </div>
          <div style={{ flex:1 }}><label style={lbl}>Data de Nascimento</label>
            <input type="date" value={form.data_nascimento} onChange={set('data_nascimento')} style={inp}/>
          </div>
        </div>
        <div style={row2}>
          <div style={{ flex:1 }}><label style={lbl}>Departamento</label>
            <select value={form.departamento} onChange={set('departamento')} style={inp}>
              <option value="">Selecione</option>
              {['Comercial','Financeiro','Marketing','Logística','Operações','TI','RH','Jurídico','Produto','Outros'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}><label style={lbl}>Cargo</label>
            <input value={form.cargo} onChange={set('cargo')} placeholder="ex: Analista de Vendas" style={inp} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
          </div>
        </div>
        <div style={row2}>
          <div style={{ flex:1 }}><label style={lbl}>Data de Admissão *</label><input type="date" value={form.data_admissao} onChange={set('data_admissao')} style={inp}/></div>
          <div style={{ flex:1 }}><label style={lbl}>Salário (R$)</label><input value={form.salario} onChange={set('salario')} placeholder="ex: 3500.00" style={inp} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
        </div>
        <div style={row2}>
          <div style={{ flex:1 }}><label style={lbl}>E-mail</label><input type="email" value={form.email} onChange={set('email')} placeholder="ana@empresa.com" style={inp} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
          <div style={{ flex:1 }}><label style={lbl}>Telefone</label><input value={form.telefone} onChange={set('telefone')} placeholder="(37) 99999-9999" style={inp} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={lbl}>Observação</label>
          <textarea value={form.observacao} onChange={set('observacao')} rows={2} style={{ ...inp, resize:'vertical' }} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={saving} style={{ background:saving ? V.muted2 : V.accent, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor:saving ? 'default' : 'pointer', fontSize:13, fontWeight:600 }}>
            {saving ? 'Salvando...' : colaborador ? '✓ Salvar Alterações' : '✓ Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL DESLIGAMENTO ───────────────────────────────────────────
function ModalDesligar({ colaborador, onClose, onSaved }) {
  const [form, setForm]     = useState({ data_desligamento: new Date().toISOString().split('T')[0], motivo_desligamento:'' });
  const [saving, setSaving] = useState(false);
  const handleDesligar = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/colaboradores/${colaborador.id}/desligar`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      if (res.ok) { onSaved(); onClose(); }
    } catch {} finally { setSaving(false); }
  };
  if (!colaborador) return null;
  const inp = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:13, outline:'none' };
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(239,68,68,0.2)', backdropFilter:'blur(6px)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid rgba(239,68,68,0.3)`, borderRadius:16, padding:28, width:420, maxWidth:'95vw' }}>
        <div style={{ fontSize:28, marginBottom:10, textAlign:'center' }}>🚪</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:V.text, marginBottom:4, textAlign:'center' }}>Desligar {colaborador.nome}?</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:20, textAlign:'center' }}>O colaborador será movido para o histórico de desligados.</div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:5 }}>Data de desligamento</label>
          <input type="date" value={form.data_desligamento} onChange={e => setForm(p => ({ ...p, data_desligamento:e.target.value }))} style={inp}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:5 }}>Motivo</label>
          <select value={form.motivo_desligamento} onChange={e => setForm(p => ({ ...p, motivo_desligamento:e.target.value }))} style={inp}>
            <option value="">Não informado</option>
            {['Pedido de demissão','Demissão sem justa causa','Demissão com justa causa','Acordo mútuo','Fim de contrato','Aposentadoria','Outros'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleDesligar} disabled={saving} style={{ background:saving ? V.muted2 : V.red, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
            {saving ? 'Processando...' : 'Confirmar Desligamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL IMPORT CSV ─────────────────────────────────────────────
function ModalImportCSV({ open, onClose, onDone }) {
  const [file, setFile]       = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch(`${BASE_URL}/colaboradores/import-csv`, { method:'POST', headers:{ 'Authorization':`Bearer ${getToken()}` }, body:fd });
      const data = await res.json();
      setResult(data);
      if (data.inseridos > 0) onDone();
    } catch { setResult({ error:'Erro ao enviar arquivo' }); }
    finally { setLoading(false); }
  };
  if (!open) return null;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:460, maxWidth:'95vw' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4, color:V.text }}>Importar CSV</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:4 }}>Colunas: nome, genero, data_nascimento, departamento, cargo, data_admissao, salario, email, telefone</div>
        <a href="data:text/csv;charset=utf-8,%EF%BB%BFnome%2Cgenero%2Cdata_nascimento%2Cdepartamento%2Ccargo%2Cdata_admissao%2Csalario%2Cemail%2Ctelefone%0AAna%20Paula%2CFeminino%2C1990-03-15%2CComercial%2CGerente%2C2022-01-10%2C8500%2Cana%40empresa.com%2C37999999999"
          download="modelo_colaboradores.csv" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, color:V.accent, marginBottom:18, textDecoration:'none' }}>
          ⬇ Baixar modelo CSV
        </a>
        <div style={{ border:`2px dashed ${file ? V.green : V.border}`, borderRadius:10, padding:24, textAlign:'center', cursor:'pointer', marginBottom:16, background:file ? 'rgba(16,185,129,0.05)' : 'transparent' }}
          onClick={() => document.getElementById('csv-input').click()}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}>
          <input id="csv-input" type="file" accept=".csv" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])}/>
          <div style={{ fontSize:24, marginBottom:6 }}>{file ? '📄' : '📁'}</div>
          <div style={{ fontSize:13, fontWeight:500, color:file ? V.green : V.text }}>{file ? file.name : 'Clique ou arraste o arquivo CSV'}</div>
        </div>
        {result && (
          <div style={{ padding:'12px 14px', borderRadius:8, marginBottom:16, fontSize:12, background:result.error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border:`1px solid ${result.error ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, color:result.error ? V.red : V.green }}>
            {result.error ? `❌ ${result.error}` : `✓ ${result.inseridos} colaboradores importados`}
          </div>
        )}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            {result?.inseridos > 0 ? 'Fechar' : 'Cancelar'}
          </button>
          {!result?.inseridos && (
            <button onClick={handleUpload} disabled={!file || loading} style={{ background:!file || loading ? V.muted2 : V.accent, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>
              {loading ? 'Importando...' : '⬆ Importar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MODAL AVALIAÇÃO ──────────────────────────────────────────────
function ModalAvaliacao({ open, onClose, onSaved, colaboradores }) {
  const EMPTY = { colaborador_id:'', periodo:'', avaliador_nome:'', comunicacao:'', trabalho_equipe:'', iniciativa:'', lideranca:'', organizacao:'', observacao:'' };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');
  useEffect(() => { if (open) setForm(EMPTY); }, [open]);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const nota_geral = () => {
    const vals = ['comunicacao','trabalho_equipe','iniciativa','lideranca','organizacao'].map(k => parseFloat(form[k])).filter(v => !isNaN(v) && v >= 0 && v <= 10);
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  };
  const handleSalvar = async () => {
    if (!form.colaborador_id) { setToast('Selecione o colaborador'); setTimeout(() => setToast(''), 2000); return; }
    if (!form.periodo)        { setToast('Informe o período');        setTimeout(() => setToast(''), 2000); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/avaliacoes`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${getToken()}`}, body:JSON.stringify(form) });
      if (res.ok) { onSaved(); onClose(); }
      else { const e = await res.json(); setToast(e.error || 'Erro'); setTimeout(() => setToast(''), 2500); }
    } catch { setToast('Sem conexão'); setTimeout(() => setToast(''), 2000); }
    finally { setSaving(false); }
  };
  if (!open) return null;
  const COMP = [{ key:'comunicacao',label:'Comunicação'},{ key:'trabalho_equipe',label:'Trabalho em Equipe'},{ key:'iniciativa',label:'Iniciativa'},{ key:'lideranca',label:'Liderança'},{ key:'organizacao',label:'Organização'}];
  const inp  = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif" };
  const lbl  = { fontSize:11, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 };
  const ng   = nota_geral();
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:560, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
        {toast && <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', background:V.red, color:'white', padding:'6px 18px', borderRadius:20, fontSize:12, fontWeight:500, whiteSpace:'nowrap', zIndex:10 }}>{toast}</div>}
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:4, color:V.text }}>Nova Avaliação de Desempenho</div>
        <div style={{ fontSize:12, color:V.muted, marginBottom:22 }}>Notas de 0 a 10 por competência</div>
        <div style={{ display:'flex', gap:12, marginBottom:14 }}>
          <div style={{ flex:2 }}><label style={lbl}>Colaborador *</label>
            <select value={form.colaborador_id} onChange={set('colaborador_id')} style={inp}>
              <option value="">Selecione...</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}><label style={lbl}>Período *</label><input value={form.periodo} onChange={set('periodo')} placeholder="ex: 2025-T1" style={inp} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
        </div>
        <div style={{ marginBottom:18 }}><label style={lbl}>Avaliador</label><input value={form.avaliador_nome} onChange={set('avaliador_nome')} placeholder="Nome do gestor" style={inp} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
        <div style={{ background:V.surface2, borderRadius:10, padding:16, marginBottom:18 }}>
          <div style={{ fontWeight:600, fontSize:12, marginBottom:14, color:V.text }}>Notas por Competência (0–10)</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {COMP.map(({ key, label }) => (
              <div key={key}>
                <label style={{ ...lbl, textTransform:'none', fontSize:12, fontWeight:500 }}>{label}</label>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="number" min="0" max="10" step="0.1" value={form[key]} onChange={set(key)} placeholder="0–10" style={{ ...inp, width:80 }} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
                  <div style={{ flex:1, height:6, background:V.border, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, width:`${Math.min((parseFloat(form[key]) || 0) / 10 * 100, 100)}%`, background:(parseFloat(form[key]) || 0) >= 8 ? V.green : (parseFloat(form[key]) || 0) >= 6 ? V.orange : V.red, transition:'width 0.3s' }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${V.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:V.muted }}>Nota Geral (média automática)</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:ng !== '—' && parseFloat(ng) >= 7 ? V.green : V.orange }}>{ng}</span>
          </div>
        </div>
        <div style={{ marginBottom:20 }}><label style={lbl}>Observações</label><textarea value={form.observacao} onChange={set('observacao')} rows={3} style={{ ...inp, resize:'vertical' }} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={saving} style={{ background:saving ? V.muted2 : V.accent, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>{saving ? 'Salvando...' : '✓ Salvar Avaliação'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL CARGO ─────────────────────────────────────────────────
function ModalCargo({ open, onClose, onSaved, cargo = null }) {
  const EMPTY = { nome:'', departamento:'', faixa_i:'', faixa_ii:'', faixa_iii:'', faixa_iv:'', faixa_v:'' };
  const [form, setForm] = useState(cargo ? { ...EMPTY, ...cargo } : EMPTY);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(cargo ? { ...EMPTY, ...cargo } : EMPTY); }, [cargo, open]);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const handleSalvar = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(cargo ? `${BASE_URL}/cargos/${cargo.id}` : `${BASE_URL}/cargos`, {
        method: cargo ? 'PUT' : 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      if (res.ok) { onSaved(); onClose(); }
    } catch {} finally { setSaving(false); }
  };
  if (!open) return null;
  const inp = { width:'100%', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:13, outline:'none' };
  const lbl = { fontSize:11, color:V.muted, textTransform:'uppercase', display:'block', marginBottom:5 };
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position:'fixed', inset:0, background:'rgba(26,58,143,0.35)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:16, padding:28, width:500, maxWidth:'100%' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:20, color:V.text }}>{cargo ? 'Editar Cargo' : 'Novo Cargo'}</div>
        <div style={{ display:'flex', gap:12, marginBottom:14 }}>
          <div style={{ flex:2 }}><label style={lbl}>Nome do Cargo *</label><input value={form.nome} onChange={set('nome')} placeholder="ex: Analista de Vendas" style={inp} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/></div>
          <div style={{ flex:1 }}><label style={lbl}>Departamento</label>
            <select value={form.departamento} onChange={set('departamento')} style={inp}>
              <option value="">Selecione</option>
              {['Comercial','Financeiro','Marketing','Logística','Operações','TI','RH','Jurídico','Produto','Outros'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ background:V.surface2, borderRadius:10, padding:14, marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color:V.text, marginBottom:12 }}>Faixas Salariais (R$)</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {['i','ii','iii','iv','v'].map(f => (
              <div key={f}><label style={{ ...lbl, textAlign:'center', fontSize:10 }}>Faixa {f.toUpperCase()}</label>
                <input type="number" value={form[`faixa_${f}`]} onChange={set(`faixa_${f}`)} placeholder="0,00" style={{ ...inp, textAlign:'center', padding:'8px 6px' }} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={saving} style={{ background:saving ? V.muted2 : V.accent, border:'none', color:'white', padding:'9px 22px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>{saving ? 'Salvando...' : '✓ Salvar'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── SUB: AVALIAÇÕES ─────────────────────────────────────────────
function SubAvaliacoes({ colaboradores }) {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [media, setMedia]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [filtColab, setFiltColab]   = useState('');
  const COMP = [{ key:'comunicacao',label:'Comunicação'},{ key:'trabalho_equipe',label:'Trab. Equipe'},{ key:'iniciativa',label:'Iniciativa'},{ key:'lideranca',label:'Liderança'},{ key:'organizacao',label:'Organização'}];

  const fetchAll = async () => {
    setLoading(true);
    try {
      const p = filtColab ? `?colaborador_id=${filtColab}` : '';
      const [avRes, mdRes] = await Promise.all([
        fetch(`${BASE_URL}/avaliacoes${p}`,          { headers:{ 'Authorization':`Bearer ${getToken()}` } }),
        fetch(`${BASE_URL}/avaliacoes/media-equipe`, { headers:{ 'Authorization':`Bearer ${getToken()}` } }),
      ]);
      setAvaliacoes(avRes.ok ? await avRes.json() : []);
      setMedia(mdRes.ok ? await mdRes.json() : null);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, [filtColab]);

  const handleDelete = async (id) => {
    await fetch(`${BASE_URL}/avaliacoes/${id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${getToken()}` } });
    fetchAll();
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:V.text }}>Avaliação de Desempenho</div>
          <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{avaliacoes.length} avaliações registradas</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={filtColab} onChange={e => setFiltColab(e.target.value)} style={{ background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'8px 12px', color:V.text, fontSize:12, outline:'none', cursor:'pointer' }}>
            <option value="">Todos os colaboradores</option>
            {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button onClick={() => setModalOpen(true)} style={{ background:V.accent, border:'none', color:'white', padding:'9px 18px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>+ Nova Avaliação</button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:16, marginBottom:20 }}>
        <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:24, display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, marginBottom:16, color:V.text }}>Média da Equipe</div>
          {media ? <RadarChart data={COMP.map(c => ({ label:c.label, value:parseFloat(media[c.key] || 0) }))} size={220}/> : <div style={{ width:220, height:220, display:'flex', alignItems:'center', justifyContent:'center', color:V.muted, fontSize:12 }}>Sem dados ainda</div>}
          {media && <div style={{ marginTop:12, textAlign:'center' }}>
            <div style={{ fontSize:11, color:V.muted }}>Nota Geral Média</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:parseFloat(media.nota_geral || 0) >= 7 ? V.green : V.orange }}>{media.nota_geral || '—'}</div>
            <div style={{ fontSize:11, color:V.muted }}>{media.total_avaliacoes} avaliações</div>
          </div>}
        </div>
        <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, marginBottom:18, color:V.text }}>Notas Médias por Competência</div>
          {media ? COMP.map(c => {
            const val   = parseFloat(media[c.key] || 0);
            const color = val >= 8 ? V.green : val >= 6 ? V.orange : V.red;
            return (
              <div key={c.key} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, color:V.text }}>{c.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color }}>{val.toFixed(1)}</span>
                </div>
                <div style={{ height:8, background:V.surface2, borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${val * 10}%`, height:'100%', background:color, borderRadius:4, transition:'width 0.8s ease' }}/>
                </div>
              </div>
            );
          }) : <div style={{ color:V.muted, fontSize:12, paddingTop:20 }}>Nenhuma avaliação registrada ainda.</div>}
        </div>
      </div>
      {/* Tabela de avaliações */}
      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${V.border}`, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:V.text }}>Histórico de Avaliações</div>
        {loading ? <div style={{ padding:40, textAlign:'center', color:V.muted }}>Carregando...</div>
        : avaliacoes.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', color:V.muted2 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>📋</div>
            <div style={{ fontWeight:500, marginBottom:8 }}>Nenhuma avaliação ainda</div>
            <button onClick={() => setModalOpen(true)} style={{ background:V.accent, border:'none', color:'white', padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>+ Criar primeira avaliação</button>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr style={{ background:V.surface2 }}>
                {['Colaborador','Período','Com.','Eq.','Inic.','Lider.','Org.','Nota Geral','Avaliador',''].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {avaliacoes.map(a => {
                  const ng = parseFloat(a.nota_geral || 0);
                  return (
                    <tr key={a.id} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)` }} onMouseEnter={e=>e.currentTarget.style.background='rgba(26,58,143,0.03)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{ padding:'12px 14px', fontWeight:500 }}>{a.colaborador_nome}</td>
                      <td style={{ padding:'12px 14px', color:V.muted }}>{a.periodo}</td>
                      {['comunicacao','trabalho_equipe','iniciativa','lideranca','organizacao'].map(k => (
                        <td key={k} style={{ padding:'12px 14px', textAlign:'center', fontWeight:600, color:parseFloat(a[k]||0)>=8?V.green:parseFloat(a[k]||0)>=6?V.orange:a[k]?V.red:V.muted2 }}>{a[k] ?? '—'}</td>
                      ))}
                      <td style={{ padding:'12px 14px' }}><span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:ng>=7?V.green:ng>=5?V.orange:V.red }}>{a.nota_geral ?? '—'}</span></td>
                      <td style={{ padding:'12px 14px', color:V.muted, fontSize:11 }}>{a.avaliador_nome || '—'}</td>
                      <td style={{ padding:'12px 14px' }}>
                        <button onClick={() => handleDelete(a.id)} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:26, height:26, borderRadius:6, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=V.red;e.currentTarget.style.color=V.red;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;e.currentTarget.style.color=V.muted2;}}>🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ModalAvaliacao open={modalOpen} onClose={() => setModalOpen(false)} onSaved={fetchAll} colaboradores={colaboradores}/>
    </div>
  );
}

// ─── SUB: CARGOS E SALÁRIOS ───────────────────────────────────────
function SubCargosSalarios() {
  const [cargos, setCargos]       = useState([]);
  const [aderencia, setAderencia] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando]   = useState(null);
  const [subTab, setSubTab]       = useState('tabela');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        fetch(`${BASE_URL}/cargos`,           { headers:{ 'Authorization':`Bearer ${getToken()}` } }),
        fetch(`${BASE_URL}/cargos/aderencia`, { headers:{ 'Authorization':`Bearer ${getToken()}` } }),
      ]);
      setCargos(cRes.ok ? await cRes.json() : []);
      setAderencia(aRes.ok ? await aRes.json() : []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id) => { await fetch(`${BASE_URL}/cargos/${id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${getToken()}` } }); fetchAll(); };
  const fmt      = v => v ? `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits:2 })}` : '—';
  const adColor  = s => s==='aderente'?V.green:s==='abaixo'?V.red:s==='acima'?V.orange:V.muted2;
  const adLabel  = s => s==='aderente'?'✓ Aderente':s==='abaixo'?'↓ Abaixo':s==='acima'?'↑ Acima':'— Sem dados';
  const cnt = { aderente:0, abaixo:0, acima:0, sem_dados:0 };
  aderencia.forEach(a => { cnt[a.status_aderencia] = (cnt[a.status_aderencia] || 0) + 1; });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:V.text }}>Plano de Cargos e Salários</div>
          <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{cargos.length} cargos cadastrados</div>
        </div>
        <button onClick={() => { setEditando(null); setModalOpen(true); }} style={{ background:V.accent, border:'none', color:'white', padding:'9px 18px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>+ Novo Cargo</button>
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:`1px solid ${V.border}` }}>
        {[['tabela','📋 Tabela de Cargos'],['aderencia','📊 Aderência Salarial']].map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{ padding:'8px 16px', fontSize:12, fontWeight:500, cursor:'pointer', border:'none', borderBottom:`2px solid ${subTab===id?V.accent:'transparent'}`, color:subTab===id?V.accent:V.muted, background:'none', transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif" }}>{label}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign:'center', padding:40, color:V.muted }}>Carregando...</div>
      : subTab === 'tabela' ? (
        cargos.length === 0 ? (
          <div style={{ textAlign:'center', padding:48, color:V.muted2, background:V.surface, border:`1px solid ${V.border}`, borderRadius:14 }}>
            <div style={{ fontSize:32, marginBottom:10 }}>💼</div>
            <div style={{ fontWeight:500, marginBottom:8 }}>Nenhum cargo cadastrado</div>
            <button onClick={() => setModalOpen(true)} style={{ background:V.accent, border:'none', color:'white', padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:12 }}>+ Cadastrar primeiro cargo</button>
          </div>
        ) : (
          <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ background:V.surface2 }}>
                  {['Nome do Cargo','Departamento','Faixa I','Faixa II','Faixa III','Faixa IV','Faixa V','Colaboradores','Ações'].map(h => (
                    <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {cargos.map(c => (
                    <tr key={c.id} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)` }} onMouseEnter={e=>e.currentTarget.style.background='rgba(26,58,143,0.03)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <td style={{ padding:'12px 14px', fontWeight:600 }}>{c.nome}</td>
                      <td style={{ padding:'12px 14px' }}>{c.departamento ? <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:`${V.accent}12`, color:V.accent, fontWeight:500 }}>{c.departamento}</span> : <span style={{ color:V.muted2 }}>—</span>}</td>
                      {['faixa_i','faixa_ii','faixa_iii','faixa_iv','faixa_v'].map(f => (
                        <td key={f} style={{ padding:'12px 14px', fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:600, color:c[f]?V.text:V.muted2 }}>{fmt(c[f])}</td>
                      ))}
                      <td style={{ padding:'12px 14px', textAlign:'center' }}><span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14 }}>{c.total_colaboradores || 0}</span></td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button title="Editar" onClick={() => { setEditando(c); setModalOpen(true); }} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=V.accent;e.currentTarget.style.color=V.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;e.currentTarget.style.color=V.muted2;}}>✏</button>
                          <button title="Excluir" onClick={() => handleDelete(c.id)} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=V.red;e.currentTarget.style.color=V.red;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;e.currentTarget.style.color=V.muted2;}}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            {[{label:'Aderentes',val:cnt.aderente,color:V.green},{label:'Abaixo',val:cnt.abaixo,color:V.red},{label:'Acima',val:cnt.acima,color:V.orange},{label:'Sem dados',val:cnt.sem_dados,color:V.muted2}].map((k, i) => (
              <div key={i} style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:12, padding:18 }}>
                <div style={{ fontSize:11, color:V.muted, marginBottom:8 }}>{k.label}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:k.color }}>{k.val}</div>
              </div>
            ))}
          </div>
          <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, overflow:'hidden' }}>
            {aderencia.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:V.muted2, fontSize:13 }}>Vincule colaboradores a cargos para ver o relatório de aderência.</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:V.surface2 }}>
                    {['Colaborador','Cargo','Faixa','Salário Atual','Referência','Diferença','Status'].map(h => (
                      <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {aderencia.map(a => {
                      const diff = a.salario_atual && a.salario_referencia ? parseFloat(a.salario_atual) - parseFloat(a.salario_referencia) : null;
                      return (
                        <tr key={a.id} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)` }} onMouseEnter={e=>e.currentTarget.style.background='rgba(26,58,143,0.03)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <td style={{ padding:'12px 14px', fontWeight:500 }}>{a.nome}</td>
                          <td style={{ padding:'12px 14px', color:V.muted }}>{a.cargo_nome || a.cargo_texto || '—'}</td>
                          <td style={{ padding:'12px 14px', textAlign:'center' }}>{a.faixa_atual ? <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:`${V.accent}12`, color:V.accent, fontWeight:700 }}>{a.faixa_atual}</span> : '—'}</td>
                          <td style={{ padding:'12px 14px', fontWeight:600 }}>{fmt(a.salario_atual)}</td>
                          <td style={{ padding:'12px 14px', color:V.muted }}>{fmt(a.salario_referencia)}</td>
                          <td style={{ padding:'12px 14px', fontWeight:700, color:diff===null?V.muted2:diff<0?V.red:diff>0?V.orange:V.green }}>{diff === null ? '—' : `${diff >= 0 ? '+' : ''}R$ ${diff.toLocaleString('pt-BR', { minimumFractionDigits:2 })}`}</td>
                          <td style={{ padding:'12px 14px' }}><span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:600, background:`${adColor(a.status_aderencia)}18`, color:adColor(a.status_aderencia) }}>{adLabel(a.status_aderencia)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      <ModalCargo open={modalOpen} onClose={() => { setModalOpen(false); setEditando(null); }} onSaved={fetchAll} cargo={editando}/>
    </div>
  );
}

// ─── PAINEL PRINCIPAL ─────────────────────────────────────────────
export default function PanelColaboradores() {
  const [subTab, setSubTab]           = useState('lista');
  const [colaboradores, setColaboradores] = useState([]);
  const [lista, setLista]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [busca, setBusca]             = useState('');
  const [filtStatus, setFiltStatus]   = useState('ativo');
  const [filtDepto, setFiltDepto]     = useState('');
  const [modalForm, setModalForm]     = useState(false);
  const [modalCSV, setModalCSV]       = useState(false);
  const [editando, setEditando]       = useState(null);
  const [desligando, setDesligando]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletandoId, setDeletandoId] = useState(null);

  const fetchLista = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...(filtStatus&&{status:filtStatus}), ...(filtDepto&&{departamento:filtDepto}), ...(busca&&{busca}) });
      const res  = await fetch(`${BASE_URL}/colaboradores?${params}`, { headers:{ 'Authorization':`Bearer ${getToken()}` } });
      const data = await res.json();
      setLista(data.data || []); setTotal(data.total || 0); setPages(data.pages || 1);
    } catch { setLista([]); } finally { setLoading(false); }
  };

  const loadColaboradores = () => {
    fetch(`${BASE_URL}/colaboradores?status=ativo&limit=200`, { headers:{ 'Authorization':`Bearer ${getToken()}` } })
      .then(r => r.ok ? r.json() : { data:[] })
      .then(d => setColaboradores(d.data || []));
  };

  useEffect(() => { fetchLista(1); setPage(1); }, [filtStatus, filtDepto, busca]);
  useEffect(() => { loadColaboradores(); }, []);

  const handleDelete = async (id) => {
    setDeletandoId(id);
    try { await fetch(`${BASE_URL}/colaboradores/${id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${getToken()}` } }); fetchLista(); loadColaboradores(); }
    catch {} finally { setDeletandoId(null); setConfirmDelete(null); }
  };

  const handleExport = () => { window.open(`${BASE_URL}/colaboradores/export-csv?token=${getToken()}`, '_blank'); };
  const genderIcon   = g => g === 'Feminino' ? '♀' : g === 'Masculino' ? '♂' : '—';
  const deptos = ['Comercial','Financeiro','Marketing','Logística','Operações','TI','RH','Jurídico','Produto','Outros'];

  return (
    <div>
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`1px solid ${V.border}`, overflowX:'auto' }}>
        {[['lista','👥 Lista'],['avaliacao','📋 Avaliação de Desempenho'],['cargos','💼 Cargos e Salários']].map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{ padding:'10px 22px', fontSize:13, fontWeight:500, cursor:'pointer', border:'none', background:'none', whiteSpace:'nowrap', borderBottom:`2px solid ${subTab===id?V.accent:'transparent'}`, color:subTab===id?V.accent:V.muted, transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif" }}>{label}</button>
        ))}
      </div>

      {subTab === 'lista' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:V.text }}>Colaboradores</div>
              <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>{total.toLocaleString('pt-BR')} {filtStatus==='ativo'?'ativos':filtStatus==='desligado'?'desligados':'total'}</div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={() => setModalCSV(true)} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12 }}>📥 Importar CSV</button>
              <button onClick={handleExport}            style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:12 }}>📤 Exportar</button>
              <button onClick={() => { setEditando(null); setModalForm(true); }} style={{ background:V.accent, border:'none', color:'white', padding:'9px 18px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>+ Novo Colaborador</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar por nome ou cargo..." style={{ flex:'1 1 220px', background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 14px', color:V.text, fontSize:12, outline:'none' }} onFocus={e=>e.target.style.borderColor=V.accent} onBlur={e=>e.target.style.borderColor=V.border}/>
            <select value={filtStatus} onChange={e => setFiltStatus(e.target.value)} style={{ background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:12, outline:'none', cursor:'pointer' }}>
              <option value="ativo">Ativos</option><option value="desligado">Desligados</option><option value="">Todos</option>
            </select>
            <select value={filtDepto} onChange={e => setFiltDepto(e.target.value)} style={{ background:V.surface2, border:`1px solid ${V.border}`, borderRadius:8, padding:'9px 12px', color:V.text, fontSize:12, outline:'none', cursor:'pointer' }}>
              <option value="">Todos os deptos</option>
              {deptos.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:12, overflow:'hidden' }}>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, flexDirection:'column', gap:12 }}>
                <div style={{ width:28, height:28, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
                <span style={{ fontSize:13, color:V.muted }}>Carregando...</span>
              </div>
            ) : lista.length === 0 ? (
              <div style={{ textAlign:'center', padding:48, color:V.muted2 }}>
                <div style={{ fontSize:36, marginBottom:10 }}>👥</div>
                <div style={{ fontWeight:500, marginBottom:8 }}>Nenhum colaborador encontrado</div>
                <button onClick={() => setModalForm(true)} style={{ background:V.accent, border:'none', color:'white', padding:'9px 20px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>+ Cadastrar primeiro colaborador</button>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:V.surface2 }}>
                    {['Colaborador','Cargo','Departamento','Admissão','Gênero','Salário','Status','Ações'].map(h => (
                      <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:V.muted, fontWeight:500, borderBottom:`1px solid ${V.border}`, fontSize:11, textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {lista.map((c, i) => {
                      const initials = c.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                      const admDate  = c.data_admissao ? new Date(c.data_admissao).toLocaleDateString('pt-BR') : '—';
                      const salario  = c.salario ? `R$ ${parseFloat(c.salario).toLocaleString('pt-BR', { minimumFractionDigits:2 })}` : '—';
                      return (
                        <tr key={c.id} style={{ borderBottom:`1px solid rgba(226,232,244,0.5)`, transition:'background 0.15s', animation:`fadeUp 0.3s ease ${i * 0.03}s both` }} onMouseEnter={e=>e.currentTarget.style.background='rgba(26,58,143,0.03)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:32, height:32, borderRadius:8, background:`${V.accent}18`, color:V.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{initials}</div>
                              <div>
                                <div style={{ fontWeight:500, fontSize:13 }}>{c.nome}</div>
                                {c.email && <div style={{ fontSize:10, color:V.muted }}>{c.email}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px' }}>{c.cargo || '—'}</td>
                          <td style={{ padding:'12px 14px' }}>{c.departamento ? <span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, background:`${V.accent}12`, color:V.accent, fontWeight:500 }}>{c.departamento}</span> : '—'}</td>
                          <td style={{ padding:'12px 14px', color:V.muted, whiteSpace:'nowrap' }}>{admDate}</td>
                          <td style={{ padding:'12px 14px', color:V.muted, textAlign:'center' }}>{genderIcon(c.genero)}</td>
                          <td style={{ padding:'12px 14px', fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:12 }}>{salario}</td>
                          <td style={{ padding:'12px 14px' }}><span style={{ fontSize:10, padding:'3px 9px', borderRadius:20, fontWeight:600, background:c.status==='ativo'?'rgba(16,185,129,0.12)':'rgba(107,114,128,0.12)', color:c.status==='ativo'?V.green:V.muted2 }}>{c.status==='ativo'?'● Ativo':'○ Desligado'}</span></td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', gap:6 }}>
                              <button title="Editar" onClick={() => { setEditando(c); setModalForm(true); }} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=V.accent;e.currentTarget.style.color=V.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;e.currentTarget.style.color=V.muted2;}}>✏</button>
                              {c.status === 'ativo' && <button title="Desligar" onClick={() => setDesligando(c)} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=V.orange;e.currentTarget.style.color=V.orange;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;e.currentTarget.style.color=V.muted2;}}>🚪</button>}
                              {confirmDelete === c.id ? (
                                <div style={{ display:'flex', gap:4 }}>
                                  <button onClick={() => handleDelete(c.id)} disabled={deletandoId === c.id} style={{ background:V.red, border:'none', color:'white', padding:'4px 8px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:600 }}>{deletandoId === c.id ? '...' : 'Sim'}</button>
                                  <button onClick={() => setConfirmDelete(null)} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, padding:'4px 8px', borderRadius:6, cursor:'pointer', fontSize:10 }}>Não</button>
                                </div>
                              ) : (
                                <button title="Excluir" onClick={() => setConfirmDelete(c.id)} style={{ background:'none', border:`1px solid ${V.border}`, color:V.muted2, width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=V.red;e.currentTarget.style.color=V.red;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=V.border;e.currentTarget.style.color=V.muted2;}}>🗑</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {pages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:16 }}>
              <button onClick={() => { const p = Math.max(1, page-1); setPage(p); fetchLista(p); }} disabled={page===1} style={{ background:'none', border:`1px solid ${V.border}`, color:page===1?V.muted2:V.text, padding:'6px 14px', borderRadius:8, cursor:page===1?'default':'pointer', fontSize:12 }}>‹ Anterior</button>
              <span style={{ fontSize:12, color:V.muted }}>Página {page} de {pages} · {total} registros</span>
              <button onClick={() => { const p = Math.min(pages, page+1); setPage(p); fetchLista(p); }} disabled={page===pages} style={{ background:'none', border:`1px solid ${V.border}`, color:page===pages?V.muted2:V.text, padding:'6px 14px', borderRadius:8, cursor:page===pages?'default':'pointer', fontSize:12 }}>Próxima ›</button>
            </div>
          )}
          <ModalColaborador open={modalForm} onClose={() => { setModalForm(false); setEditando(null); }} onSaved={() => { fetchLista(); loadColaboradores(); }} colaborador={editando}/>
          <ModalImportCSV open={modalCSV} onClose={() => setModalCSV(false)} onDone={() => { fetchLista(); loadColaboradores(); }}/>
          {desligando && <ModalDesligar colaborador={desligando} onClose={() => setDesligando(null)} onSaved={() => { fetchLista(); setDesligando(null); loadColaboradores(); }}/>}
        </div>
      )}
      {subTab === 'avaliacao' && <SubAvaliacoes colaboradores={colaboradores}/>}
      {subTab === 'cargos'    && <SubCargosSalarios/>}
    </div>
  );
}
