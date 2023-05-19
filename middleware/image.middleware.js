const multer = require("multer");
const SharpMulter = require("sharp-multer");

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};

// var storage = multer.diskStorage({
//   destination: (req, image, cb) => {
//     cb(null, "./public/images/uploads");
//   },
//   filename: (req, image, cb) => {
//     cb(null, `${Date.now()}-groshop-${image.originalname}`);
//   },
// });

const storage = SharpMulter({
    destination: (req, file, cb) => {
        cb(null, "./public/images/uploads");
    },
    imageOptions: {
        fileFormat: "jpg",
        quality: 100,
        // resize: { width: 500, height: 400 },
        useTimestamp: true
    }
})

var upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10*1024*1024
    },
    fileFilter: imageFilter 
});


module.exports = upload;