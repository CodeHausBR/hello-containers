import multer from "multer";

const uploadFiles = multer({
    storage: multer.memoryStorage(),
});

export default uploadFiles;
