const fs = require("fs-extra");
const path = require("path");

exports.deleteFile = async (req, res) => {
  try {
    let { file_name } = req.body;
    let pathTmp = path.join(global.dirPublic, "upload", file_name);

    fs.removeSync(pathTmp);
    return res.json({ msg: "deleted" });
  } catch (err) {
    console.log(err);
    return res.json({ error: true });
  }
};
