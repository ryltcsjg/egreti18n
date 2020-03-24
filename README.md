#EgretI18n  
皮肤文件中绑定数据的多语言支持

绑定数据格式需为： $i18n.\*

#命令：  
egreti18n save ： 保存exml.json文件中绑定数据$i18n.\* 至 resource/i18n/{language} 文件夹  
egreti18n use  ： 合并resource/i18n/{language}中的数据至 exml.json($i18n.\*) 并切换语言  
extension.EgretI18nExportChinese： 导出皮肤文件中的中文到exml.json文件  
#设置：  
EgretI18n.skinPath：  设置皮肤所在文件夹，默认值： resoruce/skins  
EgretI18n.exportTags： 皮肤文件中要导出中文的标签  
```
默认值 
[
   ["e:Label", "text"],
   ["e:Label", "text.up"],
   ["e:Label", "text.down"],
   ["e:Label", "text.disabled"],
   ["e:Label", "text.unOpen"],
   ["e:BitmapLabel", "text"],
   ["e:Button", "label"],
   ["e:EditableText", "prompt"],
   ["e:EditableText", "text"],
   ["e:TextInput", "prompt"]
 ]
```
#代码example  
```
eui.getTheme('resource/default.thm.json', (content: string) => {
  let data = JSON.parse(content);
  let ThemePath = {};
  data.exmls.forEach((path: string) => {
    let fileArr = path.split('/');
    let filename = fileArr[fileArr.length - 1].replace('.exml', '');
    i18n.setThemePath(filename,path);
  });
});
```
```
class I18n {
private static instance = null;
private themePath: { [x: string]: string } = {};
private language: string = 'zh';
private i18nComponents: { [x: number]: any } = {};
public init() {
  this.defineComponentSkinName();

  this.setLanguage('zh');
}

public setLanguage(lan: string) {
  let oldLanguage = this.language;
  this.language = lan;

  let promises: Promise<any>[] = [];
  for (let hashCode in this.i18nComponents) {
    let { component, resName } = this.i18nComponents[hashCode];
    resName = resName.replace(`_${oldLanguage}_json`, `_${lan}_json`);
    if (component && resName && RES.hasRes(resName)) {
      let data = RES.getRes(resName);
      if (data) {
        component['$i18n'] = data;
        this.i18nComponents[hashCode].resName = resName;
      } else {
        let _pormise = RES.getResAsync(resName)
          .then(data => {
            component['$i18n'] = data;
            this.i18nComponents[hashCode].resName = resName;
          })
          .catch(e => {});

        promises.push(_pormise);
      }
    }
  }
  //showloading
  Promise.all(promises).then(() => {
    //closeloading
  });
}

public getLanguage() {
  return this.language;
}

public setThemePath(fileName: string, path: string) {
  this.themePath[fileName] && console.warn('重名', path);
  this.themePath[fileName] = path;
}

private defineComponentSkinName() {
  const self = this;
  const originalSkinnameGet = Object.getOwnPropertyDescriptor(eui.Component.prototype, 'skinName').get;
  const originalSkinnameSet = Object.getOwnPropertyDescriptor(eui.Component.prototype, 'skinName').set;

  Object.defineProperty(eui.Component.prototype, 'skinName', {
    get: originalSkinnameGet,
    set: function(name) {
      originalSkinnameSet.call(this, name);
      let resName = '';
      if (typeof name === 'string') {
        if (name.indexOf('/') != -1) {
          resName = self.parseSkinName(name);
        } else {
          resName = egret.getImplementation('eui.Theme').getSkinName(this);
          if (resName) {
            resName = self.parseSkinName(resName);
          } else if (self.themePath[name]) {
            resName = self.parseSkinName(self.themePath[name]);
          } else {
            return;
          }
        }
        if (resName && RES.hasRes(resName)) {
          let data = RES.getRes(resName);
          if (data) {
            this['$i18n'] = data;
          } else {
            RES.getResAsync(resName)
              .then(data => {
                this['$i18n'] = data;
              })
              .catch(e => {});
          }
        }
      }
      let listener = self.i18nComponents[this.hashCode] && self.i18nComponents[this.hashCode].listener;
      if (!listener) {
        listener = (event: egret.Event) => {
          this.removeEventListener(egret.Event.REMOVED, listener, this);
          !self.i18nComponents[this.hashCode] && console.error('错误');
          delete self.i18nComponents[this.hashCode];
        };
        this.addEventListener(egret.Event.REMOVED, listener);
      }
      self.i18nComponents[this.hashCode] = {
        component: this,
        resName,
        listener,
      };
    },
  });
}

private parseSkinName(name): string {
  return (
    name
      .replace('resource/skins/', '')
      .replace(/\//g, '_')
      .replace('.exml', '') + `_${this.language}_json`
  );
}

public static getInstance() {
  return I18n.instance || (I18n.instance = new I18n());
}
}

export const i18n = I18n.getInstance();
```