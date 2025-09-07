/**
 * Main Application Controller
 * Handles UI interactions and animation management
 */

class PsychedelicApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.animation = null;
        this.animationFrame = null;
        this.lastTime = 0;
        
        this.initializeUI();
        this.createAnimation('rotating_polygons');
        this.startAnimationLoop();
    }

    initializeUI() {
        // Animation type selector
        document.getElementById('animationType').addEventListener('change', (e) => {
            this.createAnimation(e.target.value);
        });

        // Playback controls
        document.getElementById('playPause').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.reset();
        });

        // Global controls
        this.setupSlider('speed', (value) => {
            this.animation.updateParams({ speed: parseFloat(value) });
        });

        document.getElementById('trails').addEventListener('change', (e) => {
            this.animation.updateParams({ trails: e.target.checked });
        });

        this.setupSlider('trailFade', (value) => {
            this.animation.updateParams({ trailFade: parseFloat(value) });
        });

        // Export controls
        document.getElementById('exportGif').addEventListener('click', () => {
            this.exportGif();
        });

        document.getElementById('fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'KeyR':
                    this.reset();
                    break;
                case 'KeyF':
                    this.toggleFullscreen();
                    break;
            }
        });
    }

    setupSlider(id, callback) {
        const slider = document.getElementById(id);
        const display = document.getElementById(id + 'Value');
        
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            display.textContent = value;
            callback(value);
        });
    }

    createAnimation(type) {
        if (this.animation) {
            this.animation.pause();
        }
        
        this.animation = createAnimation(type, this.canvas);
        this.animation.play();
        
        this.setupAnimationControls();
        this.updatePlayPauseButton();
    }

    setupAnimationControls() {
        const controlsContainer = document.getElementById('specificControls');
        controlsContainer.innerHTML = '';
        
        const schema = this.animation.getControlSchema();
        
        if (Object.keys(schema).length > 0) {
            // Group controls by their group property (for combination mode)
            const groupedControls = {};
            const ungroupedControls = {};
            
            Object.entries(schema).forEach(([key, config]) => {
                if (config.group) {
                    if (!groupedControls[config.group]) {
                        groupedControls[config.group] = {};
                    }
                    groupedControls[config.group][key] = config;
                } else {
                    ungroupedControls[key] = config;
                }
            });
            
            // Create ungrouped controls first (main controls)
            if (Object.keys(ungroupedControls).length > 0) {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'control-group';
                
                const title = document.createElement('h3');
                title.textContent = 'Animation Settings';
                groupDiv.appendChild(title);
                
                this.createControlsForGroup(ungroupedControls, groupDiv);
                controlsContainer.appendChild(groupDiv);
            }
            
            // Create grouped controls (for combination mode)
            Object.entries(groupedControls).forEach(([groupName, controls]) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'control-group mixer-track';
                
                const title = document.createElement('h3');
                title.textContent = groupName;
                title.style.color = groupName.includes('Animation 1') ? '#ff6b6b' : '#4ecdc4';
                groupDiv.appendChild(title);
                
                this.createControlsForGroup(controls, groupDiv);
                controlsContainer.appendChild(groupDiv);
            });
        }
    }

    createControlsForGroup(controls, parentElement) {
        Object.entries(controls).forEach(([key, config]) => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'control';
            
            if (config.type === 'range') {
                const label = document.createElement('label');
                const valueSpan = document.createElement('span');
                valueSpan.className = 'value-display';
                
                // Get the current value - handle prefixed keys for combination mode
                let currentValue;
                if (key.startsWith('anim1_') || key.startsWith('anim2_')) {
                    // For combination mode, get value from the specific animation
                    const animIndex = key.startsWith('anim1_') ? 0 : 1;
                    const realKey = key.substring(6);
                    if (this.animation.animations && this.animation.animations[animIndex]) {
                        currentValue = this.animation.animations[animIndex].params[realKey];
                    } else {
                        currentValue = config.min || 0;
                    }
                } else {
                    currentValue = this.animation.params[key];
                }
                
                valueSpan.textContent = currentValue;
                label.innerHTML = `${config.label} `;
                label.appendChild(valueSpan);
                
                const input = document.createElement('input');
                input.type = 'range';
                input.min = config.min;
                input.max = config.max;
                input.step = config.step;
                input.value = currentValue;
                
                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    valueSpan.textContent = value;
                    this.animation.updateParams({ [key]: value });
                });
                
                controlDiv.appendChild(label);
                controlDiv.appendChild(input);
                
            } else if (config.type === 'select') {
                const label = document.createElement('label');
                label.textContent = config.label;
                
                const select = document.createElement('select');
                config.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    
                    // Get current value for comparison
                    let currentValue;
                    if (key.startsWith('anim1_') || key.startsWith('anim2_')) {
                        const animIndex = key.startsWith('anim1_') ? 0 : 1;
                        const realKey = key.substring(6);
                        if (this.animation.animations && this.animation.animations[animIndex]) {
                            currentValue = this.animation.animations[animIndex].params[realKey];
                        }
                    } else {
                        currentValue = this.animation.params[key];
                    }
                    
                    if (option === currentValue) {
                        optionElement.selected = true;
                    }
                    select.appendChild(optionElement);
                });
                
                select.addEventListener('change', (e) => {
                    this.animation.updateParams({ [key]: e.target.value });
                });
                
                controlDiv.appendChild(label);
                controlDiv.appendChild(select);
                
            } else if (config.type === 'checkbox') {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                
                // Get current value
                let currentValue;
                if (key.startsWith('anim1_') || key.startsWith('anim2_')) {
                    const animIndex = key.startsWith('anim1_') ? 0 : 1;
                    const realKey = key.substring(6);
                    if (this.animation.animations && this.animation.animations[animIndex]) {
                        currentValue = this.animation.animations[animIndex].params[realKey];
                    } else {
                        currentValue = false;
                    }
                } else {
                    currentValue = this.animation.params[key];
                }
                
                checkbox.checked = currentValue;
                
                checkbox.addEventListener('change', (e) => {
                    this.animation.updateParams({ [key]: e.target.checked });
                });
                
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(' ' + config.label));
                controlDiv.appendChild(label);
            }
            
            parentElement.appendChild(controlDiv);
        });
    }

    startAnimationLoop() {
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            if (this.animation) {
                this.animation.update(deltaTime);
                this.animation.render();
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }

    togglePlayPause() {
        if (this.animation.isPlaying) {
            this.animation.pause();
        } else {
            this.animation.play();
        }
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        const button = document.getElementById('playPause');
        button.textContent = this.animation.isPlaying ? '⏸️ Pause' : '▶️ Play';
    }

    reset() {
        this.animation.reset();
        
        // Reinitialize particles if it's a particle system
        if (this.animation.initializeParticles) {
            this.animation.initializeParticles();
        }
        
        // Clear spirograph trail
        if (this.animation.trailPoints) {
            this.animation.trailPoints = [];
        }
    }

    async exportGif() {
        const button = document.getElementById('exportGif');
        const originalText = button.textContent;
        button.textContent = '🔄 Exporting...';
        button.disabled = true;
        
        try {
            // Simple frame capture approach
            // In a real implementation, you'd use a library like gif.js
            const link = document.createElement('a');
            link.download = 'psychedelic-animation.png';
            link.href = this.canvas.toDataURL();
            link.click();
            
            // Show success message
            button.textContent = '✅ Exported!';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Export failed:', error);
            button.textContent = '❌ Failed';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.canvas.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PsychedelicApp();
});
