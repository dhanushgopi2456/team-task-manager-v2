import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Helper to convert hex to normalized RGB [0..1]
function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [0.03, 0.05, 0.1]; // default fallback
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLSL SHADER SOURCES (WebGL 2 with WebGL 1 compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

const VS_WEBGL2 = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FS_WEBGL2 = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uDitherIntensity;
uniform float uPrismIntensity;

// Hash functions for procedural noise
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }

// Simplex 2D Noise
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM (Fractal Brownian Motion)
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// 8x8 Bayer Matrix for ordered dithering
float bayer8x8(vec2 uv) {
  ivec2 p = ivec2(mod(uv, 8.0));
  const int matrix[64] = int[64](
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
  );
  return float(matrix[p.y * 8 + p.x]) / 64.0;
}

// Blue Noise approximation
float blueNoise(vec2 uv, float time) {
  float n1 = hash(uv + vec2(time * 0.1, 0.0));
  float n2 = hash(uv * 2.1 + vec2(0.0, time * 0.13));
  float n3 = hash(uv * 4.3 + vec2(time * 0.07, time * 0.11));
  return fract(n1 + n2 * 0.5 + n3 * 0.25);
}

// Prismatic color refraction
vec3 prism(vec2 uv, float time, float intensity) {
  float angle = atan(uv.y - 0.5, uv.x - 0.5);
  float dist = length(uv - 0.5);
  float prismAngle = angle + time * 0.3 + dist * 3.0;
  float r = 0.5 + 0.5 * sin(prismAngle);
  float g = 0.5 + 0.5 * sin(prismAngle + 2.094);
  float b = 0.5 + 0.5 * sin(prismAngle + 4.188);
  return vec3(r, g, b) * intensity;
}

// Holographic iridescence
vec3 iridescence(vec2 uv, float time) {
  float t = time * 0.5;
  vec2 p = uv * 3.0;
  float n1 = snoise(p + vec2(t, 0.0));
  float n2 = snoise(p * 1.3 + vec2(0.0, t * 0.7));
  float n3 = snoise(p * 0.7 + vec2(t * 0.5, t * 0.3));
  vec3 col1 = vec3(0.5 + 0.5 * sin(n1 * 3.14159 + t));
  vec3 col2 = vec3(0.5 + 0.5 * sin(n2 * 3.14159 + t * 1.3 + 2.0));
  vec3 col3 = vec3(0.5 + 0.5 * sin(n3 * 3.14159 + t * 0.7 + 4.0));
  return (col1 + col2 + col3) / 3.0;
}

// Geometrically morphing shapes
float diamond(vec2 p) { return abs(p.x) + abs(p.y); }
float morphShape(vec2 uv, float time) {
  float morph = sin(time * 0.4) * 0.5 + 0.5;
  vec2 p = uv * 4.0 - 2.0;
  p = p + vec2(sin(time * 0.3), cos(time * 0.4)) * 0.5;
  float circle = length(p) - 1.0;
  float diam = diamond(p) - 1.4;
  float shape = mix(circle, diam, morph);
  vec2 q = mod(uv * 8.0, 2.0) - 1.0;
  float multiShape = mix(length(q), diamond(q), morph) - 0.3;
  return min(shape, multiShape);
}

// Mouse interaction - concentric ripples
float mouseRipple(vec2 uv, vec2 mouse, float time, float intensity) {
  float dist = length(uv - mouse);
  float ripple1 = sin(dist * 40.0 - time * 5.0) * exp(-dist * 3.0);
  float ripple2 = sin(dist * 25.0 - time * 3.5 + 1.0) * exp(-dist * 4.0);
  float ripple3 = sin(dist * 60.0 - time * 7.0) * exp(-dist * 5.0);
  return (ripple1 + ripple2 * 0.5 + ripple3 * 0.3) * intensity;
}

// Mouse glow aura
vec3 mouseGlow(vec2 uv, vec2 mouse, float time, float intensity, vec3 glowColor) {
  float dist = length(uv - mouse);
  float core = exp(-dist * 15.0) * 1.5;
  float outer = exp(-dist * 5.0) * 0.8;
  float pulse = 0.8 + 0.2 * sin(time * 3.0);
  float chromatic = sin(dist * 30.0 + time * 2.0) * exp(-dist * 8.0);
  vec3 rainbow = vec3(
    sin(time * 2.0) * 0.5 + 0.5,
    sin(time * 2.0 + 2.094) * 0.5 + 0.5,
    sin(time * 2.0 + 4.188) * 0.5 + 0.5
  );
  vec3 glow = glowColor * (core + outer) * pulse * intensity;
  glow += rainbow * chromatic * intensity * 0.5;
  return glow;
}

// Lens distortion around cursor
vec2 mouseLensDistort(vec2 uv, vec2 mouse, float intensity) {
  vec2 delta = uv - mouse;
  float dist = length(delta);
  float distortion = exp(-dist * 6.0) * intensity * 0.15;
  return uv + normalize(delta + 0.001) * distortion;
}

void main() {
  vec2 uv = vUv;
  vec2 pixelCoord = gl_FragCoord.xy;
  float time = uTime;

  // Layer 0: Mouse lens distortion
  vec2 distortedUv = mouseLensDistort(uv, uMouse, uMouseIntensity);

  // Layer 1: Flowing gradient noise
  float noise1 = fbm(distortedUv * 2.0 + vec2(time * 0.05, time * 0.03), 4);
  float noise2 = fbm(distortedUv * 3.0 + vec2(-time * 0.04, time * 0.06), 3);
  float diagonal = (distortedUv.x + distortedUv.y) * 0.5;
  float flow = diagonal + noise1 * 0.3 + noise2 * 0.2;
  flow += sin(time * 0.2) * 0.1;

  // Layer 2: Tri-color mix
  vec3 col;
  float t1 = smoothstep(0.0, 0.5, flow);
  float t2 = smoothstep(0.5, 1.0, flow);
  col = mix(uColor1, uColor2, t1);
  col = mix(col, uColor3, t2);

  // Layer 3: Prismatic light refraction
  vec3 prismColor = prism(distortedUv, time, uPrismIntensity);
  float edgeMask = abs(fract(flow * 5.0) - 0.5) * 2.0;
  edgeMask = smoothstep(0.3, 0.7, edgeMask);
  col += prismColor * edgeMask * 0.4;

  // Layer 4: Iridescent holographic overlay
  vec3 iris = iridescence(distortedUv, time);
  float irisMask = snoise(distortedUv * 5.0 + time * 0.1);
  irisMask = smoothstep(-0.2, 0.8, irisMask) * 0.15;
  col = mix(col, iris, irisMask);

  // Layer 5: Geometric crystal patterns
  float shape = morphShape(distortedUv, time);
  float shapeMask = 1.0 - smoothstep(-0.1, 0.1, shape);
  col = mix(col, col * 1.15 + vec3(0.08), shapeMask * 0.3);

  // Layer 6: Mouse interaction (ripples + glow + color shift)
  float ripple = mouseRipple(uv, uMouse, time, uMouseIntensity);
  col += ripple * prismColor * 1.2;
  col += ripple * vec3(0.3, 0.2, 0.4);

  vec3 glow = mouseGlow(uv, uMouse, time, uMouseIntensity, vec3(1.0, 0.8, 1.0));
  col += glow;

  float mouseDist = length(uv - uMouse);
  float proximityBoost = exp(-mouseDist * 4.0) * uMouseIntensity;
  col = mix(col, col * 1.5 + prismColor * 0.3, proximityBoost);

  // Layer 7: Bayer & Blue noise dithering
  float bayer = bayer8x8(pixelCoord);
  float blue = blueNoise(pixelCoord * 0.1, time);
  float ditherPattern = mix(bayer, blue, 0.3 + 0.2 * sin(time * 0.5));
  vec3 ditherOffset = (vec3(ditherPattern) - 0.5) * uDitherIntensity;
  col += ditherOffset;

  // Quantize for signature retro look
  float levels = 16.0;
  vec3 quantized = floor(col * levels + ditherPattern) / levels;
  col = mix(col, quantized, uDitherIntensity * 0.5);

  // Layer 8: Scanline effect
  float scanline = sin(pixelCoord.y * 2.0 + time * 2.0) * 0.02;
  col += scanline * uDitherIntensity;

  // Layer 9: Vignette
  float vignette = 1.0 - length((uv - 0.5) * 1.2);
  vignette = smoothstep(0.0, 0.7, vignette);
  col *= 0.85 + vignette * 0.15;

  col = clamp(col, 0.0, 1.0);
  fragColor = vec4(col, 1.0);
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// DITHER PRISM CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface DitherPrismCanvasProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  ditherIntensity?: number;
  prismIntensity?: number;
  showParticles?: boolean;
  particleCount?: number;
  particleColor?: string;
}

export function DitherPrismCanvas({
  color1 = '#05070f',
  color2 = '#6366f1',
  color3 = '#06b6d4',
  speed = 1,
  ditherIntensity = 0.15,
  prismIntensity = 0.5,
  showParticles = true,
  particleCount = 50,
  particleColor = '#ffffff',
}: DitherPrismCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);

  // Color RGB vectors
  const rgb1 = useMemo(() => hexToRgb(color1), [color1]);
  const rgb2 = useMemo(() => hexToRgb(color2), [color2]);
  const rgb3 = useMemo(() => hexToRgb(color3), [color3]);

  // Mouse tracking state
  const mouseRef = useRef({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    intensity: 0.8,
    targetIntensity: 0.8,
  });

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      mouseRef.current.targetX = e.clientX / w;
      mouseRef.current.targetY = 1.0 - e.clientY / h;
      mouseRef.current.targetIntensity = 0.9;
    };

    const handlePointerLeave = () => {
      mouseRef.current.targetIntensity = 0.4;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, []);

  // WebGL Shader setup & loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGL2RenderingContext | WebGLRenderingContext | null =
      canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' }) as WebGL2RenderingContext;

    if (!gl) {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false }) as WebGLRenderingContext;
    }
    if (!gl) return;

    const isWebGL2 = Boolean(gl && 'COLOR_ATTACHMENT0' in gl && (gl as any).drawBuffers);

    // Compile shader helper
    const createShader = (type: number, src: string) => {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.warn('Shader error:', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    };

    // Adapt source for WebGL 1 if WebGL 2 is unavailable
    let vsSrc = VS_WEBGL2;
    let fsSrc = FS_WEBGL2;

    if (!isWebGL2) {
      vsSrc = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;
      fsSrc = FS_WEBGL2
        .replace('#version 300 es', '')
        .replace('in vec2 vUv;', 'varying vec2 vUv;')
        .replace('out vec4 fragColor;', '')
        .replace('fragColor =', 'gl_FragColor =');
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full-screen quad geometry
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uMouse = gl.getUniformLocation(program, 'uMouse');
    const uMouseIntensity = gl.getUniformLocation(program, 'uMouseIntensity');
    const uColor1 = gl.getUniformLocation(program, 'uColor1');
    const uColor2 = gl.getUniformLocation(program, 'uColor2');
    const uColor3 = gl.getUniformLocation(program, 'uColor3');
    const uDitherIntensity = gl.getUniformLocation(program, 'uDitherIntensity');
    const uPrismIntensity = gl.getUniformLocation(program, 'uPrismIntensity');

    let animId: number;
    const startTime = performance.now();

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    const render = (now: number) => {
      animId = requestAnimationFrame(render);

      const elapsed = ((now - startTime) / 1000) * speed;

      // Mouse easing
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.08;
      m.y += (m.targetY - m.y) * 0.08;
      m.intensity += (m.targetIntensity - m.intensity) * 0.05;

      gl!.useProgram(program);

      if (uTime) gl!.uniform1f(uTime, elapsed);
      if (uResolution) gl!.uniform2f(uResolution, canvas.width, canvas.height);
      if (uMouse) gl!.uniform2f(uMouse, m.x, m.y);
      if (uMouseIntensity) gl!.uniform1f(uMouseIntensity, m.intensity);

      if (uColor1) gl!.uniform3fv(uColor1, rgb1);
      if (uColor2) gl!.uniform3fv(uColor2, rgb2);
      if (uColor3) gl!.uniform3fv(uColor3, rgb3);

      if (uDitherIntensity) gl!.uniform1f(uDitherIntensity, ditherIntensity);
      if (uPrismIntensity) gl!.uniform1f(uPrismIntensity, prismIntensity);

      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(quadBuffer);
      }
    };
  }, [rgb1, rgb2, rgb3, speed, ditherIntensity, prismIntensity]);

  // Floating particles canvas overlay
  useEffect(() => {
    if (!showParticles) return;
    const canvas = particlesCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2.2 + 0.8,
      phase: Math.random() * Math.PI * 2,
      speedX: (Math.random() - 0.5) * 0.0004,
      speedY: (Math.random() - 0.5) * 0.0006,
      opacity: Math.random() * 0.5 + 0.25,
    }));

    const resizeParticles = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor((canvas.clientWidth || window.innerWidth) * dpr);
      canvas.height = Math.floor((canvas.clientHeight || window.innerHeight) * dpr);
    };
    resizeParticles();
    window.addEventListener('resize', resizeParticles, { passive: true });

    const [pr, pg, pb] = hexToRgb(particleColor);
    const colorStr = `rgba(${Math.round(pr * 255)}, ${Math.round(pg * 255)}, ${Math.round(pb * 255)}`;

    const renderParticles = (now: number) => {
      animId = requestAnimationFrame(renderParticles);
      const t = now * 0.001 * speed;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX + Math.sin(t * 0.5 + p.phase) * 0.0003;
        p.y += p.speedY + Math.cos(t * 0.7 + p.phase) * 0.0004;

        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const px = p.x * w;
        const py = p.y * h;
        const radius = p.size;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `${colorStr}, ${p.opacity})`;
        ctx.shadowBlur = radius * 3;
        ctx.shadowColor = `${colorStr}, 0.8)`;
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(renderParticles);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeParticles);
    };
  }, [showParticles, particleCount, particleColor, speed]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {showParticles && (
        <canvas ref={particlesCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none block" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DITHER PRISM BACKGROUND (Ambient drop-in for Login / Register / Auth)
// ═══════════════════════════════════════════════════════════════════════════════

export interface DitherPrismBackgroundProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  ditherIntensity?: number;
  prismIntensity?: number;
  showParticles?: boolean;
  particleCount?: number;
  particleColor?: string;
  className?: string;
}

export function DitherPrismBackground({
  color1 = '#05070f', // Project base-950 deep midnight
  color2 = '#6366f1', // Project brand-500 electric indigo
  color3 = '#06b6d4', // Project cyan accent
  speed = 0.8,
  ditherIntensity = 0.14,
  prismIntensity = 0.45,
  showParticles = true,
  particleCount = 45,
  particleColor = '#a5b4fc',
  className = '',
}: DitherPrismBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      style={{ background: color1 }}
    >
      <DitherPrismCanvas
        color1={color1}
        color2={color2}
        color3={color3}
        speed={speed}
        ditherIntensity={ditherIntensity}
        prismIntensity={prismIntensity}
        showParticles={showParticles}
        particleCount={particleCount}
        particleColor={particleColor}
      />
      {/* Contrast vignette overlay: prevents bright shader hot-spots from washing out form text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(5,7,15,0.45) 0%, rgba(5,7,15,0.82) 100%)',
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DITHER PRISM HERO COMPONENT (Full Componentry Spec)
// ═══════════════════════════════════════════════════════════════════════════════

export interface DitherPrismHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  /** First line of headline */
  title1?: string;
  /** Second line of headline */
  title2?: string;
  /** Primary color (deep/dark base) */
  color1?: string;
  /** Secondary color (mid-tone gradient) */
  color2?: string;
  /** Tertiary color (light/accent highlight) */
  color3?: string;
  /** Animation speed multiplier */
  speed?: number;
  /** Dithering intensity (0-1) */
  ditherIntensity?: number;
  /** Prismatic refraction intensity (0-1) */
  prismIntensity?: number;
  /** Number of floating particles */
  particleCount?: number;
  /** Show floating particles */
  showParticles?: boolean;
  /** Particle color */
  particleColor?: string;
  /** Children to render on top */
  children?: React.ReactNode;
}

const HERO_HEADLINE_CLASS =
  'pb-[0.08em] text-[12cqi] md:text-[8cqi] lg:text-[6cqi] leading-[0.96] tracking-tighter font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-200 to-indigo-400';

export default function DitherPrismHero({
  title1,
  title2,
  color1 = '#05070f',
  color2 = '#6366f1',
  color3 = '#06b6d4',
  speed = 1,
  ditherIntensity = 0.15,
  prismIntensity = 0.5,
  particleCount = 50,
  showParticles = true,
  particleColor = '#ffffff',
  className = '',
  children,
  style,
  ...props
}: DitherPrismHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden text-white ${className}`}
      style={{ containerType: 'size', ...style }}
      {...props}
    >
      {/* WebGL Background */}
      {mounted && (
        <DitherPrismCanvas
          color1={color1}
          color2={color2}
          color3={color3}
          speed={speed}
          ditherIntensity={ditherIntensity}
          prismIntensity={prismIntensity}
          showParticles={showParticles}
          particleCount={particleCount}
          particleColor={particleColor}
        />
      )}

      {/* Content Overlay */}
      {(title1 || title2 || children) && (
        <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center pt-8 pb-8 md:pt-20 md:pb-20">
          <div className="w-full max-w-[1200px] px-6 flex flex-col items-center">
            {/* Headline */}
            {(title1 || title2) && (
              <div className="flex flex-col items-center text-center gap-2 md:gap-4 mb-8 md:mb-12">
                {title1 && (
                  <div className="overflow-hidden">
                    <motion.h1
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      transition={{
                        duration: 1,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.2,
                      }}
                      className={HERO_HEADLINE_CLASS}
                    >
                      <span>{title1}</span>
                    </motion.h1>
                  </div>
                )}
                {title2 && (
                  <div className="overflow-hidden">
                    <motion.h1
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      transition={{
                        duration: 1,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.35,
                      }}
                      className={HERO_HEADLINE_CLASS}
                    >
                      <span>{title2}</span>
                    </motion.h1>
                  </div>
                )}
              </div>
            )}

            {/* Custom Children */}
            {children && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
                className="w-full flex justify-center"
              >
                {children}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
