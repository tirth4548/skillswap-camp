/**
 * Hero 3D Background for SkillSwap Landing Page
 * Features a cinematic, slow-moving neural constellation.
 */

class HeroBackground {
    constructor(containerId) {
        this.container = document.body; // Full page background
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.id = 'hero-canvas-container';
        this.canvasContainer.style.position = 'fixed';
        this.canvasContainer.style.top = '0';
        this.canvasContainer.style.left = '0';
        this.canvasContainer.style.width = '100%';
        this.canvasContainer.style.height = '100%';
        this.canvasContainer.style.zIndex = '-1';
        this.canvasContainer.style.background = 'radial-gradient(circle at center, #0a0a1a 0%, #000000 100%)';
        this.container.appendChild(this.canvasContainer);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.canvasContainer.appendChild(this.renderer.domElement);

        this.points = [];
        this.lines = [];
        this.particleCount = 150;
        this.init();
    }

    init() {
        this.camera.position.z = 20;

        // Create Particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = [];

        for (let i = 0; i < this.particleCount; i++) {
            const x = (Math.random() - 0.5) * 60;
            const y = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 60;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            velocities.push({
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.05,
                z: (Math.random() - 0.5) * 0.05
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.12,
            color: 0x6366f1,
            transparent: true,
            opacity: 0.4, // Reduced from 0.8
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
        this.velocities = velocities;

        // Create initial connections (will update in animate)
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.05, // Reduced from 0.1
            blending: THREE.AdditiveBlending
        });

        this.lineGeometry = new THREE.BufferGeometry();
        this.linePositions = new Float32Array(this.particleCount * this.particleCount * 3);
        this.lineSystem = new THREE.LineSegments(this.lineGeometry, lineMaterial);
        this.scene.add(this.lineSystem);

        this.animate();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Mouse Interactivity
        document.addEventListener('mousemove', (e) => {
            const mouseX = (e.clientX - window.innerWidth / 2) / 200;
            const mouseY = (e.clientY - window.innerHeight / 2) / 200;
            this.scene.rotation.y = mouseX;
            this.scene.rotation.x = mouseY;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const positions = this.particleSystem.geometry.attributes.position.array;

        // Move Particles
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] += this.velocities[i].x;
            positions[i * 3 + 1] += this.velocities[i].y;
            positions[i * 3 + 2] += this.velocities[i].z;

            // Boundary Check
            if (Math.abs(positions[i * 3]) > 30) this.velocities[i].x *= -1;
            if (Math.abs(positions[i * 3 + 1]) > 30) this.velocities[i].y *= -1;
            if (Math.abs(positions[i * 3 + 2]) > 30) this.velocities[i].z *= -1;
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;

        // Dynamic Connections (Simple distance-based)
        const linePositions = [];
        let connectionCount = 0;

        for (let i = 0; i < this.particleCount; i++) {
            for (let j = i + 1; j < this.particleCount; j++) {
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < 8) {
                    linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                    linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                    connectionCount++;
                }
            }
        }

        this.lineSystem.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        this.lineSystem.geometry.attributes.position.needsUpdate = true;

        this.particleSystem.rotation.y += 0.001;
        this.lineSystem.rotation.y += 0.001;

        this.renderer.render(this.scene, this.camera);
    }
}

window.initHeroBackground = () => new HeroBackground();
