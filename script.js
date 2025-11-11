const imageUpload = document.getElementById('imageUpload');
const statusMessage = document.getElementById('statusMessage');
const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

let originalImage = new Image();
let isImageLoaded = false;

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
                
                // --- CALCUL DE TAILLE DU CANVAS (PYTHAGORE) ---
                // Calcule la longueur de la diagonale pour éviter le rognage à 360°
                const diagonal = Math.sqrt(
                    originalImage.width * originalImage.width + 
                    originalImage.height * originalImage.height
                );
                
                // Le Canvas est dimensionné à la diagonale
                canvas.width = diagonal;
                canvas.height = diagonal;
                canvasContainer.style.height = diagonal + 'px'; 
                
                // Réinitialiser les transformations
                rotationAngle = 0;
                offsetX = 0;
                offsetY = 0;
                scale = 1;

                drawScene();
                statusMessage.textContent = 'Image chargée. Glissez pour manipuler l\'image.';
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
    
    // Déplacer l'origine au centre du NOUVEAU canvas
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.scale(scale, scale);
    
    // Appliquer la translation (décalage)
    ctx.translate(offsetX, offsetY); 

    // Dessiner l'image (en la décalant du centre pour qu'elle s'aligne)
    ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);

    ctx.restore(); 


    // --- Dessiner la Ligne de Guide (Centrée sur le NOUVEAU canvas) ---
    if (isImageLoaded) {
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
