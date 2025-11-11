const imageUpload = document.getElementById('imageUpload');
const statusMessage = document.getElementById('statusMessage');
const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.getElementById('interactiveCanvas');
const ctx = canvas.getContext('2d');

let originalImage = new Image();
let isImageLoaded = false;

// Variables pour la transformation (Rotation/Inclinaison)
let rotationAngle = 0; // Angle en radians
let offsetX = 0;
let offsetY = 0;
let scale = 1;

// Variables pour l'interaction (Mouse/Touch)
let isDragging = false;
let lastX = 0;
let lastY = 0;

// Constantes pour la ligne de guide
const GUIDE_LINE_COLOR = 'red';
const GUIDE_LINE_WIDTH = 2;
const GUIDE_LINE_LENGTH = 100; // Longueur du segment visible

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
                // Définir la taille initiale du canvas et du conteneur
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;
                canvasContainer.style.height = originalImage.height + 'px'; // Fixer la hauteur du conteneur
                
                // Centrer et dessiner l'image initiale
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

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Effacer le canvas

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // --- Appliquer les Transformations ---
    ctx.save();
    
    // Déplacer le point d'origine au centre pour effectuer la rotation autour du centre
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.scale(scale, scale);
    
    // Appliquer la translation (décalage)
    ctx.translate(offsetX, offsetY); 

    // Dessiner l'image (en la décalant du centre pour qu'elle s'aligne)
    ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);

    ctx.restore(); // Restaurer pour que les prochaines opérations ne soient pas affectées


    // --- Dessiner la Ligne de Guide (Le 'Maître' pour l'alignement) ---
    if (isImageLoaded) {
        ctx.save();
        ctx.strokeStyle = GUIDE_LINE_COLOR;
        ctx.lineWidth = GUIDE_LINE_WIDTH;
        
        // Dessiner une ligne horizontale traversant le milieu du canvas
        ctx.beginPath();
        ctx.moveTo(centerX - GUIDE_LINE_LENGTH, centerY);
        ctx.lineTo(centerX + GUIDE_LINE_LENGTH, centerY);
        ctx.stroke();

        // Dessiner une ligne verticale traversant le milieu du canvas
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - GUIDE_LINE_LENGTH);
        ctx.lineTo(centerX, centerY + GUIDE_LINE_LENGTH);
        ctx.stroke();

        ctx.restore();
    }
}

// --------------------------------------------------------
// --- GESTION DE L'INTERACTION (MANIPULATION MANUELLE) ---
// --------------------------------------------------------

// Démarrage du glissement (Clic de souris ou Touch Down)
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('touchstart', startDrag);

// Fin du glissement (Relâchement du clic ou Touch Up)
window.addEventListener('mouseup', endDrag);
window.addEventListener('touchend', endDrag);

// Mouvement du glissement (Mouse Move ou Touch Move)
window.addEventListener('mousemove', drag);
window.addEventListener('touchmove', drag);

// Gestionnaire de la roulette de la souris pour le Zoom (facultatif mais utile)
canvas.addEventListener('wheel', handleZoom, { passive: false });


function getClientPos(event) {
    // Gérer les événements tactiles vs. souris
    if (event.touches && event.touches.length > 0) {
        // Pour le tactile, utiliser le premier point de contact
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    // Pour la souris
    return { x: event.clientX, y: event.clientY };
}


function startDrag(event) {
    if (!isImageLoaded) return;
    
    // S'assurer qu'un seul doigt/clic est utilisé pour le glissement
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

    // --- Logique de Glissement/Déplacement (Translation) ---
    // Les offsets sont mis à jour en fonction du glissement
    offsetX += deltaX / scale;
    offsetY += deltaY / scale;

    // --- Logique de Rotation (Simulée pour un glissement simple) ---
    // Si l'utilisateur glisse horizontalement/verticalement sur les bords, on peut simuler la rotation.
    // Pour simplifier l'interaction mobile, nous allons ajouter la rotation dans la section suivante (Gestures/Pinch)
    
    lastX = pos.x;
    lastY = pos.y;
    
    drawScene(); // Redessiner la scène immédiatement
}

// --------------------------------------------------------
// --- GESTION DU ZOOM ET ROTATION AVANCÉE (Simulée par double-glissement ou boutons) ---
// Note: Le tactile multi-touch (pincer pour zoomer/rotation) est complexe sans librairie. 
// Nous allons nous concentrer sur le défilement pour le zoom.
// --------------------------------------------------------

function handleZoom(event) {
    if (!isImageLoaded) return;
    event.preventDefault();
    
    // 100 est une valeur standard de défilement pour un seul "clic" de roulette
    const zoomFactor = (event.deltaY > 0) ? 0.95 : 1.05; 
    
    scale *= zoomFactor;
    
    // Limiter le zoom
    scale = Math.max(0.5, Math.min(scale, 5.0));

    drawScene();
}

// Fonction pour simuler la Rotation (Vous pouvez la lier à un geste dans un code plus avancé)
function rotateImage(deltaAngle) {
    if (!isImageLoaded) return;
    rotationAngle += deltaAngle; 
    drawScene();
}

// Exemple: Pour tester la rotation (vous pouvez appeler ceci depuis la console)
// window.rotateImage(0.1); 

// Initialiser le canvas (Dessiner la scène vide au début)
drawScene();
