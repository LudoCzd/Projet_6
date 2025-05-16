const Book = require("../models/Book");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

exports.createBook = (req, res) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  const originalname = req.file.originalname.split(" ").join("_");
  const nameWithoutExt = originalname.split(".").slice(0, -1).join("_");
  const filename = `${Date.now()}-${nameWithoutExt}.webp`;
  const outputPath = path.join("images", filename);

  sharp(req.file.buffer)
    .resize({ width: 800 })
    .toFormat("webp", { quality: 80 })
    .toFile(outputPath)
    .then(() => {
      const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${filename}`,
      });
      return book.save();
    })
    .then(() => {
      res.status(201).json({ message: "Objet enregistré" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (book.userId !== req.auth.userId) {
      return res.status(401).json({ message: "Non autorisé" });
    }
    let bookObject;
    if (req.file) {
      const oldFilename = book.imageUrl.split("/images/")[1];
      await fsPromises.unlink(path.join("images", oldFilename));
      const originalname = req.file.originalname.split(" ").join("_");
      const nameWithoutExt = originalname.split(".").slice(0, -1).join("_");
      const filename = `${Date.now()}-${nameWithoutExt}.webp`;
      const outputPath = path.join("images", filename);
      await sharp(req.file.buffer)
        .resize({ width: 800 })
        .toFormat("webp", { quality: 80 })
        .toFile(outputPath);
      bookObject = {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${filename}`,
      };
    } else {
      bookObject = { ...req.body };
    }
    delete bookObject._userId;
    await Book.updateOne(
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id }
    );
    res.status(200).json({ message: "Objet modifié" });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non autorisé" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};
