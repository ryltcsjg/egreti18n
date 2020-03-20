import {
  findFile,
  formattime,
  readFile,
  shallowEqual,
  writeFile
} from "./util";

const fs = require("fs");
const vscode = require("vscode");
const childProcess = require("child_process");

let name_id: { [x: string]: string } = {};
let id_name: { [x: string]: string } = {};
let existPaths: { [x: string]: boolean } = {};

const workPath = vscode.workspace.rootPath;
const exmlPath = ".wing/exml.json";
let skinPath = "";
const destPath = "resource/i18n";
const cachePath = "temp/i18n";

let Log = vscode.window.createOutputChannel("egreti18n");

Log.appendLine("工作路径：" + workPath);

function operateExmlfile(p: string) {
  return readFile(p, "utf-8")
    .then((data: any) => {
      let idstr = data.match(/w:Config id="[0-9a-zA-Z]+"/);
      if (!idstr || idstr.length <= 0) {
        return;
      }
      let id: any = /"[0-9a-zA-Z]+"/.exec(idstr[0]);
      id = id && id[0].replace(/"/g, "");
      // let temp = p.split("/");
      // temp = temp[temp.length - 1].split(".");
      // let name = temp[0];

      if (id_name[id]) {
        Log.appendLine("修改重复id  " + p.replace(workPath, ""));
        while (id_name[id]) {
          id = (Date.now() - Math.round(Math.random() * 10000000)).toString(16);
        }
        writeFile(
          p,
          data.replace(/w:Config id="[0-9a-zA-Z]+"/, `w:Config id="${id}"`)
        );
      }
      id_name[id] = p;
      name_id[p] = id;
    })
    .catch((e: any) => {
      Log.appendLine("失败operateExmlfile：" + e.message);
    });
}

//读取皮肤文件结束
function readSkinFiles() {
  return findFile(`${workPath}/${skinPath}`, /\.exml$/).then(files => {
    if (!files || files.length <= 0) {
      Log.appendLine(`${skinPath}中找不到.exml文件，请设置`);
      throw new Error(`${skinPath}中找不到.exml文件，请设置`);
    }
    let promises: Promise<any>[] = [];
    files.forEach(file => {
      promises.push(operateExmlfile(file));
    });
    return Promise.all(promises).then(() => {
      Log.appendLine("读取皮肤文件结束！");
    });
  });
}

function checkFilePath(p: string) {
  if (existPaths[p]) {
    return;
  }
  if (fs.existsSync(p)) {
    existPaths[p] = true;
    return;
  }
  let paths = p.split("/");
  let ps: string[] = [];
  paths.forEach(item => {
    ps.push(item);
    let temppath = ps.join("/");

    if (existPaths[temppath] || workPath.indexOf(temppath) != -1) {
      return;
    }
    if (fs.existsSync(temppath)) {
      existPaths[temppath] = true;
      return;
    }
    Log.appendLine("mkdir：" + temppath);
    fs.mkdirSync(temppath);
    existPaths[temppath] = true;
  });
}

function parseExmlFile(lan: string): Promise<{ [x: string]: any }> {
  let path = `${workPath}/${exmlPath}`;
  return readFile(path, "utf-8")
    .then((data: string) => {
      let obj = JSON.parse(data);
      Log.appendLine(`解析${path}成功`);
      return obj;
    })
    .catch((e: any) => {
      throw new Error(`解析${path}失败` + e.message);
    });
}

function writeJsonFile(data: { [x: string]: any }, lan: string) {
  let promises = [];
  for (let key in data) {
    const item = data[key];
    if (typeof item === "object") {
      let bindingDataTestObj = item.bindingDataTestObj;
      //exml文件路径
      let filePath = id_name[key];
      if (bindingDataTestObj && bindingDataTestObj.length > 0 && filePath) {
        //目标路径
        let dPath = filePath
          .replace(skinPath, destPath + "/" + lan)
          .replace(/\/[0-9a-zA-Z_]+\.exml$/, "");

        let arrF = filePath.split("/");
        let fileName = arrF[arrF.length - 1].replace(".exml", "");

        //创建文件夹
        checkFilePath(dPath);
        //文本内容
        let content: { [x: string]: string } = {};
        bindingDataTestObj.forEach((item: any) => {
          item.key.indexOf("$i18n.") != -1 &&
            (content[item.key.replace("$i18n.", "")] = item.value);
        });
        if (Object.keys(content).length > 0) {
          let filePath = dPath + "/" + fileName + "_" + lan + ".json";
          //有数据---存储文件
          let _promise = writeFile(filePath, JSON.stringify(content)).then(
            () => {
              Log.appendLine(
                "更新文件：" + filePath.replace(workPath + "/", "")
              );
            }
          );
          promises.push(_promise);
        }
      }
    }
  }

  return Promise.all(promises);
}

/**
 * 开始
 */
export function save(lan: string) {
  Log.show();

  skinPath =
    vscode.workspace.getConfiguration().get("EgretIi8n.skinPath") ||
    "resource/skins";
  Log.appendLine("EgretIi8n.skinPath 皮肤文件路径：" + skinPath);

  let cache = lan + formattime(Date.now());
  checkFilePath(`${workPath}/${destPath}/${lan}`);
  checkFilePath(`${workPath}/${cachePath}`);
  Log.appendLine("备份文件至：" + cache);
  const p = childProcess.exec(`
  mv ${workPath}/${destPath}/${lan} ${workPath}/${cachePath}/${cache}
  `);
  p.once("exit", function(code: number) {
    if (code != 0) {
      Log.appendLine("备份文件失败：" + code);
      vscode.window.showInformationMessage("备份文件失败" + code);
      return;
    }
    existPaths = {};

    Log.appendLine("开始读取皮肤文件！");

    readSkinFiles()
      .then(() => parseExmlFile(lan))
      .then(data => writeJsonFile(data, lan))
      .then(() => {
        Log.appendLine("success!");
        vscode.window.showInformationMessage("成功");
      })
      .catch((e: any) => {
        Log.appendLine("Fail  " + e.message);
        vscode.window.showErrorMessage("失败");
      })
      .then(() => {
        //清空
        name_id = {};
        id_name = {};
        existPaths = {};
      });
  });
}
