const fs = require("fs-extra");
const path = require("path");
const mime = require("mime-types");
const { File } = require("../models");
const { Generate } = require("../utils");

exports.uploadChunks = async (req, res) => {
  try {
    let { userId } = req?.authentication;

    let { item, totalChunks, tmp_name, file_name, mimetype, size, folder } =
      req.body;

    if (!tmp_name) return res.status(400).json({ error: true });
    if (!totalChunks) return res.status(400).json({ error: true });
    if (!item) return res.status(400).json({ error: true });
    if (!tmp_name) return res.status(400).json({ error: true });

    let FileUpload = req?.files?.blob;

    let pathTmp = path.join(global.dirPublic, ".temp", tmp_name);
    let pathSave = path.join(global.dirUpload);
    if (!fs.existsSync(pathTmp)) fs.mkdirSync(pathTmp, { recursive: true });
    if (!fs.existsSync(pathSave)) fs.mkdirSync(pathSave, { recursive: true });
    let chunkTmp = path.join(pathTmp, `${item}`);
    if (fs.existsSync(chunkTmp)) fs.unlinkSync(chunkTmp);

    FileUpload.mv(chunkTmp, async function (err) {
      if (err) {
        fs.unlinkSync(FileUpload?.tempFilePath);
        return res.status(500).json({ error: true, msg: "failed" });
      }
    });

    if (totalChunks == item) {
      //รวมไฟล์
      let BufferUpload = [];
      for (let i = 1; i <= totalChunks; i++) {
        const chunkPath = path.join(pathTmp, `${i}`);
        if (!fs.existsSync(chunkPath)) {
          fs.removeSync(pathSave);
          return res.status(500).json({ error: true, msg: "failed" });
        }
        const BufferData = fs.readFileSync(chunkPath);
        BufferUpload.push(BufferData);
      }

      let dataCreate = {
        userId,
        title: file_name,
        type: "upload",
        mimeType: "video",
        size: size,
      };
      dataCreate.slug = await Generate.Slug();
      if (folder) {
        let exist = await File.List.findOne({
          _id: folder,
          mimeType: "dir",
        }).select(`_id`);
        if (exist?._id) {
          dataCreate.dirId = folder;
        }
      }
      if (BufferUpload?.length > 0) {
        const ext = mime.extension(mimetype);
        let saveLocal = path.join(pathSave, `${dataCreate?.slug}.${ext}`);
        dataCreate.source = `//${req.get("host")}/upload/${
          dataCreate?.slug
        }.${ext}`;

        let dbCreate = await File.List.create(dataCreate);
        if (dbCreate?._id) {
          const mergeFile = Buffer.concat(BufferUpload);
          fs.writeFileSync(saveLocal, mergeFile);
          fs.removeSync(pathTmp);
          Buffer.allocUnsafe(0);

          return res.json({
            msg: `อัพโหลด ${file_name} สำเร็จ`,
          });
        } else {
          return res.status(200).json({ error: true, msg: `ลองอีกครั้ง` });
        }
      } else {
        fs.removeSync(pathTmp);
        return res.status(500).json({ error: true, msg: "ลองอีกครั้ง" });
      }
    } else {
      return res.status(201).json({ msg: `อัพโหลด ${item}` });
    }
  } catch (err) {
    console.log(err);
    return res.json({ error: true });
  }
};
exports.uploadSingle = async (req, res) => {
  try {
    let { userId } = req?.authentication;
    let { folder } = req.body;

    let FileUpload = req?.files?.file;
    FileUpload.name = Buffer.from(FileUpload?.name, "latin1").toString("utf8");

    if (FileUpload.size > global.limitUpload) {
      return res.status(413).json({ error: true });
    }

    const ext = mime.extension(FileUpload.mimetype);
    if (!fs.existsSync(global.dirPublic)) fs.mkdirSync(global.dirPublic);

    let dataCreate = {
      userId,
      title: FileUpload.name,
      type: "upload",
      mimeType: "video",
      size: FileUpload.size,
    };
    dataCreate.slug = await Generate.Slug();
    if (folder) {
      let exist = await File.List.findOne({
        _id: folder,
        mimeType: "dir",
      }).select(`_id`);
      if (exist?._id) {
        dataCreate.dirId = folder;
      }
    }

    dataCreate.source = `//${req.get("host")}/upload/${
      dataCreate?.slug
    }.${ext}`;

    let dbCreate = await File.List.create(dataCreate);
    if (dbCreate?._id) {
      let pathSave = path.join(global.dirPublic, "upload");
      fs.mkdirSync(pathSave, { recursive: true });
      let saveLocal = path.join(pathSave, `${dataCreate?.slug}.${ext}`);

      FileUpload.mv(saveLocal, async function (err) {
        if (err) {
          await Files.Lists.deleteOne({ _id: dbCreate?._id });
          fs.unlinkSync(FileUpload?.tempFilePath);
          return res.status(403).json({ error: true, msg: "failed" });
        }
      });

      return res
        .status(201)
        .json({
          slug: dataCreate?.slug,
          msg: `อัพโหลด ${dataCreate?.title} สำเร็จ`,
        });
    } else {
      fs.unlinkSync(FileUpload?.tempFilePath);
      return res.status(500).json({ error: true, msg: "failed" });
    }
  } catch (err) {
    console.log(err);
    return res.json({ error: true });
  }
};
