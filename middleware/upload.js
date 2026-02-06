const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const directories = ['documents', 'receipts', 'id_proofs', 'images'];

directories.forEach(dir => {
    const fullPath = path.join(uploadDir, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let subDir = 'documents';

        if (req.baseUrl.includes('transactions') || file.fieldname === 'receipt') {
            subDir = 'receipts';
        } else if (req.baseUrl.includes('customers') || file.fieldname === 'idProof') {
            subDir = 'id_proofs';
        } else if (file.fieldname === 'images' || file.mimetype.startsWith('image/')) {
            subDir = 'images';
        }

        cb(null, path.join(uploadDir, subDir));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed: images, PDF, Word, Excel'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    }
});

module.exports = upload;
