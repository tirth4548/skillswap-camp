/**
 * 3D Pulse Background for SkillSwap Chat
 * Visualizes messages as data pulses flowing through a digital stream.
 */

class ChatPulse {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.particles = [];
        this.pulses = [];
        this.init();
    }

    init() {
        this.camera.position.z = 5;

        // Background Stream of Particles
        const geo = new THREE.BufferGeometry();
        const count = 1500; // Increased density
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.03,
            color: 0x6366f1,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        this.stream = new THREE.Points(geo, mat);
        this.scene.add(this.stream);

        this.animate();

        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        });
    }

    triggerPulse(color = 0x6366f1) {
        const geo = new THREE.SphereGeometry(0.15, 12, 12);
        const mat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const pulse = new THREE.Mesh(geo, mat);
        pulse.position.set((Math.random() - 0.5) * 2, -5, 0);
        this.scene.add(pulse);
        this.pulses.push({ mesh: pulse, speed: 0.1 + Math.random() * 0.1 });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Move stream
        const positions = this.stream.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += 0.02;
            if (positions[i + 1] > 10) positions[i + 1] = -10;
        }
        this.stream.geometry.attributes.position.needsUpdate = true;

        // Move pulses
        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const p = this.pulses[i];
            p.mesh.position.y += p.speed;
            p.mesh.scale.multiplyScalar(1.02);
            p.mesh.material.opacity -= 0.01;

            if (p.mesh.material.opacity <= 0) {
                this.scene.remove(p.mesh);
                this.pulses.splice(i, 1);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.initChatPulse = (containerId) => new ChatPulse(containerId);
