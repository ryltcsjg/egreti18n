import { findFile, readFile, writeFile, coverData, Log } from "./util";

const vscode = require("vscode");
const fs = require("fs");

const workPath = vscode.workspace.rootPath;

let skinPath = "";
let exmlPath = ".wing/exml.json";
const destCls2FilePath = "resource/i18n";

let output: { [x: string]: any } = {};
let id_name: { [x: string]: string } = {};
let class2filePath: { [x: string]: string } = {};
let existPaths: { [x: string]: boolean } = {};

//读取皮肤文件结束
function readSkinFiles() {
  return findFile(`${workPath}/${skinPath}`, /\.exml$/).then(
    (files: string[]) => {
      if (!files || files.length <= 0) {
        throw new Error(`${skinPath}中找不到.exml文件，请设置`);
      }
      let promises: Promise<any>[] = [];
      files.forEach((file) => {
        promises.push(operateExmlfile(file));
      });
      return Promise.all(promises).then(() => {
        console.log("读取皮肤文件结束！");
      });
    }
  );
}

function operateExmlfile(p: string): Promise<any> {
  return readFile(p, "utf-8")
    .then((originalData: any) => {
      let data = originalData;
      let idstr = data.match(/w:Config id="[0-9a-zA-Z]+"/);
      let id: any = "";
      if (!idstr || idstr.length <= 0) {
        id = (Date.now() - Math.round(Math.random() * 10000000)).toString(16);
        data = data.replace(/<\?xml .+\?>[\n]+<e:Skin [^>]+>/, (v: string) => {
          if (!/xmlns:w=".+"/.test(v)) {
            v =
              v.substr(0, v.length - 1) +
              ` xmlns:w="http://ns.egret.com/wing">`;
          }
          return `${v}
  <w:Config id="${id}"/>`;
        });
      } else {
        id = /"[0-9a-zA-Z]+"/.exec(idstr[0]);
        id = id && id[0].replace(/"/g, "");
      }

      if (id_name[id]) {
        while (id_name[id]) {
          id = (Date.now() - Math.round(Math.random() * 10000000)).toString(16);
        }
        data = data.replace(
          /w:Config id="[0-9a-zA-Z]+"/,
          `w:Config id="${id}"`
        );
        id_name[id] = p;
      }

      let marr = data.match(/<\?xml .+\?>[\n]+<e:Skin [^>]+>/);
      let clstr = marr && marr[0];
      //classname
      marr = clstr.match(/class="[^"]+"/);
      let clsname = marr && marr[0].replace(/^class="/, "").replace(/"$/, "");
      class2filePath[clsname] &&   Log.appendLine("重复的classname："+clsname);
      class2filePath[clsname] = p.replace(`${workPath}/`, "");

      vscode.workspace
        .getConfiguration()
        .get("EgretI18n.exportTags")
        .forEach(([tag, lab]: [string, string]) => {
          data = data.replace(
            eval(`/<${tag} ((?!>[ ]*\\n)[\\s\\S])*>/g`),
            (v: string) => {
              return v.replace(eval(`/${lab}="[^"]+"/`), (content: string) => {
                if (!/[\u4e00-\u9fa5]/.test(content)) {
                  return content;
                }
                if (eval(`/${lab}="{.*}"/`).test(content)) {
                  return content;
                } else {
                  let slashLen = content.match(/"/g);
                  slashLen && slashLen.length > 2 && console.warn(content, p);
                  /[{}]/.test(content) && console.warn(content, p);
                  eval(`/${lab}=""/`).test(content) && console.warn(content, p);

                  let value = content
                    .replace(eval(`/^${lab}="/`), "")
                    .replace(/"$/, "");
                  output[id] = output[id] || [];
                  let uid = "";
                  let id_index = 0;
                  let ms = v.match(eval(`/<${tag}/`));
                  let head = ms && ms[0];
                  while (true) {
                    uid = `${head &&
                      head.replace(/^<[a-zA-Z0-9]+:/, "")}_${id_index}`;
                    let isUnique = output[id].every(
                      (item: { key: string }) => item.key !== `$i18n.${uid}`
                    );
                    if (isUnique) {
                      break;
                    }
                    id_index++;
                  }
                  for (let i = 0; i < output[id].length; i++) {
                    if (output[id][i].value === value) {
                      return `${lab}="{${output[id][i].key}}"`;
                    }
                  }
                  output[id].push({
                    key: `$i18n.${uid}`,
                    value,
                  });
                  return `${lab}="{$i18n.${uid}}"`;
                }
              });
            }
          );
        });

      return [data, originalData];
    })
    .then(([changeData, originalData]: [string, string]) => {
      if (changeData !== originalData) {
        return writeFile(p, changeData);
      }
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
  paths.forEach((item) => {
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

export function exportChinese() {
  Log.show();

  output = {};
  class2filePath = {};
  existPaths = {};
  skinPath =
    vscode.workspace.getConfiguration().get("EgretI18n.skinPath") ||
    "resource/skins";
  Log.appendLine("EgretI18n.skinPath 皮肤文件路径：" + skinPath);

  Log.appendLine(
    "导出标签：" +
      JSON.stringify(
        vscode.workspace.getConfiguration().get("EgretI18n.exportTags")
      )
  );

  Log.appendLine("开始读取皮肤文件！");
  readSkinFiles()
    .then(() =>
      readFile(`${workPath}/${exmlPath}`, "utf-8").then((data: string) =>
        JSON.parse(data)
      )
    )
    .then((data) => {
      for (let key in output) {
        data[key] = data[key] || {};
        data[key]["bindingDataTestObj"] = coverData(
          data[key]["bindingDataTestObj"],
          output[key]
        );
      }
      return writeFile(`${workPath}/${exmlPath}`, JSON.stringify(data)).then(
        () => {
          Log.appendLine(`更新文件：${exmlPath}`);
        }
      );
    })
    .then(() => {
      checkFilePath(`${workPath}/${destCls2FilePath}`);
      return writeFile(
        `${workPath}/${destCls2FilePath}/class2filePath.json`,
        JSON.stringify(class2filePath)
      ).then(() => {
        Log.appendLine(`更新文件：${destCls2FilePath}`);
      });
    })
    .catch((e) => console.error("error:", e));
}
