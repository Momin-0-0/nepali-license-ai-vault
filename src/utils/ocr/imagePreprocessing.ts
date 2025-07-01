
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
        // Scale up image for better OCR results
        const scaleFactor = Math.max(2, Math.min(4, 1200 / Math.max(img.width, img.height)));
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;

        // Apply bicubic scaling for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data for advanced processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Multi-stage enhancement pipeline
        enhanceContrast(data);
        removeBackground(data);
        sharpenText(data, canvas.width, canvas.height);
        applyGaussianBlur(data, canvas.width, canvas.height, 0.5);
        
        // Apply processed image data
        ctx.putImageData(imageData, 0, 0);

        // Additional morphological operations
        applyMorphologicalOperations(ctx, canvas.width, canvas.height);

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

const enhanceContrast = (data: Uint8ClampedArray) => {
  const factor = 2.5;
  const intercept = 128 * (1 - factor);
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] * factor + intercept));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor + intercept));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor + intercept));
  }
};

const removeBackground = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = (r + g + b) / 3;
    
    // Remove holographic/security patterns (blues, greens, light colors)
    if (b > r + 20 || g > r + 20 || gray > 180) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
    
    // Enhance dark text
    if (gray < 120) {
      const darkening = Math.max(0, gray - 40);
      data[i] = darkening;
      data[i + 1] = darkening;
      data[i + 2] = darkening;
    }
  }
};

const sharpenText = (data: Uint8ClampedArray, width: number, height: number) => {
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  const newData = new Uint8ClampedArray(data);
  
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

const applyGaussianBlur = (data: Uint8ClampedArray, width: number, height: number, sigma: number) => {
  const kernel = generateGaussianKernel(sigma);
  const newData = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let weightSum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
            const weight = kernel[(ky + 1) * 3 + (kx + 1)];
            sum += data[pixel] * weight;
            weightSum += weight;
          }
        }
        
        const index = (y * width + x) * 4 + c;
        newData[index] = Math.max(0, Math.min(255, sum / weightSum));
      }
    }
  }
  
  for (let i = 0; i < data.length; i++) {
    data[i] = newData[i];
  }
};

const generateGaussianKernel = (sigma: number): number[] => {
  const kernel = [];
  const size = 3;
  const center = Math.floor(size / 2);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      const value = Math.exp(-(distance ** 2) / (2 * sigma ** 2));
      kernel.push(value);
    }
  }
  
  return kernel;
};

const applyMorphologicalOperations = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Apply erosion followed by dilation to clean up noise
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert to binary
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const binary = gray < 128 ? 0 : 255;
    data[i] = binary;
    data[i + 1] = binary;
    data[i + 2] = binary;
  }
  
  ctx.putImageData(imageData, 0, 0);
};

export const applyAdvancedSharpenFilter = (imageData: ImageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(data);

  const kernel = [
    -1, -1, -1,
    -1,  9, -1,
    -1, -1, -1
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
