// index.tsx — Preview Single-File (sem decorators)
// Refinos da tela Captar: seeds, validações, atalhos (Efetivar, Reembolso, Transferir), toasts e diagnósticos.
// Mantém: menu na ordem pedida, tabela de percentuais (M5 Emergencial=10,0%), testes runtime.

import * as React from 'react';

// ==========================
// Tipos básicos
// ==========================
 type Grau = 'SUB'|'M1'|'M2'|'M3'|'M4'|'M5';
 type Percentuais = Record<'FIDELIDADE'|'ESSENCIAL'|'INCREMENTAL'|'COBERTURA'|'EMERGENCIAL'|'PROJETOS'|'AMENIDADES', number>;
 type TabelaPercentuais = Record<Grau, Percentuais>;
 type FidelidadeKey = 'DIZIMO'|'PACTO'|'MISSAO'|'HUMANITARIA'|'DIVERSAS';
 type TabelaFidelidade = Record<Grau, Record<FidelidadeKey, number>>;

 // Seeds (categorias para classificação de lançamentos)
 type CategoriaSeedId = 'FIDELIDADE'|'ESSENCIAL'|'INCREMENTAL'|'COBERTURA'|'EMERGENCIAL'|'PROJETOS'|'AMENIDADES'|'MANEJO'|'RENDA';
 type Subcat = { id:string; nome:string; visivel:boolean; lockName?:boolean };
 type CategoriaSeed = { id:CategoriaSeedId; nome:string; bloqueadaNoGratuito:true; subcats: Subcat[] };

 type MovType = 'Entrada'|'Saída'|'manejo'; // conforme especificação (case exato)
 type Modalidade = 'Boleto'|'C. Crédito'|'C. Débito'|'DDA'|'Depósito Imediato'|'DOC/TED'|'Espécie'|'PIX'|'Cartão de Transporte'|'Saque'|'TEF'|'Transferência Eletrônica';
 type Parte = 'Usuário'|'Prestador'|'Fornecedor'|'Pagador'|'Recebedor'|'Doador';

 // Registro (simplificado para preview)
 type Lanc = {
  internalId: string; // local
  indice: string; // 0001 sequencial por ano
  item: string;
  marca?: string; modelo?: string; unidade?: string; quantidade?: number; objeto?: string;
  dataAquis: string; // YYYY-MM-DD
  dataVenc?: string; // YYYY-MM-DD
  dataMov?: string;  // YYYY-MM-DD
  mov: MovType;
  valor: number; // positivo padrão; reembolso negativo conforme regra
  modalidade?: Modalidade;
  origem: string; destino: string; pagador: Parte; recebedor: Parte;
  categoria: CategoriaSeedId; subcategoria: string;
  obs?: string;
 };

// ==========================
// Tabela acordada (valores em %)
// ==========================
const PERCENTUAIS: TabelaPercentuais = {
  SUB: { FIDELIDADE:20.000, ESSENCIAL:70.000, INCREMENTAL:5.000, COBERTURA:1.000, EMERGENCIAL:2.000, PROJETOS:1.000, AMENIDADES:1.000 },
  M1:  { FIDELIDADE:20.000, ESSENCIAL:45.000, INCREMENTAL:10.000, COBERTURA:10.000, EMERGENCIAL:5.000, PROJETOS:5.000, AMENIDADES:5.000 },
  M2:  { FIDELIDADE:22.500, ESSENCIAL:40.000, INCREMENTAL:10.625, COBERTURA:10.625, EMERGENCIAL:6.250, PROJETOS:5.000, AMENIDADES:5.000 },
  M3:  { FIDELIDADE:25.000, ESSENCIAL:35.000, INCREMENTAL:11.250, COBERTURA:11.250, EMERGENCIAL:7.500, PROJETOS:5.000, AMENIDADES:5.000 },
  M4:  { FIDELIDADE:27.500, ESSENCIAL:30.000, INCREMENTAL:11.875, COBERTURA:11.875, EMERGENCIAL:8.750, PROJETOS:5.000, AMENIDADES:5.000 },
  M5:  { FIDELIDADE:30.000, ESSENCIAL:25.000, INCREMENTAL:12.500, COBERTURA:12.500, EMERGENCIAL:10.000, PROJETOS:5.000, AMENIDADES:5.000 },
};

const FIDELIDADE_DETALHE: TabelaFidelidade = {
  SUB: { DIZIMO:10.000, PACTO:4.000, MISSAO:2.000, HUMANITARIA:2.000, DIVERSAS:2.000 },
  M1:  { DIZIMO:10.000, PACTO:4.000, MISSAO:2.000, HUMANITARIA:2.000, DIVERSAS:2.000 },
  M2:  { DIZIMO:10.000, PACTO:4.000, MISSAO:3.000, HUMANITARIA:3.000, DIVERSAS:2.500 },
  M3:  { DIZIMO:10.000, PACTO:4.000, MISSAO:4.000, HUMANITARIA:4.000, DIVERSAS:3.000 },
  M4:  { DIZIMO:10.000, PACTO:5.000, MISSAO:4.500, HUMANITARIA:4.500, DIVERSAS:3.500 },
  M5:  { DIZIMO:10.000, PACTO:5.000, MISSAO:5.000, HUMANITARIA:5.000, DIVERSAS:5.000 },
};

// ==========================
// Helpers utilitários
// ==========================
const BRL = (v:number)=> v.toLocaleString('pt-BR',{ style:'currency', currency:'BRL' });
// Moeda em centavos (int) para PERSISTÊNCIA (domínio).
// A UI pode seguir trabalhando em reais (number) e convertemos na borda (save/render).
const toCents = (v:number)=> Math.round((v||0)*100);
const fromCents = (c:number)=> (c||0)/100;

const pad4 = (n:number)=> String(n).padStart(4,'0');
const sameDay = (a?:string,b?:string)=> !!a && !!b && new Date(a).toDateString()===new Date(b).toDateString();
function grauDeMeta(renda:number): Grau {
  const [L1,L2,L3,L4,L5] = getLimites();
  if (renda <= L1) return 'SUB';
  if (renda <= L2) return 'M1';
  if (renda <= L3) return 'M2';
  if (renda <= L4) return 'M3';
  if (renda <= L5) return 'M4';
  return 'M5';
}

// Autofill de Vencimento no salvar
function autoVencimentoOnSave(dataAquis:string, dataMov?:string, dataVenc?:string){
  if (dataVenc && dataVenc.trim()!=='') return dataVenc;
  if (dataMov && dataMov.trim()!=='') return dataMov;
  return dataAquis; // se ambos vazios, copia Aquisição
}

// Índice sequencial por ano
function nextIndiceForYear(existing: Lanc[], dateAquis: string){
  const year = new Date(dateAquis).getFullYear();
  const last = existing.filter(l=> new Date(l.dataAquis).getFullYear()===year)
                       .map(l=> parseInt(l.indice,10))
                       .reduce((m,n)=> Math.max(m,n), 0);
  return pad4(last+1);
}

// Duplicata (±3 dias, mesmo valor, origem, destino, item, obs)

// Normalizador de strings para checagem de duplicata
const normalize = (s?:string)=> (s||'').trim().toLowerCase();
function isDuplicate(existing: Lanc[], candidate: Lanc){
  if(!candidate.dataMov) return false;
  const movDate = new Date(candidate.dataMov).getTime();
  const win = 3*24*3600*1000;
  return existing.some(l=> {
    if(!l.dataMov) return false;
    const d = new Date(l.dataMov).getTime();
    return Math.abs(d - movDate) <= win
      && l.valor===candidate.valor
      && l.origem===candidate.origem
      && l.destino===candidate.destino
      && normalize(l.item)===normalize(candidate.item)
      && normalize(l.obs)===normalize(candidate.obs);
  });
}

// Contas do usuário (para manejo)
const CONTAS_USUARIO = ['Espécie A','Espécie B','Banco A P01','Banco B P01','Conta de Pagamento A','Cartão de Transporte P01'];
const PARTES: Parte[] = ['Usuário','Prestador','Fornecedor','Pagador','Recebedor','Doador'];
const MODALIDADES: Modalidade[] = ['Boleto','C. Crédito','C. Débito','DDA','Depósito Imediato','DOC/TED','Espécie','PIX','Cartão de Transporte','Saque','TEF','Transferência Eletrônica'];
const isAccount = (s:string)=> CONTAS_USUARIO.includes(s);

// Classificação assistida (heurística simples)
function sugerirCategoriaSub(item:string): {categoria:CategoriaSeedId; sub:string} | null{
  const t = item.toLowerCase();
  if(t.includes('mercado')||t.includes('supermerc')) return {categoria:'ESSENCIAL', sub:'Supermercado básico'};
  if(t.includes('aluguel')) return {categoria:'ESSENCIAL', sub:'Aluguel/Condomínio'};
  if(t.includes('energia')||t.includes('eletric')) return {categoria:'ESSENCIAL', sub:'Supermercado básico'}; // placeholder de exemplo
  if(t.includes('dízimo')) return {categoria:'FIDELIDADE', sub:'Dízimo (10%)'};
  if(t.includes('oferta')) return {categoria:'FIDELIDADE', sub:'Oferta | Pacto'};
  return null;
}


// ==========================
// Ajustes publicados (Settings) + getters
// ==========================
 type Settings = {
   percentuais: TabelaPercentuais;
   fidelidadeDetalhe: TabelaFidelidade;
   limites: [number, number, number, number, number];
 };
 let currentSettings: Settings = {
   percentuais: PERCENTUAIS,
   fidelidadeDetalhe: FIDELIDADE_DETALHE,
   limites: [1000,4000,7000,10000,13000],
 };
 const getPercentuais = ()=> currentSettings.percentuais;
 const getFidelidade = ()=> currentSettings.fidelidadeDetalhe;
 const getLimites = ()=> currentSettings.limites;

// IndexedDB helper mínimo (sem libs)
const DB_NAME = 'morfin';
const DB_VERSION = 1;
function idbOpen(): Promise<IDBDatabase>{
  return new Promise((resolve, reject)=>{
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = ()=>{
      const db = req.result;
      if(!db.objectStoreNames.contains('lanc')) db.createObjectStore('lanc', { keyPath:'internalId' });
      if(!db.objectStoreNames.contains('ajustes')) db.createObjectStore('ajustes', { keyPath:'key' });
      if(!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath:'id' });
    };
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  });
}
async function idbGetAll(store:string){
  const db = await idbOpen();
  return await new Promise<any[]>((resolve,reject)=>{
    const tx = db.transaction(store,'readonly');
    const st = tx.objectStore(store);
    const req = st.getAll();
    req.onsuccess = ()=> resolve(req.result||[]);
    req.onerror = ()=> reject(req.error);
  });
}
async function idbPut(store:string, obj:any){
  const db = await idbOpen();
  await new Promise<void>((resolve,reject)=>{
    const tx = db.transaction(store,'readwrite');
    const st = tx.objectStore(store);
    const req = st.put(obj);
    req.onsuccess = ()=> resolve();
    req.onerror = ()=> reject(req.error);
  });
}
async function idbBulkPut(store:string, arr:any[]){
  const db = await idbOpen();
  await new Promise<void>((resolve,reject)=>{
    const tx = db.transaction(store,'readwrite');
    const st = tx.objectStore(store);
    arr.forEach(o=> st.put(o));
    tx.oncomplete = ()=> resolve();
    tx.onerror = ()=> reject(tx.error);
  });
}
// ==========================
// Seeds de categorias/subcategorias
// ==========================
function makeSeeds(): CategoriaSeed[] {
  return [
    { id:'FIDELIDADE', nome:'Fidelidade', bloqueadaNoGratuito:true, subcats:[
      { id:'DIZIMO', nome:'Dízimo (10%)', visivel:true, lockName:true },
      { id:'PACTO', nome:'Oferta | Pacto', visivel:true, lockName:true },
      { id:'MISSAO', nome:'Oferta Missionária', visivel:true, lockName:true },
      { id:'HUMANITARIA', nome:'Oferta Humanitária', visivel:true, lockName:true },
      { id:'DIVERSAS', nome:'Ofertas | Diversas', visivel:true, lockName:true },
      { id:'OUTROS_FID', nome:'Outros (Fidelidade)', visivel:true },
    ]},
    { id:'ESSENCIAL', nome:'Essencial', bloqueadaNoGratuito:true, subcats:[
      { id:'ALUGUEL', nome:'Aluguel/Condomínio', visivel:true },
      { id:'MERCADO', nome:'Supermercado básico', visivel:true },
      { id:'MEDIC', nome:'Medicamentos contínuos', visivel:true },
      { id:'TRANS', nome:'Transporte diário', visivel:true },
    ]},
    { id:'INCREMENTAL', nome:'Incremental', bloqueadaNoGratuito:true, subcats:[
      { id:'EDUC', nome:'Educação/Cursos', visivel:true },
      { id:'LIVROS', nome:'Livros', visivel:true },
      { id:'FERR', nome:'Ferramentas trabalho/estudo', visivel:true },
    ]},
    { id:'COBERTURA', nome:'Cobertura', bloqueadaNoGratuito:true, subcats:[
      { id:'SEGUROS', nome:'Seguros (vida/auto)', visivel:true },
      { id:'IMPOSTOS', nome:'Impostos/Anuidades', visivel:true },
      { id:'MANUT', nome:'Manutenção obrigatória', visivel:true },
    ]},
    { id:'EMERGENCIAL', nome:'Emergencial', bloqueadaNoGratuito:true, subcats:[
      { id:'FUNDO', nome:'Fundo emergencial', visivel:true },
      { id:'PROV', nome:'Provisões de curto prazo', visivel:true },
    ]},
    { id:'PROJETOS', nome:'Projetos', bloqueadaNoGratuito:true, subcats:[
      { id:'REFORMA', nome:'Reforma', visivel:true },
      { id:'VIAGEM', nome:'Viagem', visivel:true },
      { id:'AQUIS', nome:'Aquisição relevante', visivel:true },
    ]},
    { id:'AMENIDADES', nome:'Amenidades', bloqueadaNoGratuito:true, subcats:[
      { id:'PASSEIOS', nome:'Passeios', visivel:true },
      { id:'PRESENTES', nome:'Presentes', visivel:true },
      { id:'ENTRETEN', nome:'Entretenimento', visivel:true },
    ]},
    { id:'MANEJO', nome:'Manejo', bloqueadaNoGratuito:true, subcats:[
      { id:'MOV', nome:'Movimento', visivel:true, lockName:true },
    ]},
    { id:'RENDA', nome:'Renda', bloqueadaNoGratuito:true, subcats:[
      { id:'RENDA', nome:'Renda', visivel:true, lockName:true },
    ]},
  ];
}

// ==========================
// Toasts simples
// ==========================
 type Toast = { id:number; text:string };
 const ToastCtx = React.createContext<{ push:(text:string)=>void }|null>(null);
 function ToastProvider({children}:{children:React.ReactNode}){
  const [items, setItems] = React.useState<Toast[]>([]);
  const push = (text:string)=>{
    const id = Date.now()+Math.random();
    setItems(prev=>[...prev, {id, text}]);
    setTimeout(()=> setItems(prev=> prev.filter(t=>t.id!==id)), 3500);
  };
  return (
    <ToastCtx.Provider value={{push}}>
      {children}
      <div style={{position:'fixed', bottom:16, right:16, display:'flex', flexDirection:'column', gap:8}}>
        {items.map(t=> (
          <div key={t.id} style={{background:'#0f172a', color:'#fff', padding:'10px 12px', borderRadius:12, boxShadow:'0 4px 12px rgba(0,0,0,.2)'}}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
 }
 const useToast = ()=> React.useContext(ToastCtx)!;

// ==========================
// UI atoms
// ==========================
function Button(props:{onClick?:()=>void; children:React.ReactNode; title?:string; disabled?:boolean; tone?:'primary'|'ghost'}){
  const tone = props.tone||'primary';
  const bg = tone==='primary'? '#0f172a':'#e2e8f0';
  const fg = tone==='primary'? '#fff':'#0f172a';
  return (
    <button
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
      style={{padding:'8px 12px', borderRadius:12, border:'1px solid #cbd5e1', background: props.disabled? '#e2e8f0':bg, color: props.disabled? '#64748b':fg, cursor: props.disabled?'not-allowed':'pointer'}}>
      {props.children}
    </button>
  );
}
function PillLink(props:{active?:boolean; onClick:()=>void; children:React.ReactNode}){
  return (
    <span onClick={props.onClick} style={{
      padding:'6px 10px', borderRadius:12, cursor:'pointer', userSelect:'none',
      background: props.active? '#0f172a':'#f1f5f9', color: props.active? '#fff':'#0f172a',
      border: props.active? '1px solid #0f172a':'1px solid #e2e8f0',
    }}>{props.children}</span>
  );
}
function Field({label, children}:{label:string; children:React.ReactNode}){
  return (
    <label style={{display:'grid', gap:6}}>
      <span style={{fontSize:12, color:'#475569'}}>{label}</span>
      {children}
    </label>
  );
}
function Input(p: React.InputHTMLAttributes<HTMLInputElement>){
  return <input {...p} style={{padding:'8px 10px', borderRadius:10, border:'1px solid #cbd5e1'}} />;
}
function Select(p: React.SelectHTMLAttributes<HTMLSelectElement>){
  return <select {...p} style={{padding:'8px 10px', borderRadius:10, border:'1px solid #cbd5e1'}} />;
}
function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>){
  return <textarea {...p} style={{padding:'8px 10px', borderRadius:10, border:'1px solid #cbd5e1', minHeight:64}} />;
}
function Row({k,v}:{k:string; v:string|number}){
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:12, padding:'6px 0', borderBottom:'1px dashed #e2e8f0'}}>
      <div>{k}</div>
      <div style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace'}}>{typeof v==='number'? v.toFixed(3)+'%': v}</div>
    </div>
  );
}

// ==========================
// Captar — Assistentes (Dízimar / Ofertar / Transferir)
// ==========================
function CaptarAssistentes({onCreate}:{onCreate:(l:Partial<Lanc>)=>void}){
  const { push } = useToast();
  const [base, setBase] = React.useState<number>(0);
  const grau = grauDeMeta(base);
  const pctPacto = getFidelidade()[grau].PACTO / 100;
  const dizimo = Math.max(0, base * 0.10);
  const oferta = Math.max(0, base * pctPacto);
  // Origem & modalidade para Dízimo/Oferta
  const [contaOrigemFid, setContaOrigemFid] = React.useState(CONTAS_USUARIO[0]);
  const [modalidadeFid, setModalidadeFid] = React.useState<Modalidade>('PIX');


  // Transferir (Manejo)
  const [origem, setOrigem] = React.useState('Espécie A');
  const [destino, setDestino] = React.useState('Banco A P01');
  const [valor, setValor] = React.useState<number>(0);
  const [dataMov, setDataMov] = React.useState<string>('');

  function confirmarDizimo(){
    if(base<=0){ push('Informe a base do mês (> 0)'); return; }
    onCreate({ item:'Dízimo', mov:'Saída', valor:dizimo, categoria:'FIDELIDADE', subcategoria:'Dízimo (10%)', origem: contaOrigemFid, destino:'Recebedor', modalidade: modalidadeFid, pagador:'Usuário', recebedor:'Recebedor', dataAquis: new Date().toISOString().slice(0,10), dataMov,
    });
    push(`Dízimo registrado: ${BRL(dizimo)} (10% de ${BRL(base)})`);
  }
  function confirmarOferta(){
    if(base<=0){ push('Informe a base do mês (> 0)'); return; }
    onCreate({ item:'Oferta | Pacto', mov:'Saída', valor:oferta, categoria:'FIDELIDADE', subcategoria:'Oferta | Pacto', origem: contaOrigemFid, destino:'Recebedor', modalidade: modalidadeFid, pagador:'Usuário', recebedor:'Recebedor', dataAquis: new Date().toISOString().slice(0,10), dataMov,
    });
    push(`Oferta | Pacto: ${BRL(oferta)} (${(pctPacto*100).toFixed(1)}% • grau ${grau})`);
  }
  function confirmarTransferir(){
    if(valor<=0){ push('Informe um valor (> 0)'); return; }
    if(origem===destino){ push('Origem e destino precisam ser diferentes'); return; }
    if(!isAccount(origem) || !isAccount(destino)){ push('Para manejo, origem e destino devem ser contas do usuário.'); return; }
    onCreate({
      item: 'Manejo', mov: 'manejo', valor,
      categoria: 'MANEJO', subcategoria: 'Movimento', origem, destino, pagador: 'Usuário', recebedor: 'Usuário', dataAquis: new Date().toISOString().slice(0,10), dataMov,
    });
    push(`Manejo: ${BRL(valor)} de "${origem}" → "${destino}"`);
  }

  return (
    <div style={{display:'grid', gap:12}}>
      <div style={{display:'flex', alignItems:'center', gap:8, color:'#475569'}}>
        <span role="img" aria-label="ajuda" title="Lançamentos rápidos. Dízimo = 10% da base; Ofertar segue o grau do mês; Manejar transfere entre contas (não compõe renda).">ⓘ</span>
        <span>Lançamentos rápidos conforme sua fidelidade e movimentações.</span>
      </div>
      <div style={{display:'grid', gap:8, border:'1px solid #e2e8f0', borderRadius:12, padding:12}}>
        <h3 style={{margin:0}}>Base do mês</h3>
        <Input type='number' min={0} step='0.01' value={isNaN(base)?'':base} onChange={e=>setBase(parseFloat(e.target.value)||0)} placeholder='Ex.: 5000.00' />
        <small>Grau calculado: <b>{grau}</b></small>
        <Field label='Data movimento (opcional para os atalhos)'>
          <Input type='date' value={dataMov} onChange={e=>setDataMov(e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr 1fr'}}>
        <div style={{border:'1px solid #e2e8f0', borderRadius:12, padding:12}}>
          <h3 style={{marginTop:0}}>Dízimar</h3>
          <div>Valor sugerido: <b>{BRL(dizimo)}</b></div>
          <Field label='Origem (conta)'><Select value={contaOrigemFid} onChange={e=>setContaOrigemFid(e.target.value)}>{CONTAS_USUARIO.map(c=> <option key={c}>{c}</option>)}</Select></Field>
          <Field label='Modalidade'><Select value={modalidadeFid} onChange={e=>setModalidadeFid(e.target.value as any)}>{MODALIDADES.map(m=> <option key={m}>{m}</option>)}</Select></Field>
          <Button onClick={confirmarDizimo}>Dízimar</Button>
        </div>
        <div style={{border:'1px solid #e2e8f0', borderRadius:12, padding:12}}>
          <h3 style={{marginTop:0}}>Ofertar</h3>
          <div>Pacto: <b>{(pctPacto*100).toFixed(1)}%</b> • Valor: <b>{BRL(oferta)}</b></div>
          <Field label='Origem (conta)'><Select value={contaOrigemFid} onChange={e=>setContaOrigemFid(e.target.value)}>{CONTAS_USUARIO.map(c=> <option key={c}>{c}</option>)}</Select></Field>
          <Field label='Modalidade'><Select value={modalidadeFid} onChange={e=>setModalidadeFid(e.target.value as any)}>{MODALIDADES.map(m=> <option key={m}>{m}</option>)}</Select></Field>
          <Button onClick={confirmarOferta}>Ofertar</Button>
        </div>
        <div style={{border:'1px solid #e2e8f0', borderRadius:12, padding:12}}>
          <h3 style={{marginTop:0}}>Transferir (Manejo)</h3>
          <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
            <Select value={origem} onChange={e=>setOrigem(e.target.value)}>{CONTAS_USUARIO.map(c=> <option key={c}>{c}</option>)}</Select>
            <Select value={destino} onChange={e=>setDestino(e.target.value)}>{CONTAS_USUARIO.map(c=> <option key={c}>{c}</option>)}</Select>
          </div>
          <Input type='number' min={0} step='0.01' value={isNaN(valor)?'':valor} onChange={e=>setValor(parseFloat(e.target.value)||0)} placeholder='Valor' />
          <Button onClick={confirmarTransferir}>Transferir</Button>
        </div>
      </div>
    </div>
  );
}

// ==========================
// Modais utilitários (Efetivar / Reembolso)
// ==========================
function Modal({title, onClose, children}:{title:string; onClose:()=>void; children:React.ReactNode}){
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.25)', display:'grid', placeItems:'center'}}>
      <div style={{background:'#fff', borderRadius:12, padding:16, width:640, maxWidth:'95vw'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <h3 style={{margin:0}}>{title}</h3>
          <Button tone='ghost' onClick={onClose}>Fechar</Button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ==========================
// Tela Captar (form principal + listagem + atalhos)
// ==========================
function ScreenCaptar(){
  const { push } = useToast();
  const [items, setItems] = React.useState<Lanc[]>([]);
  const [editingId, setEditingId] = React.useState<string|null>(null);
  const [cats] = React.useState<CategoriaSeed[]>(()=> makeSeeds());
  const [isPro] = React.useState<boolean>(true); // simular Pro para edição de seeds (não usado diretamente aqui)
  const [sabatico] = React.useState<boolean>(false); // simular sabático

  // Persistência (IndexedDB)
  React.useEffect(()=>{ (async()=>{
    // Carrega lançamentos salvos
    try{ const all = await idbGetAll('lanc'); if(all?.length){ setItems(all); } }catch{}
    // Carrega ajustes publicados (se houver)
    try{ const aj = await idbGetAll('ajustes'); const cur = aj.find((x:any)=> x.key==='current'); if(cur){ currentSettings = { percentuais: cur.percentuais, fidelidadeDetalhe: cur.fidelidadeDetalhe, limites: cur.limites }; } }catch{}
  })(); }, []);
  React.useEffect(()=>{ (async()=>{ try{ await idbBulkPut('lanc', items); }catch{} })(); }, [items]);


  // Estado do formulário
  const [f, setF] = React.useState<Partial<Lanc>>({ mov:'Saída' });

  // Subcategorias da categoria atual
  const subcats = React.useMemo(()=> {
    const c = cats.find(c=> c.nome===f.categoria || c.id===f.categoria);
    return c? c.subcats.filter(s=> s.visivel).map(s=> s.nome): [];
  }, [cats, f.categoria]);

  // Sugestão por Item
  function onItemBlur(){
    if(!f.item) return;
    const s = sugerirCategoriaSub(f.item);
    if(s && (!f.categoria || !f.subcategoria)){
      setF(prev=> ({...prev, categoria: s.categoria, subcategoria: s.sub}));
      push(`Sugerido: ${s.categoria} / ${s.sub}`);
    }
  }

  function up(p: Partial<Lanc>){ setF(prev=> ({...prev, ...p})); }

  function computeValorPorUnidade(){
    const q = Number(f.quantidade||0); const v = Number(f.valor||0);
    if(q>0){ return `${BRL(v/q)}${f.unidade? `/${f.unidade}`:''}`; }
    return '';
  }

  function createOrUpdate(partial: Partial<Lanc>){
    // usado pelos atalhos
    const base: Partial<Lanc> = { ...partial };
    if(!base.dataAquis) base.dataAquis = new Date().toISOString().slice(0,10);
    setF(prev=> ({...prev, ...base}));
  }

  function save(){
    if(sabatico){ push('Ações seculares bloqueadas no Sábado.'); return; }
    // obrigatórios
    const obrig = ['item','dataAquis','mov','valor','origem','destino','pagador','recebedor','categoria','subcategoria'] as const;
    for(const k of obrig){ if((f as any)[k]===undefined || (f as any)[k]===''){ push(`Preencha: ${k}`); return; } }

    // Regras específicas
    if(f.mov==='manejo'){
      if(f.origem===f.destino){ push('Manejo: origem e destino devem ser diferentes.'); return; }
      if(!isAccount(String(f.origem)) || !isAccount(String(f.destino))){ push('Manejo: use contas do usuário em origem e destino.'); return; }
      if(f.categoria!=='MANEJO' || f.subcategoria!=='Movimento'){ push('Manejo: Categoria=MANEJO e Sub=Movimento.'); return; }
    }
    if(f.mov==='Entrada' && !(f.categoria==='RENDA' && f.subcategoria==='Renda')){
      push('Entrada de Renda: use Categoria=Renda e Sub=Renda.'); return;
    }

    const full: Lanc = {
      internalId: editingId || (Date.now()+Math.random()).toString(36),
      indice: editingId? (items.find(x=>x.internalId===editingId)?.indice||nextIndiceForYear(items, f.dataAquis!)) : nextIndiceForYear(items, f.dataAquis!),
      item: f.item!, marca:f.marca, modelo:f.modelo, unidade:f.unidade, quantidade:f.quantidade, objeto:f.objeto,
      dataAquis: f.dataAquis!,
      dataMov: f.dataMov,
      dataVenc: autoVencimentoOnSave(f.dataAquis!, f.dataMov, f.dataVenc),
      mov: f.mov!, valor: toCents(Number(f.valor)), modalidade:f.modalidade as Modalidade|undefined,
      origem: f.origem!, destino: f.destino!, pagador: f.pagador as Parte, recebedor: f.recebedor as Parte,
      categoria: f.categoria as CategoriaSeedId, subcategoria: f.subcategoria!, obs:f.obs,
    };

    if(isDuplicate(items, full)){
      const ok = window.confirm('Atenção: possível duplicata (±3 dias). Deseja salvar mesmo?');
      if(!ok){ return; }
    }

    if(editingId){
      setItems(prev=> prev.map(x=> x.internalId===editingId? full: x));
      push('Lançamento atualizado.');
    } else {
      setItems(prev=> [full, ...prev]);
      push('Lançamento registrado.');
    }
    setEditingId(null);
    setF({ mov:'Saída' });
  }

  // Atalhos secundários
  const [showEfetivar, setShowEfetivar] = React.useState(false);
  const [showReembolso, setShowReembolso] = React.useState(false);

  function efetivarEmLote(dataMov:string, modalidade?:Modalidade){
    const pendentes = items.filter(i=> !i.dataMov);
    const atualizados = pendentes.map(i=> ({...i, dataMov, dataVenc: autoVencimentoOnSave(i.dataAquis, dataMov, i.dataVenc), modalidade: modalidade||i.modalidade }));
    setItems(prev=> [
      ...atualizados,
      ...prev.filter(i=> i.dataMov)
    ]);
    push(`Efetivados ${atualizados.length} lançamento(s).`);
  }

  function duplicarComoReembolso(srcId:string, novoValorAbs:number, dataMov:string){
    const src = items.find(i=> i.internalId===srcId); if(!src){ push('Item não encontrado'); return; }
    const l: Partial<Lanc> = {
      item: `${src.item} — Reembolso`, mov: 'Saída', valor: -Math.abs(novoValorAbs),
      categoria: src.categoria, subcategoria: src.subcategoria,
      origem: src.origem, destino: src.destino, pagador: src.pagador, recebedor: src.recebedor,
      dataAquis: src.dataAquis, dataMov,
    };
    createOrUpdate(l);
    save();
  }

  // UI
  return (
    <div>
      <h1 style={{fontSize:22, fontWeight:700}}>Captar</h1>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <Button onClick={()=> setShowEfetivar(true)}>Efetivar</Button>
        <Button onClick={()=> setShowReembolso(true)}>Reembolso</Button>
      </div>
      <CaptarAssistentes onCreate={createOrUpdate}/>

      <h2 style={{fontSize:18, fontWeight:700, marginTop:24}}>Registrar / Editar</h2>
      <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 1fr', alignItems:'end'}}>
        <Field label='Índice (auto, por ano)'>
          <Input readOnly value={f.dataAquis? nextIndiceForYear(items, f.dataAquis): ''} placeholder='0001' />
        </Field>
        <Field label='Status'>
          <Input readOnly value={f.dataMov? 'Efetivado':'Pendente de Data Movimento'} />
        </Field>

        <Field label='Item (50c)'>
          <Input maxLength={50} value={f.item||''} onChange={e=> up({item:e.target.value})} onBlur={onItemBlur} />
        </Field>
        <Field label='Marca (50c)'>
          <Input maxLength={50} value={f.marca||''} onChange={e=> up({marca:e.target.value})} />
        </Field>
        <Field label='Modelo/Tipo (100c)'>
          <Input maxLength={100} value={f.modelo||''} onChange={e=> up({modelo:e.target.value})} />
        </Field>
        <Field label='Unidade (50c)'>
          <Input maxLength={50} value={f.unidade||''} onChange={e=> up({unidade:e.target.value})} />
        </Field>
        <Field label='Quantidade'>
          <Input type='number' min={0} step='1' value={isNaN(Number(f.quantidade))?'':f.quantidade} onChange={e=> up({quantidade: parseFloat(e.target.value)||0})} />
        </Field>
        <Field label='Objeto (50c)'>
          <Input maxLength={50} value={f.objeto||''} onChange={e=> up({objeto:e.target.value})} />
        </Field>

        <Field label='Data Aquisição (obrigatória)'>
          <Input type='date' value={f.dataAquis||''} onChange={e=> up({dataAquis:e.target.value})} />
        </Field>
        <Field label='Data Vencimento (auto se vazio)'>
          <Input type='date' value={f.dataVenc||''} onChange={e=> up({dataVenc:e.target.value})} />
        </Field>
        <Field label='Data Movimento (efetivação)'>
          <Input type='date' value={f.dataMov||''} onChange={e=> up({dataMov:e.target.value})} />
        </Field>

        <Field label='Movimento'>
          <Select value={f.mov} onChange={e=> up({mov: e.target.value as MovType})}>
            {(['Entrada','Saída','manejo'] as MovType[]).map(m=> <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label='Valor'>
          <Input type='number' step='0.01' value={isNaN(Number(f.valor))?'':f.valor} onChange={e=> up({valor: parseFloat(e.target.value)||0})} />
        </Field>
        <Field label='Valor por unidade (auto)'>
          <Input readOnly value={computeValorPorUnidade()} placeholder='—' />
        </Field>

        <Field label='Modalidade'>
          <Select value={f.modalidade||''} onChange={e=> up({modalidade: e.target.value as Modalidade})}>
            <option value=''>—</option>
            {MODALIDADES.map(m=> <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label='Origem do valor'>
          <Select value={f.origem||''} onChange={e=> up({origem:e.target.value})}>
            {[...CONTAS_USUARIO, 'Fornecedor','Prestador','Pagador','Recebedor','Doador'].map(o=> <option key={o}>{o}</option>)}
          </Select>
        </Field>
        <Field label='Destino do valor'>
          <Select value={f.destino||''} onChange={e=> up({destino:e.target.value})}>
            {[...CONTAS_USUARIO, 'Fornecedor','Prestador','Pagador','Recebedor','Doador'].map(o=> <option key={o}>{o}</option>)}
          </Select>
        </Field>
        <Field label='Pagador'>
          <Select value={f.pagador||''} onChange={e=> up({pagador: e.target.value as Parte})}>
            {PARTES.map(p=> <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label='Recebedor'>
          <Select value={f.recebedor||''} onChange={e=> up({recebedor: e.target.value as Parte})}>
            {PARTES.map(p=> <option key={p}>{p}</option>)}
          </Select>
        </Field>

        <Field label='Categoria'>
          <Select value={(f.categoria as any)||''} onChange={e=> up({categoria: e.target.value as CategoriaSeedId, subcategoria: ''})}>
            {cats.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </Field>
        <Field label='Subcategoria'>
          <Select value={f.subcategoria||''} onChange={e=> up({subcategoria: e.target.value})}>
            {subcats.map(s=> <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>

        <Field label='Observação (250c)'>
          <Textarea maxLength={250} value={f.obs||''} onChange={e=> up({obs:e.target.value})} />
        </Field>
      </div>
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <Button onClick={save}>Salvar</Button>
        {editingId && <Button tone='ghost' onClick={()=>{ setEditingId(null); setF({mov:'Saída'}); }}>Cancelar edição</Button>}
      </div>

      {/* Listagem simples */}
      <div style={{marginTop:24}}>
        <h3 style={{margin:0}}>Lançamentos</h3>
        <table style={{width:'100%', marginTop:8, borderCollapse:'collapse', fontSize:13}}>
          <thead>
            <tr style={{textAlign:'left'}}>
              {['Índice','Item','Mov','Valor','Origem→Destino','Datas (Aq/Mov/Venc)','Cat/Sub','Status','Ações'].map(h=> <th key={h} style={{borderBottom:'1px solid #e2e8f0', padding:'6px 4px'}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map(i=> (
              <tr key={i.internalId}>
                <td style={{padding:'6px 4px'}}>{i.indice}</td>
                <td style={{padding:'6px 4px'}}>{i.item}</td>
                <td style={{padding:'6px 4px'}}>{i.mov}</td>
                <td style={{padding:'6px 4px'}}>{BRL(fromCents(i.valor))}</td>
                <td style={{padding:'6px 4px'}}>{i.origem} → {i.destino}</td>
                <td style={{padding:'6px 4px'}}>{i.dataAquis||'—'} / {i.dataMov||'—'} / {i.dataVenc||'—'}</td>
                <td style={{padding:'6px 4px'}}>{i.categoria} / {i.subcategoria}</td>
                <td style={{padding:'6px 4px'}}>{i.dataMov? 'Efetivado':'Pendente'}</td>
                <td style={{padding:'6px 4px'}}>
                  <Button tone='ghost' onClick={()=>{ setEditingId(i.internalId); setF({...i}); }}>Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEfetivar && (
        <Modal title='Efetivar lançamentos pendentes' onClose={()=> setShowEfetivar(false)}>
          <EfetivarModal items={items} onApply={(d,m)=>{ efetivarEmLote(d,m); setShowEfetivar(false); }} />
        </Modal>
      )}
      {showReembolso && (
        <Modal title='Reembolso' onClose={()=> setShowReembolso(false)}>
          <ReembolsoModal items={items} onApply={(id,val,d)=>{ duplicarComoReembolso(id,val,d); setShowReembolso(false); }} />
        </Modal>
      )}
    </div>
  );
}

function EfetivarModal({items, onApply}:{items:Lanc[]; onApply:(dataMov:string, modalidade?:Modalidade)=>void}){
  const pend = items.filter(i=> !i.dataMov);
  const [dataMov, setDataMov] = React.useState<string>('');
  const [mod, setMod] = React.useState<Modalidade | ''>('');
  return (
    <div style={{display:'grid', gap:8}}>
      <p>Itens sem Data Movimento: <b>{pend.length}</b></p>
      <Field label='Data Movimento para aplicar'>
        <Input type='date' value={dataMov} onChange={e=> setDataMov(e.target.value)} />
      </Field>
      <Field label='Modalidade (opcional)'>
        <Select value={mod||''} onChange={e=> setMod(e.target.value as Modalidade)}>
          <option value=''>—</option>
          {MODALIDADES.map(m=> <option key={m}>{m}</option>)}
        </Select>
      </Field>
      <Button onClick={()=> onApply(dataMov, (mod||undefined) as Modalidade|undefined)} disabled={!dataMov}>Aplicar</Button>
    </div>
  );
}

function ReembolsoModal({items, onApply}:{items:Lanc[]; onApply:(srcId:string, novoValorAbs:number, dataMov:string)=>void}){
  const [sel, setSel] = React.useState<string>('');
  const [valor, setValor] = React.useState<number>(0);
  const [dataMov, setDataMov] = React.useState<string>('');
  return (
    <div style={{display:'grid', gap:8}}>
      <Field label='Escolha o item a reembolsar'>
        <Select value={sel} onChange={e=> setSel(e.target.value)}>
          <option value=''>—</option>
          {items.map(i=> <option key={i.internalId} value={i.internalId}>{i.indice} — {i.item} ({BRL(fromCents(i.valor))})</option>)}
        </Select>
      </Field>
      <Field label='Valor do reembolso (será lançado NEGATIVO)'>
        <Input type='number' step='0.01' value={isNaN(valor)?'':valor} onChange={e=> setValor(parseFloat(e.target.value)||0)} />
      </Field>
      <Field label='Data Movimento do reembolso'>
        <Input type='date' value={dataMov} onChange={e=> setDataMov(e.target.value)} />
      </Field>
      <Button onClick={()=> onApply(sel, valor, dataMov)} disabled={!sel || !dataMov || !(valor>0)}>Duplicar como Reembolso</Button>
    </div>
  );
}

// ==========================

function ScreenAjustes(){
  const { push } = useToast();
  const [lim, setLim] = React.useState(()=> [...getLimites()] as [number,number,number,number,number]);
  const [pjson, setPjson] = React.useState(()=> JSON.stringify(getPercentuais(), null, 2));
  const [fjson, setFjson] = React.useState(()=> JSON.stringify(getFidelidade(), null, 2));
  async function publicar(){
    try{
      const p = JSON.parse(pjson);
      const f = JSON.parse(fjson);
      const limNum = lim.map(Number) as [number,number,number,number,number];
      currentSettings = { percentuais: p, fidelidadeDetalhe: f, limites: limNum };
      await idbPut('ajustes', { key:'current', ...currentSettings });
      push('Ajustes publicados.');
    }catch(e:any){
      push('Erro ao publicar: '+ (e?.message||e));
    }
  }
  function resetar(){
    setLim([1000,4000,7000,10000,13000]);
    setPjson(JSON.stringify(PERCENTUAIS, null, 2));
    setFjson(JSON.stringify(FIDELIDADE_DETALHE, null, 2));
  }
  return (
    <div style={{display:'grid', gap:12}}>
      <h2>Publicação de Ajustes</h2>
      <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr'}}>
        {lim.map((v,i)=> (
          <div key={i}>
            <label style={{fontSize:12}}>Limite L{i+1}</label>
            <Input type='number' value={v} onChange={e=>{
              const a=[...lim] as any; a[i]=Number(e.target.value||0); setLim(a);
            }}/>
          </div>
        ))}
      </div>
      <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 1fr'}}>
        <div>
          <label style={{display:'block', fontWeight:600, marginBottom:4}}>Percentuais por grau (JSON)</label>
          <textarea value={pjson} onChange={e=>setPjson(e.target.value)} rows={16} style={{width:'100%'}}/>
        </div>
        <div>
          <label style={{display:'block', fontWeight:600, marginBottom:4}}>Fidelidade detalhada (JSON)</label>
          <textarea value={fjson} onChange={e=>setFjson(e.target.value)} rows={16} style={{width:'100%'}}/>
        </div>
      </div>
      <div style={{display:'flex', gap:8}}>
        <Button onClick={publicar}>Publicar</Button>
        <Button tone='ghost' onClick={resetar}>Restaurar padrões</Button>
      </div>
      <small>Dica: publique ajustes válidos (somas = 100%; dízimo = 10%).</small>
    </div>
  );
}

function ScreenBackup(){
  const { push } = useToast();
  async function exportar(){
    const ajustes = await idbGetAll('ajustes');
    const lanc = await idbGetAll('lanc');
    const blob = new Blob([JSON.stringify({ajustes, lanc}, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'morfin_backup.mf.json'; a.click();
    URL.revokeObjectURL(url);
    push('Backup gerado.');
  }
  async function importar(file: File){
    const text = await file.text();
    const data = JSON.parse(text);
    if(data.ajustes){ for(const a of data.ajustes){ await idbPut('ajustes', a); } }
    if(data.lanc){ await idbBulkPut('lanc', data.lanc); }
    // Reload runtime state
    const ls = await idbGetAll('lanc');
    setItemsExt(ls);
    push('Backup restaurado.');
  }
  // pequena ponte para atualizar listagem principal
  const [_, setItemsExt] = React.useState<Lanc[]>([]);
  React.useEffect(()=>{ (async()=>{ setItemsExt(await idbGetAll('lanc')); })() }, []);
  return (
    <div style={{display:'grid', gap:12}}>
      <h2>Backup & Restauração</h2>
      <div style={{display:'flex', gap:8}}>
        <Button onClick={exportar}>Exportar .mf.json</Button>
        <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
          <input type='file' accept='.json' onChange={e=>{ const f=e.target.files?.[0]; if(f) importar(f); }}/>
        </label>
      </div>
      <small>Os dados ficam apenas neste dispositivo. O backup permite migrar/dispositivo ou recuperar histórico.</small>
    </div>
  );
}
// Outras telas
// ==========================
function ScreenFidelidade(){
  const [grau, setGrau] = React.useState<Grau>('SUB');
  const cat = getPercentuais()[grau];
  const fid = getFidelidade()[grau];
  const total = Object.values(cat).reduce((a,b)=>a+b,0);
  const totalFid = Object.values(fid).reduce((a,b)=>a+b,0);
  function RowP({k,v}:{k:string; v:number}){ return <Row k={k} v={v}/>; }
  return (
    <div>
      <h1 style={{fontSize:22, fontWeight:700}}>Envelope (Fidelidade)</h1>
      <div style={{display:'flex', gap:8, margin:'8px 0'}}>
        {(['SUB','M1','M2','M3','M4','M5'] as Grau[]).map(g=>
          <PillLink key={g} active={g===grau} onClick={()=>setGrau(g)}>{g}</PillLink>
        )}
      </div>
      <h3 style={{marginTop:8}}>Categorias</h3>
      {Object.entries(cat).map(([k,v])=> <RowP key={k} k={k} v={v as number} />)}
      <div style={{textAlign:'right', marginTop:8}}><b>Total: {total.toFixed(3)}%</b></div>
      <h3 style={{marginTop:16}}>Fidelidade — detalhamento</h3>
      {Object.entries(fid).map(([k,v])=> <RowP key={k} k={k} v={v as number} />)}
      <div style={{textAlign:'right', marginTop:8}}><b>Total Fidelidade: {totalFid.toFixed(3)}%</b></div>
    </div>
  );
}
function ScreenRenda(){
  return (
    <div>
      <h1 style={{fontSize:22, fontWeight:700}}>Renda</h1>
      <p>Base de renda = soma de entradas em <i>Renda</i> no mês; grau conforme faixas.</p>
    </div>
  );
}
function ScreenPatrimonial(){
  return (
    <div>
      <h1 style={{fontSize:22, fontWeight:700}}>Patrimonial</h1>
      <p>Saldos por conta (ΔReal vs ΔCalculado no Pro).</p>
    </div>
  );
}

// ==========================
// Diagnósticos ("tests" runtime)
// ==========================
function runTests(){
  const tests: { name:string; pass:boolean; details?:string }[] = [];
  (['SUB','M1','M2','M3','M4','M5'] as Grau[]).forEach(g => {
    const total = Math.round(Object.values(getPercentuais()[g]).reduce((a,b)=>a+b,0)*1000)/1000;
    tests.push({ name:`Soma categorias = 100% [${g}]`, pass: Math.abs(total - 100) < 1e-6, details:`total=${total}` });
    const fid = Math.round(Object.values(getFidelidade()[g]).reduce((a,b)=>a+b,0)*1000)/1000;
    tests.push({ name:`Soma fidelidade detalhada = FIDELIDADE [${g}]`, pass: Math.abs(fid - getPercentuais()[g].FIDELIDADE) < 1e-6, details:`det=${fid} vs cat=${getPercentuais()[g].FIDELIDADE}` });
    tests.push({ name:`Dízimo = 10% [${g}]`, pass: Math.abs(getFidelidade()[g].DIZIMO - 10) < 1e-6 });
  });
  const progFid = (['SUB','M1','M2','M3','M4','M5'] as Grau[]).map(g=>getPercentuais()[g].FIDELIDADE);
  tests.push({ name:'Fidelidade não decresce por grau', pass: progFid.every((v,i,a)=> i===0 || v>=a[i-1]), details:progFid.join(' ≤ ') });
  const progEmer = (['SUB','M1','M2','M3','M4','M5'] as Grau[]).map(g=>getPercentuais()[g].EMERGENCIAL);
  tests.push({ name:'Emergencial não decresce por grau', pass: progEmer.every((v,i,a)=> i===0 || v>=a[i-1]), details:progEmer.join(' ≤ ') });

  // Novos testes
  const dummy: Lanc[] = [
    { internalId:'a', indice:'0001', item:'X', dataAquis:'2025-01-10', mov:'Saída', valor:1, origem:'Espécie A', destino:'Fornecedor', pagador:'Usuário', recebedor:'Fornecedor', categoria:'ESSENCIAL', subcategoria:'Supermercado básico' },
    { internalId:'b', indice:'0002', item:'Y', dataAquis:'2025-03-05', mov:'Saída', valor:1, origem:'Espécie A', destino:'Fornecedor', pagador:'Usuário', recebedor:'Fornecedor', categoria:'ESSENCIAL', subcategoria:'Supermercado básico' },
  ];
  const n1 = nextIndiceForYear(dummy, '2025-12-01');
  const n2 = nextIndiceForYear(dummy, '2026-01-01');
  tests.push({ name:'Índice sequencial 2025 → 0003', pass: n1==='0003', details:n1 });
  tests.push({ name:'Índice reinicia em 2026 → 0001', pass: n2==='0001', details:n2 });

  tests.push({ name:'Vencimento auto (usa Mov se há Mov)', pass: autoVencimentoOnSave('2025-01-01','2025-02-03','')==='2025-02-03' });
  tests.push({ name:'Vencimento auto (sem Mov → usa Aquisição)', pass: autoVencimentoOnSave('2025-01-01','', '')==='2025-01-01' });
  tests.push({ name:'Vencimento respeita valor informado', pass: autoVencimentoOnSave('2025-01-01','2025-02-03','2025-04-10')==='2025-04-10' });

  // Manejo: origem != destino e ambas contas (sanity)
  tests.push({ name:'isAccount reconhece contas do usuário', pass: isAccount('Espécie A') && isAccount('Banco A P01') });
  tests.push({ name:'isAccount rejeita não-conta', pass: !isAccount('Fornecedor') });

  // Duplicata ±3 dias
  const dupA: Lanc = { internalId:'x', indice:'0003', item:'Compra', dataAquis:'2025-03-01', dataMov:'2025-03-10', mov:'Saída', valor:100, origem:'Espécie A', destino:'Fornecedor', pagador:'Usuário', recebedor:'Fornecedor', categoria:'ESSENCIAL', subcategoria:'Supermercado básico' };
  const dupB: Lanc = { ...dupA, internalId:'y', indice:'0004', dataMov:'2025-03-12' };
  const dupC: Lanc = { ...dupA, internalId:'z', indice:'0005', dataMov:'2025-03-12', valor:101 };
  tests.push({ name:'isDuplicate true (±3 dias, mesmo item)', pass: isDuplicate([dupA], dupB) });
  tests.push({ name:'isDuplicate false quando valor difere', pass: !isDuplicate([dupA], dupC) });

  // Grau de meta — limites
  const [L1,L2,L3,L4,L5] = getLimites();
  const boundaries: [number, Grau][] = [[L1,'SUB'],[L1+1,'M1'],[L2,'M1'],[L2+1,'M2'],[L3,'M2'],[L3+1,'M3'],[L4,'M3'],[L4+1,'M4'],[L5,'M4'],[L5+1,'M5']];
  boundaries.forEach(([r,g])=> tests.push({ name:`grauDeMeta boundary ${r} → ${g}`, pass: grauDeMeta(r)===g }));

  return tests;
}

// ==========================
// Shell + Navegação
// ==========================
const NAV = [
  { key:'CAPTAR', label:'Captar' },
  { key:'PATRIMONIAL', label:'Patrimonial' },
  { key:'FIDELIDADE', label:'Envelope (Fidelidade)' },
  { key:'RENDA', label:'Renda' },
  { key:'MONITOR', label:'Monitor' },
  { key:'EXPORTAR', label:'Exportar' },
  { key:'AJUSTES', label:'Ajustes' },
  { key:'BACKUP', label:'Backup/Restaurar' },
  { key:'LICENCA', label:'Desbloquear Pro' },
] as const;

type NavKey = typeof NAV[number]['key'];

function RootShell(){
  const [route, setRoute] = React.useState<NavKey>('CAPTAR');
  const tests = React.useMemo(()=> runTests(), []);
  
  React.useEffect(()=>{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js').catch(()=>{});
    }
  },[]);
return (
    <ToastProvider>
      <div style={{minHeight:'100vh', background:'#f8fafc', color:'#0f172a'}}>
        <header style={{position:'sticky', top:0, zIndex:10, background:'#fff', borderBottom:'1px solid #e2e8f0'}}>
          <nav style={{maxWidth:960, margin:'0 auto', display:'flex', gap:8, padding:8, fontSize:14, alignItems:'center'}}>
            {NAV.map(n=>
              <PillLink key={n.key} active={route===n.key} onClick={()=>setRoute(n.key)}>{n.label}</PillLink>
            )}
            <div style={{marginLeft:'auto', padding:'4px 10px', borderRadius:12, background:'#ecfccb', color:'#3f6212'}}>Período livre para lançamentos/exportações.</div>
          </nav>
        </header>
        <main style={{maxWidth:960, margin:'0 auto', padding:16}}>
          {route==='CAPTAR' && <ScreenCaptar/>}
          {route==='PATRIMONIAL' && <ScreenPatrimonial/>}
          {route==='FIDELIDADE' && <ScreenFidelidade/>}
          {route==='RENDA' && <ScreenRenda/>}
          {route==='AJUSTES' && <ScreenAjustes/>}
          {route==='BACKUP' && <ScreenBackup/>}
          {['MONITOR','EXPORTAR','LICENCA'].includes(route) && (
            <div>
              <h1 style={{fontSize:22, fontWeight:700}}>{NAV.find(n=>n.key===route)?.label}</h1>
              <p>Conteúdo placeholder.</p>
            </div>
          )}

          <section style={{marginTop:24}}>
            <h2 style={{fontSize:18, fontWeight:700}}>Diagnóstico rápido</h2>
            <ul>
              {tests.map((t,i)=> (
                <li key={i} style={{color: t.pass? '#065f46':'#991b1b'}}>
                  {t.pass? '✓':'✗'} {t.name}{t.details? ` — ${t.details}`:''}
                </li>
              ))}
            </ul>
          </section>
        </main>
        <footer style={{maxWidth:960, margin:'0 auto', padding:16, fontSize:12, color:'#64748b'}}>
          <p>Não coletamos dados pessoais. Seus dados permanecem apenas neste dispositivo.</p>
          <div style={{display:'flex', gap:12, marginTop:8}}>
            <a href="#" onClick={(e)=>{e.preventDefault(); alert('Grupo WhatsApp (gratuito): link externo');}} style={{textDecoration:'underline'}}>Entrar no grupo WhatsApp (gratuito)</a>
            <a href="#" onClick={(e)=>{e.preventDefault(); alert('Grupo WhatsApp (Pro): link externo');}} style={{textDecoration:'underline'}}>Entrar no grupo WhatsApp (Pro)</a>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default function PreviewApp(){
  return <RootShell/>;
}
