/* ============================================================
   HATSUNE MIKUFYER - script.js
   All interactivity. No inline JS. Pure chaos.
   ============================================================ */

// ── CONSTANTS & CONFIGURATION ──

const MIKU_PORTRAITS = [
    'src/mikus/portraits/mikunt.png',
    'src/mikus/portraits/mikuv2.png',
    'src/mikus/portraits/mikuv3.png',
    'src/mikus/portraits/mikuv4.png',
    'src/mikus/portraits/mikuv6.png'
];

const WALLPAPERS = [
    { file: 'src/wallpapers/yunomi_imonuy (twitter).jpg', credit: 'Art by yunomi_imonuy (Twitter)' },
    { file: 'src/wallpapers/はるよ (pixiv).jpg', credit: 'Art by はるよ (Pixiv)' },
    { file: 'src/wallpapers/ヤマコ (pixiv).png', credit: 'Art by ヤマコ (Pixiv)' },
    { file: 'src/wallpapers/三輪士郎 (pixiv).jpg', credit: 'Art by 三輪士郎 (Pixiv)' },
    { file: 'src/wallpapers/八三 (pixiv).png', credit: 'Art by 八三 (Pixiv)' },
    { file: 'src/wallpapers/砂吹 (pixiv).png', credit: 'Art by 砂吹 (Pixiv)' }
];

const AUDIO_FILES = {
    bgMusic: 'src/audio/LamazeP - Triple Baka.mp3',
    mikuXP: 'src/audio/electron - MikuXP.mp3',
    mikudayo: 'src/audio/mikudayo.mp3'
};

const LEEK_EMOJIS = ['🥬', '🌿'];
const MIKUFY_MIN_OVERLAYS = 1;
const MIKUFY_MAX_OVERLAYS = 5;
const JUMPSCARE_CHANCE = 1 / 300;         // per second
const JUMPSCARE_DURATION_MS = 2000;
const CAROUSEL_AUTO_INTERVAL_MS = 5000;

// ── DOM REFERENCES ──

const elements = {
    // Jumpscare
    jumpscareOverlay: document.getElementById('jumpscare-overlay'),
    jumpscareImg: document.getElementById('jumpscare-img'),

    // Cursor canvas
    cursorCanvas: document.getElementById('cursor-canvas'),

    // Leek
    leekImg: document.getElementById('leek-img'),
    clearLeeksBtn: document.getElementById('clear-leeks-btn'),
    leekContainer: document.getElementById('leek-container'),

    // Miku PNG
    mikuMainPng: document.getElementById('miku-main-png'),

    // Mikufy
    imageUpload: document.getElementById('image-upload'),
    uploadLabel: document.getElementById('upload-label'),
    mikufyCanvas: document.getElementById('mikufy-canvas'),
    canvasPlaceholder: document.getElementById('canvas-placeholder'),
    mikuPortraitIcons: document.querySelectorAll('.miku-portrait-icon'),

    // Music player
    bgMusic: document.getElementById('bg-music'),
    playPauseBtn: document.getElementById('play-pause-btn'),
    volumeSlider: document.getElementById('volume-slider'),
    volumeIcon: document.getElementById('volume-icon'),
    progressBarContainer: document.getElementById('progress-bar-container'),
    progressBar: document.getElementById('progress-bar'),

    // SFX
    mikuXPSfx: document.getElementById('miku-xp-sfx'),
    mikudayoSfx: document.getElementById('mikudayo-sfx'),

    // Wallpaper background
    wallpaperStrip: document.getElementById('wallpaper-strip')
};

// ── STATE ──

let landedLeeks = [];
let isPlaying = false;
let previousVolume = 50;
let userUploadedImage = null;       // stores the uploaded Image object
let mikuPortraitImages = [];        // pre-loaded Image objects for mikufication
let sparkles = [];                  // cursor trail particles
let mouseX = 0;
let mouseY = 0;


// ══════════════════════════════════════════════════════════════
// 1. MIKUFICATION (Image Upload + Overlay Miku PNGs)
// ══════════════════════════════════════════════════════════════

function preloadMikuPortraits() {
    MIKU_PORTRAITS.forEach(function (src) {
        const img = new Image();
        img.src = src;
        mikuPortraitImages.push(img);
    });
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            userUploadedImage = img;
            mikufyImage();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function mikufyImage() {
    if (!userUploadedImage) return;

    const canvas = elements.mikufyCanvas;
    const ctx = canvas.getContext('2d');

    // Size canvas to fit the container while preserving aspect ratio
    const maxW = 500;
    const maxH = 450;
    let w = userUploadedImage.width;
    let h = userUploadedImage.height;

    if (w > maxW) {
        h = h * (maxW / w);
        w = maxW;
    }
    if (h > maxH) {
        w = w * (maxH / h);
        h = maxH;
    }

    canvas.width = w;
    canvas.height = h;

    // Draw original image
    ctx.drawImage(userUploadedImage, 0, 0, w, h);

    // Randomly overlay 1-5 Miku portraits
    const overlayCount = randomInt(MIKUFY_MIN_OVERLAYS, MIKUFY_MAX_OVERLAYS);

    let loadedCount = 0;
    const totalToLoad = overlayCount;

    for (let i = 0; i < overlayCount; i++) {
        const portrait = mikuPortraitImages[randomInt(0, mikuPortraitImages.length - 1)];

        // Ensure the portrait is loaded before drawing
        if (portrait.complete) {
            drawMikuOverlay(ctx, portrait, w, h);
            loadedCount++;
            if (loadedCount === totalToLoad) {
                finalizeMikufy();
            }
        } else {
            portrait.onload = function () {
                drawMikuOverlay(ctx, portrait, w, h);
                loadedCount++;
                if (loadedCount === totalToLoad) {
                    finalizeMikufy();
                }
            };
        }
    }

    // If all were already loaded
    if (loadedCount === totalToLoad) {
        finalizeMikufy();
    }
}

function drawMikuOverlay(ctx, portrait, canvasW, canvasH) {
    const scale = 0.3 + Math.random() * 0.7;   // 30%-100% of canvas size
    const overlayW = canvasW * scale * 0.5;
    const overlayH = (portrait.height / portrait.width) * overlayW;

    const x = Math.random() * (canvasW - overlayW * 0.5);
    const y = Math.random() * (canvasH - overlayH * 0.5);
    const rotation = (Math.random() - 0.5) * 60 * (Math.PI / 180); // ±30 degrees

    ctx.save();
    ctx.translate(x + overlayW / 2, y + overlayH / 2);
    ctx.rotate(rotation);
    ctx.drawImage(portrait, -overlayW / 2, -overlayH / 2, overlayW, overlayH);
    ctx.restore();
}

function finalizeMikufy() {
    elements.mikufyCanvas.style.display = 'block';
    elements.canvasPlaceholder.style.display = 'none';
}

function handlePortraitIconClick(event) {
    const icon = event.currentTarget;
    const index = parseInt(icon.getAttribute('data-index'), 10);
    const portrait = mikuPortraitImages[index];

    if (!portrait) return;

    // Play SFX
    playSound(elements.mikuXPSfx);

    // Bounce clicked icon
    icon.classList.remove('bouncing');
    void icon.offsetWidth; // force reflow
    icon.classList.add('bouncing');
    setTimeout(function () {
        icon.classList.remove('bouncing');
    }, 500);

    // Draw clicked portrait on canvas if user image is uploaded
    if (userUploadedImage) {
        const canvas = elements.mikufyCanvas;
        const ctx = canvas.getContext('2d');
        drawMikuOverlay(ctx, portrait, canvas.width, canvas.height);
    }
}

function reMikufy() {
    if (userUploadedImage) {
        mikufyImage();
    }
}


// ══════════════════════════════════════════════════════════════
// 2. LEEK FALLING EFFECT
// ══════════════════════════════════════════════════════════════

function spawnFallingLeek() {
    const leek = document.createElement('span');
    leek.classList.add('falling-leek');
    leek.textContent = LEEK_EMOJIS[randomInt(0, LEEK_EMOJIS.length - 1)];

    const xPos = randomInt(0, window.innerWidth - 50);
    leek.style.left = xPos + 'px';

    const fallDuration = 1.5 + Math.random() * 1.5;
    leek.style.animationDuration = fallDuration + 's, ' + (0.5 + Math.random()) + 's';

    const finalRotation = randomInt(0, 360);

    elements.leekContainer.appendChild(leek);

    // After animation, land at bottom
    setTimeout(function () {
        leek.remove();
        createLandedLeek(xPos, finalRotation);
    }, fallDuration * 1000);
}

function createLandedLeek(xPos, rotation) {
    const landed = document.createElement('span');
    landed.classList.add('landed-leek');
    landed.textContent = LEEK_EMOJIS[randomInt(0, LEEK_EMOJIS.length - 1)];
    landed.style.left = xPos + 'px';
    landed.style.setProperty('--final-rotation', rotation + 'deg');
    elements.leekContainer.appendChild(landed);
    landedLeeks.push(landed);
}

function clearAllLeeks() {
    landedLeeks.forEach(function (leek) {
        leek.remove();
    });
    landedLeeks = [];

    // Also remove any currently falling leeks
    const falling = elements.leekContainer.querySelectorAll('.falling-leek');
    falling.forEach(function (f) { f.remove(); });
}


// ══════════════════════════════════════════════════════════════
// 3. MIKU PNG CLICK (bounce + sound effect)
// ══════════════════════════════════════════════════════════════

function handleMikuClick() {
    // Play MikuXP sound effect
    playSound(elements.mikuXPSfx);

    // Trigger bounce animation
    elements.mikuMainPng.classList.remove('bouncing');
    // Force reflow to restart animation
    void elements.mikuMainPng.offsetWidth;
    elements.mikuMainPng.classList.add('bouncing');

    // Remove class after animation ends
    setTimeout(function () {
        elements.mikuMainPng.classList.remove('bouncing');
    }, 500);
}


// ══════════════════════════════════════════════════════════════
// 4. BACKGROUND MUSIC (Triple Baka with controls)
// ══════════════════════════════════════════════════════════════

function togglePlayPause() {
    if (isPlaying) {
        elements.bgMusic.pause();
        elements.playPauseBtn.textContent = '▶';
        isPlaying = false;
    } else {
        elements.bgMusic.play().catch(function () {
            // Autoplay blocked by browser; user must click
            console.log('Autoplay blocked. Click play to start music.');
        });
        elements.playPauseBtn.textContent = '⏸';
        isPlaying = true;
    }
}

function setVolume(value) {
    const vol = value / 100;
    elements.bgMusic.volume = vol;
    elements.mikuXPSfx.volume = vol;
    updateVolumeIcon(value);
}

function updateVolumeIcon(value) {
    if (value == 0) {
        elements.volumeIcon.textContent = '🔇';
    } else if (value < 33) {
        elements.volumeIcon.textContent = '🔈';
    } else if (value < 66) {
        elements.volumeIcon.textContent = '🔉';
    } else {
        elements.volumeIcon.textContent = '🔊';
    }
}

function toggleMute() {
    if (elements.volumeSlider.value > 0) {
        previousVolume = elements.volumeSlider.value;
        elements.volumeSlider.value = 0;
        setVolume(0);
    } else {
        elements.volumeSlider.value = previousVolume;
        setVolume(previousVolume);
    }
}

function updateProgressBar() {
    if (elements.bgMusic.duration) {
        const percent = (elements.bgMusic.currentTime / elements.bgMusic.duration) * 100;
        elements.progressBar.style.width = percent + '%';
    }
}

function seekMusic(event) {
    if (!elements.bgMusic.duration) return;
    const rect = elements.progressBarContainer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percent = clickX / rect.width;
    elements.bgMusic.currentTime = percent * elements.bgMusic.duration;
}


// ══════════════════════════════════════════════════════════════
// 5. SIDE-SCROLLING WALLPAPER BACKGROUND
// ══════════════════════════════════════════════════════════════

function initWallpaperBackground() {
    const strip = elements.wallpaperStrip;

    // Populate the strip with all wallpaper images (doubled for seamless loop)
    const allImages = WALLPAPERS.concat(WALLPAPERS);

    allImages.forEach(function (wp) {
        const img = document.createElement('img');
        img.src = wp.file;
        img.alt = wp.credit;
        img.draggable = false;
        strip.appendChild(img);
    });

    // Set scroll duration based on image count (20s per image for a relaxed pace)
    const scrollDuration = WALLPAPERS.length * 20;
    strip.style.setProperty('--scroll-duration', scrollDuration + 's');
}


// ══════════════════════════════════════════════════════════════
// 6. RAINBOW CURSOR TRAIL + SPARKLES
// ══════════════════════════════════════════════════════════════

function initCursorCanvas() {
    const canvas = elements.cursorCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Add sparkle particles on mouse move
        for (let i = 0; i < 2; i++) {
            sparkles.push(createSparkle(mouseX, mouseY));
        }
    });

    animateSparkles();
}

function createSparkle(x, y) {
    return {
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        size: Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 3,
        speedY: (Math.random() - 0.5) * 3 + 1,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        hue: Math.random() * 360
    };
}

function animateSparkles() {
    const canvas = elements.cursorCanvas;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.speedX;
        s.y += s.speedY;
        s.life -= s.decay;
        s.hue = (s.hue + 2) % 360;

        if (s.life <= 0) {
            sparkles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.fillStyle = 'hsl(' + s.hue + ', 100%, 70%)';
        ctx.shadowColor = 'hsl(' + s.hue + ', 100%, 70%)';
        ctx.shadowBlur = 8;

        // Draw a small star/diamond shape
        ctx.beginPath();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.hue * Math.PI / 180);
        const sz = s.size;
        ctx.moveTo(0, -sz);
        ctx.lineTo(sz * 0.3, -sz * 0.3);
        ctx.lineTo(sz, 0);
        ctx.lineTo(sz * 0.3, sz * 0.3);
        ctx.lineTo(0, sz);
        ctx.lineTo(-sz * 0.3, sz * 0.3);
        ctx.lineTo(-sz, 0);
        ctx.lineTo(-sz * 0.3, -sz * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Limit particles to prevent performance issues
    if (sparkles.length > 200) {
        sparkles.splice(0, sparkles.length - 200);
    }

    requestAnimationFrame(animateSparkles);
}


// ══════════════════════════════════════════════════════════════
// 7. MIKUDAYO JUMPSCARE (1/500 chance per second)
// ══════════════════════════════════════════════════════════════

function startJumpscareTimer() {
    setInterval(function () {
        if (Math.random() < JUMPSCARE_CHANCE) {
            triggerJumpscare();
        }
    }, 1000);
}

function triggerJumpscare() {
    const overlay = elements.jumpscareOverlay;
    const sfx = elements.mikudayoSfx;

    // Show overlay
    overlay.classList.remove('hidden');
    overlay.style.animation = 'none';
    void overlay.offsetWidth;   // reflow
    overlay.style.animation = 'jumpscare-flash ' + (JUMPSCARE_DURATION_MS / 1000) + 's ease-out forwards';

    // Blast audio at max volume
    sfx.volume = 1.0;
    sfx.currentTime = 0;
    sfx.play().catch(function () { });

    // Hide after duration
    setTimeout(function () {
        overlay.classList.add('hidden');
        sfx.pause();
        sfx.currentTime = 0;
    }, JUMPSCARE_DURATION_MS);
}


// ══════════════════════════════════════════════════════════════
// 8. UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function playSound(audioElement) {
    audioElement.currentTime = 0;
    audioElement.play().catch(function () { });
}


// ══════════════════════════════════════════════════════════════
// 9. EVENT LISTENERS (all wired up here, no inline JS)
// ══════════════════════════════════════════════════════════════

function initEventListeners() {
    // Leek click → spawn falling leek
    elements.leekImg.addEventListener('click', spawnFallingLeek);

    // Clear leeks button
    elements.clearLeeksBtn.addEventListener('click', clearAllLeeks);

    // Miku PNG click → bounce + SFX
    elements.mikuMainPng.addEventListener('click', handleMikuClick);

    // Image upload for mikufication
    elements.imageUpload.addEventListener('change', handleImageUpload);

    // Interactive Miku portrait icons
    elements.mikuPortraitIcons.forEach(function (icon) {
        icon.addEventListener('click', handlePortraitIconClick);
    });

    // Re-mikufy on canvas click (re-rolls the overlays)
    elements.mikufyCanvas.addEventListener('click', reMikufy);

    // Music controls
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    elements.volumeSlider.addEventListener('input', function () {
        setVolume(this.value);
    });
    elements.volumeIcon.addEventListener('click', toggleMute);
    elements.bgMusic.addEventListener('timeupdate', updateProgressBar);
    elements.progressBarContainer.addEventListener('click', seekMusic);

}


// ══════════════════════════════════════════════════════════════
// 10. INITIALIZATION
// ══════════════════════════════════════════════════════════════

function autoplayMusic() {
    elements.bgMusic.play().then(function () {
        isPlaying = true;
        elements.playPauseBtn.textContent = '⏸';
    }).catch(function () {
        // Browser blocked autoplay — start on first user interaction instead
        const startOnInteraction = function () {
            elements.bgMusic.play().then(function () {
                isPlaying = true;
                elements.playPauseBtn.textContent = '⏸';
            }).catch(function () { });
            document.removeEventListener('click', startOnInteraction);
            document.removeEventListener('keydown', startOnInteraction);
        };
        document.addEventListener('click', startOnInteraction);
        document.addEventListener('keydown', startOnInteraction);
    });
}

function init() {
    // Pre-load miku portraits for mikufication
    preloadMikuPortraits();

    // Set initial volume
    setVolume(50);

    // Wire up all event listeners
    initEventListeners();

    // Start side-scrolling wallpaper background
    initWallpaperBackground();

    // Start cursor sparkle trail
    initCursorCanvas();

    // Start jumpscare timer
    startJumpscareTimer();

    // Autoplay Triple Baka
    autoplayMusic();
}

// Launch everything when the DOM is ready
document.addEventListener('DOMContentLoaded', init);
