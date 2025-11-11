const imageUpload = document.getElementById('imageUpload');
const statusMessage = document.getElementById('statusMessage');
const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');
const toggleGuideButton = document.getElementById('toggleGuideButton'); // Nouveau bouton

let originalImage = new Image();
let isImageLoaded = false;
let showGuides = true; // الحالة الافتراضية: إظهار الخطوط

// Variables pour la transformation
let rotationAngle = 0; // Angle en radians
let offsetX = 0;
let offsetY = 0;
let scale = 1;

// Variables pour l'interaction
let isDragging = false;
let lastX = 0;
let lastY = 0;

// Constantes pour la ligne de guide
const GUIDE_LINE_COLOR = 'red';
const GUIDE_LINE_WIDTH = 2;
const GUIDE_LINE_LENGTH = 100;

// Constantes pour l'ajustement de l'image
const ROTATION_PADDING = 1.2; 
const MAX_CANVAS_SIZE = 550; 

// --------------------------------------------------------
// --- GESTION DU CHARGEMENT DE L'IMAGE ---
// --------------------------------------------------------

imageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage.onload = function() {
                isImageLoaded = true;
                
                // --- AJUSTEMENT DE L'IMAGE À L'ÉCRAN (SCALING) ---
                let imgW = originalImage.width;
                let imgH = originalImage.height;
                let scaleFactor = 1;
                
                if (imgW > MAX_CANVAS_SIZE || imgH > MAX_CANVAS_SIZE) {
                    scaleFactor = MAX_CANVAS_SIZE / Math.max(imgW, imgH);
                }
                
                const scaledW = imgW * scaleFactor;
                const scaledH = imgH * scaleFactor;

                // --- DÉFINITION DE LA TAILLE DU CANVAS ---
                canvas.width = scaledW * ROTATION_PADDING;
                canvas.height = scaledH * ROTATION_PADDING;
                canvasContainer.style.height = canvas.height + 'px'; 
                
                // Réinitialiser les transformations
                rotationAngle = 0;
                offsetX = 0;
                offsetY = 0;
                scale = 1;

                drawScene();
                statusMessage.textContent = 'Image chargée et adaptée à l\'écran. Glissez pour manipuler.';
                statusMessage.className = 'status-message success';
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        isImageLoaded = false;
        statusMessage.textContent = 'Veuillez d\'abord sélectionner une image.';
        statusMessage.className = 'status-message';
    }
});


// --------------------------------------------------------
// --- FONCTION DE DESSIN PRINCIPALE ---
// --------------------------------------------------------

function drawScene() {
    if (!isImageLoaded) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // --- Appliquer les Transformations ---
    ctx.save();
    
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.scale(scale, scale);
    ctx.translate(offsetX, offsetY); 

    // Dessiner l'image en appliquant la mise à l'échelle
    let imgW = originalImage.width;
    let imgH = originalImage.height;
    let scaleFactor = 1;
    
    if (imgW > MAX_CANVAS_SIZE || imgH > MAX_CANVAS_SIZE) {
        scaleFactor = MAX_CANVAS_SIZE / Math.max(imgW, imgH);
    }

    const scaledW = imgW * scaleFactor;
    const scaledH = imgH * scaleFactor;

    ctx.drawImage(originalImage, -scaledW / 2, -scaledH / 2, scaledW, scaledH);

    ctx.restore(); 


    // --- Dessiner la Ligne de Guide (Nouveau: utilisation de showGuides) ---
    if (isImageLoaded && showGuides) {
        ctx.save();
        ctx.strokeStyle = GUIDE_LINE_COLOR;
        ctx.lineWidth = GUIDE_LINE_WIDTH;
        
        // Ligne horizontale
        ctx.beginPath();
        ctx.moveTo(centerX - GUIDE_LINE_LENGTH, centerY);
        ctx.lineTo(centerX + GUIDE_LINE_LENGTH, centerY);
        ctx.stroke();

        // Ligne verticale
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - GUIDE_LINE_LENGTH);
        ctx.lineTo(centerX, centerY + GUIDE_LINE_LENGTH);
        ctx.stroke();

        ctx.restore();
    }
}

// --------------------------------------------------------
// --- GESTION DE L'INTERACTION (TACTILE / SOURIS) ---
// --------------------------------------------------------

// Démarrage du glissement
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('touchstart', startDrag);

// Fin du glissement
window.addEventListener('mouseup', endDrag);
window.addEventListener('touchend', endDrag);

// Mouvement du glissement
window.addEventListener('mousemove', drag);
window.addEventListener('touchmove', drag);

// Gestionnaire de la roulette de la souris (Zoom)
canvas.addEventListener('wheel', handleZoom, { passive: false });

// NOUVEAU: Gestionnaire pour masquer/afficher le guide
toggleGuideButton.addEventListener('click', function() {
    showGuides = !showGuides; // Inverser l'état
    toggleGuideButton.textContent = showGuides ? 'Masquer le Guide' : 'Afficher le Guide';
    drawScene(); 
});


function getClientPos(event) {
    if (event.touches && event.touches.length > 0) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
}


function startDrag(event) {
    if (!isImageLoaded) return;
    if (event.touches && event.touches.length > 1) return; 

    isDragging = true;
    const pos = getClientPos(event);
    lastX = pos.x;
    lastY = pos.y;
    event.preventDefault(); 
}

function endDrag(event) {
    isDragging = false;
}

function drag(event) {
    if (!isDragging || !isImageLoaded) return;
    
    event.preventDefault(); 
    
    const pos = getClientPos(event);
    const deltaX = pos.x - lastX;
    const deltaY = pos.y - lastY;
    
    const canvasRect = canvas.getBoundingClientRect();
    const centerX = canvasRect.left + canvas.width / 2;
    const centerY = canvasRect.top + canvas.height / 2;
    
    const currentRelX = pos.x - centerX;
    const currentRelY = pos.y - centerY;
    const lastRelX = lastX - centerX;
    const lastRelY = lastY - centerY;
    
    const distanceToCenter = Math.sqrt(currentRelX * currentRelX + currentRelY * currentRelY);
    const rotationThreshold = 50; 
    
    if (distanceToCenter > rotationThreshold) {
         // --- Rotation (Si loin du centre) ---
         const angleBefore = Math.atan2(lastRelY, lastRelX);
         const angleAfter = Math.atan2(currentRelY, currentRelX);
         const angleDelta = angleAfter - angleBefore;

         rotationAngle += angleDelta * 0.5; 
         
    } else {
         // --- Translation (Si proche du centre) ---
         offsetX += deltaX / scale;
         offsetY += deltaY / scale;
    }

    lastX = pos.x;
    lastY = pos.y;
    
    drawScene(); 
}

// --------------------------------------------------------
// --- GESTION DU ZOOM ---
// --------------------------------------------------------

function handleZoom(event) {
    if (!isImageLoaded) return;
    event.preventDefault();
    
    const zoomFactor = (event.deltaY > 0) ? 0.95 : 1.05; 
    
    scale *= zoomFactor;
    
    scale = Math.max(0.5, Math.min(scale, 5.0));

    drawScene();
}

// Initialiser le canvas
drawScene();
