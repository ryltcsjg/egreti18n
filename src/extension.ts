// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
// import * as Exml2Json from "./exml2json";
// import * as Json2Exml from "./json2exml";

import { save } from "./save";
import { useLan } from "./useLan";
import { exportChinese } from "./exportChinese";

export function activate(context: vscode.ExtensionContext) {
  console.log("egreti18n start");
  // let disposable = vscode.commands.registerCommand(
  //   "extension.egreti18nexml2json",
  //   () => {
  //     vscode.window.showInformationMessage("egret i18n exml2json");
  //     Exml2Json.start();
  //   }
  // );
  // context.subscriptions.push(disposable);
  // disposable = vscode.commands.registerCommand(
  //   "extension.egreti18njson2exml",
  //   () => {
  //     vscode.window.showInformationMessage("egret i18n json2exml");
  //     Json2Exml.start();
  //   }
  // );
  // context.subscriptions.push(disposable);
  //保存exml数据至json
  let disposable = vscode.commands.registerCommand(
    "extension.EgretI18nSave",
    () => {
      vscode.window.showInputBox().then(lan => {
        if (!lan) {
          vscode.window.showInformationMessage("请输入要保存至的语言类型");
          return;
        }
        vscode.window.showInformationMessage("保存文件至resource/i18n，覆盖");
        save(lan);
      });
    }
  );
  context.subscriptions.push(disposable);
  //使用语言
  disposable = vscode.commands.registerCommand("extension.EgretI18nUse", () => {
    vscode.window.showInputBox().then(lan => {
      if (!lan) {
        vscode.window.showInformationMessage("请输入要切换的语言类型");
        return;
      }
      vscode.window.showInformationMessage("切换语言，合并至.wing/exmljson");
      useLan(lan).then(() => {
        vscode.window.showInformationMessage("切换语言成功，重载wing后生效");

        // setTimeout(
        //   () => vscode.commands.executeCommand("workbench.action.reloadWindow"),
        //   1000
        // );
      });
    });
  });
  //导出皮肤中的中文标签
  disposable = vscode.commands.registerCommand(
    "extension.EgretI18nExportChinese",
    () => {
      exportChinese();
    }
  );
  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
