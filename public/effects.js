let context,enabled=false;
export const soundEnabled=()=>enabled;
export async function toggleSound(){
 if(enabled){enabled=false;return false}
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio)throw new Error('เบราว์เซอร์นี้ไม่รองรับเสียงเกม');
 context??=new Audio();await context.resume();enabled=true;playSound('ready');return true;
}
export function playSound(kind){
 if(!enabled||!context||context.state!=='running')return;
 const notes={tick:[620],ready:[440,660,880],correct:[523,659,784],board:[392,523,659],winner:[523,659,784,1047]}[kind]||[330];
 notes.forEach((frequency,i)=>{
  const start=context.currentTime+i*.12,osc=context.createOscillator(),gain=context.createGain();
  osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.07,start+.01);gain.gain.exponentialRampToValueAtTime(.001,start+.16);osc.connect(gain);gain.connect(context.destination);osc.start(start);osc.stop(start+.18);
 });
}
export function celebrate(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const layer=document.createElement('div');layer.className='confetti';layer.setAttribute('aria-hidden','true');
 for(let i=0;i<50;i++){const p=document.createElement('i');p.style.cssText=`left:${Math.random()*100}%;--delay:${Math.random()*1.5}s;--spin:${Math.random()*700}deg;background:${['#7651e8','#f4a340','#da4056','#267dc4','#158776'][i%5]}`;layer.append(p)}
 document.body.append(layer);setTimeout(()=>layer.remove(),5000);
}
