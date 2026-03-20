/* ========================================
   Scene 1 - Space & Stars
   ======================================== */
import * as THREE from 'three';

export class SceneSpace {
    constructor(app) {
        this.app = app;
        this.scene = new THREE.Scene();
        this.stars = null;
        this.galaxies = [];
        this.nebulae = [];
        this.active = false;
        this.cameraTransitioning = false;

        this.build();
        this.setupEvents();
    }

    build() {
        // Deep space background
        this.scene.background = new THREE.Color(0x000011);
        this.scene.fog = new THREE.FogExp2(0x000011, 0.00015);

        // === Stars (particles) ===
        const starCount = 4000;
        const starGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 200 + Math.random() * 800;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Star colors: white, blue-white, yellow-white
            const colorChoice = Math.random();
            if (colorChoice < 0.5) {
                colors[i3] = 0.9 + Math.random() * 0.1;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 1.0;
            } else if (colorChoice < 0.8) {
                colors[i3] = 0.7 + Math.random() * 0.3;
                colors[i3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i3 + 2] = 1.0;
            } else {
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 0.7 + Math.random() * 0.2;
            }

            sizes[i] = 0.5 + Math.random() * 2.5;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);

        // === Twinkling layer ===
        const twinkleCount = 800;
        const twinkleGeometry = new THREE.BufferGeometry();
        const twinklePositions = new Float32Array(twinkleCount * 3);
        const twinkleSizes = new Float32Array(twinkleCount);

        for (let i = 0; i < twinkleCount; i++) {
            const i3 = i * 3;
            const radius = 150 + Math.random() * 500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            twinklePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            twinklePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            twinklePositions[i3 + 2] = radius * Math.cos(phi);
            twinkleSizes[i] = Math.random();
        }

        twinkleGeometry.setAttribute('position', new THREE.BufferAttribute(twinklePositions, 3));
        twinkleGeometry.setAttribute('size', new THREE.BufferAttribute(twinkleSizes, 1));

        this.twinkleMaterial = new THREE.PointsMaterial({
            size: 2.5,
            color: 0xa78bfa,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.twinkleStars = new THREE.Points(twinkleGeometry, this.twinkleMaterial);
        this.scene.add(this.twinkleStars);

        // === Distant Nebulae (colored clouds) ===
        this.createNebula(new THREE.Vector3(-300, 100, -500), 0x6d28d9, 120);
        this.createNebula(new THREE.Vector3(400, -50, -600), 0xec4899, 80);
        this.createNebula(new THREE.Vector3(100, 200, -700), 0x3b82f6, 100);

        // === Galaxy spiral ===
        this.createGalaxy();

        // === Ambient light ===
        const ambient = new THREE.AmbientLight(0x222244, 0.4);
        this.scene.add(ambient);

        // Point light for glow
        const pointLight = new THREE.PointLight(0xa78bfa, 2, 100);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);
    }

    createNebula(position, color, size) {
        const geometry = new THREE.PlaneGeometry(size, size);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        const c = new THREE.Color(color);
        gradient.addColorStop(0, `rgba(${Math.floor(c.r*255)}, ${Math.floor(c.g*255)}, ${Math.floor(c.b*255)}, 0.3)`);
        gradient.addColorStop(0.4, `rgba(${Math.floor(c.r*255)}, ${Math.floor(c.g*255)}, ${Math.floor(c.b*255)}, 0.1)`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.lookAt(0, 0, 0);
        this.scene.add(mesh);
        this.nebulae.push(mesh);
    }

    createGalaxy() {
        const arms = 5;
        const pointsPerArm = 600;
        const galaxyGeometry = new THREE.BufferGeometry();
        const galaxyPositions = new Float32Array(arms * pointsPerArm * 3);
        const galaxyColors = new Float32Array(arms * pointsPerArm * 3);

        for (let a = 0; a < arms; a++) {
            const armAngle = (a / arms) * Math.PI * 2;
            for (let i = 0; i < pointsPerArm; i++) {
                const idx = (a * pointsPerArm + i) * 3;
                const dist = (i / pointsPerArm) * 60;
                const angle = armAngle + (dist * 0.15);
                const scatter = (Math.random() - 0.5) * (dist * 0.15 + 2);
                const scatterY = (Math.random() - 0.5) * 3;

                galaxyPositions[idx] = Math.cos(angle) * dist + scatter - 200;
                galaxyPositions[idx + 1] = scatterY + 150;
                galaxyPositions[idx + 2] = Math.sin(angle) * dist + scatter - 600;

                const t = i / pointsPerArm;
                galaxyColors[idx] = 0.5 + t * 0.5;
                galaxyColors[idx + 1] = 0.3 + t * 0.2;
                galaxyColors[idx + 2] = 0.9;
            }
        }

        galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3));
        galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));

        const galaxyMaterial = new THREE.PointsMaterial({
            size: 1.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
        this.scene.add(this.galaxy);
    }

    setupEvents() {
        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', () => {
            // Resume audio context on user gesture
            if (this.app.audioContext && this.app.audioContext.state === 'suspended') {
                this.app.audioContext.resume();
            }
            this.app.playSong('song1');
            this.transitionToEarth();
        });
    }

    transitionToEarth() {
        if (this.cameraTransitioning) return;
        this.cameraTransitioning = true;
        this.app.transitionLock = true;

        // Fade out overlay
        const overlay = document.getElementById('scene1-overlay');
        overlay.style.transition = 'opacity 2s ease';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';

        // Camera zoom animation
        const startPos = { ...this.app.camera.position };
        const duration = 4000;
        const startTime = Date.now();

        const animateZoom = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress);

            this.app.camera.position.z = startPos.z - eased * 200;
            this.app.camera.position.y = startPos.y + eased * 50;

            // Increase bloom during transition
            this.app.bloomPass.strength = 0.8 + eased * 1.5;

            if (progress < 1) {
                requestAnimationFrame(animateZoom);
            } else {
                // Switch to clouds scene
                this.app.transitionLock = false;
                this.app.bloomPass.strength = 0.8;
                this.app.camera.position.set(0, 0, 5);
                this.app.switchScene('clouds');
            }
        };

        animateZoom();
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    activate() {
        this.active = true;
        this.app.camera.position.set(0, 0, 5);
    }

    deactivate() {
        this.active = false;
    }

    update(delta, elapsed) {
        if (!this.active) return;

        // Rotate stars slowly
        if (this.stars) {
            this.stars.rotation.y += delta * 0.01;
            this.stars.rotation.x += delta * 0.005;
        }

        // Twinkle effect
        if (this.twinkleMaterial) {
            this.twinkleMaterial.opacity = 0.3 + Math.sin(elapsed * 2) * 0.3;
        }

        if (this.twinkleStars) {
            this.twinkleStars.rotation.y -= delta * 0.015;
        }

        // Nebulae gentle movement
        this.nebulae.forEach((neb, i) => {
            neb.material.opacity = 0.15 + Math.sin(elapsed * 0.5 + i) * 0.05;
        });

        // Galaxy rotation
        if (this.galaxy) {
            this.galaxy.rotation.y += delta * 0.02;
        }
    }
}
