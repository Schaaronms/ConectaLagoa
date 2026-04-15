// PanelIndicadoresRH.jsx — Conecta Lagoa
import { useState, useEffect } from 'react';
import { V, BASE_URL, getToken } from './shared';

const RH_MOCK = {
  headcount:     { total:1432, feminino:631, masculino:801, outro:0 },
  admissoes:     { total:1831, yoy:27, yoy_up:true  },
  desligamentos: { total:399,  yoy:66, yoy_up:false },
  turnover: 28,
  por_departamento: [
    { departamento:'Comercial',  total:579 },
    { departamento:'Financeiro', total:521 },
    { departamento:'Marketing',  total:273 },
    { departamento:'Logística',  total:106 },
    { departamento:'Operações',  total:66  },
    { departamento:'TI',         total:101 },
  ],
  evolucao_anual: [
    { ano:2019, admissoes:130 }, { ano:2020, admissoes:105 }, { ano:2021, admissoes:262 },
    { ano:2022, admissoes:243 }, { ano:2023, admissoes:310 }, { ano:2024, admissoes:287 },
  ],
  faixa_etaria: [
    { faixa:'18-25', total:270 }, { faixa:'26-35', total:330 }, { faixa:'36-45', total:318 },
    { faixa:'46-54', total:343 }, { faixa:'55+',   total:378 },
  ],
};

function DonutChart({ value, total }) {
  const R = 52, circ = 2 * Math.PI * R;
  const dash = total > 0 ? (value / total) * circ : 0;
  return (
    <div style={{ position:'relative', width:140, height:140, flexShrink:0 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={R} fill="none" stroke={V.surface2} strokeWidth="14"/>
        <circle cx="70" cy="70" r={R} fill="none" stroke={V.accent} strokeWidth="14"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
        <div style={{ fontSize:10, marginBottom:2 }}>👥</div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:V.text, lineHeight:1 }}>{total.toLocaleString('pt-BR')}</div>
        <div style={{ fontSize:9, color:V.muted, textTransform:'uppercase', letterSpacing:'0.05em', marginTop:2 }}>Headcount</div>
      </div>
    </div>
  );
}

function HBar({ label, value, total, color, index }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, animation:`fadeUp 0.4s ease ${index * 0.05}s both` }}>
      <div style={{ fontSize:12, color:V.text, minWidth:100, textAlign:'right' }}>{label}</div>
      <div style={{ flex:1, height:22, background:V.surface2, borderRadius:4, overflow:'hidden', position:'relative' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4, transition:'width 0.8s ease', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:6 }}>
          {pct > 20 && <span style={{ fontSize:10, color:'white', fontWeight:600 }}>{value.toLocaleString('pt-BR')}</span>}
        </div>
        {pct <= 20 && <span style={{ position:'absolute', left:`${pct + 1}%`, top:'50%', transform:'translateY(-50%)', fontSize:10, color:V.muted, fontWeight:500 }}>{value.toLocaleString('pt-BR')} ({Math.round(pct)}%)</span>}
      </div>
      <div style={{ fontSize:11, color:V.muted2, minWidth:40, textAlign:'right' }}>{Math.round(pct)}%</div>
    </div>
  );
}

function BarChartAnual({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.admissoes));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:120, paddingTop:8 }}>
      {data.map((d, i) => {
        const pct   = max > 0 ? (d.admissoes / max) * 100 : 0;
        const prev  = i > 0 ? data[i-1].admissoes : d.admissoes;
        const delta = i > 0 ? Math.round(((d.admissoes - prev) / prev) * 100) : null;
        return (
          <div key={d.ano} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
            {delta !== null && <div style={{ fontSize:9, color:delta >= 0 ? V.green : V.red, fontWeight:600 }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%</div>}
            <div style={{ fontSize:10, fontWeight:700, color:V.text }}>{d.admissoes}</div>
            <div style={{ width:'100%', background:`linear-gradient(180deg, ${V.accent2}, ${V.accent})`, borderRadius:'4px 4px 0 0', height:`${Math.max(pct, 8)}%`, transition:'height 0.7s ease', cursor:'default' }}
              onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(180deg, ${V.accent3}, ${V.accent})`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(180deg, ${V.accent2}, ${V.accent})`; }}/>
            <div style={{ fontSize:9, color:V.muted }}>{d.ano}</div>
          </div>
        );
      })}
    </div>
  );
}

function RHMetricCard({ icon, label, value, yoy, yoyUp, delay }) {
  return (
    <div style={{ background:'rgba(173,216,255,0.08)', border:`1px solid rgba(173,216,255,0.25)`, borderRadius:14, padding:'18px 20px', animation:`fadeUp 0.5s ease ${delay}s both`, transition:'all 0.25s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(26,58,143,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:34, height:34, borderRadius:8, background:'rgba(173,216,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</div>
        <div style={{ fontSize:10, color:V.muted, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:500 }}>{label}</div>
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:30, color:V.text, lineHeight:1, marginBottom:8 }}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:yoyUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color:yoyUp ? V.green : V.red }}>
        {yoyUp ? '▲' : '▼'} YOY: {Math.abs(yoy)}%
      </div>
    </div>
  );
}

const DEPT_COLORS = [V.accent, V.accent2, V.accent3, V.green, '#7c3aed', '#c96a00'];

export default function PanelIndicadoresRH() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/empresa/indicadores-rh`, {
          headers: { 'Authorization': `Bearer ${getToken()}` },
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!json.headcount || json.headcount.total === 0) { setData(null); }
        else { setData(json); setIsMock(false); }
      } catch { setData(null); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, flexDirection:'column', gap:16 }}>
      <div style={{ width:36, height:36, border:`3px solid ${V.border}`, borderTop:`3px solid ${V.accent}`, borderRadius:'50%', animation:'clSpin 0.8s linear infinite' }}/>
      <p style={{ color:V.muted, fontSize:14 }}>Carregando indicadores...</p>
    </div>
  );

  if (!data) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, flexDirection:'column', gap:12, background:'#fff', borderRadius:12, border:`1px solid ${V.border}` }}>
      <span style={{ fontSize:36, opacity:0.3 }}>📈</span>
      <div style={{ fontWeight:600, fontSize:14, color:V.text }}>Nenhum dado de RH disponível</div>
      <div style={{ fontSize:12, color:V.muted, textAlign:'center', lineHeight:1.6 }}>Os indicadores aparecerão aqui quando houver<br/>colaboradores cadastrados na plataforma.</div>
    </div>
  );

  const d = data;
  const maxDepto = Math.max(...(d.por_departamento || []).map(x => parseInt(x.total)));
  const maxFaixa = Math.max(...(d.faixa_etaria || []).map(x => parseInt(x.total)));

  return (
    <div>
      {isMock && (
        <div style={{ marginBottom:20, padding:'10px 16px', borderRadius:10, background:'rgba(224,123,0,0.1)', border:`1px solid rgba(224,123,0,0.25)`, fontSize:12, color:V.orange, display:'flex', alignItems:'center', gap:8 }}>
          <span>⚠️</span>
          <span><strong>Dados de demonstração.</strong> Cadastre colaboradores para ver seus dados reais.</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:14, marginBottom:20, alignItems:'stretch' }}>
        <RHMetricCard icon="🧑‍🤝‍🧑" label="Admissões"     value={d.admissoes.total}     yoy={d.admissoes.yoy}     yoyUp={d.admissoes.yoy_up}     delay={0.05}/>
        <RHMetricCard icon="🚪"       label="Desligamentos" value={d.desligamentos.total} yoy={d.desligamentos.yoy} yoyUp={d.desligamentos.yoy_up} delay={0.1}/>

        <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:'18px 20px', animation:'fadeUp 0.5s ease 0.15s both' }}>
          <div style={{ fontSize:10, color:V.muted, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:500, marginBottom:10 }}>📉 Turnover</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:36, color:V.text, lineHeight:1, marginBottom:6 }}>{d.turnover}%</div>
          <div style={{ height:6, background:V.surface2, borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, width:`${Math.min(d.turnover, 100)}%`, background:d.turnover > 20 ? V.red : d.turnover > 10 ? V.orange : V.green, transition:'width 1s ease' }}/>
          </div>
          <div style={{ fontSize:10, color:V.muted, marginTop:4 }}>{d.turnover > 20 ? '⚠ Alto — atenção' : d.turnover > 10 ? '⚡ Moderado' : '✓ Saudável'}</div>
        </div>

        <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:'18px 20px', display:'flex', flexDirection:'column', alignItems:'center', animation:'fadeUp 0.5s ease 0.2s both' }}>
          <div style={{ fontSize:10, color:V.muted, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:500, marginBottom:10 }}>Headcount Total</div>
          <DonutChart value={d.headcount.feminino} total={d.headcount.total}/>
          <div style={{ display:'flex', gap:14, marginTop:10 }}>
            {[{ label:'Feminino', val:d.headcount.feminino, color:V.accent }, { label:'Masculino', val:d.headcount.masculino, color:V.border }].map(g => (
              <div key={g.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:g.color }}/>
                <span style={{ color:V.muted }}>{g.label}</span>
                <span style={{ fontWeight:700, color:V.text }}>{g.val} ({d.headcount.total > 0 ? Math.round((g.val/d.headcount.total)*100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22, animation:'fadeUp 0.5s ease 0.25s both' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:V.text }}>Evolução de Colaboradores</div>
              <div style={{ fontSize:11, color:V.muted, marginTop:2 }}>Admissões por ano</div>
            </div>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, fontWeight:600, background:'rgba(26,58,143,0.1)', color:V.accent }}>Anual</span>
          </div>
          <BarChartAnual data={d.evolucao_anual}/>
        </div>

        <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22, animation:'fadeUp 0.5s ease 0.3s both' }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, marginBottom:4, color:V.text }}>Por Departamento</div>
          <div style={{ fontSize:11, color:V.muted, marginBottom:18 }}>Total: {d.headcount.total.toLocaleString('pt-BR')} ativos</div>
          {(d.por_departamento || []).map((dep, i) => (
            <HBar key={dep.departamento} label={dep.departamento} value={parseInt(dep.total)} total={maxDepto} color={DEPT_COLORS[i % DEPT_COLORS.length]} index={i}/>
          ))}
        </div>
      </div>

      <div style={{ background:V.surface, border:`1px solid ${V.border}`, borderRadius:14, padding:22, animation:'fadeUp 0.5s ease 0.35s both' }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, marginBottom:4, color:V.text }}>Faixa Etária</div>
        <div style={{ fontSize:11, color:V.muted, marginBottom:18 }}>Distribuição atual</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12 }}>
          {(d.faixa_etaria || []).map((f, i) => {
            const pct    = d.headcount.total > 0 ? Math.round((parseInt(f.total) / d.headcount.total) * 100) : 0;
            const height = maxFaixa > 0 ? Math.max((parseInt(f.total) / maxFaixa) * 120, 12) : 12;
            return (
              <div key={f.faixa} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, animation:`fadeUp 0.4s ease ${i * 0.06}s both` }}>
                <div style={{ fontSize:11, fontWeight:700, color:V.text }}>{pct}%</div>
                <div style={{ fontSize:10, color:V.muted }}>{parseInt(f.total).toLocaleString('pt-BR')}</div>
                <div style={{ width:'100%', background:`linear-gradient(180deg, ${V.accent2}99, ${V.accent})`, borderRadius:'6px 6px 0 0', height:`${height}px`, transition:'height 0.8s ease', minHeight:8 }}/>
                <div style={{ fontSize:12, fontWeight:600, color:V.text }}>{f.faixa}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
