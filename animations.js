/**
 * Psychedelic Animation Engine
 * Mathematical animations for creating trippy visual effects
 */

class Animation {
    constructor(canvas, params = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.frame = 0;
        this.time = 0;
        this.params = { ...this.getDefaultParams(), ...params };
        this.isPlaying = false;
    }

    getDefaultParams() {
        return {
            speed: 1.0,
            trails: false,
            trailFade: 0.95
        };
    }

    update(deltaTime) {
        if (this.isPlaying) {
            this.time += deltaTime * this.params.speed;
            this.frame++;
        }
    }

    render() {
        // Apply trail effect or clear canvas
        if (this.params.trails) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.params.trailFade})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    play() { this.isPlaying = true; }
    pause() { this.isPlaying = false; }
    reset() { 
        this.frame = 0; 
        this.time = 0; 
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
    }

    // Utility functions
    hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        if (h < 1/6) { r = c; g = x; b = 0; }
        else if (h < 2/6) { r = x; g = c; b = 0; }
        else if (h < 3/6) { r = 0; g = c; b = x; }
        else if (h < 4/6) { r = 0; g = x; b = c; }
        else if (h < 5/6) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }

    getControlSchema() {
        return {};
    }
}

class RotatingPolygons extends Animation {
    constructor(canvas, params = {}) {
        super(canvas, params);
        this.rotationPhase = 0;
        this.lastTime = 0;
        this.lastRotationSpeed = this.params.rotationSpeed;
    }

    getDefaultParams() {
        return {
            ...super.getDefaultParams(),
            numPolygons: 5,
            sides: 6,
            maxRadius: 200,
            minRadius: 50,
            rotationSpeed: 1.0,
            colorShift: 0.0,
            lineWidth: 2
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isPlaying) {
            // Update rotation phase continuously, preserving it when speed changes
            const timeDelta = this.time - this.lastTime;
            this.rotationPhase += timeDelta * this.params.rotationSpeed * 0.01;
            this.lastTime = this.time;
            this.lastRotationSpeed = this.params.rotationSpeed;
        }
    }

    render() {
        super.render();

        const { numPolygons, sides, maxRadius, minRadius, rotationSpeed, colorShift, lineWidth } = this.params;
        
        this.ctx.lineWidth = lineWidth;

        for (let i = 0; i < numPolygons; i++) {
            const radius = numPolygons === 1 ? maxRadius : minRadius + (maxRadius - minRadius) * (i / (numPolygons - 1));
            const rotation = this.rotationPhase + (i * Math.PI / numPolygons);
            
            // Calculate color
            const hue = (this.time * 0.001 + i * 0.2 + colorShift) % 1.0;
            const [r, g, b] = this.hsvToRgb(hue, 0.8, 0.9);
            this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            
            // Draw polygon
            this.ctx.beginPath();
            for (let j = 0; j <= sides; j++) {
                const angle = (j / sides) * Math.PI * 2 + rotation;
                const x = this.centerX + Math.cos(angle) * radius;
                const y = this.centerY + Math.sin(angle) * radius;
                
                if (j === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
    }

    reset() {
        super.reset();
        this.rotationPhase = 0;
        this.lastTime = 0;
    }

    getControlSchema() {
        return {
            numPolygons: { type: 'range', min: 1, max: 10, step: 1, label: 'Polygons' },
            sides: { type: 'range', min: 3, max: 12, step: 1, label: 'Sides' },
            maxRadius: { type: 'range', min: 50, max: 300, step: 10, label: 'Max Radius' },
            minRadius: { type: 'range', min: 10, max: 100, step: 5, label: 'Min Radius' },
            rotationSpeed: { type: 'range', min: 0.1, max: 5.0, step: 0.1, label: 'Rotation Speed' },
            colorShift: { type: 'range', min: 0, max: 1, step: 0.01, label: 'Color Shift' },
            lineWidth: { type: 'range', min: 1, max: 10, step: 0.5, label: 'Line Width' }
        };
    }
}

class WaveInterference extends Animation {
    getDefaultParams() {
        return {
            ...super.getDefaultParams(),
            frequency1: 0.05,
            frequency2: 0.03,
            amplitude: 50,
            waveSpeed: 1.0,
            colorMode: 'rainbow'
        };
    }

    render() {
        super.render();

        const { frequency1, frequency2, amplitude, waveSpeed, colorMode } = this.params;
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const dx = x - this.centerX;
                const dy = y - this.centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const wave1 = Math.sin(distance * frequency1 - this.time * waveSpeed * 0.01);
                const wave2 = Math.sin(distance * frequency2 - this.time * waveSpeed * 0.015);
                const combined = (wave1 + wave2) / 2;
                const normalized = (combined + 1) / 2;

                const index = (y * this.width + x) * 4;
                
                if (colorMode === 'rainbow') {
                    const hue = (normalized + this.time * 0.0001) % 1.0;
                    const [r, g, b] = this.hsvToRgb(hue, 0.8, normalized);
                    data[index] = r;
                    data[index + 1] = g;
                    data[index + 2] = b;
                } else {
                    const intensity = normalized * 255;
                    data[index] = intensity;
                    data[index + 1] = intensity;
                    data[index + 2] = intensity;
                }
                data[index + 3] = 255; // Alpha
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    getControlSchema() {
        return {
            frequency1: { type: 'range', min: 0.01, max: 0.1, step: 0.001, label: 'Frequency 1' },
            frequency2: { type: 'range', min: 0.01, max: 0.1, step: 0.001, label: 'Frequency 2' },
            amplitude: { type: 'range', min: 10, max: 100, step: 5, label: 'Amplitude' },
            waveSpeed: { type: 'range', min: 0.1, max: 3.0, step: 0.1, label: 'Wave Speed' },
            colorMode: { type: 'select', options: ['rainbow', 'monochrome'], label: 'Color Mode' }
        };
    }
}

class ParticleSystem extends Animation {
    constructor(canvas, params = {}) {
        super(canvas, params);
        this.particles = [];
        this.initializeParticles();
    }

    getDefaultParams() {
        return {
            ...super.getDefaultParams(),
            particleCount: 100,
            gravity: 0.1,
            bounceDamping: 0.8,
            airDamping: 0.999,
            trailLength: 20,
            colorMode: 'velocity'
        };
    }

    initializeParticles() {
        this.particles = [];
        for (let i = 0; i < this.params.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                trail: []
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.isPlaying) return;

        const { gravity, bounceDamping, airDamping, trailLength } = this.params;
        const dt = deltaTime * 0.01;

        this.particles.forEach(particle => {
            // Apply gravity
            particle.vy += gravity;
            
            // Apply air damping (energy loss over time)
            particle.vx *= airDamping;
            particle.vy *= airDamping;
            
            // Update position
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            
            // Bounce off walls
            if (particle.x <= 0 || particle.x >= this.width) {
                particle.vx *= -bounceDamping;
                particle.x = Math.max(0, Math.min(this.width, particle.x));
            }
            if (particle.y <= 0 || particle.y >= this.height) {
                particle.vy *= -bounceDamping;
                particle.y = Math.max(0, Math.min(this.height, particle.y));
            }
            
            // Update trail
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > trailLength) {
                particle.trail.shift();
            }
        });
    }

    render() {
        super.render();

        const { colorMode } = this.params;

        this.particles.forEach(particle => {
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            
            // Calculate color
            let color;
            if (colorMode === 'velocity') {
                const hue = (speed / 20) % 1.0;
                const [r, g, b] = this.hsvToRgb(hue, 1.0, 1.0);
                color = `rgb(${r}, ${g}, ${b})`;
            } else {
                color = 'white';
            }
            
            // Draw trail
            particle.trail.forEach((point, index) => {
                const alpha = index / particle.trail.length;
                this.ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });
    }

    getControlSchema() {
        return {
            particleCount: { type: 'range', min: 10, max: 200, step: 10, label: 'Particle Count' },
            gravity: { type: 'range', min: 0, max: 1, step: 0.01, label: 'Gravity' },
            bounceDamping: { type: 'range', min: 0.0, max: 1.0, step: 0.01, label: 'Bounce Damping' },
            airDamping: { type: 'range', min: 0.0, max: 1.0, step: 0.01, label: 'Air Damping' },
            trailLength: { type: 'range', min: 5, max: 200, step: 5, label: 'Trail Length' },
            colorMode: { type: 'select', options: ['velocity', 'white'], label: 'Color Mode' }
        };
    }
}

class PerlinNoise extends Animation {
    constructor(canvas, params = {}) {
        super(canvas, params);
        this.noiseOffset = 0;
        this.permutation = this.generatePermutation();
    }

    getDefaultParams() {
        return {
            ...super.getDefaultParams(),
            scale: 0.01,
            octaves: 4,
            persistence: 0.5,
            lacunarity: 2.0,
            timeSpeed: 1.0,
            colorMode: 'rainbow',
            brightness: 1.0
        };
    }

    // Simple Perlin noise implementation
    generatePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        
        // Shuffle array
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Duplicate for wrapping
        for (let i = 0; i < 256; i++) p[256 + i] = p[i];
        return p;
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
        const A = this.permutation[X] + Y;
        const AA = this.permutation[A] + Z;
        const AB = this.permutation[A + 1] + Z;
        const B = this.permutation[X + 1] + Y;
        const BA = this.permutation[B] + Z;
        const BB = this.permutation[B + 1] + Z;
        
        return this.lerp(
            this.lerp(
                this.lerp(this.grad(this.permutation[AA], x, y, z),
                         this.grad(this.permutation[BA], x - 1, y, z), u),
                this.lerp(this.grad(this.permutation[AB], x, y - 1, z),
                         this.grad(this.permutation[BB], x - 1, y - 1, z), u), v),
            this.lerp(
                this.lerp(this.grad(this.permutation[AA + 1], x, y, z - 1),
                         this.grad(this.permutation[BA + 1], x - 1, y, z - 1), u),
                this.lerp(this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
                         this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1), u), v), w);
    }

    fractalNoise(x, y, z, octaves, persistence, lacunarity) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        
        return value / maxValue;
    }

    render() {
        super.render();

        const { scale, octaves, persistence, lacunarity, timeSpeed, colorMode, brightness } = this.params;
        this.noiseOffset += timeSpeed * 0.01;
        
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const noiseValue = this.fractalNoise(
                    x * scale, 
                    y * scale, 
                    this.noiseOffset,
                    octaves,
                    persistence,
                    lacunarity
                );
                
                const normalized = (noiseValue + 1) / 2; // Convert from [-1,1] to [0,1]
                const index = (y * this.width + x) * 4;
                
                if (colorMode === 'rainbow') {
                    const hue = (normalized + this.time * 0.0001) % 1.0;
                    const [r, g, b] = this.hsvToRgb(hue, 0.8, normalized * brightness);
                    data[index] = r;
                    data[index + 1] = g;
                    data[index + 2] = b;
                } else if (colorMode === 'fire') {
                    const intensity = normalized * brightness;
                    data[index] = Math.min(255, intensity * 255 * 2);
                    data[index + 1] = Math.min(255, intensity * 255 * 1.5);
                    data[index + 2] = Math.min(255, intensity * 255 * 0.5);
                } else { // monochrome
                    const intensity = normalized * brightness * 255;
                    data[index] = intensity;
                    data[index + 1] = intensity;
                    data[index + 2] = intensity;
                }
                data[index + 3] = 255; // Alpha
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    getControlSchema() {
        return {
            scale: { type: 'range', min: 0.001, max: 0.05, step: 0.001, label: 'Scale' },
            octaves: { type: 'range', min: 1, max: 8, step: 1, label: 'Octaves' },
            persistence: { type: 'range', min: 0.1, max: 1.0, step: 0.1, label: 'Persistence' },
            lacunarity: { type: 'range', min: 1.0, max: 4.0, step: 0.1, label: 'Lacunarity' },
            timeSpeed: { type: 'range', min: 0.1, max: 5.0, step: 0.1, label: 'Time Speed' },
            brightness: { type: 'range', min: 0.1, max: 2.0, step: 0.1, label: 'Brightness' },
            colorMode: { type: 'select', options: ['rainbow', 'fire', 'monochrome'], label: 'Color Mode' }
        };
    }
}

class Fractal extends Animation {
    constructor(canvas, params = {}) {
        super(canvas, params);
        this.zoom = 1;
        this.centerX = -0.5;
        this.centerY = 0;
        this.colorOffset = 0;
    }

    getDefaultParams() {
        return {
            ...super.getDefaultParams(),
            maxIterations: 100,
            zoomSpeed: 1.0,
            colorSpeed: 1.0,
            fractalType: 'mandelbrot',
            colorMode: 'rainbow',
            brightness: 1.0,
            contrast: 1.0,
            centerX: -0.5,
            centerY: 0.0
        };
    }

    mandelbrot(cx, cy, maxIter) {
        let x = 0, y = 0;
        let x2 = 0, y2 = 0;
        let iter = 0;
        
        while (x2 + y2 <= 4 && iter < maxIter) {
            y = 2 * x * y + cy;
            x = x2 - y2 + cx;
            x2 = x * x;
            y2 = y * y;
            iter++;
        }
        
        if (iter === maxIter) return 0;
        
        // Smooth coloring
        const log_zn = Math.log(x2 + y2) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        return iter + 1 - nu;
    }

    julia(cx, cy, maxIter, juliaC = { r: -0.7, i: 0.27015 }) {
        let x = cx, y = cy;
        let x2 = x * x, y2 = y * y;
        let iter = 0;
        
        while (x2 + y2 <= 4 && iter < maxIter) {
            y = 2 * x * y + juliaC.i;
            x = x2 - y2 + juliaC.r;
            x2 = x * x;
            y2 = y * y;
            iter++;
        }
        
        if (iter === maxIter) return 0;
        
        const log_zn = Math.log(x2 + y2) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        return iter + 1 - nu;
    }

    burning_ship(cx, cy, maxIter) {
        let x = 0, y = 0;
        let x2 = 0, y2 = 0;
        let iter = 0;
        
        while (x2 + y2 <= 4 && iter < maxIter) {
            y = 2 * Math.abs(x * y) + cy;
            x = x2 - y2 + cx;
            x2 = x * x;
            y2 = y * y;
            iter++;
        }
        
        if (iter === maxIter) return 0;
        
        const log_zn = Math.log(x2 + y2) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        return iter + 1 - nu;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isPlaying) {
            // Update zoom
            this.zoom *= 1 + (this.params.zoomSpeed * 0.01 * deltaTime * 0.001);
            
            // Update color cycling
            this.colorOffset += this.params.colorSpeed * deltaTime * 0.0001;
            
            // Update center based on parameters
            this.centerX = this.params.centerX;
            this.centerY = this.params.centerY;
        }
    }

    render() {
        super.render();

        const { maxIterations, fractalType, colorMode, brightness, contrast } = this.params;
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        const scale = 4.0 / (this.zoom * Math.min(this.width, this.height));
        
        for (let px = 0; px < this.width; px++) {
            for (let py = 0; py < this.height; py++) {
                const x = (px - this.width / 2) * scale + this.centerX;
                const y = (py - this.height / 2) * scale + this.centerY;
                
                let iterations;
                switch (fractalType) {
                    case 'julia':
                        iterations = this.julia(x, y, maxIterations);
                        break;
                    case 'burning_ship':
                        iterations = this.burning_ship(x, y, maxIterations);
                        break;
                    default: // mandelbrot
                        iterations = this.mandelbrot(x, y, maxIterations);
                }
                
                const index = (py * this.width + px) * 4;
                
                if (iterations === 0) {
                    // Inside the set - black
                    data[index] = 0;
                    data[index + 1] = 0;
                    data[index + 2] = 0;
                } else {
                    // Outside the set - colorize
                    const normalized = (iterations / maxIterations) * contrast;
                    
                    if (colorMode === 'rainbow') {
                        const hue = (normalized + this.colorOffset) % 1.0;
                        const [r, g, b] = this.hsvToRgb(hue, 0.8, brightness);
                        data[index] = r;
                        data[index + 1] = g;
                        data[index + 2] = b;
                    } else if (colorMode === 'fire') {
                        const intensity = normalized * brightness;
                        data[index] = Math.min(255, intensity * 255 * 2);
                        data[index + 1] = Math.min(255, intensity * 255 * 1.2);
                        data[index + 2] = Math.min(255, intensity * 255 * 0.3);
                    } else if (colorMode === 'ocean') {
                        const intensity = normalized * brightness;
                        data[index] = Math.min(255, intensity * 255 * 0.2);
                        data[index + 1] = Math.min(255, intensity * 255 * 0.8);
                        data[index + 2] = Math.min(255, intensity * 255 * 1.5);
                    } else { // monochrome
                        const intensity = normalized * brightness * 255;
                        data[index] = intensity;
                        data[index + 1] = intensity;
                        data[index + 2] = intensity;
                    }
                }
                data[index + 3] = 255; // Alpha
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    reset() {
        super.reset();
        this.zoom = 1;
        this.centerX = this.params.centerX;
        this.centerY = this.params.centerY;
        this.colorOffset = 0;
    }

    getControlSchema() {
        return {
            fractalType: { type: 'select', options: ['mandelbrot', 'julia', 'burning_ship'], label: 'Fractal Type' },
            maxIterations: { type: 'range', min: 20, max: 300, step: 10, label: 'Max Iterations' },
            zoomSpeed: { type: 'range', min: 0.0, max: 5.0, step: 0.1, label: 'Zoom Speed' },
            colorSpeed: { type: 'range', min: 0.0, max: 10.0, step: 0.1, label: 'Color Speed' },
            centerX: { type: 'range', min: -2.0, max: 2.0, step: 0.01, label: 'Center X' },
            centerY: { type: 'range', min: -2.0, max: 2.0, step: 0.01, label: 'Center Y' },
            brightness: { type: 'range', min: 0.1, max: 2.0, step: 0.1, label: 'Brightness' },
            contrast: { type: 'range', min: 0.1, max: 3.0, step: 0.1, label: 'Contrast' },
            colorMode: { type: 'select', options: ['rainbow', 'fire', 'ocean', 'monochrome'], label: 'Color Mode' }
        };
    }
}

class Spirograph extends Animation {
    constructor(canvas, params = {}) {
        super(canvas, params);
        this.trailPoints = [];
    }

    getDefaultParams() {
        return {
            ...super.getDefaultParams(),
            R: 100, // Outer circle radius
            r: 30,  // Inner circle radius
            d: 50,  // Distance from center
            spiralSpeed: 1.0,
            colorShift: 0.0,
            trailFade: 0.99
        };
    }

    render() {
        // Apply custom trail fade
        this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.params.trailFade})`;
        this.ctx.fillRect(0, 0, this.width, this.height);

        const { R, r, d, spiralSpeed, colorShift } = this.params;
        const t = this.time * spiralSpeed * 0.01;
        
        // Calculate spirograph point
        const ratio = (R - r) / r;
        const x = (R - r) * Math.cos(t) + d * Math.cos(ratio * t);
        const y = (R - r) * Math.sin(t) - d * Math.sin(ratio * t);
        
        // Center the pattern
        const centerX = this.centerX + x;
        const centerY = this.centerY + y;
        
        // Add point to trail
        if (centerX >= 0 && centerX < this.width && centerY >= 0 && centerY < this.height) {
            this.trailPoints.push({ x: centerX, y: centerY, time: t });
        }
        
        // Draw trail with color gradient
        this.trailPoints.forEach((point, index) => {
            const alpha = index / this.trailPoints.length;
            const hue = (point.time * 0.1 + colorShift) % 1.0;
            const [r, g, b] = this.hsvToRgb(hue, 0.8, alpha);
            
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Limit trail length
        if (this.trailPoints.length > 2000) {
            this.trailPoints = this.trailPoints.slice(-2000);
        }
    }

    getControlSchema() {
        return {
            R: { type: 'range', min: 50, max: 200, step: 5, label: 'Outer Radius' },
            r: { type: 'range', min: 10, max: 80, step: 1, label: 'Inner Radius' },
            d: { type: 'range', min: 10, max: 100, step: 1, label: 'Distance' },
            spiralSpeed: { type: 'range', min: 0.1, max: 3.0, step: 0.1, label: 'Speed' },
            colorShift: { type: 'range', min: 0, max: 1, step: 0.01, label: 'Color Shift' },
            trailFade: { type: 'range', min: 0.9, max: 0.999, step: 0.001, label: 'Trail Fade' }
        };
    }
}

// Animation registry
const ANIMATIONS = {
    rotating_polygons: RotatingPolygons,
    wave_interference: WaveInterference,
    particle_system: ParticleSystem,
    perlin_noise: PerlinNoise,
    fractal: Fractal,
    spirograph: Spirograph
};

function createAnimation(type, canvas, params = {}) {
    if (!ANIMATIONS[type]) {
        throw new Error(`Unknown animation type: ${type}`);
    }
    return new ANIMATIONS[type](canvas, params);
}
