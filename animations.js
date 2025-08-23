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
    spirograph: Spirograph
};

function createAnimation(type, canvas, params = {}) {
    if (!ANIMATIONS[type]) {
        throw new Error(`Unknown animation type: ${type}`);
    }
    return new ANIMATIONS[type](canvas, params);
}
