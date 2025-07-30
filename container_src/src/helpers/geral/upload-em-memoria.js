import multer from "multer";
import setResponse from "../response/setResponse.js";

// Configuração para validar arquivos e limites
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!file.originalname?.match(/\.(txt|rem|crt|r01|r02)$/i)) {
        return cb((req, res) => {
            return cb(new Error("Extensão de arquivo inválida!"));
        });
    }
    cb(null, true);
};

// Configuração de upload único e múltiplo
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter,
});

const uploadMultiple = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5, // Limite de 5 arquivos
    },
    fileFilter,
});

const uploadEmMemoria = class uploadEmMemoria {
    static single(req, res, next) {
        const uploadSingle = upload.single();

        uploadSingle(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return setResponse.INVALID_FILE({res: res, message: "Erro ao enviar arquivo!"});
            } else if (err) {
                return setResponse.INVALID_FILE({res: res, message: "Somente arquivos txt|rem|crt|r01|r02 são permitidos!"});
            }
            next();
        });
    }

    static multiple(req, res, next) {
        const uploadAny = uploadMultiple.any();

        uploadAny(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return setResponse.INVALID_FILE({res: res, message: "Erro ao enviar arquivos!"});
            } else if (err) {
                return setResponse.INVALID_FILE({res: res, message: "Somente arquivos txt|rem|crt|r01|r02 são permitidos!!"});
            }
            next();
        });
    }
};

export default uploadEmMemoria;
