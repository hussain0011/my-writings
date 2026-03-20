/* ========================================
   Scene 4 - Middle Door: Yes/No & Book
   Enhanced with page-tear animation
   ======================================== */
import * as THREE from 'three';

export class SceneBook {
    constructor(app) {
        this.app = app;
        this.scene = new THREE.Scene();
        this.active = false;
        this.noCount = 0;
        this.bookOpened = false;
        this.tornPieces = [];
        this.pages = [];
        this.currentPageIndex = 0;
        this.isAnimating = false;

        this.introText = "يفراشتي مكانتج خاصة عندي وماقبل اشوف الزعل على ملامحج اللطيفة الجميلة  ✨";
        this.bookText = "صفحة جديدة لحياة جديدة مع شخص يستحق أن نسميه الحياة بذاتها";

        this.build();
        this.setupEvents();
    }

    build() {
        // Dark romantic atmosphere
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = 2;
        bgCanvas.height = 512;
        const bgCtx = bgCanvas.getContext('2d');
        const bgGrad = bgCtx.createLinearGradient(0, 0, 0, 512);
        bgGrad.addColorStop(0, '#0a0020');
        bgGrad.addColorStop(0.4, '#1a0a3e');
        bgGrad.addColorStop(0.7, '#2d1060');
        bgGrad.addColorStop(1, '#0a0020');
        bgCtx.fillStyle = bgGrad;
        bgCtx.fillRect(0, 0, 2, 512);
        const bgTexture = new THREE.CanvasTexture(bgCanvas);
        this.scene.background = bgTexture;

        // === Floating particles ===
        const particleCount = 500;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = (Math.random() - 0.5) * 40;
            particlePositions[i3 + 1] = (Math.random() - 0.5) * 20;
            particlePositions[i3 + 2] = (Math.random() - 0.5) * 40 - 10;
            particleSizes[i] = Math.random();
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

        this.particleMaterial = new THREE.PointsMaterial({
            color: 0xc084fc,
            size: 0.15,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(particleGeometry, this.particleMaterial);
        this.scene.add(this.particles);

        // === 3D Book (enhanced) ===
        this.createBookMesh();

        // === Lighting ===
        const ambient = new THREE.AmbientLight(0x1a0a30, 0.6);
        this.scene.add(ambient);

        const mainLight = new THREE.PointLight(0xa78bfa, 3, 30);
        mainLight.position.set(0, 5, 5);
        this.scene.add(mainLight);
        this.mainLight = mainLight;

        const accentLight = new THREE.PointLight(0xec4899, 1.5, 25);
        accentLight.position.set(-5, 3, -5);
        this.scene.add(accentLight);

        const bookLight = new THREE.SpotLight(0xffffff, 2, 20, Math.PI / 6, 0.5);
        bookLight.position.set(0, 8, 3);
        bookLight.target.position.set(0, 0, -5);
        bookLight.castShadow = true;
        this.scene.add(bookLight);
        this.scene.add(bookLight.target);
        this.bookLight = bookLight;
    }

    createBookMesh() {
        this.bookGroup = new THREE.Group();
        this.bookGroup.visible = false;

        const coverWidth = 3.2;
        const coverDepth = 4.2;
        const coverThickness = 0.12;

        // --- Back Cover ---
        const coverGeo = new THREE.BoxGeometry(coverWidth, coverThickness, coverDepth);
        const coverMat = new THREE.MeshStandardMaterial({
            color: 0x2d1060,
            roughness: 0.35,
            metalness: 0.6,
            emissive: 0x1a0840,
            emissiveIntensity: 0.3
        });

        const backCover = new THREE.Mesh(coverGeo, coverMat);
        backCover.position.set(0, -0.06, 0);
        backCover.receiveShadow = true;
        this.bookGroup.add(backCover);

        // --- Pages Stack ---
        const pagesGeo = new THREE.BoxGeometry(coverWidth - 0.2, 0.35, coverDepth - 0.2);
        const pagesMat = new THREE.MeshStandardMaterial({
            color: 0xf5f0e8,
            roughness: 0.95,
            metalness: 0
        });
        const pagesStack = new THREE.Mesh(pagesGeo, pagesMat);
        pagesStack.position.set(0, 0.12, 0);
        pagesStack.castShadow = true;
        this.bookGroup.add(pagesStack);

        // --- Individual turnable pages (5 pages) ---
        this.pages = [];
        for (let i = 0; i < 5; i++) {
            const page = this.createSinglePage(i);
            page.position.set(coverWidth / 2 - 0.1, 0.32 + i * 0.01, 0);
            page.userData.originalY = 0.32 + i * 0.01;
            page.userData.pageIndex = i;
            this.bookGroup.add(page);
            this.pages.push(page);
        }

        // --- Front Cover (opens) ---
        this.frontCoverPivot = new THREE.Group();
        this.frontCoverPivot.position.set(coverWidth / 2, 0.35, 0);

        const frontCoverMesh = new THREE.Mesh(coverGeo.clone(), coverMat.clone());
        frontCoverMesh.material.emissive = new THREE.Color(0x3d1880);
        frontCoverMesh.position.set(-coverWidth / 2, 0, 0);
        frontCoverMesh.castShadow = true;
        this.frontCoverPivot.add(frontCoverMesh);

        // Cover decorative emblem
        const emblemGeo = new THREE.RingGeometry(0.3, 0.5, 6);
        const emblemMat = new THREE.MeshStandardMaterial({
            color: 0xd4a8ff,
            emissive: 0xa78bfa,
            emissiveIntensity: 0.8,
            side: THREE.DoubleSide
        });
        const emblem = new THREE.Mesh(emblemGeo, emblemMat);
        emblem.position.set(-coverWidth / 2, coverThickness / 2 + 0.01, 0);
        emblem.rotation.x = -Math.PI / 2;
        this.frontCoverPivot.add(emblem);

        this.bookGroup.add(this.frontCoverPivot);

        // --- Spine ---
        const spineGeo = new THREE.BoxGeometry(0.08, 0.55, coverDepth);
        const spineMat = new THREE.MeshStandardMaterial({
            color: 0xa78bfa,
            emissive: 0x6d28d9,
            emissiveIntensity: 0.5
        });
        const spine = new THREE.Mesh(spineGeo, spineMat);
        spine.position.set(coverWidth / 2, 0.15, 0);
        this.bookGroup.add(spine);

        // --- Golden corner decorations ---
        const corners = [
            [-coverWidth / 2 + 0.15, coverThickness / 2 + 0.36, -coverDepth / 2 + 0.15],
            [-coverWidth / 2 + 0.15, coverThickness / 2 + 0.36, coverDepth / 2 - 0.15],
            [coverWidth / 2 - 0.15, coverThickness / 2 + 0.36, -coverDepth / 2 + 0.15],
            [coverWidth / 2 - 0.15, coverThickness / 2 + 0.36, coverDepth / 2 - 0.15],
        ];
        const cornerGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const cornerMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xcc9900,
            emissiveIntensity: 0.4,
            metalness: 0.9,
            roughness: 0.2
        });
        corners.forEach(pos => {
            const c = new THREE.Mesh(cornerGeo, cornerMat);
            c.position.set(...pos);
            this.bookGroup.add(c);
        });

        this.bookGroup.position.set(0, -1, -5);
        this.bookGroup.rotation.x = -Math.PI / 6;
        this.scene.add(this.bookGroup);
    }

    createSinglePage(index) {
        // Create a page with pivot at the right edge (spine side)
        const pivot = new THREE.Group();

        const pageW = 2.9;
        const pageH = 3.8;
        const pageGeo = new THREE.PlaneGeometry(pageW, pageH, 12, 12);
        const pageMat = new THREE.MeshStandardMaterial({
            color: 0xfaf6ef,
            roughness: 0.95,
            metalness: 0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95
        });

        const pageMesh = new THREE.Mesh(pageGeo, pageMat);
        pageMesh.rotation.x = -Math.PI / 2;
        pageMesh.position.set(-pageW / 2, 0, 0);
        pageMesh.castShadow = true;
        pageMesh.receiveShadow = true;

        // Faint line decorations on page
        const lineGeo = new THREE.PlaneGeometry(pageW - 0.4, 0.005, 1, 1);
        const lineMat = new THREE.MeshBasicMaterial({
            color: 0xc8bfa8,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        for (let l = 0; l < 8; l++) {
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(-pageW / 2, 0.001, -pageH / 2 + 0.5 + l * 0.45);
            pivot.add(line);
        }

        pivot.add(pageMesh);
        pivot.userData.pageMesh = pageMesh;
        return pivot;
    }

    setupEvents() {
        const btnYes = document.getElementById('btn-yes');
        const btnNo = document.getElementById('btn-no');

        btnYes.addEventListener('click', () => {
            this.onYes();
        });

        btnNo.addEventListener('click', () => {
            this.onNo();
        });
    }

    onNo() {
        this.noCount++;

        // Shake the No button
        const btnNo = document.getElementById('btn-no');
        btnNo.classList.remove('shake');
        void btnNo.offsetWidth;
        btnNo.classList.add('shake');

        // Screen shake
        const canvas = document.getElementById('experience-canvas');
        canvas.classList.remove('screen-shake');
        void canvas.offsetWidth;
        canvas.classList.add('screen-shake');

        // Show notification
        this.app.showNotification('متأكدة؟ 🥺');

        setTimeout(() => {
            btnNo.classList.remove('shake');
            canvas.classList.remove('screen-shake');
        }, 600);

        // After 3 presses, convert No to Yes
        if (this.noCount >= 3) {
            setTimeout(() => {
                btnNo.textContent = 'نعم';
                btnNo.classList.remove('btn-no');
                btnNo.classList.add('btn-yes');
                btnNo.style.background = 'linear-gradient(135deg, #059669, #34d399)';
                btnNo.style.borderColor = 'rgba(52, 211, 153, 0.5)';
                btnNo.removeEventListener('click', () => {});
                btnNo.addEventListener('click', () => this.onYes());
            }, 700);
        }
    }

    async onYes() {
        if (this.bookOpened) return;
        this.bookOpened = true;

        // Hide question
        this.app.hideOverlay('scene4-overlay');

        // Show book overlay
        this.app.showOverlay('book-overlay');

        // Show 3D book
        this.bookGroup.visible = true;

        // Step 1: Book enters from below with scale animation
        await this.animateBookEntrance();

        // Step 2: Front cover opens dramatically
        await this.animateCoverOpen();

        // Step 3: Pages turn one by one with tearing on the old page
        await this.wait(800);
        await this.animatePagesTurningWithTear();

        // Step 4: Final page with text
        const bookTextEl = document.getElementById('book-text');
        await this.wait(1000);
        await this.typeText(bookTextEl, this.bookText, 60);

        // Wait for reading
        await this.wait(5000);

        // Step 5: Book closes and fades
        await this.animateBookClose();

        // Show finale
        this.app.hideOverlay('book-overlay');
        this.showFinale();
    }

    animateBookEntrance() {
        return new Promise((resolve) => {
            const duration = 1500;
            const startTime = Date.now();
            const startY = -6;
            const endY = -1;

            this.bookGroup.position.y = startY;
            this.bookGroup.scale.set(0.3, 0.3, 0.3);

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutBack(progress);

                this.bookGroup.position.y = startY + (endY - startY) * eased;
                const s = 0.3 + 0.7 * eased;
                this.bookGroup.scale.set(s, s, s);

                // Gentle rotation as it enters
                this.bookGroup.rotation.y = (1 - eased) * Math.PI * 0.3;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    animateCoverOpen() {
        return new Promise((resolve) => {
            const duration = 2000;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutBack(progress);

                // Rotate cover open around the spine (right edge / pivot)
                this.frontCoverPivot.rotation.z = eased * Math.PI * 0.85;

                // Camera moves closer
                this.app.camera.position.z = 5 - eased * 1.5;
                this.app.camera.position.y = 2 - eased * 0.5;

                // Bloom increases during opening
                this.app.bloomPass.strength = 0.8 + eased * 0.6;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.app.bloomPass.strength = 1.0;
                    resolve();
                }
            };
            animate();
        });
    }

    animatePagesTurningWithTear() {
        return new Promise(async (resolve) => {
            // Turn pages 0-3, each with a tear effect
            for (let i = 0; i < Math.min(this.pages.length - 1, 4); i++) {
                await this.turnAndTearPage(this.pages[i], i);
                await this.wait(600);
            }
            resolve();
        });
    }

    turnAndTearPage(page, index) {
        return new Promise((resolve) => {
            const duration = 1200;
            const startTime = Date.now();
            const tearStartProgress = 0.4; // tear starts mid-turn

            let tornCreated = false;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Page turns with curve easing
                const turnEased = this.easeInOutCubic(progress);
                page.rotation.z = turnEased * Math.PI * 0.92;

                // Page lifts slightly during turn
                page.position.y = page.userData.originalY + Math.sin(progress * Math.PI) * 0.3;

                // Deform page (wave effect during turn)
                const pageMesh = page.userData.pageMesh;
                if (pageMesh && pageMesh.geometry) {
                    const posAttr = pageMesh.geometry.attributes.position;
                    for (let v = 0; v < posAttr.count; v++) {
                        const x = posAttr.getX(v);
                        // Wave deformation based on distance from spine
                        const wave = Math.sin(progress * Math.PI) * Math.sin((x + 1.5) * 2) * 0.08;
                        posAttr.setZ(v, wave);
                    }
                    posAttr.needsUpdate = true;
                }

                // Create torn pieces at the tear point
                if (progress > tearStartProgress && !tornCreated) {
                    tornCreated = true;
                    this.createTornPieces(page);
                }

                // Fade page slightly towards end
                if (pageMesh && pageMesh.material) {
                    pageMesh.material.opacity = 1 - progress * 0.15;
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Reset page deformation
                    if (pageMesh && pageMesh.geometry) {
                        const posAttr = pageMesh.geometry.attributes.position;
                        for (let v = 0; v < posAttr.count; v++) {
                            posAttr.setZ(v, 0);
                        }
                        posAttr.needsUpdate = true;
                    }
                    resolve();
                }
            };
            animate();
        });
    }

    createTornPieces(sourcePage) {
        const worldPos = new THREE.Vector3();
        sourcePage.getWorldPosition(worldPos);

        const pieceCount = 8 + Math.floor(Math.random() * 6);

        for (let i = 0; i < pieceCount; i++) {
            // Random irregular shape for torn paper
            const w = 0.15 + Math.random() * 0.35;
            const h = 0.1 + Math.random() * 0.3;

            const shape = new THREE.Shape();
            const points = 5 + Math.floor(Math.random() * 3);
            for (let p = 0; p < points; p++) {
                const angle = (p / points) * Math.PI * 2;
                const r = (w + h) / 4 * (0.6 + Math.random() * 0.4);
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (p === 0) shape.moveTo(px, py);
                else shape.lineTo(px, py);
            }
            shape.closePath();

            const geo = new THREE.ShapeGeometry(shape);
            const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.1, 0.08, 0.92 + Math.random() * 0.06),
                roughness: 0.95,
                metalness: 0,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });

            const piece = new THREE.Mesh(geo, mat);
            piece.position.set(
                worldPos.x + (Math.random() - 0.5) * 2,
                worldPos.y + 0.5 + Math.random() * 0.5,
                worldPos.z + (Math.random() - 0.5) * 2
            );
            piece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            piece.castShadow = true;

            // Physics-like properties
            piece.userData = {
                vx: (Math.random() - 0.5) * 0.06,
                vy: 0.02 + Math.random() * 0.04,
                vz: (Math.random() - 0.5) * 0.06,
                rotSpeedX: (Math.random() - 0.5) * 0.08,
                rotSpeedY: (Math.random() - 0.5) * 0.08,
                rotSpeedZ: (Math.random() - 0.5) * 0.08,
                gravity: 0.001,
                life: 1.0,
                fadeSpeed: 0.003 + Math.random() * 0.004
            };

            this.scene.add(piece);
            this.tornPieces.push(piece);
        }

        // Emit glow particles at tear point
        this.emitTearParticles(worldPos);
    }

    emitTearParticles(position) {
        const count = 20;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x + (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 1] = position.y + Math.random() * 1;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 1.5;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xffd700,
            size: 0.12,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const sparkles = new THREE.Points(geo, mat);
        sparkles.userData = { life: 1.0, fadeSpeed: 0.015 };
        this.scene.add(sparkles);
        this.tornPieces.push(sparkles); // reuse array for cleanup
    }

    animateBookClose() {
        return new Promise((resolve) => {
            const duration = 2000;
            const startTime = Date.now();

            const startRotZ = this.frontCoverPivot.rotation.z;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeInOutCubic(progress);

                // Close cover
                this.frontCoverPivot.rotation.z = startRotZ * (1 - eased);

                // Book floats up and shrinks
                this.bookGroup.position.y = -1 + eased * 3;
                const s = 1 - eased * 0.5;
                this.bookGroup.scale.set(s, s, s);
                this.bookGroup.rotation.y = eased * Math.PI * 0.2;

                // Fade bloom
                this.app.bloomPass.strength = 1.0 + eased * 1.2;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.app.bloomPass.strength = 0.8;
                    resolve();
                }
            };
            animate();
        });
    }

    async showFinale() {
        this.startCelebrationParticles();
        await this.wait(500);
        this.app.showOverlay('finale-overlay');
        this.app.showNotification('🌸 شكراً لك على هذه الرحلة 🌸', 5000);
    }

    startCelebrationParticles() {
        const particleCanvas = document.getElementById('particle-canvas');
        particleCanvas.classList.add('active');
        const ctx = particleCanvas.getContext('2d');
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;

        const celebrationParticles = [];
        const colors = ['#a78bfa', '#ec4899', '#f59e0b', '#34d399', '#f472b6', '#818cf8', '#fb923c'];

        for (let i = 0; i < 120; i++) {
            celebrationParticles.push({
                x: Math.random() * particleCanvas.width,
                y: -20 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 3,
                vy: 1 + Math.random() * 3,
                size: 3 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                opacity: 0.8 + Math.random() * 0.2
            });
        }

        const animateParticles = () => {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

            let allDone = true;
            celebrationParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.02;
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.001;

                if (p.y < particleCanvas.height + 50 && p.opacity > 0) {
                    allDone = false;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;

                    ctx.beginPath();
                    for (let j = 0; j < 5; j++) {
                        const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2;
                        const r = p.size;
                        if (j === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
                        else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            });

            if (!allDone) {
                requestAnimationFrame(animateParticles);
            } else {
                particleCanvas.classList.remove('active');
            }
        };

        animateParticles();
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

    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    async activate() {
        this.active = true;
        this.noCount = 0;
        this.bookOpened = false;
        this.tornPieces = [];
        this.app.camera.position.set(0, 2, 5);
        this.app.camera.lookAt(0, 0, 0);

        // Play song2
        this.app.playSong('song2');

        // Show intro text
        const textEl = document.getElementById('scene4-text');
        const container = document.getElementById('scene4-text-container');
        container.style.display = '';
        container.classList.remove('text-fade-out');

        await this.wait(1500);
        await this.typeText(textEl, this.introText, 50);

        // Wait for reading
        await this.wait(4000);

        // Fade out intro text
        container.classList.add('text-fade-out');
        await this.wait(1500);
        container.style.display = 'none';

        // Show question with buttons
        const questionContainer = document.getElementById('question-container');
        questionContainer.classList.remove('hidden');
        questionContainer.style.pointerEvents = 'all';

        // Reset No button
        const btnNo = document.getElementById('btn-no');
        btnNo.textContent = 'لا';
        btnNo.className = 'btn-3d btn-no';
        btnNo.style.background = '';
        btnNo.style.borderColor = '';
    }

    deactivate() {
        this.active = false;
        // Clean up torn pieces
        this.tornPieces.forEach(p => {
            this.scene.remove(p);
            if (p.geometry) p.geometry.dispose();
            if (p.material) p.material.dispose();
        });
        this.tornPieces = [];
    }

    update(delta, elapsed) {
        if (!this.active) return;

        // Floating particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(elapsed * 0.8 + i) * 0.003;
                positions[i] += Math.cos(elapsed * 0.3 + i * 0.5) * 0.001;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // Light pulse
        if (this.mainLight) {
            this.mainLight.intensity = 2.5 + Math.sin(elapsed * 1.2) * 0.5;
        }

        // Book floating
        if (this.bookGroup && this.bookGroup.visible && !this.isAnimating) {
            this.bookGroup.position.y += Math.sin(elapsed * 0.5) * 0.001;
            this.bookGroup.rotation.y = Math.sin(elapsed * 0.2) * 0.05;
        }

        // Animate torn pieces (physics)
        for (let i = this.tornPieces.length - 1; i >= 0; i--) {
            const piece = this.tornPieces[i];
            const d = piece.userData;

            if (d.vx !== undefined) {
                // Paper piece physics
                piece.position.x += d.vx;
                piece.position.y -= d.vy;
                piece.position.z += d.vz;
                d.vy += d.gravity; // gravity pulls down

                // Flutter effect
                d.vx += Math.sin(elapsed * 3 + i) * 0.0005;
                d.vz += Math.cos(elapsed * 2.5 + i) * 0.0005;

                piece.rotation.x += d.rotSpeedX;
                piece.rotation.y += d.rotSpeedY;
                piece.rotation.z += d.rotSpeedZ;

                // Slow down rotation over time
                d.rotSpeedX *= 0.998;
                d.rotSpeedY *= 0.998;
                d.rotSpeedZ *= 0.998;

                d.life -= d.fadeSpeed;
                if (piece.material) {
                    piece.material.opacity = Math.max(0, d.life);
                }
            } else if (d.life !== undefined) {
                // Sparkle particle
                d.life -= d.fadeSpeed;
                if (piece.material) {
                    piece.material.opacity = Math.max(0, d.life);
                }
            }

            // Remove dead pieces
            if (d.life !== undefined && d.life <= 0) {
                this.scene.remove(piece);
                if (piece.geometry) piece.geometry.dispose();
                if (piece.material) piece.material.dispose();
                this.tornPieces.splice(i, 1);
            }
        }

        // Gentle camera movement
        this.app.camera.position.x = Math.sin(elapsed * 0.1) * 0.2;
        this.app.camera.position.y = 2 + Math.sin(elapsed * 0.15) * 0.1;
    }
}
