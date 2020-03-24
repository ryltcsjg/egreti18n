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