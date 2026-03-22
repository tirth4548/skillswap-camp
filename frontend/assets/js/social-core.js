/**
 * 3D Global Neural Core for SkillSwap Social Hub
 * Visualizes all users as interconnected neural synapses in 3D space.
 */

class SocialCore {
    constructor(containerId, users = []) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.users = users;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.offsetWidth / this.container.offsetHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.nodes = [];
        this.links = [];
        this.init();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.container || this.container.offsetWidth === 0) return;
        this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    }

    init() {
        this.camera.position.z = 20;

        // Ensure container has size, if not, wait or use screen size for first pass
        const width = this.container.offsetWidth || window.innerWidth * 0.5;
        const height = this.container.offsetHeight || 600;
        this.renderer.setSize(width, height);

        // Add Ambient Light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        if (!this.users || this.users.length === 0) {
            // Default: Show a beautiful "Neural Heart" center hub
            const geometry = new THREE.IcosahedronGeometry(4, 2);
            const material = new THREE.MeshPhongMaterial({
                color: 0x6366f1,
                emissive: 0x4f46e5,
                emissiveIntensity: 1.5,
                wireframe: true,
                transparent: true,
                opacity: 0.6
            });
            const core = new THREE.Mesh(geometry, material);
            core.name = "FallbackCore";
            this.scene.add(core);
            this.nodes.push(core);

            // Add a floating ring around the core
            const ringGeo = new THREE.TorusGeometry(7, 0.05, 16, 100);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.3 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            this.scene.add(ring);
        } else {
            this.users.forEach((user, i) => {
                const geometry = new THREE.SphereGeometry(0.5, 24, 24);
                const isMatch = (user.match_score || 0) > 80;
                const material = new THREE.MeshStandardMaterial({
                    color: isMatch ? 0x6366f1 : 0xffffff,
                    emissive: isMatch ? 0x6366f1 : 0x222222,
                    emissiveIntensity: isMatch ? 1.0 : 0.2,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const node = new THREE.Mesh(geometry, material);

                // Random sphere distribution
                const phi = Math.acos(-1 + (2 * i) / (this.users.length > 1 ? this.users.length - 1 : 1));
                const theta = Math.sqrt(this.users.length * Math.PI) * phi;
                const r = 10;

                node.position.set(
                    r * Math.cos(theta) * Math.sin(phi),
                    r * Math.sin(theta) * Math.sin(phi),
                    r * Math.cos(phi)
                );

                node.userData = { user };
                this.scene.add(node);
                this.nodes.push(node);
            });
        }

        // Add Neural Connections
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.2
        });

        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                if (Math.random() > 0.9) {
                    const points = [this.nodes[i].position, this.nodes[j].position];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(geometry, lineMaterial);
                    this.scene.add(line);
                }
            }
        }

        // Add Lighting
        const light = new THREE.PointLight(0xffffff, 1.5, 100);
        light.position.set(10, 10, 10);
        this.scene.add(light);

        // Raycaster for interaction (Initialized before animation starts)
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.container.addEventListener('click', (e) => this.onNodeClick(e));

        this.animate();
    }

    onMouseMove(event) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    onNodeClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes);
        if (intersects.length > 0) {
            const user = intersects[0].object.userData.user;
            if (user && window.showUserCard) window.showUserCard(user);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Gentle rotation
        this.scene.rotation.y += 0.003;
        this.scene.rotation.x += 0.001;

        // Hover effect
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nodes);

        this.nodes.forEach(n => {
            // Pulse matches
            if (n.material.emissive && n.material.emissiveIntensity > 0.5) {
                n.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
            } else {
                n.scale.setScalar(1);
            }
        });

        if (intersects.length > 0) {
            intersects[0].object.scale.setScalar(1.5);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.initSocialCore = (containerId, users) => {
    window.socialCoreInstance = new SocialCore(containerId, users);
    return window.socialCoreInstance;
};
