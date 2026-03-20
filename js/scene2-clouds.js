/* ========================================
   Scene 2 - Clouds & Sunset
   ======================================== */
import * as THREE from 'three';

export class SceneClouds {
    constructor(app) {
        this.app = app;
        this.scene = new THREE.Scene();
        this.clouds = [];
        this.active = false;
        this.textIndex = 0;
        this.isTyping = false;

        this.texts = [
            "جاي افكر هواي بكل الصار وحاب نحجي!",
            "اشتاقيت للأوقات الحلوة والذكريات الجميلة اللي جانت بيننا وماريده تضيع بهل سهولة",
            "ماعرف الامور الصارت وادت لهذا الموقف دون علمي بس اعرف إنو الأمور تخربطت بيننا بس احس نكدر نلگه طريقة نتخطى الصار",
            "بدوري اعتذر على الوصلنا لهذي النقطة واريد اصلح الاكدر عليه",
            "البعد مرات ينطي وضوح وأني أخذت وقتي وفكرت بغير جانب ومنظور حتى اقيم الوضع وشفت يمكن الطرفين كالو أشياء ما قاصدينها وما توضحت من الجانبين لهذا اريد نصفّي القلوب ونترك المضى",
            "واكيد ماكدر اغير الماضي بس اكدر ابني مستقبل احسن اذا انتي موافقة"
        ];

        this.build();
    }

    build() {
        // Sunset sky gradient
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 2;
        skyCanvas.height = 512;
        const skyCtx = skyCanvas.getContext('2d');
        const skyGradient = skyCtx.createLinearGradient(0, 0, 0, 512);
        skyGradient.addColorStop(0, '#0a0a2e');
        skyGradient.addColorStop(0.2, '#1a1040');
        skyGradient.addColorStop(0.4, '#4a1942');
        skyGradient.addColorStop(0.55, '#c2185b');
        skyGradient.addColorStop(0.7, '#ff6f00');
        skyGradient.addColorStop(0.85, '#ffab40');
        skyGradient.addColorStop(1, '#fff3e0');
        skyCtx.fillStyle = skyGradient;
        skyCtx.fillRect(0, 0, 2, 512);
        const skyTexture = new THREE.CanvasTexture(skyCanvas);
        this.scene.background = skyTexture;

        // === Cloud layers ===
        for (let i = 0; i < 40; i++) {
            this.createCloud(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 20 - 2,
                -10 - Math.random() * 60
            );
        }

        // === Sun glow ===
        const sunGeometry = new THREE.PlaneGeometry(30, 30);
        const sunCanvas = document.createElement('canvas');
        sunCanvas.width = 256;
        sunCanvas.height = 256;
        const sunCtx = sunCanvas.getContext('2d');
        const sunGradient = sunCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
        sunGradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
        sunGradient.addColorStop(0.2, 'rgba(255, 150, 50, 0.4)');
        sunGradient.addColorStop(0.5, 'rgba(255, 100, 20, 0.1)');
        sunGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sunCtx.fillStyle = sunGradient;
        sunCtx.fillRect(0, 0, 256, 256);
        const sunTexture = new THREE.CanvasTexture(sunCanvas);
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: sunTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(0, -8, -50);
        this.scene.add(this.sun);

        // === Lighting ===
        const dirLight = new THREE.DirectionalLight(0xffa040, 1.5);
        dirLight.position.set(0, -5, -10);
        this.scene.add(dirLight);

        const ambLight = new THREE.AmbientLight(0x553322, 0.8);
        this.scene.add(ambLight);

        // Warm point light
        const warmLight = new THREE.PointLight(0xff8c00, 3, 80);
        warmLight.position.set(0, -10, -30);
        this.scene.add(warmLight);
    }

    createCloud(x, y, z) {
        const cloudGroup = new THREE.Group();
        const puffCount = 5 + Math.floor(Math.random() * 6);

        for (let i = 0; i < puffCount; i++) {
            const size = 3 + Math.random() * 5;
            const geometry = new THREE.SphereGeometry(size, 12, 12);

            // Pink-white cloud color
            const pinkness = 0.8 + Math.random() * 0.2;
            const color = new THREE.Color().setHSL(
                0.95 + Math.random() * 0.05,
                0.15 + Math.random() * 0.1,
                pinkness
            );

            const material = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.3,
                roughness: 1,
                metalness: 0
            });

            const puff = new THREE.Mesh(geometry, material);
            puff.position.set(
                (Math.random() - 0.5) * size * 2,
                (Math.random() - 0.5) * size * 0.6,
                (Math.random() - 0.5) * size
            );
            puff.scale.setScalar(0.6 + Math.random() * 0.8);
            cloudGroup.add(puff);
        }

        cloudGroup.position.set(x, y, z);
        cloudGroup.userData = {
            speed: 0.2 + Math.random() * 0.5,
            originalX: x
        };

        this.scene.add(cloudGroup);
        this.clouds.push(cloudGroup);
    }

    async activate() {
        this.active = true;
        this.textIndex = 0;
        this.app.camera.position.set(0, 5, 5);
        this.app.camera.lookAt(0, 0, -20);

        // Start camera descent animation
        this.animateCameraEntry();

        // Start text sequence after delay
        setTimeout(() => {
            this.startTextSequence();
        }, 3000);
    }

    animateCameraEntry() {
        const startY = 15;
        const endY = 2;
        const duration = 3000;
        const startTime = Date.now();

        this.app.camera.position.y = startY;

        const animate = () => {
            if (!this.active) return;
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutQuad(progress);

            this.app.camera.position.y = startY + (endY - startY) * eased;
            this.app.camera.lookAt(0, 0, -20);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    async startTextSequence() {
        const textEl = document.getElementById('scene2-text');
        const container = document.getElementById('scene2-text-container');

        for (let i = 0; i < this.texts.length; i++) {
            if (!this.active) return;

            // Fade in container
            container.classList.remove('text-fade-out');
            container.classList.add('text-fade-in');
            container.style.opacity = '1';

            // Typewriter effect
            await this.typeText(textEl, this.texts[i], 40);

            // Wait for reading
            const readTime = Math.max(3000, this.texts[i].length * 60);
            await this.wait(readTime);

            // Fade out
            container.classList.remove('text-fade-in');
            container.classList.add('text-fade-out');
            await this.wait(1500);

            // Clear text
            textEl.textContent = '';
            container.classList.remove('text-fade-out');
            container.style.opacity = '0';
            await this.wait(800);
        }

        // Transition to Scene 3
        await this.wait(1000);
        this.app.switchScene('doors');
    }

    typeText(element, text, speed = 40) {
        return new Promise((resolve) => {
            element.textContent = '';
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text[i];
                    i++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }

    deactivate() {
        this.active = false;
    }

    update(delta, elapsed) {
        if (!this.active) return;

        // Move clouds
        this.clouds.forEach((cloud, i) => {
            cloud.position.x += cloud.userData.speed * delta;
            // Wrap around
            if (cloud.position.x > 50) {
                cloud.position.x = -50;
            }
            // Gentle bobbing
            cloud.position.y += Math.sin(elapsed * 0.3 + i * 0.7) * 0.002;
        });

        // Sun pulse
        if (this.sun) {
            const scale = 1 + Math.sin(elapsed * 0.5) * 0.05;
            this.sun.scale.set(scale, scale, 1);
        }

        // Gentle camera sway
        this.app.camera.position.x = Math.sin(elapsed * 0.1) * 0.3;
    }
}
