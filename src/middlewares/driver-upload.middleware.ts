import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage for Driver Documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/drivers';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Unique filename: timestamp-random-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter
const fileFilter = (req: any, file: any, cb: any) => {
    // Accept Images, PDF, Word
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false); // Reject file without error (handled in controller if file missing)
    }
};

export const driverUploadMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
}).single('file'); // Expecting a single file field named 'file'
