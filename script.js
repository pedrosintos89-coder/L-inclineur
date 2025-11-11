const imageUpload = document.getElementById('imageUpload');
const uploadStatus = document.getElementById('uploadStatus');
const tiltX = document.getElementById('tiltX');
const tiltXValue = document.getElementById('tiltXValue');
const tiltY = document.getElementById('tiltY');
const tiltYValue = document.getElementById('tiltYValue');
const applyTiltButton = document.getElementById('applyTiltButton');
const tiltStatus = document.getElementById('tiltStatus');
const tiltedCanvas = document.getElementById('tiltedCanvas');
const noTiltedImageText = document.getElementById('noTiltedImageText');

let currentImageBase64 = null;
let originalImage = new Image(); 

// 1. Gestionnaire de téléchargement d'image
imageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageBase64 = e.target.result;
            originalImage.onload = function() {
                // Rendre les contrôles actifs après le chargement de l'image
                tiltX.disabled = false;
                tiltY.disabled = false;
                applyTiltButton.disabled = false;
                
                // Dessiner l'image originale comme base (sans inclinaison)
                applyTilt(); 

                uploadStatus.textContent = 'Image chargée. Ajustez les curseurs ou cliquez sur Appliquer.';
                uploadStatus.className = 'status-message success';
                tiltStatus.textContent = ''; 
            };
            originalImage.src = currentImageBase64;
        };
        reader.readAsDataURL(file);
    } else {
        currentImageBase64 = null;
        originalImage.src = '';
        applyTiltButton.disabled = true;
        tiltX.disabled = true;
        tiltY.disabled = true;
        uploadStatus.textContent = 'Veuillez d\'abord sélectionner une image.';
        uploadStatus.className = 'status-message';
        tiltedCanvas.style.display = 'none';
        noTiltedImageText.style.display = 'block';
    }
});

// 2. Mettre à jour la valeur de l'inclinaison sur l'interface et appliquer en temps réel (si désiré)
tiltX.addEventListener('input', function() {
    tiltXValue.textContent = parseFloat(tiltX.value).toFixed(3);
    // Optionnel: appliquer le tilt en temps réel (décommenter si le téléphone est rapide)
    // if (currentImageBase64) { applyTilt(); }
});

tiltY.addEventListener('input', function() {
    tiltYValue.textContent = parseFloat(tiltY.value).toFixed(3);
    // Optionnel: appliquer le tilt en temps réel (décommenter si le téléphone est rapide)
    // if (currentImageBase64) { applyTilt(); }
});


// 3. Gestionnaire du bouton "Appliquer l'Inclinaison"
applyTiltButton.addEventListener('click', function() {
    if (!currentImageBase64) return;
    applyTilt();
    tiltStatus.textContent = 'Inclinaison appliquée avec succès !';
    tiltStatus.className = 'status-message success';
});


// *** Fonction principale pour appliquer l'inclinaison (Tilt/Skew) ***
function applyTilt() {
    if (!originalImage.src) return;

    const skewX = parseFloat(tiltX.value);
    const skewY = parseFloat(tiltY.value);

    // Calculer les nouvelles dimensions maximales nécessaires pour éviter le rognage
    // La hauteur ou la largeur du canvas doit être augmentée selon le degré d'inclinaison
    const newWidth = originalImage.width + Math.abs(skewY * originalImage.height);
    const newHeight = originalImage.height + Math.abs(skewX * originalImage.width);

    tiltedCanvas.width = newWidth;
    tiltedCanvas.height = newHeight;

    const ctx = tiltedCanvas.getContext('2d');
    ctx.clearRect(0, 0, newWidth, newHeight);

    ctx.save();

    // Déterminer la translation nécessaire pour maintenir l'image visible au coin supérieur gauche
    let translateX = 0;
    let translateY = 0;

    // Si skewY est positif, l'image se déplace vers la droite horizontalement (il faut compenser)
    if (skewY > 0) { 
        // Compensation pour l'inclinaison verticale (y) sur l'axe X
        translateX = Math.abs(skewY * originalImage.height);
    }
    
    // Si skewX est négatif, l'image se déplace vers le haut verticalement (il faut compenser)
    if (skewX < 0) { 
        // Compensation pour l'inclinaison horizontale (x) sur l'axe Y
        translateY = Math.abs(skewX * originalImage.width);
    }
    
    // Appliquer d'abord la translation (pour compenser l'expansion due à l'inclinaison)
    ctx.translate(translateX, translateY);


    // Appliquer la transformation d'inclinaison (skew)
    // ctx.transform(scaleX, skewY, skewX, scaleY, translateX, translateY)
    // On garde scaleX et scaleY à 1
    ctx.transform(1, skewY, skewX, 1, 0, 0); 

    // Dessiner l'image originale (elle est maintenant inclinée par la matrice de transformation)
    ctx.drawImage(originalImage, 0, 0);

    ctx.restore(); // Restaurer l'état du contexte pour les opérations futures

    tiltedCanvas.style.display = 'block';
    noTiltedImageText.style.display = 'none';
}
