// src/components/SkillsEditor.jsx — Conecta Lagoa
// Componente para candidato preencher skills estruturadas + nível de senioridade + anos de exp.
// Usado no perfil do candidato (CandidatoDashboard ou página de perfil).
//
// Props:
//   skills: array de strings ou { nome, nivel }
//   onChange: (novas_skills) => void
//   disabled?: boolean

import { useState } from 'react';

const C = {
  navy: '#1a3a8f', blue: '#2d52c4', gray100: '#f1f5f9',
  gray200: '#e2e8f0', gray400: '#94a3b8', gray600: '#475569', gray900: '#0f172a',
  green: '#10b981', red: '#ef4444',
};

const NIVEIS = ['básico', 'intermediário', 'avançado', 'especialista'];
const SUGESTOES = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'Excel',
  'Power BI', 'Photoshop', 'Figma', 'Git', 'AWS', 'Docker', 'Java', 'PHP',
  'Marketing Digital', 'SEO', 'Gestão de Projetos', 'Scrum', 'Atendimento ao Cliente',
];

export default function SkillsEditor({ skills = [], onChange, disabled }) {
  const [input, setInput] = useState('');

  // Normaliza: aceita strings ou { nome, nivel }
  const lista = skills.map(s => typeof s === 'string' ? { nome: s, nivel: 'intermediário' } : s);

  const adicionar = (nome) => {
    const n = nome.trim();
    if (!n || lista.some(s => s.nome.toLowerCase() === n.toLowerCase())) return;
    onChange([...lista, { nome: n, nivel: 'intermediário' }]);
    setInput('');
  };

  const remover = (idx) => {
    onChange(lista.filter((_, i) => i !== idx));
  };

  const alterarNivel = (idx, nivel) => {
    onChange(lista.map((s, i) => i === idx ? { ...s, nivel } : s));
  };

  const sugestoesLivres = SUGESTOES.filter(
    s => !lista.some(l => l.nome.toLowerCase() === s.toLowerCase())
  ).slice(0, 8);

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Input de nova skill */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionar(input))}
          placeholder="Digite uma skill e pressione Enter..."
          disabled={disabled}
          style={{
            flex: 1, padding: '9px 14px', borderRadius: 8, border: `1px solid ${C.gray200}`,
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={() => adicionar(input)}
          disabled={disabled || !input.trim()}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none', background: C.blue,
            color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
          }}
        >
          + Adicionar
        </button>
      </div>

      {/* Sugestões rápidas */}
      {sugestoesLivres.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.gray400, marginBottom: 8 }}>Sugestões:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sugestoesLivres.map(s => (
              <button
                key={s}
                onClick={() => adicionar(s)}
                disabled={disabled}
                style={{
                  background: C.gray100, border: `1px dashed ${C.gray200}`, borderRadius: 20,
                  padding: '3px 12px', fontSize: 12, cursor: 'pointer', color: C.gray600,
                  fontFamily: 'inherit', transition: 'all .1s',
                }}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de skills */}
      {lista.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map((skill, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: C.gray100, borderRadius: 8, padding: '8px 12px',
              }}
            >
              <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{skill.nome}</div>

              {/* Seletor de nível */}
              <div style={{ display: 'flex', gap: 4 }}>
                {NIVEIS.map(n => (
                  <button
                    key={n}
                    onClick={() => alterarNivel(idx, n)}
                    disabled={disabled}
                    style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, border: 'none',
                      cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      background: skill.nivel === n ? C.blue : '#fff',
                      color: skill.nivel === n ? '#fff' : C.gray400,
                      transition: 'all .1s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={() => remover(idx)}
                disabled={disabled}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.gray400, fontSize: 18, lineHeight: 1, padding: '0 4px',
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {lista.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '20px 0', color: C.gray400,
          fontSize: 13, border: `1px dashed ${C.gray200}`, borderRadius: 8,
        }}>
          Nenhuma skill adicionada. Suas skills melhoram o score de compatibilidade com as vagas.
        </div>
      )}
    </div>
  );
}
