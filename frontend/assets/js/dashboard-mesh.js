/**
 * Crystal Matrix Background
 * Ultra-Premium "Liquid Mesh" Effect for the Dashboard
 */

class DashboardMesh {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.blobs = [];
        this.init();
    }

    init() {
        this.camera.position.z = 8;

        // Ultra-Premium Palette
        const colors = [0x6366f1, 0x8b5cf6, 0x0ea5e9, 0x4f46e5, 0xc084fc];

        for (let i = 0; i < 8; i++) { // More blobs for density
            const size = Math.random() * 3 + 2;
            const geometry = new THREE.SphereGeometry(size, 64, 64);
            const material = new THREE.MeshPhysicalMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 0.12,
                roughness: 0,
                metalness: 0.1,
                transmission: 0.5, // Physical transparency
                thickness: 2
            });

            const blob = new THREE.Mesh(geometry, material);
            blob.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 5
            );

            // Random movement vectors
            blob.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005,
                (Math.random() - 0.5) * 0.005
            );

            this.scene.add(blob);
            this.blobs.push(blob);
        }

        // Multi-point lighting for "Crystal" refraction
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        this.lights = [];
        const lightColors = [0x6366f1, 0x0ea5e9, 0xffffff];
        lightColors.forEach((color, i) => {
            const light = new THREE.PointLight(color, 0.8, 20);
            light.position.set(
                Math.sin(i) * 10,
                Math.cos(i) * 10,
                5
            );
            this.scene.add(light);
            this.lights.push(light);
        });

        this.animate();

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        const time = Date.now() * 0.0005;
        requestAnimationFrame(() => this.animate());

        this.blobs.forEach((blob, i) => {
            // Organic drifting motion
            blob.position.x += Math.sin(time + i) * 0.003;
            blob.position.y += Math.cos(time + i * 1.5) * 0.003;

            // Subtle pulse
            const pulse = 1 + Math.sin(time * 2 + i) * 0.05;
            blob.scale.set(pulse, pulse, pulse);

            blob.rotation.x += 0.001;
            blob.rotation.y += 0.001;
        });

        // Animate lights
        if (this.lights) {
            this.lights.forEach((light, i) => {
                light.position.x = Math.sin(time * 0.5 + i) * 8;
                light.position.y = Math.cos(time * 0.5 + i) * 8;
            });
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.initDashboardMesh = (containerId) => new DashboardMesh(containerId);
