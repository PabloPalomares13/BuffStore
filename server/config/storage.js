// config/storage.js
const { Storage } = require('@google-cloud/storage');
const axios = require('axios');
const crypto = require('crypto');
 
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

/**
 * Borra TODOS los objetos cuyo nombre empiece con `prefix` (imágenes, videos,
 * poster y el thumbnail que genera Cloud Run). En GCS no existen carpetas
 * reales: son solo el prefijo del nombre de archivo, así que borrar todos
 * los objetos con ese prefijo es lo que hace que la "carpeta" desaparezca
 * de la consola de Google Cloud.
 *
 * `force: true` hace que, si algún archivo individual ya no existe (por
 * ejemplo porque se borró antes a mano, o el video procesado todavía no
 * había llegado), esta función no truene: ignora esos casos puntuales y
 * sigue borrando el resto.
 *
 * @param {string} prefix - ej: `products/${productId}/`
 * @returns {Promise<number>} cantidad de archivos borrados
 */
const deleteFolderFromGCS = async (prefix) => {
  try {
    const [files] = await bucket.getFiles({ prefix });

    if (files.length === 0) {
      console.log(`No hay archivos bajo el prefijo ${prefix}`);
      return 0;
    }

    await bucket.deleteFiles({ prefix, force: true });
    console.log(`Carpeta eliminada de GCS: ${prefix} (${files.length} archivo(s))`);
    return files.length;
  } catch (error) {
    // No relanzamos: borrar la carpeta es "best effort", no debe tumbar
    // el borrado del producto en la base de datos si GCS falla.
    console.error(`Error borrando carpeta ${prefix} de GCS:`, error);
    return 0;
  }
};
 
// Quita acentos y caracteres raros, deja solo letras/números en mayúsculas.
// Mismo criterio que generateUniqueProductCode, para que el código del
// producto y el nombre de sus archivos en GCS se puedan relacionar a simple vista.
const slugifyName = (name, len) => {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, len);
};

// Función para generar nombre único de archivo (galería normal)
// `productFolder` es el identificador que se usa como nombre de carpeta en GCS:
// pásale product.code (ej: "THELAS482"), no el _id de Mongo, para que la
// carpeta también sea legible.
// Ej: products/THELAS482/THELASTOFUSPA_1732500000000_0_a1b2c3.jpg
const generateFileName = (originalName, productFolder, index, productName) => {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const slug = slugifyName(productName, 12) || 'GAME'; // el doble de largo que el código del producto (6)
  const random = crypto.randomBytes(3).toString('hex'); // evita choques si dos subidas caen en el mismo milisegundo
  return `products/${productFolder}/${slug}_${timestamp}_${index}_${random}.${extension}`;
};
 
// Función para generar el nombre de la foto de portada, dentro de una
// subcarpeta "poster" propia de cada producto:
// products/{productFolder}/poster/{SLUG}_{timestamp}_{random}.{ext}
const generatePosterFileName = (originalName, productFolder, productName) => {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const slug = slugifyName(productName, 12) || 'GAME';
  const random = crypto.randomBytes(3).toString('hex');
  return `products/${productFolder}/poster/${slug}_${timestamp}_${random}.${extension}`;
};
 
/**
 * Sube el video crudo a GCS y, opcionalmente, dispara el procesamiento
 * (compresión + thumbnail) en Cloud Run.
 *
 * @param {*} file - archivo de multer
 * @param {*} fileName - nombre destino en el bucket
 * @param {*} productId - id del producto
 * @param {boolean} shouldProcess - si es false, se sube el video tal cual
 *   y se marca processing: false de inmediato, sin llamar a Cloud Run.
 */
const processAndUploadVideo = async (file, fileName, productId, shouldProcess = true) => {
  try {
    const gcsFile = bucket.file(fileName);
    const stream = gcsFile.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000',
      }
    });
 
    await new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(file.buffer);
    });
 
    const rawVideoUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`;
 
    // Si el admin desmarcó "procesar video", se queda tal cual se subió,
    // sin pasar por Cloud Run. Se marca processing:false de inmediato.
    if (!shouldProcess) {
      return {
        fileName,
        processing: false,
        rawVideoUrl
      };
    }
 
    const videoProcessorUrl = process.env.VIDEO_PROCESSOR_URL;
    const callbackUrl = `${process.env.API_BASE_URL}/api/videos/callback`;
 
    // IMPORTANTE: no se espera (no await) la respuesta de Cloud Run.
    // Se dispara la solicitud y se sigue de inmediato, para no bloquear
    // la respuesta al admin mientras el video se procesa en segundo plano.
    axios.post(
      `${videoProcessorUrl}/process`,
      {
        videoFileName: fileName,
        callbackUrl: callbackUrl,
        productId: productId
      },
      {
        headers: {
          'x-video-process-key': process.env.VIDEO_PROCESS_KEY,
          'Content-Type': 'application/json'
        }
      }
    ).catch((err) => {
      console.error(`Error al iniciar el procesamiento del video ${fileName}:`, err.message);
    });
 
    return {
      fileName,
      processing: true,
      rawVideoUrl
    };
  } catch (error) {
    throw new Error(`Error uploading video: ${error.message}`);
  }
};
 
module.exports = {
  storage,
  bucket,
  uploadFileToGCS,
  deleteFileFromGCS,
  deleteFolderFromGCS,
  generateFileName,
  generatePosterFileName,
  processAndUploadVideo
};                          