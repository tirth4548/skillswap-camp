/**
 * Etheral Shadow Animation (Vanilla JS Port)
 * Ported from the React component to support the current SkillSwap Dashboard.
 * Uses SVG Filters + RequestAnimationFrame for ultra-smooth performance.
 */

class EtheralShadow {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.options = {
            color: options.color || 'rgba(99, 102, 241, 0.4)',
            scale: options.scale || 80,
            speed: options.speed || 50,
            noiseOpacity: options.noiseOpacity || 0.3,
            noiseScale: options.noiseScale || 1.2,
            ...options
        };

        this.id = `shadow-filter-${Math.random().toString(36).substr(2, 9)}`;
        this.hueValue = 0;
        this.init();
    }

    init() {
        // 1. Create the SVG Filter Definition
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.position = "absolute";
        svg.style.width = "0";
        svg.style.height = "0";

        const displacementScale = this.mapRange(this.options.scale, 1, 100, 20, 100);
        const baseFreqX = this.mapRange(this.options.scale, 0, 100, 0.001, 0.0005);
        const baseFreqY = this.mapRange(this.options.scale, 0, 100, 0.004, 0.002);

        svg.innerHTML = `
            <defs>
                <filter id="${this.id}">
                    <feTurbulence
                        result="undulation"
                        numOctaves="2"
                        baseFrequency="${baseFreqX},${baseFreqY}"
                        seed="0"
                        type="turbulence"
                    />
                    <feColorMatrix
                        id="${this.id}-hue"
                        in="undulation"
                        type="hueRotate"
                        values="0"
                    />
                    <feColorMatrix
                        in="dist"
                        result="circulation"
                        type="matrix"
                        values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="circulation"
                        scale="${displacementScale}"
                        result="dist"
                    />
                    <feDisplacementMap
                        in="dist"
                        in2="undulation"
                        scale="${displacementScale}"
                        result="output"
                    />
                </filter>
            </defs>
        `;
        document.body.appendChild(svg);
        this.hueMatrix = document.getElementById(`${this.id}-hue`);

        // 2. Create the Visual Layers
        this.container.style.position = "relative";
        this.container.style.overflow = "hidden";

        console.log(`[Etheral Shadow] Initializing ${this.id} on ${this.container.id}`);

        // Shadow Layer — Base Color Background
        const shadowLayer = document.createElement('div');
        shadowLayer.style.position = "absolute";
        shadowLayer.style.width = "100%";
        shadowLayer.style.height = "100%";
        shadowLayer.style.top = "0";
        shadowLayer.style.left = "0";
        shadowLayer.style.backgroundColor = this.options.color;

        // Complex SVG Filter for warping
        shadowLayer.style.filter = `url(#${this.id}) blur(15px)`;

        // Webkit & Modern Masks with radial fallback
        const maskUrl = 'https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png';
        const maskCss = `url("${maskUrl}"), radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)`;

        shadowLayer.style.maskImage = maskCss;
        shadowLayer.style.webkitMaskImage = maskCss;
        shadowLayer.style.maskSize = "cover, cover";
        shadowLayer.style.webkitMaskSize = "cover, cover";
        shadowLayer.style.maskPosition = "center";
        shadowLayer.style.webkitMaskPosition = "center";
        shadowLayer.style.maskRepeat = "no-repeat";
        shadowLayer.style.webkitMaskRepeat = "no-repeat";

        this.container.appendChild(shadowLayer);

        // Noise Overlay
        if (this.options.noiseOpacity > 0) {
            const noise = document.createElement('div');
            noise.style.position = "absolute";
            noise.style.inset = "0";
            noise.style.backgroundImage = `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`;
            noise.style.backgroundSize = `${this.options.noiseScale * 200}px`;
            noise.style.backgroundRepeat = "repeat";
            noise.style.opacity = this.options.noiseOpacity;
            noise.style.pointerEvents = "none";
            this.container.appendChild(noise);
        }

        this.animate();
    }

    mapRange(value, fromLow, fromHigh, toLow, toHigh) {
        if (fromLow === fromHigh) return toLow;
        const percentage = (value - fromLow) / (fromHigh - fromLow);
        return toLow + percentage * (toHigh - toLow);
    }

    animate() {
        // Animation Speed Calculation: speed 1-100 to duration
        const speedFactor = this.options.speed / 100;
        this.hueValue = (this.hueValue + (0.5 * speedFactor)) % 360;

        if (this.hueMatrix) {
            this.hueMatrix.setAttribute("values", this.hueValue.toString());
        }

        requestAnimationFrame(() => this.animate());
    }
}

window.initEtheralShadow = (containerId, options) => new EtheralShadow(containerId, options);
