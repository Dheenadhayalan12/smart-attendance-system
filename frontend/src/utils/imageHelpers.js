// Image processing utilities for face image handling

// Convert file to base64 (without data URL prefix)
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Compress image if too large
export const compressImage = (file, maxWidth = 640, maxHeight = 480, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Validate image file
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (!file) {
    return { isValid: false, message: 'Please select an image file' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: 'Please select a JPEG or PNG image' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, message: 'Image size must be less than 5MB' };
  }
  
  return { isValid: true, message: null };
};

// Create image preview URL
export const createImagePreview = (file) => {
  return URL.createObjectURL(file);
};

// Clean up image preview URL
export const cleanupImagePreview = (url) => {
  URL.revokeObjectURL(url);
};