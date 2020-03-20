import { findFile, readFile, shallowEqual, writeFile } from "./util";

const fs = require("fs");
const vscode = require("vscode");

let name_id: { [x: string]: string } = {};
let id_name: { [x: string]: string } = {};
let existPaths: { [x: string]: boolean } = {};

const workPath = vscode.workspace.rootPath;
const exmlPath = ".wing";
const skinPath = "resource/skins";
const destPath = "resource/i18n";

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

function parseExmlFiles() {
  return findFile(`${workPath}/${exmlPath}`, /exml\.[a-zA-Z]+\.json/).then(
    (files: string[]) => {
      let promises: any[] = [];
      files.forEach(file => {
        let arr = file.match(/\.[a-zA-Z]+\.json$/);
        let lan: any =
          arr && arr[0] && arr[0].replace(".json", "").replace(".", "");
        if (!lan) {
          return;
        }
        promises.push(
          parseExmlFile(lan, file).then(data => writeJsonFile(data, lan))
        );
      });

      return Promise.all(promises);
    }
  );
}

function parseExmlFile(
  lan: string,
  path: string
): Promise<{ [x: string]: any }> {
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
          let _promise = readFile(filePath, "utf-8")
            .catch(() => JSON.stringify({}))
            .then((filecontent: string) => {
              let data = JSON.parse(filecontent);
              if (shallowEqual(data, content)) {
                Log.appendLine(
                  "无需更新：" + filePath.replace(workPath + "/", "")
                );
                return;
              }
              content = { ...data, ...content };
              return writeFile(filePath, JSON.stringify(content)).then(() => {
                Log.appendLine(
                  "更新文件：" + filePath.replace(workPath + "/", "")
                );
              });
            })
            .catch((e: any) => {
              Log.appendLine(
                "更新文件失败：" + filePath.replace(workPath + "/", "")
              );
            });
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
export function start() {
  Log.show();
  Log.appendLine("开始读取皮肤文件！");

  readSkinFiles()
    .then(parseExmlFiles)
    .then(() => {
      Log.appendLine("success!");
    })
    .catch((e: any) => {
      Log.appendLine("Fail" + e.message);
    })
    .then(() => {
      //清空
      name_id = {};
      id_name = {};
      existPaths = {};
    });
  // });
}
