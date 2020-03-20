const fs = require("fs");
const Path = require("path");

export function promisify(fn: Function): Function {
  return function(...args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      fn(...args, (err: any, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };
}

export const stat = promisify(fs.stat);
export const readdir = promisify(fs.readdir);
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);

export function isDir(filePath: string) {
  return stat(filePath)
    .then((stats: any) => stats.isDirectory())
    .catch(() => false);
}

export function findFile(filePath: string, regexp: RegExp): Promise<string[]> {
  return isDir(filePath).then((isDirectory: boolean) => {
    if (!isDirectory) {
      return [];
    }
    return readdir(filePath).then((files: string[]) => {
      let promises = [];
      let paths: string[] = [];
      for (let file of files) {
        const fullPath = Path.join(filePath, file);

        let _promise = isDir(fullPath).then((isDirectory: boolean) => {
          if (isDirectory) {
            return findFile(fullPath, regexp).then(result => {
              paths = paths.concat(result);
            });
          } else if (regexp.test(fullPath)) {
            paths.push(fullPath);
          }
        });
        promises.push(_promise);
      }
      return Promise.all(promises).then(() => paths);
    });
  });
}

function is(x: any, y: any) {
  // From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
  if (x === y) {
    return x !== 0 || 1 / x === 1 / y;
  } else {
    return x !== x && y !== y;
  }
}

export function shallowEqual(objA: any, objB: any) {
  //From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
  if (is(objA, objB)) return true;
  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      !is(objA[keysA[i]], objB[keysA[i]])
    ) {
      return false;
    }
  }
  return true;
}

export function coverData(arrA: Array<any>, arrB: Array<any>) {
  let da: { [x: string]: string } = {};
  let db: { [x: string]: string } = {};
  arrA && arrA.forEach(item => (da[item.key] = item.value));
  arrB && arrB.forEach(item => (db[item.key] = item.value));
  da = { ...da, ...db };
  let arr = [];
  for (let key in da) {
    arr.push({
      key,
      value: da[key]
    });
  }
  return arr;
}

export function formattime(time: number, formatstr = "yyyy-MM-dd-HH:mm:ss") {
  let date = new Date(time);
  return formatstr
    .replace(/yyyy/gi, date.getFullYear().toString())
    .replace(/MM/g, (date.getMonth() + 1).toString())
    .replace(/DD/gi, date.getDate().toString())
    .replace(/hh/gi, date.getHours().toString())
    .replace(/mm/g, date.getMinutes().toString())
    .replace(/ss/gi, date.getSeconds().toString());
}
