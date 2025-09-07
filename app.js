/**
 * Main Application Controller
 * Handles UI interactions and animation management
 */

class PsychedelicApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.animation = null;
        this.animation2 = null;
        this.combinationAnimation = null;
        this.animationFrame = null;
        this.lastTime = 0;
        this.mixerMode = false;
        
        this.initializeUI();
        this.createAnimation('rotating_polygons');
        this.startAnimationLoop();
    }

    initializeUI() {
        // Mixer toggle button
        document.getElementById('mixerToggle').addEventListener('click', () => {
            this.toggleMixerMode();
        });

        // Animation type selectors
        document.getElementById('animationType').addEventListener('change', (e) => {
            if (this.mixerMode) {
                this.updateMixerAnimation(1, e.target.value);
            } else {
                this.createAnimation(e.target.value);
            }
        });

        document.getElementById('animationType2').addEventListener('change', (e) => {
            if (this.mixerMode) {
                this.updateMixerAnimation(2, e.target.value);
            }
        });

        // Mixer controls
        document.getElementById('blendMode').addEventListener('change', (e) => {
            if (this.combinationAnimation) {
                this.combinationAnimation.updateParams({ blendMode: e.target.value });
            }
        });

        this.setupSlider('volume1', (value) => {
            if (this.combinationAnimation) {
                this.combinationAnimation.updateParams({ opacity1: parseFloat(value) });
            }
        });

        this.setupSlider('volume2', (value) => {
            if (this.combinationAnimation) {
                this.combinationAnimation.updateParams({ opacity2: parseFloat(value) });
            }
        });

        document.getElementById('syncTracks').addEventListener('change', (e) => {
            if (this.combinationAnimation) {
                this.combinationAnimation.updateParams({ sync: e.target.checked });
            }
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

    toggleMixerMode() {
        this.mixerMode = !this.mixerMode;
        const toggleButton = document.getElementById('mixerToggle');
        const track2 = document.getElementById('track2');
        const mixerControls = document.getElementById('mixerControls');

        if (this.mixerMode) {
            // Enable mixer mode
            toggleButton.textContent = '🎛️ Disable Mixer Mode';
            toggleButton.classList.add('active');
            track2.style.display = 'block';
            mixerControls.style.display = 'block';
            
            // Create combination animation
            this.createCombinationAnimation();
        } else {
            // Disable mixer mode
            toggleButton.textContent = '🎛️ Enable Mixer Mode';
            toggleButton.classList.remove('active');
            track2.style.display = 'none';
            mixerControls.style.display = 'none';
            
            // Return to single animation mode
            if (this.combinationAnimation) {
                this.combinationAnimation.pause();
                this.combinationAnimation = null;
            }
            
            // Restart the main animation
            const currentType = document.getElementById('animationType').value;
            this.createAnimation(currentType);
        }
    }

    createCombinationAnimation() {
        const type1 = document.getElementById('animationType').value;
        const type2 = document.getElementById('animationType2').value;
        
        if (this.animation) {
            this.animation.pause();
        }
        
        this.combinationAnimation = createAnimation('combination', this.canvas, {
            animation1: type1,
            animation2: type2,
            blendMode: document.getElementById('blendMode').value,
            opacity1: parseFloat(document.getElementById('volume1').value),
            opacity2: parseFloat(document.getElementById('volume2').value),
            sync: document.getElementById('syncTracks').checked
        });
        
        this.combinationAnimation.play();
        this.setupAnimationControls();
        this.updatePlayPauseButton();
    }

    updateMixerAnimation(track, type) {
        if (this.combinationAnimation) {
            const params = {};
            params[`animation${track}`] = type;
            this.combinationAnimation.updateParams(params);
            this.setupAnimationControls();
        }
    }

    setupAnimationControls() {
        const controlsContainer = document.getElementById('specificControls');
        controlsContainer.innerHTML = '';
        
        if (this.mixerMode && this.combinationAnimation) {
            // Mixer mode - create dual column layout
            this.setupMixerControls(controlsContainer);
        } else {
            // Single animation mode
            const schema = this.animation.getControlSchema();
            if (Object.keys(schema).length > 0) {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'control-group';
                
                const title = document.createElement('h3');
                title.textContent = 'Animation Settings';
                groupDiv.appendChild(title);
                
                this.createControlsForGroup(schema, groupDiv, this.animation);
                controlsContainer.appendChild(groupDiv);
            }
        }
    }

    setupMixerControls(container) {
        // Create dual column container
        const dualColumnContainer = document.createElement('div');
        dualColumnContainer.className = 'mixer-dual-columns';
        dualColumnContainer.style.display = 'flex';
        dualColumnContainer.style.gap = '10px';
        
        // Track 1 column
        const track1Column = document.createElement('div');
        track1Column.className = 'mixer-column track1-column';
        track1Column.style.flex = '1';
        track1Column.style.border = '2px solid #ff6b6b';
        track1Column.style.borderRadius = '8px';
        track1Column.style.padding = '10px';
        track1Column.style.background = 'rgba(255, 107, 107, 0.1)';
        
        const track1Title = document.createElement('h3');
        track1Title.textContent = '🎵 Track 1 Controls';
        track1Title.style.color = '#ff6b6b';
        track1Title.style.textAlign = 'center';
        track1Title.style.marginBottom = '15px';
        track1Column.appendChild(track1Title);
        
        // Track 2 column
        const track2Column = document.createElement('div');
        track2Column.className = 'mixer-column track2-column';
        track2Column.style.flex = '1';
        track2Column.style.border = '2px solid #4ecdc4';
        track2Column.style.borderRadius = '8px';
        track2Column.style.padding = '10px';
        track2Column.style.background = 'rgba(78, 205, 196, 0.1)';
        
        const track2Title = document.createElement('h3');
        track2Title.textContent = '🎵 Track 2 Controls';
        track2Title.style.color = '#4ecdc4';
        track2Title.style.textAlign = 'center';
        track2Title.style.marginBottom = '15px';
        track2Column.appendChild(track2Title);
        
        // Get controls for both animations
        if (this.combinationAnimation.animations[0]) {
            const track1Schema = this.combinationAnimation.animations[0].getControlSchema();
            this.createControlsForGroup(track1Schema, track1Column, this.combinationAnimation.animations[0], 'track1');
        }
        
        if (this.combinationAnimation.animations[1]) {
            const track2Schema = this.combinationAnimation.animations[1].getControlSchema();
            this.createControlsForGroup(track2Schema, track2Column, this.combinationAnimation.animations[1], 'track2');
        }
        
        dualColumnContainer.appendChild(track1Column);
        dualColumnContainer.appendChild(track2Column);
        container.appendChild(dualColumnContainer);
    }

    createControlsForGroup(controls, parentElement, targetAnimation, trackId = null) {
        Object.entries(controls).forEach(([key, config]) => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'control';
            
            if (config.type === 'range') {
                const label = document.createElement('label');
                const valueSpan = document.createElement('span');
                valueSpan.className = 'value-display';
                
                // Get current value from the target animation
                const currentValue = targetAnimation.params[key] || config.min || 0;
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
                    // Update the target animation directly
                    targetAnimation.updateParams({ [key]: value });
                });
                
                controlDiv.appendChild(label);
                controlDiv.appendChild(input);
                
            } else if (config.type === 'select') {
                const label = document.createElement('label');
                label.textContent = config.label;
                
                const select = document.createElement('select');
                const currentValue = targetAnimation.params[key];
                
                config.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    
                    if (option === currentValue) {
                        optionElement.selected = true;
                    }
                    select.appendChild(optionElement);
                });
                
                select.addEventListener('change', (e) => {
                    targetAnimation.updateParams({ [key]: e.target.value });
                });
                
                controlDiv.appendChild(label);
                controlDiv.appendChild(select);
                
            } else if (config.type === 'checkbox') {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                
                const currentValue = targetAnimation.params[key] || false;
                checkbox.checked = currentValue;
                
                checkbox.addEventListener('change', (e) => {
                    targetAnimation.updateParams({ [key]: e.target.checked });
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
            
            if (this.mixerMode && this.combinationAnimation) {
                this.combinationAnimation.update(deltaTime);
                this.combinationAnimation.render();
            } else if (this.animation) {
                this.animation.update(deltaTime);
                this.animation.render();
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }

    togglePlayPause() {
        const currentAnimation = this.mixerMode ? this.combinationAnimation : this.animation;
        if (currentAnimation.isPlaying) {
            currentAnimation.pause();
        } else {
            currentAnimation.play();
        }
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        const button = document.getElementById('playPause');
        const currentAnimation = this.mixerMode ? this.combinationAnimation : this.animation;
        button.textContent = currentAnimation.isPlaying ? '⏸️ Pause' : '▶️ Play';
    }

    reset() {
        const currentAnimation = this.mixerMode ? this.combinationAnimation : this.animation;
        currentAnimation.reset();
        
        // Reinitialize particles if it's a particle system
        if (currentAnimation.initializeParticles) {
            currentAnimation.initializeParticles();
        }
        
        // Clear spirograph trail
        if (currentAnimation.trailPoints) {
            currentAnimation.trailPoints = [];
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
