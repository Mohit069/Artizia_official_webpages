/* ============================================================
   ARTIZIA — WebGL molten-quartz engine + texture baker
   Exposes: window.MarbleGL
   Requires: window.MAT (from data.js)
   ============================================================ */
(function(){
  const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const FS = `precision highp float;
  uniform vec2 u_res;uniform float u_time;uniform vec3 u_base;uniform vec3 u_vein;uniform vec3 u_glow;
  uniform float u_seed;uniform float u_flow;uniform float u_sharp;uniform float u_dark;uniform float u_zoom;
  float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));
   vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
  void main(){
   vec2 uv=gl_FragCoord.xy/u_res.xy;vec2 p=uv;p.x*=u_res.x/u_res.y;p*=2.6*u_zoom;p+=u_seed;
   float t=u_time*.05*u_flow;
   vec2 q=vec2(fbm(p),fbm(p+vec2(5.2,1.3)));
   vec2 r=vec2(fbm(p+3.5*q+vec2(1.7+t,9.2)),fbm(p+3.5*q+vec2(8.3,2.8-t*.8)));
   float f=fbm(p+3.8*r);
   float m=fbm(p*.6+r*2.2+t*.5);
   float vein=abs(sin((m*4.2+r.x*3.0)*3.14159));
   vein=pow(1.-vein,mix(3.5,11.,u_sharp));
   float fine=pow(1.-abs(sin((fbm(p*3.0+r)*7.0)*3.14159)),9.)*.35;
   vec3 col=mix(u_base*.82,u_base,smoothstep(.15,.85,f));
   col=mix(col,u_vein,smoothstep(.3,.95,length(r))*.45);
   float pulse=.55+.45*sin(u_time*.5+f*5.0+r.x*4.0);
   col+=u_glow*(vein+fine)*pulse;
   col+=u_glow*.05*smoothstep(.55,1.,f);
   col*=1.-u_dark*.35*length(uv-.5);
   gl_FragColor=vec4(clamp(col,0.,1.),1.);
  }`;
  function hx(h){return [parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];}
  function makeGL(canvas){
    const gl=canvas.getContext('webgl',{antialias:true,preserveDrawingBuffer:true,alpha:false});
    if(!gl)return null;
    function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
    const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
    gl.linkProgram(pr);gl.useProgram(pr);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const U={};['u_res','u_time','u_base','u_vein','u_glow','u_seed','u_flow','u_sharp','u_dark','u_zoom'].forEach(n=>U[n]=gl.getUniformLocation(pr,n));
    return {gl,U,pr};
  }
  function draw(ctx,canvas,mat,time,dpr,zoom){
    const {gl,U}=ctx;
    const w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(U.u_res,canvas.width,canvas.height);
    gl.uniform1f(U.u_time,time);
    gl.uniform3fv(U.u_base,hx(mat.base));gl.uniform3fv(U.u_vein,hx(mat.vein));gl.uniform3fv(U.u_glow,hx(mat.glow));
    gl.uniform1f(U.u_seed,mat.seed);gl.uniform1f(U.u_flow,mat.flow);gl.uniform1f(U.u_sharp,mat.sharp);gl.uniform1f(U.u_dark,mat.dark);
    gl.uniform1f(U.u_zoom,zoom||1.0);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }

  /* ---- baker: one offscreen context bakes still marble images (cached) ---- */
  const bakeCanvas=document.createElement('canvas');bakeCanvas.width=440;bakeCanvas.height=560;
  Object.defineProperty(bakeCanvas,'clientWidth',{value:440});
  Object.defineProperty(bakeCanvas,'clientHeight',{value:560});
  const bakeCtx=makeGL(bakeCanvas);
  const cache={};
  function marbleImg(key,seedShift){
    const M=window.MAT||{}; if(!M[key])key=Object.keys(M)[0];
    const ck=key+'_'+(seedShift||0);
    if(cache[ck])return cache[ck];
    let url='';
    if(bakeCtx&&M[key]){
      const m=Object.assign({},M[key]); if(seedShift)m.seed+=seedShift;
      draw(bakeCtx,bakeCanvas,m,7.3+(m.seed%5),1,1);
      try{url=bakeCanvas.toDataURL('image/jpeg',0.86);}catch(e){url='';}
    }
    cache[ck]=url; return url;
  }
  function imgTag(key,seedShift,cls){
    const M=window.MAT||{}; const u=marbleImg(key,seedShift);
    const name=(M[key]&&M[key].name)||'Quartz';
    return u?`<img src="${u}" alt="${name} engineered quartz surface" class="${cls||''}" loading="lazy">`
            :`<div style="width:100%;height:100%;background:linear-gradient(135deg,${(M[key]&&M[key].base)||'#222'},${(M[key]&&M[key].vein)||'#555'})"></div>`;
  }
  function roomHTML(key){
    return `<div class="room"><div class="wall"></div><div class="bk">${imgTag(key)}</div><div class="ct">${imgTag(key,3)}</div><div class="cab"></div></div>`;
  }
  /* uploaded photo for a slot (0=slab,1=closeup,2=application,3=detail) or null */
  function slotImg(key,slot){
    const m=(window.MAT||{})[key]||{};const src=m.images&&m.images[slot];
    return src?`<img src="${src}" alt="${m.name||'Surface'}" loading="lazy">`:null;
  }
  /* uploaded photo if present, else generated marble */
  function imgFor(key,slot,seedShift){return slotImg(key,slot)||imgTag(key,seedShift||0);}
  function firstPhoto(key){const m=(window.MAT||{})[key]||{};return (m.images||[]).find(Boolean)||null;}

  window.MarbleGL={makeGL,draw,marbleImg,imgTag,roomHTML,slotImg,imgFor,firstPhoto,
    dpr:Math.min(window.devicePixelRatio||1,1.8),
    reduce:window.matchMedia('(prefers-reduced-motion:reduce)').matches};
})();
