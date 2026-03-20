/* ========================================
   Scene 3 - Path & Doors
   ======================================== */
import * as THREE from 'three';

export class SceneDoors {
    constructor(app) {
        this.app = app;
        this.scene = new THREE.Scene();
        this.active = false;
        this.visitedDoors = { right: false, left: false, center: false };
        this.currentDoor = null;

        this.doorTexts = {
            right: `يا زهرة ايأمي واجمل ما بيومي وبكِ يمسي اليوم يزهو وبعيناك يبهجُ العقلِ

انتي لستِ بمجرد زهرةٍ بل انتي معنى للحياة ذاتها وللسعادة فيها

فكيف تمكنتُ من جرح قلب لطيف كهذا؟
وانتي ما بداخلك اجمل وارق من ان يُقرب له بفعل كهذا

ايحق لي ان اجرحك هكذا؟ فبئساً لي بفعلتي هذا

زهراء اولها الزاي وبه تزين الحياة ولكل من كان بمقربة منها

وثانيها الهاء والا هو هداية وهدية لنا

وثالثها الراء دالاً على روعتها وطيبها

يا عيناكِ كانت لؤلؤ يرمي سهام جاذبةً لها ناظر كل من هب ودب

وتجعل الكافر يؤمن بخشوع وجابرة كل ملحد يقول:
آمنت برب هذه العيون

ويا وجناتك ناعمة كالحرير ويا ثغرك المتبسم كبتلات الياسمين واناملك الدافئة بها مسكُ ولين

فبماذا نطلب من سمو صاحبة هذه الصفات؟

سوا الصفح والسماح عما اقدمت

ونكون لها اول المعتذرين واحر المتقدمين به`,

            left: `اريدج تعرفين اني احترمج واقدرج لأبعد حد

ونيتي وتصرفي مو مثل توقعج بس ما ننكر اني غلطت وكلنا نغلط والبشر ما معصوم من الغلط ووارد يصير خطأ

ممكن صار سوء فهم بس أكيد نكدر نصلحه ونلكه طريقة وانتي خير من يصلح الأمور

ما أريد أترك أي شي يخلق مسافة بيننا لان الي بيننا غالي وما أريد أفقده بسهولة بسبب لحظة غلط

اعتذر منج عما ساء من تصرفي وكلامي ومن قلبي اطلب منج تقبلين اعتذاري بصدر رحب`
        };

        this.build();
        this.setupEvents();
    }

    build() {
        // Dark atmospheric background
        this.scene.background = new THREE.Color(0x080818);
        this.scene.fog = new THREE.FogExp2(0x080818, 0.02);

        // === Road / Path ===
        const roadLength = 60;
        const roadWidth = 4;

        // Road base
        const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 20);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            roughness: 0.8,
            metalness: 0.2,
            emissive: 0x0a0a1e,
            emissiveIntensity: 0.3
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, -0.01, -roadLength / 2);
        road.receiveShadow = true;
        this.scene.add(road);

        // Emissive road edges
        this.createRoadEdge(-roadWidth / 2, roadLength);
        this.createRoadEdge(roadWidth / 2, roadLength);

        // Road particles/dust
        this.createRoadParticles();

        // === Door frame meshes (3D representations) ===
        this.createDoorFrame(-6, -25, 'right');
        this.createDoorFrame(0, -30, 'center');
        this.createDoorFrame(6, -25, 'left');

        // === Lighting ===
        const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
        this.scene.add(ambientLight);

        // Road light
        const roadLight = new THREE.PointLight(0x6d28d9, 3, 30);
        roadLight.position.set(0, 3, -10);
        roadLight.castShadow = true;
        this.scene.add(roadLight);
        this.roadLight = roadLight;

        // Door lights
        const rightLight = new THREE.PointLight(0xa78bfa, 2, 15);
        rightLight.position.set(-6, 4, -25);
        this.scene.add(rightLight);

        const centerLight = new THREE.PointLight(0xa78bfa, 1.5, 15);
        centerLight.position.set(0, 4, -30);
        this.scene.add(centerLight);

        const leftLight = new THREE.PointLight(0xa78bfa, 1.5, 15);
        leftLight.position.set(6, 4, -25);
        this.scene.add(leftLight);

        this.doorLights = { right: rightLight, center: centerLight, left: leftLight };
    }

    createRoadEdge(xPos, length) {
        const edgeCount = 30;
        for (let i = 0; i < edgeCount; i++) {
            const geometry = new THREE.BoxGeometry(0.08, 0.08, 1);
            const material = new THREE.MeshStandardMaterial({
                color: 0xa78bfa,
                emissive: 0x6d28d9,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7
            });
            const segment = new THREE.Mesh(geometry, material);
            segment.position.set(xPos, 0.04, -i * (length / edgeCount) - 2);
            this.scene.add(segment);
        }
    }

    createRoadParticles() {
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 20;
            positions[i3 + 1] = Math.random() * 8;
            positions[i3 + 2] = -Math.random() * 40;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xa78bfa,
            size: 0.08,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createDoorFrame(x, z, name) {
        const group = new THREE.Group();

        // Door frame
        const frameColor = name === 'right' ? 0xa78bfa : 0x333355;
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: frameColor,
            emissive: name === 'right' ? 0x6d28d9 : 0x111133,
            emissiveIntensity: name === 'right' ? 0.6 : 0.1,
            roughness: 0.3,
            metalness: 0.7
        });

        // Left pillar
        const pillarGeo = new THREE.BoxGeometry(0.3, 5, 0.3);
        const leftPillar = new THREE.Mesh(pillarGeo, frameMaterial);
        leftPillar.position.set(-1.2, 2.5, 0);
        leftPillar.castShadow = true;
        group.add(leftPillar);

        // Right pillar
        const rightPillar = new THREE.Mesh(pillarGeo, frameMaterial);
        rightPillar.position.set(1.2, 2.5, 0);
        rightPillar.castShadow = true;
        group.add(rightPillar);

        // Top beam
        const topGeo = new THREE.BoxGeometry(2.7, 0.3, 0.3);
        const topBeam = new THREE.Mesh(topGeo, frameMaterial);
        topBeam.position.set(0, 5, 0);
        topBeam.castShadow = true;
        group.add(topBeam);

        // Door panel (inner glow)
        const doorPanelGeo = new THREE.PlaneGeometry(2.1, 4.7);
        const doorPanelMat = new THREE.MeshStandardMaterial({
            color: 0x1a1030,
            emissive: name === 'right' ? 0x4c1d95 : 0x0a0a20,
            emissiveIntensity: name === 'right' ? 0.4 : 0.1,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const doorPanel = new THREE.Mesh(doorPanelGeo, doorPanelMat);
        doorPanel.position.set(0, 2.5, 0.05);
        group.add(doorPanel);

        group.position.set(x, 0, z);
        group.userData.doorName = name;
        this.scene.add(group);

        if (!this.doorMeshes) this.doorMeshes = {};
        this.doorMeshes[name] = group;
    }

    setupEvents() {
        // Door buttons
        document.getElementById('door-right').addEventListener('click', () => {
            if (this.visitedDoors.right) return;
            this.openDoor('right');
        });

        document.getElementById('door-left').addEventListener('click', () => {
            if (this.visitedDoors.left || !this.visitedDoors.right) return;
            this.openDoor('left');
        });

        document.getElementById('door-center').addEventListener('click', () => {
            if (!this.visitedDoors.right || !this.visitedDoors.left) return;
            this.openCenterDoor();
        });

        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            this.closeDoorContent();
        });
    }

    async openDoor(doorName) {
        if (this.currentDoor) return;
        this.currentDoor = doorName;

        // Hide doors overlay, show content
        this.app.hideOverlay('scene3-overlay');
        this.app.showOverlay('door-content-overlay');

        const textEl = document.getElementById('door-text');
        const backBtn = document.getElementById('back-btn');
        backBtn.classList.add('hidden');

        // Typewriter
        await this.typeText(textEl, this.doorTexts[doorName], 35);

        // Show back button
        await this.wait(2000);
        backBtn.classList.remove('hidden');
        backBtn.style.pointerEvents = 'all';
    }

    closeDoorContent() {
        const doorName = this.currentDoor;
        this.visitedDoors[doorName] = true;
        this.currentDoor = null;

        // Clear text
        document.getElementById('door-text').textContent = '';
        document.getElementById('back-btn').classList.add('hidden');

        // Hide content, show doors
        this.app.hideOverlay('door-content-overlay');
        this.app.showOverlay('scene3-overlay');

        // Update door button states
        const doorBtn = document.getElementById(`door-${doorName}`);
        doorBtn.classList.remove('door-glow');
        doorBtn.classList.add('door-visited');

        // Update 3D door mesh
        if (this.doorMeshes[doorName]) {
            this.doorMeshes[doorName].children.forEach(child => {
                if (child.material) {
                    child.material.emissive = new THREE.Color(0x222222);
                    child.material.emissiveIntensity = 0.1;
                    child.material.color = new THREE.Color(0x444444);
                }
            });
        }
        if (this.doorLights[doorName]) {
            this.doorLights[doorName].intensity = 0.3;
            this.doorLights[doorName].color = new THREE.Color(0x555555);
        }

        // Unlock next door
        this.updateDoorStates();
    }

    updateDoorStates() {
        const leftBtn = document.getElementById('door-left');
        const centerBtn = document.getElementById('door-center');

        if (this.visitedDoors.right && !this.visitedDoors.left) {
            leftBtn.classList.remove('door-locked');
            leftBtn.classList.add('door-glow');

            // Light up left door 3D
            if (this.doorMeshes.left) {
                this.doorMeshes.left.children.forEach(child => {
                    if (child.material) {
                        child.material.emissive = new THREE.Color(0x6d28d9);
                        child.material.emissiveIntensity = 0.6;
                        child.material.color = new THREE.Color(0xa78bfa);
                    }
                });
            }
            if (this.doorLights.left) {
                this.doorLights.left.intensity = 2;
                this.doorLights.left.color = new THREE.Color(0xa78bfa);
            }
        }

        if (this.visitedDoors.right && this.visitedDoors.left) {
            centerBtn.classList.remove('door-locked');
            centerBtn.classList.add('door-glow');

            // Light up center door 3D
            if (this.doorMeshes.center) {
                this.doorMeshes.center.children.forEach(child => {
                    if (child.material) {
                        child.material.emissive = new THREE.Color(0x6d28d9);
                        child.material.emissiveIntensity = 0.8;
                        child.material.color = new THREE.Color(0xa78bfa);
                    }
                });
            }
            if (this.doorLights.center) {
                this.doorLights.center.intensity = 3;
                this.doorLights.center.color = new THREE.Color(0xa78bfa);
            }
        }
    }

    openCenterDoor() {
        // Transition to Scene 4
        this.app.switchScene('book');
    }

    typeText(element, text, speed = 40) {
        return new Promise((resolve) => {
            element.textContent = '';
            let i = 0;
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text[i];
                    i++;
                    // Auto-scroll
                    element.parentElement.scrollTop = element.parentElement.scrollHeight;
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

    activate() {
        this.active = true;
        this.app.camera.position.set(0, 3, 8);
        this.app.camera.lookAt(0, 2, -20);

        // Set initial door states
        const rightBtn = document.getElementById('door-right');
        const leftBtn = document.getElementById('door-left');
        const centerBtn = document.getElementById('door-center');

        rightBtn.classList.add('door-glow');
        leftBtn.classList.add('door-locked');
        centerBtn.classList.add('door-locked');
    }

    deactivate() {
        this.active = false;
    }

    update(delta, elapsed) {
        if (!this.active) return;

        // Road light animation
        if (this.roadLight) {
            this.roadLight.intensity = 2 + Math.sin(elapsed * 1.5) * 0.5;
        }

        // Particles float
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(elapsed + i) * 0.002;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // Gentle camera sway
        this.app.camera.position.x = Math.sin(elapsed * 0.15) * 0.2;
        this.app.camera.position.y = 3 + Math.sin(elapsed * 0.2) * 0.1;
        this.app.camera.lookAt(0, 2, -20);
    }
}
