import {
  findFile,
  readdir,
  readFile,
  writeFile,
  shallowEqual,
  coverData
} from "./util";

const fs = require("fs");
const vscode = require("vscode");

let name_id: { [x: string]: string } = {};
let id_name: { [x: string]: string } = {};
let existPaths: { [x: string]: boolean } = {};

const workPath = vscode.workspace.rootPath;
let skinPath = "";
const destPath = ".wing";
const jsonPath = "resource/i18n";

let output: any = {};

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
      name_id[
        p.replace(workPath + "/" + skinPath + "/", "").replace(/\//g, "_")
      ] = id;
    })
    .catch((e: any) => {
      Log.appendLine("失败operateExmlfile：" + e.message);
    });
}
//读取皮肤文件结束
function readSkinFiles() {
  return findFile(`${workPath}/${skinPath}`, /\.exml$/).then(files => {
    // Log.appendLine("读取皮肤文件结束！");
    let promises: Promise<any>[] = [];
    files.forEach(file => {
      promises.push(operateExmlfile(file));
    });
    return Promise.all(promises).then(() => {
      Log.appendLine("读取皮肤文件结束！");
    });
  });
}

function readLanFiles(lan: string): Promise<any> {
  output[lan] = {};
  return findFile(`${workPath}/${jsonPath}/${lan}`, /\.json$/).then(
    (paths: string[]) => {
      if (!paths || paths.length <= 0) {
        throw new Error(`找不到 ${workPath}/${jsonPath}/${lan}`);
      }
      let promises: Promise<any>[] = [];
      paths.forEach((path: string) => {
        let _promise = readFile(path, "utf-8").then((str: string) => {
          let data = JSON.parse(str);
          let arr = path.split("/");
          let skinname = arr[arr.length - 1].replace(
            "_" + lan + ".json",
            ".exml"
          );
          let bindingDataTestObj = [];
          for (let key in data) {
            bindingDataTestObj.push({
              key: `$i18n.${key}`,
              value: data[key]
            });
          }
          if (bindingDataTestObj.length > 0 && name_id[skinname]) {
            output[lan][name_id[skinname]] = {
              bindingDataTestObj
            };
          }
        });
        promises.push(_promise);
      });
      return Promise.all(promises);
    }
  );
}

function writeJsonFile(lan: string) {
  let jsonPath = `${workPath}/${destPath}/exml.json`;
  return readFile(jsonPath, "utf-8")
    .catch(() => JSON.stringify({}))
    .then((fileStr: string) => {
      let data = JSON.parse(fileStr);
      for (let key in output[lan]) {
        data[key] = data[key] || {};
        data[key]["bindingDataTestObj"] = coverData(
          data[key]["bindingDataTestObj"],
          output[lan][key]["bindingDataTestObj"]
        );
      }
      return writeFile(jsonPath, JSON.stringify(data)).then(() => {
        Log.appendLine(`更新文件：${jsonPath}`);
      });
    })
    .catch(() => {
      Log.appendLine(`更新文件失败：${jsonPath}`);
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

/**
 * 开始
 */
export function useLan(lan: string) {
  Log.show();

  skinPath =
    vscode.workspace.getConfiguration().get("EgretIi8n.skinPath") ||
    "resource/skins";
  Log.appendLine("EgretIi8n.skinPath 皮肤文件路径：" + skinPath);

  Log.appendLine("开始读取皮肤文件！");
  return readSkinFiles()
    .then(() => readLanFiles(lan))
    .then(() => writeJsonFile(lan))
    .then(() => {
      Log.appendLine("success");
      //清空
      name_id = {};
      id_name = {};
      existPaths = {};
      output = {};
    })
    .catch((e: any) => {
      Log.appendLine("Fail " + e.message);
      name_id = {};
      id_name = {};
      existPaths = {};
      output = {};
      vscode.window.showErrorMessage("失败");
      throw "err";
    });
}
