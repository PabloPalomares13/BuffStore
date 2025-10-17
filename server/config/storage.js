// config/storage.js
const { Storage } = require('@google-cloud/storage');

// Validar variables de entorno
if (!process.env.GCS_PRIVATE_KEY) {
  throw new Error('GCS_PRIVATE_KEY environment variable is not set');
}

// Configuración usando variables de entorno
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    type: 'service_account',
    project_id: process.env.GCS_PROJECT_ID,
    private_key_id: process.env.GCS_PRIVATE_KEY_ID,
    private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'), 
    client_email: process.env.GCS_CLIENT_EMAIL,
    client_id: process.env.GCS_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GCS_CLIENT_EMAIL}`
  }
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Función para subir archivo a GCS
const uploadFileToGCS = async (file, fileName) => {
  try {
    const gcsFile = bucket.file(fileName);
    
    const stream = gcsFile.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      }
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        // URL pública del archivo
        const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`;
        console.log('File uploaded successfully:', publicUrl);
        resolve(publicUrl);
      });
      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Error uploading file to GCS: ${error.message}`);
  }
};
// Función para eliminar archivo de GCS
const deleteFileFromGCS = async (fileName) => {
  try {
    await bucket.file(fileName).delete();
    console.log(`File ${fileName} deleted from GCS`);
  } catch (error) {
    console.error(`Error deleting file ${fileName} from GCS:`, error);
    throw error;
  }
};

// Función para generar nombre único de archivo
const generateFileName = (originalName, productId, index) => {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  return `products/${productId}/${timestamp}_${index}.${extension}`;
};

module.exports = {
  storage,
  bucket,
  uploadFileToGCS,
  deleteFileFromGCS,
  generateFileName
};