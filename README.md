#EgretI18n  
皮肤文件中绑定数据的多语言支持

绑定数据格式需为： $i18n.\*

#命令：  
egreti18n save ： 保存exml.json文件中绑定数据$i18n.\* 至 resource/i18n/{language} 文件夹  
egreti18n use  ： 合并resource/i18n/{language}中的数据至 exml.json($i18n.\*) 并切换语言
  
#设置：  
EgretI18n.skinPath：  设置皮肤所在文件夹，默认 resoruce/skins  
  
  
#皮肤绑定数据  
```
let language = 'zh';
const originalSkinnameGet = Object.getOwnPropertyDescriptor(eui.Component.prototype, 'skinName').get;
const originalSkinnameSet = Object.getOwnPropertyDescriptor(eui.Component.prototype, 'skinName').set;
Object.defineProperty(eui.Component.prototype, 'skinName', {
  get: originalSkinnameGet,
  set: function(name) {
    originalSkinnameSet.call(this, name);
    if (typeof name === 'string') {
      let splitArr = name.split('/');
      let resName = splitArr[splitArr.length - 1].replace('.exml', '') + '_' + language + '_json';
      if (RES.hasRes(resName)) {
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
  },
});
```