// Device-local paper journal. No broker orders are ever sent.
export const key='tshiboy.paper.v1';
export function load(store){try{const x=JSON.parse(store.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
export function save(store,trades){store.setItem(key,JSON.stringify(trades))}
export function openPaper({signal,symbol,interval,balance,riskPercent,candle}){
 if(!['BUY','SELL'].includes(signal?.status)||!Number.isFinite(signal.entry)||!Number.isFinite(signal.sl))throw Error('No valid signal');
 if(!(balance>0&&riskPercent>0&&riskPercent<=2))throw Error('Invalid balance or risk');
 if(!candle?.time)throw Error('Missing provider candle timestamp');
 const distance=Math.abs(signal.entry-signal.sl);if(!(distance>0))throw Error('Invalid stop');
 // Units represent a synthetic linear contract in USD per one price unit, NOT broker lots.
 const riskUsd=balance*riskPercent/100,units=riskUsd/distance;
 return {id:crypto.randomUUID(),symbol,interval,side:signal.status,entry:signal.entry,sl:signal.sl,tp1:signal.tp1,tp2:signal.tp2,tp3:signal.tp3,units,riskUsd,score:signal.score,openedCandle:candle.time,createdAt:new Date().toISOString(),status:'OPEN',pnlUsd:null,exit:null,closedAt:null};
}
export function settle(trades,symbol,interval,candles){
 const ordered=[...candles].sort((a,b)=>String(a.time).localeCompare(String(b.time)));
 return trades.map(t=>{
  if(t.status!=='OPEN'||t.symbol!==symbol||t.interval!==interval)return t;
  const future=ordered.filter(c=>String(c.time)>String(t.openedCandle));
  for(const c of future){
   const slHit=t.side==='BUY'?c.low<=t.sl:c.high>=t.sl;
   const tpHit=t.side==='BUY'?c.high>=t.tp1:c.low<=t.tp1;
   // If both levels hit in the same candle, assume SL first (conservative).
   if(slHit||tpHit){const exit=slHit?t.sl:t.tp1;const pnlUsd=(t.side==='BUY'?exit-t.entry:t.entry-exit)*t.units;return {...t,status:slHit?'STOPPED':'TP1',exit,pnlUsd,closedAt:c.time};}
  }
  return t;
 });
}
export function stats(trades){const closed=trades.filter(t=>t.status!=='OPEN');return {open:trades.length-closed.length,closed:closed.length,pnl:closed.reduce((s,t)=>s+t.pnlUsd,0),wins:closed.filter(t=>t.pnlUsd>0).length}}
