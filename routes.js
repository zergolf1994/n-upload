"use strict";
const express = require("express");
const router = express.Router();
const { AuthJWT } = require("./utils");

const { uploadChunks, uploadSingle } = require("./controllers/upload");
const { deleteFile } = require("./controllers/delete");
const { serverCreate } = require("./controllers/server");

router.post("/upload", AuthJWT, uploadSingle);
router.post("/chunks", AuthJWT, uploadChunks);
router.get("/delete", deleteFile);

router.get("/server/create", serverCreate);

router.all("*", async (req, res) => {
  return res.status(404).json({ error: true, msg: `link_not_found` });
});

module.exports = router;
