const fs = require("fs-extra");
const path = require("path");

exports.deleteFile = async (req, res) => {
  try {
    let { file_name } = req.params;

    if (!file_name) return res.json({ error: true });

    let pathTmp = path.join(global.dirPublic, "upload", file_name);

    if (fs.existsSync(pathTmp)) {
      fs.removeSync(pathTmp);
      return res.json({ msg: "deleted" });
    } else {
      return res.json({ error: true, msg: "no_file" });
    }
  } catch (err) {
    console.log(err);
    return res.json({ error: true });
  }
};
