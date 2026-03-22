/**
 * Real-time Interactive 3D Particle System for SkillSwap (Refined Version)
 * Features: Shorter Denser Particle Strings, Normalized High-DPI Text, Organic Morphing
 */

class ThreeNeuralWeb {
    constructor(containerId, userSkills = []) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.userSkills = userSkills;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // 1. Core Particle System
        this.coreCount = 6000;
        this.coreGeometry = new THREE.BufferGeometry();
        this.corePositions = new Float32Array(this.coreCount * 3);
        this.coreTargetPositions = new Float32Array(this.coreCount * 3);
        this.coreColors = new Float32Array(this.coreCount * 3);

        // 2. String Particle System (Short & Dense)
        this.particlesPerString = 150;
        this.stringCount = userSkills.length * this.particlesPerString;
        this.stringGeometry = new THREE.BufferGeometry();
        this.stringPositions = new Float32Array(this.stringCount * 3);
        this.stringColors = new Float32Array(this.stringCount * 3);

        this.templates = ['sphere', 'heart', 'flower', 'saturn', 'firework'];
        this.currentTemplate = 'sphere';
        this.morphSpeed = 0.04;

        this.expansion = 1.0;
        this.targetExpansion = 1.0;

        // Skill Data
        this.labelSprites = [];

        this.init();
        this.animate();
        this.setupEventListeners();
    }

    init() {
        // Setup Core
        this.createTemplate('sphere', this.corePositions);
        this.createTemplate('sphere', this.coreTargetPositions);
        this.coreGeometry.setAttribute('position', new THREE.BufferAttribute(this.corePositions, 3));
        this.coreGeometry.setAttribute('color', new THREE.BufferAttribute(this.coreColors, 3));

        const coreMaterial = new THREE.PointsMaterial({
            size: 0.045,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        this.corePoints = new THREE.Points(this.coreGeometry, coreMaterial);
        this.scene.add(this.corePoints);

        // -- THE GALAXY --
        this.createGalaxyBackground();

        // Setup Strings
        this.stringGeometry.setAttribute('position', new THREE.BufferAttribute(this.stringPositions, 3));
        this.stringGeometry.setAttribute('color', new THREE.BufferAttribute(this.stringColors, 3));
        const stringMaterial = new THREE.PointsMaterial({
            size: 0.02,
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        this.stringPoints = new THREE.Points(this.stringGeometry, stringMaterial);
        this.scene.add(this.stringPoints);

        this.camera.position.z = 6;

        this.createNormalizedLabels();
        this.updateColors('#6366f1');
    }

    createGalaxyBackground() {
        this.galaxyGroup = new THREE.Group();
        this.scene.add(this.galaxyGroup);

        // 1. Far Starfield
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 3000;
        const starPos = new Float32Array(starCount * 3);
        const starCols = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const r = 20 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPos[i * 3 + 2] = r * Math.cos(phi);

            // Subtle color variance
            const col = new THREE.Color().setHSL(Math.random() * 0.1 + 0.6, 0.4, 0.9);
            starCols[i * 3] = col.r;
            starCols[i * 3 + 1] = col.g;
            starCols[i * 3 + 2] = col.b;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starCols, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.galaxyGroup.add(this.stars);

        // 2. Background Constellation Lines
        const constCount = 20;
        const lineGeom = new THREE.BufferGeometry();
        const linePos = new Float32Array(constCount * 2 * 3);

        for (let i = 0; i < constCount; i++) {
            const idx = i * 6;
            const r = 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            linePos[idx] = x; linePos[idx + 1] = y; linePos[idx + 2] = z;
            linePos[idx + 3] = x + (Math.random() - 0.5) * 10;
            linePos[idx + 4] = y + (Math.random() - 0.5) * 10;
            linePos[idx + 5] = z + (Math.random() - 0.5) * 10;
        }

        lineGeom.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        this.galaxyGroup.add(new THREE.LineSegments(lineGeom, lineMat));
    }

    createNormalizedLabels() {
        this.userSkills.forEach((skill, i) => {
            const angle = (i / this.userSkills.length) * Math.PI * 2;
            const radius = 2.4;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (Math.random() - 0.5) * 1.0;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Much wider canvas for long names
            canvas.width = 1024;
            canvas.height = 128;

            const text = skill.skill.name.toUpperCase();

            // Pill Shape (Wider)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.beginPath();
            ctx.roundRect(12, 12, 1000, 104, 64);
            ctx.fill();

            // Neon Border
            ctx.shadowColor = '#6366f1';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Clear White Text
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 50px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Dynamic Font Sizing to fit any length
            const metrics = ctx.measureText(text);
            const maxWidth = 880;
            if (metrics.width > maxWidth) {
                const newSize = Math.floor(50 * (maxWidth / metrics.width));
                ctx.font = `bold ${newSize}px Inter, system-ui, sans-serif`;
            }

            ctx.fillText(text, 512, 64);

            const texture = new THREE.CanvasTexture(canvas);
            const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0, depthTest: false });
            const sprite = new THREE.Sprite(mat);

            // Scale based on 8:1 aspect ratio
            sprite.scale.set(3.2, 0.4, 1);
            sprite.position.set(x, y, z);
            sprite.userData = { angle, radius, zOffset: z };

            this.scene.add(sprite);
            this.labelSprites.push(sprite);
        });
    }

    updateColors(baseColor) {
        const color = new THREE.Color(baseColor);
        for (let i = 0; i < this.coreCount; i++) {
            const h = color.getHSL({}).h + (Math.random() - 0.5) * 0.15;
            const temp = new THREE.Color().setHSL(h, 0.8, 0.6);
            this.coreColors[i * 3] = temp.r;
            this.coreColors[i * 3 + 1] = temp.g;
            this.coreColors[i * 3 + 2] = temp.b;
        }
        this.coreGeometry.attributes.color.needsUpdate = true;
    }

    createTemplate(type, array) {
        for (let i = 0; i < this.coreCount; i++) {
            let x, y, z;
            const t = (i / this.coreCount) * Math.PI * 2;
            const u = Math.acos(2 * Math.random() - 1);
            const r = 2.0;

            switch (type) {
                case 'sphere':
                    x = r * Math.sin(u) * Math.cos(t);
                    y = r * Math.sin(u) * Math.sin(t);
                    z = r * Math.cos(u);
                    break;
                case 'heart':
                    const v = (i / this.coreCount) * Math.PI * 2;
                    x = 1.6 * Math.pow(Math.sin(v), 3);
                    y = 1.3 * Math.cos(v) - 0.5 * Math.cos(2 * v) - 0.2 * Math.cos(3 * v) - 0.1 * Math.cos(4 * v);
                    z = (Math.random() - 0.5) * 0.8;
                    x *= 0.8; y *= 0.8;
                    break;
                case 'flower':
                    const k = 4;
                    const r_flower = Math.cos(k * t) * (1 + Math.sin(u) * 0.5) * 2;
                    x = r_flower * Math.cos(t);
                    y = r_flower * Math.sin(t);
                    z = Math.sin(u) * 0.5;
                    break;
                case 'saturn':
                    if (i < this.coreCount * 0.5) {
                        x = Math.sin(u) * Math.cos(t) * 1.3;
                        y = Math.sin(u) * Math.sin(t) * 1.3;
                        z = Math.cos(u) * 1.3;
                    } else {
                        const ringR = 2.2 + Math.random() * 1.2;
                        x = Math.cos(t) * ringR;
                        y = Math.sin(t) * ringR;
                        z = (Math.random() - 0.5) * 0.1;
                    }
                    break;
                case 'firework':
                    const dist = Math.pow(Math.random(), 2) * 5;
                    x = Math.sin(u) * Math.cos(t) * dist;
                    y = Math.sin(u) * Math.sin(t) * dist;
                    z = Math.cos(u) * dist;
                    break;
            }
            array[i * 3] = x;
            array[i * 3 + 1] = y;
            array[i * 3 + 2] = z;
        }
    }

    setupEventListeners() {
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetExpansion = Math.max(0.3, Math.min(5.0, this.targetExpansion - e.deltaY * 0.003));
        }, { passive: false });

        this.container.addEventListener('dblclick', () => {
            const nextIdx = (this.templates.indexOf(this.currentTemplate) + 1) % this.templates.length;
            this.currentTemplate = this.templates[nextIdx];
            this.createTemplate(this.currentTemplate, this.coreTargetPositions);
            this.updateColors(this.getRandomVibrantColor());
        });
    }

    getRandomVibrantColor() {
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#fbbf24'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;
        this.expansion += (this.targetExpansion - this.expansion) * 0.1;
        const constrainedExp = Math.min(this.expansion, 2.2);

        // Core Animation
        const corePos = this.coreGeometry.attributes.position.array;
        for (let i = 0; i < this.coreCount * 3; i++) {
            corePos[i] += (this.coreTargetPositions[i] * this.expansion - corePos[i]) * this.morphSpeed;
        }
        this.coreGeometry.attributes.position.needsUpdate = true;
        this.corePoints.rotation.y += 0.002;

        // Galaxy Rotation & Twinkle
        if (this.galaxyGroup) {
            this.galaxyGroup.rotation.y += 0.0005;
            this.galaxyGroup.rotation.z += 0.0002;
            this.stars.material.size = 0.08 + Math.sin(time * 2) * 0.02;
        }

        const visibility = Math.max(0, Math.min(1, (this.expansion - 1.0) * 1.5));
        this.stringPoints.material.opacity = visibility * 0.5;

        // String & Sprite Animation
        const strPos = this.stringGeometry.attributes.position.array;
        const strCol = this.stringGeometry.attributes.color.array;

        this.labelSprites.forEach((sprite, i) => {
            const data = sprite.userData;
            const orbitSpeed = 0.15;
            const currentAngle = data.angle + time * orbitSpeed;
            const lx = Math.cos(currentAngle) * data.radius * constrainedExp;
            const ly = Math.sin(currentAngle) * data.radius * constrainedExp;
            const lz = data.zOffset * constrainedExp;

            sprite.position.set(lx, ly, lz);
            sprite.material.opacity = visibility;

            // Update String Particles (Denser)
            for (let j = 0; j < this.particlesPerString; j++) {
                const sIdx = (i * this.particlesPerString + j) * 3;
                const ratio = j / this.particlesPerString;
                const wave = Math.sin(time * 4 + ratio * 10) * 0.02 * visibility;

                strPos[sIdx] = lx * ratio + wave;
                strPos[sIdx + 1] = ly * ratio + wave;
                strPos[sIdx + 2] = lz * ratio;

                const c = new THREE.Color('#6366f1');
                strCol[sIdx] = c.r * ratio;
                strCol[sIdx + 1] = c.g * ratio;
                strCol[sIdx + 2] = c.b;
            }
        });

        this.stringGeometry.attributes.position.needsUpdate = true;
        this.stringGeometry.attributes.color.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);
    }
}

window.initThreeNeuralWeb = (containerId, userSkills) => new ThreeNeuralWeb(containerId, userSkills);
