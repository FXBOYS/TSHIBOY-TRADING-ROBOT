import {analyse} from './engine.mjs';
import {load,save,openPaper,settle,stats} from './paper.mjs';
const $=id=>document.getElementById(id),money=n=>Number.isFinite(n)?n.toFixed(Math.abs(n)<10?5:2):'—';
let current=null,lastCandle=null,trades=load(localStorage);
function journal(){const s=stats(trades);$('paperStats').textContent=`${s.open} open • ${s.closed} closed • Realized synthetic P/L $${s.pnl.toFixed(2)} • ${s.wins} wins`;$('journal').replaceChildren(...trades.slice().reverse().slice(0,30).map(t=>{const el=document.createElement('div');el.className='journal-row';el.textContent=`${t.side} ${t.symbol} ${t.interval} | ${t.status} | Entry ${money(t.entry)} | SL ${money(t.sl)} | TP1 ${money(t.tp1)} | ${t.pnlUsd===null?'OPEN':`P/L $${t.pnlUsd.toFixed(2)}`}`;return el}));}
journal();
$('scan').onclick=async()=>{
 $('scan').disabled=true;$('paper').disabled=true;current=null;lastCandle=null;$('connection').textContent='● Loading provider candles…';
 try{
  const symbol=$('symbol').value,interval=$('interval').value;
  const r=await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error||'Market data unavailable');
  if(!Array.isArray(data.candles)||!data.candles.length)throw Error('No verified candles');
  const result=analyse(data.candles,Number($('threshold').value));current=result;lastCandle=data.candles.at(-1);
  $('connection').textContent=`● Provider: ${data.source}`;$('updated').textContent=`${data.candles.length} provider candles • latest candle ${lastCandle.time} • fetched ${new Date(data.fetchedAt).toLocaleString()}`;
  $('signal').textContent=result.status;$('score').textContent=result.score===undefined?'—':`${result.score}/100 confirmation points (not win probability)`;$('reason').textContent=result.reason||'';
  const labels=['entry','sl','tp1','tp2','tp3'];$('values').innerHTML=['Entry','Stop Loss','Take Profit 1','Take Profit 2','Take Profit 3','Risk / Reward'].map((label,i)=>`<div>${label} <b>${i===5?(result.rr?'1:2 / 1:3 / 1:5':'—'):money(result[labels[i]])}</b></div>`).join('');
  trades=settle(trades,symbol,interval,data.candles);save(localStorage,trades);journal();
  $('paper').disabled=!['BUY','SELL'].includes(result.status);$('paperMessage').textContent=$('paper').disabled?'No qualifying signal. No paper order available.':'Review the proposed trade and tap PLACE PAPER TRADE.';
 }catch(e){$('connection').textContent='● Market data unavailable';$('updated').textContent=e.message;$('signal').textContent='NO TRADE';$('score').textContent='—';$('reason').textContent='No signal generated without verified market data';$('paperMessage').textContent=e.message;}
 finally{$('scan').disabled=false;}
};
$('paper').onclick=()=>{
 try{
  if(!current||!lastCandle)throw Error('Run analysis first');
  const balance=Number($('balance').value),riskPercent=Number($('risk').value);
  if(trades.filter(t=>t.status==='OPEN').length>=3)throw Error('Maximum three open paper positions');
  const t=openPaper({signal:current,symbol:$('symbol').value,interval:$('interval').value,balance,riskPercent,candle:lastCandle});
  if(!confirm(`PAPER ONLY — no Exness order.\n${t.side} ${t.symbol}\nEntry ${t.entry}\nSL ${t.sl}\nTP1 ${t.tp1}\nSynthetic risk $${t.riskUsd.toFixed(2)}\nPlace paper trade?`))return;
  trades.push(t);save(localStorage,trades);journal();$('paperMessage').textContent='Paper order saved on this device. Scan again to check subsequent candles for SL/TP1.';$('paper').disabled=true;
 }catch(e){$('paperMessage').textContent=e.message;}
};
const calc=()=>{$('riskAmount').textContent=`Maximum intended risk: $${(Math.max(0,Number($('balance').value)||0)*Math.min(2,Math.max(0,Number($('risk').value)||0))/100).toFixed(2)}`};$('balance').oninput=calc;$('risk').oninput=calc;
$('mode').onchange=()=>{const preset={SCALPING:['5min',90],INTRADAY:['15min',80],SWING:['4h',85]};const v=preset[$('mode').value];if(v){$('interval').value=v[0];$('threshold').value=v[1]}};
$('symbol').onchange=$('interval').onchange=()=>{$('paper').disabled=true;current=null;};
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
