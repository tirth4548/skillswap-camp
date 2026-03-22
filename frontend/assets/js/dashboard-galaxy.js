/**
 * Deep Space Nebula Background for SkillSwap Dashboard
 * Uses Three.js for interactive galactic environments
 */

class DashboardGalaxy {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.z = 1;
        this.camera.rotation.x = 1.16;
        this.camera.rotation.y = -0.12;
        this.camera.rotation.z = 0.27;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.cloudParticles = [];
        this.init();
    }

    init() {
        let loader = new THREE.TextureLoader();
        // Fallback to procedural cloud if hosted image fails
        loader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/disturb.jpg", (texture) => {
            const cloudGeo = new THREE.PlaneBufferGeometry(500, 500);
            const cloudMaterial = new THREE.MeshLambertMaterial({
                map: texture,
                transparent: true,
                opacity: 0.12, // Reduced for readability
                blending: THREE.AdditiveBlending
            });

            for (let p = 0; p < 50; p++) { // Increased cloud count
                let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
                cloud.position.set(
                    Math.random() * 800 - 400,
                    500,
                    Math.random() * 500 - 450
                );
                cloud.rotation.x = 1.16;
                cloud.rotation.y = -0.12;
                cloud.rotation.z = Math.random() * 360;
                cloud.material.color.setHSL(Math.random() * 0.2 + 0.6, 0.7, 0.5); // Blue/Purple nebula
                this.scene.add(cloud);
                this.cloudParticles.push(cloud);
            }
            this.animate();
        });

        // Ambient Light
        const ambient = new THREE.AmbientLight(0x555555);
        this.scene.add(ambient);

        // Directional Lights (Nebula Glow)
        const directionalLight = new THREE.DirectionalLight(0xffeedd, 0.5);
        directionalLight.position.set(0, 0, 1);
        this.scene.add(directionalLight);

        // Blue point light
        this.flash = new THREE.PointLight(0x06b6d4, 20, 500, 1.5);
        this.flash.position.set(200, 300, 100);
        this.scene.add(this.flash);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Parallax Mouse Movement
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX - window.innerWidth / 2) / 1000;
            const y = (e.clientY - window.innerHeight / 2) / 1000;
            this.scene.rotation.x = y * 0.1;
            this.scene.rotation.y = x * 0.1;
        });

        // Parallax Stats Cards
        this.initParallaxCards();
    }

    initParallaxCards() {
        const cards = document.querySelectorAll('.holographic-panel');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 10;
                const rotateY = -(x - centerX) / 10;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

                // Update CSS variables for shimmer effect
                card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
                card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
            });
        });
    }

    animate() {
        this.cloudParticles.forEach(p => {
            p.rotation.z -= 0.002;
        });

        // Pulse the nebula light (more subtle)
        if (this.flash) {
            this.flash.intensity = 15 + Math.sin(Date.now() * 0.001) * 8;
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

window.initDashboardGalaxy = (containerId) => new DashboardGalaxy(containerId);
