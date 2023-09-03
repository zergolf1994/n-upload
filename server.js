"use strict";

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const cors = require("cors");
const path = require("path");
const app = express();
const fs = require("fs-extra");
const fileUpload = require("express-fileupload");

// Global
global.dir = __dirname;
global.limitUpload = 1024 * 1024 * 1024 * 5;
global.dirPublic = path.join(global.dir, "public");
global.dirUpload = path.join(global.dir, "public/upload");

if (!fs.existsSync(path.join(global.dir, ".temp")))
  fs.mkdirSync(path.join(global.dir, ".temp"), { recursive: true });

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(global.dir, ".temp"),
    limits: { fileSize: global.limitUpload },
    abortOnLimit: true,
  })
);

app.set("trust proxy", true);
app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
  })
);

app.use(express.static(global.dirPublic));

app.use(bodyParser.json({ limit: "10mb" }));

app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.options("*", (req, res, next) => res.end());

app.use(require("./routes"));

const server = http.createServer(app);
server.listen(process.env.HTTP_PORT, () =>
  console.log(`Listening on port: %s`, process.env.HTTP_PORT)
);
const path_key = path.join(global.dir, ".cert", "main.key"),
  path_cert = path.join(global.dir, ".cert", "main.cert");

if (fs.existsSync(path_key) && fs.existsSync(path_cert)) {
  const key = fs.readFileSync(path_key),
    cert = fs.readFileSync(path_cert),
    options = { key: key, cert: cert };

  const server_https = require("https").createServer(options, app);
  server_https.listen(process.env.HTTPS_PORT, () =>
    console.log(`HTTPS port:${process.env.HTTPS_PORT}...`)
  );
}
