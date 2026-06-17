import { apiClient } from "@/lib/apiClient";
import { resolveAssetUrl } from "@/lib/storeUrl";

export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await apiClient.post('/seller/media/upload', formData);
        if (!res.success) {
            throw new Error(res.message || 'Upload failed');
        }

        const uploaded = res.data?.url || res.data?.imageUrl || res.data?.path || res.data?.file?.url;
        if (!uploaded) throw new Error('Upload succeeded but no image URL was returned');
        return uploaded;
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error(`Image upload failed: ${error.message}`);
    }
};

export const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Only JPG, PNG, and WEBP images are allowed' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'Image size must be less than 5MB' };
    }

    return { valid: true, error: null };
};

/**
 * 🖼️ Dynamic Image Resolver for Admin Dashboard
 */
export function resolveImageUrl(src, placeholder = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200") {
    return resolveAssetUrl(src, placeholder);
}

