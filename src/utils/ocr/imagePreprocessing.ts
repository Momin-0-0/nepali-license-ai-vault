
export const preprocessNepalLicenseImage = async (imageFile: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Advanced preprocessing pipeline for Nepal license
        ctx.filter = 'contrast(2.2) brightness(1.4) saturate(0.5) blur(0.2px)';
        ctx.drawImage(img, 0, 0);

        // Get image data for pixel-level processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Stage 1: Enhanced contrast and background removal
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const avg = (r + g + b) / 3;
          
          // Remove holographic background colors (blues, greens)
          if (b > r + 30 || g > r + 30) {
            // Make background whiter
            data[i] = Math.min(255, data[i] + 60);
            data[i + 1] = Math.min(255, data[i + 1] + 60);
            data[i + 2] = Math.min(255, data[i + 2] + 60);
          }
          
          // Enhance dark text (black/dark colors)
          if (avg < 100) {
            data[i] = Math.max(0, data[i] - 50);
            data[i + 1] = Math.max(0, data[i + 1] - 50);
            data[i + 2] = Math.max(0, data[i + 2] - 50);
          }
          
          // Brighten light background
          if (avg > 200) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }

        // Apply processed image data
        ctx.putImageData(imageData, 0, 0);
        
        // Stage 2: Additional sharpening
        const finalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyAdvancedSharpenFilter(finalData);
        ctx.putImageData(finalData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const enhancedFile = new File([blob], `enhanced_nepal_${imageFile.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(enhancedFile);
          } else {
            reject(new Error('Failed to enhance Nepal license image'));
          }
        }, 'image/jpeg', 0.95);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

export const applyAdvancedSharpenFilter = (imageData: ImageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(data);

  // Enhanced sharpening kernel for text
  const kernel = [
    0, -1, 0,
    -1, 6, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            sum += data[pixel] * kernel[kernelIndex];
          }
        }
        const index = (y * width + x) * 4 + c;
        newData[index] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    data[i] = newData[i];
  }
};
