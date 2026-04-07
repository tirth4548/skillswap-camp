document.addEventListener('DOMContentLoaded', () => {
    // ===== 1. Interactive Neural Background =====
    // Don't init on dashboard as it has a custom 3D mesh
    const isDashboard = window.location.pathname.includes('dashboard.html');
    if (!isDashboard) {
        initNeuralBackground();
    }
    initCyberBoot();

    // ===== 2. Interactive Mouse Tracking for Floating Orbs =====
    document.addEventListener('mousemove', (e) => {
        const orbs = document.querySelectorAll('.floating-orb');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 20;
            const xOffset = (x - 0.5) * speed;
            const yOffset = (y - 0.5) * speed;
            orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });

    // ===== 3. Cursor-Tracking Glow on Glass Cards =====
    document.querySelectorAll('.glass-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--mouse-x', `50%`);
            card.style.setProperty('--mouse-y', `50%`);
        });
    });

    // ===== 4. 3D Tilt on Stat Cards =====
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6; // max 6deg
            const rotateY = ((x - centerX) / centerX) * 6;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // ===== 5. Staggered Entry Animations for Cards =====
    const cardObserverOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                cardObserver.unobserve(entry.target);
            }
        });
    }, cardObserverOptions);

    document.querySelectorAll('.glass-card, .stat-card').forEach((el, i) => {
        el.style.opacity = '0';
        el.classList.add(`stagger-${(i % 3) + 1}`);
        cardObserver.observe(el);
    });

    // ===== 6. Scroll-Triggered Reveal (Fade-in & Slide-up) =====
    const revealObserverOptions = {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, parseInt(delay));
                revealObserver.unobserve(entry.target);
            }
        });
    }, revealObserverOptions);

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
        revealObserver.observe(el);
    });
});

function initNeuralBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'neural-bg';
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '-3',
        pointerEvents: 'none',
        opacity: '0.8'
    });
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = 80;
    const connectionDist = 200;
    const mouse = { x: null, y: null, radius: 300 };

    const colors = ['#6366f1', '#0ea5e9', '#a855f7', '#ec4899'];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.6;
            this.vy = (Math.random() - 0.5) * 0.6;
            this.radius = Math.random() * 2.5 + 1;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.pulse = Math.random() * Math.PI;
        }

        draw() {
            ctx.beginPath();
            const s = 1 + Math.sin(this.pulse) * 0.3;
            ctx.arc(this.x, this.y, this.radius * s, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();

            // Subtle glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        update() {
            this.pulse += 0.05;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
            this.x += this.vx;
            this.y += this.vy;

            // Mouse interaction
            if (mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    this.x += dx * force * 0.03;
                    this.y += dy * force * 0.03;
                }
            }
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDist) {
                    const opacity = (1 - dist / connectionDist) * 0.4;
                    ctx.beginPath();
                    const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    gradient.addColorStop(0, particles[i].color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
                    gradient.addColorStop(1, particles[j].color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();

                    // Pulse spark
                    if (Math.random() > 0.997) {
                        ctx.beginPath();
                        ctx.fillStyle = '#fff';
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#fff';
                        ctx.arc(particles[i].x + dx * 0.5, particles[i].y + dy * 0.5, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawLines();
        requestAnimationFrame(animate);
        if (document.body && document.body.classList.contains("light-mode")) return;
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    resize();
    init();
    animate();
}
function initCyberBoot() {
    const brackets = document.querySelectorAll('.corner-bracket');
    const scanner = document.querySelector('.scanning-line');

    // Hide initially
    brackets.forEach(b => b.style.opacity = '0');
    if (scanner) scanner.style.opacity = '0';

    setTimeout(() => {
        // Staggered Reveal
        brackets.forEach((b, i) => {
            setTimeout(() => {
                b.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                b.style.opacity = '0.5';
                // Slight glitch movement
                b.animate([
                    { transform: 'translate(10px, 10px)', opacity: 0 },
                    { transform: 'translate(-2px, -2px)', opacity: 1 },
                    { transform: 'translate(0, 0)', opacity: 0.5 }
                ], { duration: 400 });
            }, i * 150);
        });

        if (scanner) {
            setTimeout(() => {
                scanner.style.transition = 'opacity 1s ease';
                scanner.style.opacity = '0.15';
            }, 800);
        }
    }, 500);

    // Add CRT Glitch effect on page load
    const overlay = document.createElement('div');
    overlay.className = 'crt-overlay';
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 1000);
    }, 500);
}
