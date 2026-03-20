/* ========================================
   Main.js - App Orchestrator
   ======================================== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { SceneSpace } from './scene1-space.js';
import { SceneClouds } from './scene2-clouds.js';
import { SceneDoors } from './scene3-doors.js';
import { SceneBook } from './scene4-book.js';

class CinematicExperience {
    constructor() {
        this.canvas = document.getElementById('experience-canvas');
        this.clock = new THREE.Clock();
        this.currentScene = null;
        this.scenes = {};
        this.audioContext = null;
        this.songs = {};
        this.currentSong = null;
        this.transitionLock = false;

        this.init();
    }

    init() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60, window.innerWidth / window.innerHeight, 0.1, 2000
        );
        this.camera.position.set(0, 0, 5);

        // Post-processing
        this.composer = new EffectComposer(this.renderer);

        // Bloom
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.8, 0.4, 0.85
        );

        // Initialize scenes
        this.scenes.space = new SceneSpace(this);
        this.scenes.clouds = new SceneClouds(this);
        this.scenes.doors = new SceneDoors(this);
        this.scenes.book = new SceneBook(this);

        // Setup post-processing for initial scene
        this.setupPostProcessing(this.scenes.space.scene);

        // Events
        window.addEventListener('resize', () => this.onResize());

        // Load audio
        this.loadAudio();

        // Start with Scene 1
        this.switchScene('space');

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('fade-out');
        }, 1500);

        // Start render loop
        this.animate();
    }

    setupPostProcessing(scene) {
        // Clear existing passes
        while (this.composer.passes.length > 0) {
            this.composer.removePass(this.composer.passes[0]);
        }

        const renderPass = new RenderPass(scene, this.camera);
        this.composer.addPass(renderPass);
        this.composer.addPass(this.bloomPass);
    }

    async loadAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            const loadSong = async (url, name) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) return null;
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.songs[name] = audioBuffer;
                    return audioBuffer;
                } catch (e) {
                    console.log(`Music file ${name} not found, continuing without music`);
                    return null;
                }
            };

            await Promise.all([
                loadSong('music/song1.mp3', 'song1'),
                loadSong('music/song2.mp3', 'song2')
            ]);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    playSong(name, fadeIn = 2) {
        if (!this.audioContext || !this.songs[name]) return;

        // Resume context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Fade out current
        if (this.currentSong) {
            const oldGain = this.currentSong.gainNode;
            oldGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.5);
            const oldSource = this.currentSong.source;
            setTimeout(() => {
                try { oldSource.stop(); } catch(e) {}
            }, 1600);
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.songs[name];
        source.loop = true;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + fadeIn);

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();

        this.currentSong = { source, gainNode, name };
    }

    stopMusic(fadeOut = 2) {
        if (!this.currentSong) return;
        const { gainNode, source } = this.currentSong;
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOut);
        setTimeout(() => {
            try { source.stop(); } catch(e) {}
        }, fadeOut * 1000 + 100);
        this.currentSong = null;
    }

    switchScene(sceneName) {
        if (this.transitionLock) return;

        // Hide all overlays
        document.querySelectorAll('.overlay').forEach(o => {
            o.classList.add('hidden');
            o.classList.remove('visible');
        });

        // Deactivate current scene
        if (this.currentScene && this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].deactivate();
        }

        this.currentScene = sceneName;
        const scene = this.scenes[sceneName];
        scene.activate();

        // Update post-processing
        this.setupPostProcessing(scene.scene);

        // Show appropriate overlay
        const overlayMap = {
            'space': 'scene1-overlay',
            'clouds': 'scene2-overlay',
            'doors': 'scene3-overlay',
            'book': 'scene4-overlay'
        };

        const overlayId = overlayMap[sceneName];
        if (overlayId) {
            const overlay = document.getElementById(overlayId);
            overlay.classList.remove('hidden');
            overlay.classList.add('visible');
        }

        // Play appropriate music
        if (sceneName === 'space' || sceneName === 'clouds' || sceneName === 'doors') {
            if (!this.currentSong || this.currentSong.name !== 'song1') {
                this.playSong('song1');
            }
        } else if (sceneName === 'book') {
            this.playSong('song2');
        }
    }

    showOverlay(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('hidden');
            el.classList.add('visible');
        }
    }

    hideOverlay(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.classList.remove('visible');
        }
    }

    showNotification(text, duration = 3000) {
        const notif = document.getElementById('notification');
        const notifText = document.getElementById('notification-text');
        notifText.textContent = text;
        notif.classList.add('show');

        setTimeout(() => {
            notif.classList.remove('show');
        }, duration);
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        if (this.currentScene && this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].update(delta, elapsed);
        }

        this.composer.render();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.experience = new CinematicExperience();
});
