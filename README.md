#EgretI18n  

Example: https://github.com/ryltcsjg/egret-mobx  

npm i vsce -g  
vsce package 打包插件  

皮肤文件中绑定数据的多语言支持

绑定数据格式需为： $i18n.\*

#命令：  
EgretI18n ExportChinese： 1、导出皮肤文件中的中文到exml.json文件；2、导出皮肤类名对应的文件地址  
egreti18n save ： 保存exml.json文件中绑定数据$i18n.\* 至 resource/i18n/{language}.json 文件  
egreti18n use  ： 合并resource/i18n/{language}中的数据至 exml.json($i18n.\*) 切换exml预览语言  
#设置（settings.json）：  
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