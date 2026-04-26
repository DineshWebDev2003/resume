import axios from 'axios';
import * as Crypto from 'expo-crypto';

// Cloudinary Credentials
const CLOUDINARY_CLOUD_NAME = 'dju1pyahy';
const CLOUDINARY_API_KEY = '421174848865742';
const CLOUDINARY_API_SECRET = 'dMtMRyICHWU1wcAgVBLzVUXUqwE';

export const uploadToCloudinary = async (uri: string) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  // Create signature for signed upload
  // signature = sha1("timestamp=" + timestamp + API_SECRET)
  const signatureString = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    signatureString
  );

  const formData = new FormData();
  
  const file: any = {
    uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  };

  formData.append('file', file);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return {
      url: response.data.secure_url,
      publicId: response.data.public_id
    };
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error?.response?.data || error.message);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId: string) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signatureString = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    signatureString
  );

  try {
    const params = new URLSearchParams();
    params.append('public_id', publicId);
    params.append('api_key', CLOUDINARY_API_KEY);
    params.append('timestamp', timestamp.toString());
    params.append('signature', signature);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Cloudinary Delete Error:', error?.response?.data || error.message);
    throw error;
  }
};

