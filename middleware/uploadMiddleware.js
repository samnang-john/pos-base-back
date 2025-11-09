import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/upload");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname) {
    cb(null, false); 
  } else {
    cb(null, true);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
