const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Criar diretórios se não existirem
const uploadDirs = {
  curriculos: './uploads/curriculos',
  fotos: './uploads/fotos',
  logos: './uploads/logos'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDirs.curriculos;
    
    if (file.fieldname === 'foto') {
      uploadPath = uploadDirs.fotos;
    } else if (file.fieldname === 'logo') {
      uploadPath = uploadDirs.logos;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'curriculo') {
    // Aceitar apenas PDFs para currículos
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos para currículos'), false);
    }
  } else if (file.fieldname === 'foto' || file.fieldname === 'logo') {
    // Aceitar imagens
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens (JPEG, PNG, WEBP) são permitidas'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB padrão
  }
});

module.exports = upload;
