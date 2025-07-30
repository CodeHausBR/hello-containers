import multer from "multer";
import path from "path";
import setResponse from "../response/setResponse.js";

const imagemStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/imagens");
    },
    filename: function (req, file, cb) {
        const baseURL = req.url.match(/\/([^/]+)/)[1];
        const formatoArquivo = path.extname(file.originalname);
        const nomeArquivo =
            baseURL +
            "-" +
            Math.floor(Math.random() * 91) +
            new Date().getSeconds() +
            new Date().getDate() +
            new Date().getMinutes() +
            new Date().getMilliseconds() +
            new Date().getHours() +
            Math.floor(Math.random() * 91) +
            "-" +
            new Date().getFullYear().toString();

        cb(null, nomeArquivo + formatoArquivo);
    },
});

const documentoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/documentos");
    },

    filename: function (req, file, cb) {
        const baseURL = req.url.match(/\/([^/]+)/)[1];
        const formatoArquivo = path.extname(file.originalname);
        const nomeArquivo =
            baseURL +
            "-" +
            Math.floor(Math.random() * 91) +
            new Date().getSeconds() +
            new Date().getDate() +
            new Date().getMinutes() +
            new Date().getMilliseconds() +
            new Date().getHours() +
            Math.floor(Math.random() * 91) +
            "-" +
            new Date().getFullYear().toString();

        cb(null, nomeArquivo + formatoArquivo);
    },
});

export const uploadDoc = multer({
    storage: documentoStorage,
    fileFilter(req, file, cb) {
        if (!file.originalname?.match(/\.(png|jpeg|jpg|txt|pdf|doc)$/)) {
            return cb((req, res) => {
                return setResponse.SERVER_ERROR(res, "error");
            });
        }
        cb(undefined, true);
    },
});

const uploadImage = multer({
    storage: imagemStorage,
    fileFilter(req, file, cb) {
        if (!file.originalname?.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error("Somente arquivos PNG são permitidos!"), null);
        }
        cb(undefined, true);
    },
});

const upload = class upload {
    static imagemAny(req, res, next) {
        const uploadAny = uploadImage.any();
        uploadAny(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return setResponse.INVALID_FILE({res: res, message: "Erro ao enviar arquivo!"});
            } else if (err) {
                return setResponse.INVALID_FILE({res: res, message: "Somente imagens png|jpg|jpeg são permitidas!"});
            }
            next();
        });
    }

    static documentoAny(req, res, next) {
        const uploadAny = uploadDoc.any();

        uploadAny(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                return setResponse.INVALID_FILE({res: res, message: "Erro ao enviar arquivo!"});
            } else if (err) {
                return setResponse.INVALID_FILE({res: res, message: "Somente documentos png|jpg|jpeg|txt|pdf|doc são permitidos!"});
            }
            next();
        });
    }

    static documentoSingle(req, res, next) {
        const uploadSingle = uploadDoc.single("arquivoSingle");

        uploadSingle(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                console.log(err, "err");
                return setResponse.INVALID_FILE({res: res, message: "Erro ao enviar arquivo!"});
            } else if (err) {
                return setResponse.INVALID_FILE({res: res, message: "Somente documentos png|jpg|jpeg|txt|pdf|doc são permitidos!"});
            }
            next();
        });
    }
};


export default upload;
