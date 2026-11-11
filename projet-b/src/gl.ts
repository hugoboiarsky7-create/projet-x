// Post-traitement : la seule lumière vient des tubes. Bloom, lumière sur les façades, reflets sur l'asphalte, pluie, grain.
const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const BLUR = `precision mediump float;varying vec2 uv;uniform sampler2D T;uniform vec2 d;void main(){vec3 c=texture2D(T,uv).rgb*.227;c+=(texture2D(T,uv+d*1.385).rgb+texture2D(T,uv-d*1.385).rgb)*.316;c+=(texture2D(T,uv+d*3.231).rgb+texture2D(T,uv-d*3.231).rgb)*.07;gl_FragColor=vec4(c,1.);}`;
const COPY = 'precision mediump float;varying vec2 uv;uniform sampler2D T;uniform vec2 d;void main(){gl_FragColor=vec4((texture2D(T,uv+d).rgb+texture2D(T,uv-d).rgb+texture2D(T,uv+vec2(d.x,-d.y)).rgb+texture2D(T,uv+vec2(-d.x,d.y)).rgb)*.25,1.);}';
const FINAL = `precision mediump float;varying vec2 uv;uniform sampler2D E,A,B1,B2;uniform vec2 res;uniform float t,gy,rainK,fx,amb;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float rain(vec2 p,float s,float sp){p.x+=p.y*.07;vec2 g=p*vec2(s,s*.085);g.y-=t*sp;vec2 i=floor(g),f=fract(g);float r=h(i);float x=abs(f.x-.5-(r-.5)*.5);return step(.8,r)*smoothstep(.07,0.,x)*smoothstep(0.,.25,f.y)*smoothstep(1.,.45,f.y);}
void main(){vec2 p=vec2(uv.x,1.-uv.y);vec3 e=texture2D(E,uv).rgb,b1=texture2D(B1,uv).rgb,b2=texture2D(B2,uv).rgb;vec3 c;
 if(p.y<gy){vec4 a=texture2D(A,uv);c=a.rgb*(amb+b2*7.5+b1*2.2)+e+b1*1.35+b2*.95;}
 else{float d=(p.y-gy)/(1.-gy);float pu=smoothstep(.42,.62,n(p*vec2(5.,16.)+3.));float rip=(n(vec2(p.x*90.,p.y*260.-t*1.5))-.5)*.006*(.4+d)*(1.-pu*.6);
  vec2 q=vec2(uv.x+rip,1.-(gy-(p.y-gy)*1.35));q.y=min(q.y,1.);vec3 r1=texture2D(B1,q).rgb+texture2D(E,q).rgb*.7,r2=texture2D(B2,q).rgb;
  vec3 st=(texture2D(B1,vec2(q.x,q.y+.03)).rgb+texture2D(B1,vec2(q.x,q.y+.07)).rgb+texture2D(B1,vec2(q.x,q.y-.03)).rgb)*.33;
  vec3 rf=mix(r2*.75+st*.35,r1*.95+st*.5,pu);float tex=.6+.4*n(p*vec2(140.,300.));c=vec3(.006,.007,.011)*tex+rf*(1.5-.8*d)*(.75+.25*tex)+r2*.5*(1.-d)+e+b1*1.35+b2*.5;}
 float rn=(rain(uv*res/res.y,46.,2.6)+rain(uv*res/res.y+7.,70.,3.4)*.7+rain(uv*res/res.y+3.,110.,4.4)*.5)*rainK;c+=rn*(b2*2.2+b1*.8+.012);
 vec2 v=uv-.5;c*=1.-dot(v,v)*.9;c+=(h(uv*res+fract(t)*91.)-.5)*.035*fx;c=c/(1.+c*.3);gl_FragColor=vec4(pow(c,vec3(.92)),1.);}`;
export class Post {
  gl: WebGLRenderingContext; W = 0; H = 0; private prog: Record<string, WebGLProgram> = {}; private tex: Record<string, WebGLTexture> = {}; private fb: Record<string, WebGLFramebuffer> = {}; private sz: Record<string, [number, number]> = {}; ok = true;
  constructor(public cv: HTMLCanvasElement) {
    const gl = (cv.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' }) || cv.getContext('experimental-webgl')) as WebGLRenderingContext; this.gl = gl; if (!gl) { this.ok = false; return; }
    const sh = (t: number, s: string) => { const x = gl.createShader(t)!; gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(x)); this.ok = false; } return x; };
    const mk = (fs: string) => { const p = gl.createProgram()!; gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); return p; };
    this.prog = { blur: mk(BLUR), copy: mk(COPY), fin: mk(FINAL) };
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const k of ['E', 'A', 'a1', 'b1', 'a2', 'b2']) { const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); this.tex[k] = t; }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  }
  resize(w: number, h: number) {
    const gl = this.gl; this.W = w; this.H = h; this.cv.width = w; this.cv.height = h;
    for (const [k, d] of [['a1', 4], ['b1', 4], ['a2', 12], ['b2', 12]] as [string, number][]) { const tw = Math.max(2, Math.round(w / d)), th = Math.max(2, Math.round(h / d)); this.sz[k] = [tw, th]; gl.bindTexture(gl.TEXTURE_2D, this.tex[k]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); const f = this.fb[k] || (this.fb[k] = gl.createFramebuffer()!); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex[k], 0); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  upload(k: 'E' | 'A', src: HTMLCanvasElement) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.tex[k]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src); }
  private pass(prog: string, src: string, dst: string | null, d: [number, number]) { const gl = this.gl, p = this.prog[prog]; gl.useProgram(p); gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? this.fb[dst] : null); const s = dst ? this.sz[dst] : [this.W, this.H]; gl.viewport(0, 0, s[0], s[1]); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[src]); gl.uniform1i(gl.getUniformLocation(p, 'T'), 0); gl.uniform2f(gl.getUniformLocation(p, 'd'), d[0], d[1]); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
  frame(t: number, gy: number, rain: number, fx: number, amb: number) {
    const gl = this.gl, s1 = this.sz.a1, s2 = this.sz.a2;
    this.pass('copy', 'E', 'a1', [1 / this.W, 1 / this.H]); this.pass('blur', 'a1', 'b1', [1 / s1[0], 0]); this.pass('blur', 'b1', 'a1', [0, 1 / s1[1]]);
    this.pass('copy', 'a1', 'a2', [1.5 / s1[0], 1.5 / s1[1]]); this.pass('blur', 'a2', 'b2', [1.2 / s2[0], 0]); this.pass('blur', 'b2', 'a2', [0, 1.2 / s2[1]]);
    const p = this.prog.fin; gl.useProgram(p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.W, this.H);
    ['E', 'A', 'a1', 'a2'].forEach((k, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.tex[k]); gl.uniform1i(gl.getUniformLocation(p, ['E', 'A', 'B1', 'B2'][i]), i); });
    gl.uniform2f(gl.getUniformLocation(p, 'res'), this.W, this.H); gl.uniform1f(gl.getUniformLocation(p, 't'), t % 1000); gl.uniform1f(gl.getUniformLocation(p, 'gy'), gy); gl.uniform1f(gl.getUniformLocation(p, 'rainK'), rain); gl.uniform1f(gl.getUniformLocation(p, 'fx'), fx); gl.uniform1f(gl.getUniformLocation(p, 'amb'), amb);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.activeTexture(gl.TEXTURE0);
  }
}
