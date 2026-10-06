export function analyse(candles,threshold=80){
 if(!Array.isArray(candles)||candles.length<55)return {status:'NO TRADE',reason:'At least 55 verified candles required'};
 if(candles.some(c=>![c.open,c.high,c.low,c.close].every(Number.isFinite)||c.high<Math.max(c.open,c.close)||c.low>Math.min(c.open,c.close)))return {status:'NO TRADE',reason:'Invalid market candles'};
 const last=candles.at(-1), prev=candles.at(-2), recent=candles.slice(-22,-1), older=candles.slice(-42,-21);
 const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
 const fast=mean(candles.slice(-20).map(c=>c.close)),slow=mean(candles.slice(-50).map(c=>c.close));
 const bias=fast>slow?'BUY':'SELL', high=Math.max(...recent.map(c=>c.high)),low=Math.min(...recent.map(c=>c.low));
 const olderHigh=Math.max(...older.map(c=>c.high)),olderLow=Math.min(...older.map(c=>c.low));
 const bos=bias==='BUY'?last.close>high:last.close<low;
 const sweep=bias==='BUY'?prev.low<olderLow&&prev.close>olderLow:prev.high>olderHigh&&prev.close<olderHigh;
 const candle=bias==='BUY'?last.close>last.open&&last.close>prev.close:last.close<last.open&&last.close<prev.close;
 const fvg=bias==='BUY'?last.low>candles.at(-3).high:last.high<candles.at(-3).low;
 const ranges=candles.slice(-15).map((c,i,a)=>i===0?c.high-c.low:Math.max(c.high-c.low,Math.abs(c.high-a[i-1].close),Math.abs(c.low-a[i-1].close)));
 const atr=mean(ranges);const validVol=atr>0&&atr/last.close<0.06;
 const discount=bias==='BUY'?last.close<(olderHigh+olderLow)/2:last.close>(olderHigh+olderLow)/2;
 const retest=bias==='BUY'?last.low<=high&&last.close>high:last.high>=low&&last.close<low;
 const ob=bias==='BUY'?recent.slice(-8).some(c=>c.close<c.open):recent.slice(-8).some(c=>c.close>c.open);
 const parts={structure:bos?20:0,liquidity:sweep?15:0,orderBlock:ob?15:0,fvg:fvg?15:0,retest:retest?15:0,candle:candle?10:0,bias:10};
 const score=Object.values(parts).reduce((a,b)=>a+b,0);
 if(!validVol||!bos||score<threshold)return {status:'NO TRADE',score,bias,parts,reason:!validVol?'Volatility filter rejected setup':!bos?'No confirmed break of structure':'Score below threshold',atr};
 const entry=last.close,sl=bias==='BUY'?Math.min(low,last.low)-atr*.2:Math.max(high,last.high)+atr*.2,risk=Math.abs(entry-sl);
 if(!(risk>0))return {status:'NO TRADE',reason:'Invalid stop distance'};
 const sign=bias==='BUY'?1:-1;
 return {status:bias,score,bias,parts,entry,sl,tp1:entry+sign*risk*2,tp2:entry+sign*risk*3,tp3:entry+sign*risk*5,rr:[2,3,5],atr,discount,reason:'Structure break with rule-based confirmation. Not a probability of success.'};
}
