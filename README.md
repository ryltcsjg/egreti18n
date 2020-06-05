#EgretI18n  

Example: https://github.com/ryltcsjg/egret-mobx  

npm i vsce -g  
vsce package 打包插件  

exml文件中绑定数据的多语言支持。  
1、通过绑定数据功能实现exml中的多语言支持，支持在wing编辑器中预览各语言效果。  
2、对已完成项目友好，按一下步骤操作即可导出exml文件中的中文。  
EgretI18n ExportChinese(导出中文)==>egreti18n save（保存导出的数据至 resource/i18n/{language}.json，翻译时用此文件即可）  
3、运行时实时切换语言  

绑定数据格式为： $i18n.\*

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

#原理：  
重写eui.component skinName属性的set方法，在set skinName之后设置绑定数据的值，具体可参考[example](https://github.com/ryltcsjg/egret-mobx)中代码  

核心代码如下：

```
class I18n {
		private static instance = null;
		private class2filePath: { [x: string]: string } = {};
		private language: string = 'zh';
		private i18nComponents: any = {};
		private content: any = {};
		public init() {
			this.defineComponentSkinName();
		}

		public setLanguage(lan: string) {
			console.log('setlanguage', lan);
			this.language = lan;

			return Promise.resolve()
				.then(() => {
					if (!RES.isGroupLoaded(`i18n_class2filePath`)) {
						return RES.loadGroup(`i18n_class2filePath`);
					}
				})
				.then(() => {
                    //exml类对应文件路径（{lan}.json文件中保存的key值）
					this.class2filePath = RES.getRes(`class2filePath_json`);
				})
				.then(() => {
					if (!RES.isGroupLoaded(`i18n_${lan}`)) {
						return RES.loadGroup(`i18n_${lan}`);
					}
				})
				.then(() => {
                    //多语言文本内容
					this.content[lan] = RES.getRes(`${lan}_json`);
				})
				.then(() => {
					if (!this.content[lan]) {
						return;
					}
					for (let hashCode in this.i18nComponents) {
						let { component, resName } = this.i18nComponents[hashCode];
						if (component && resName && this.content[lan][resName]) {
							component['$i18n'] = { ...i18n.content[i18n.language][resName] };
						}
					}
				});
		}

		private defineComponentSkinName() {
			const i18n = this;

			let skinSet = function(name) {
				try {
					let resName = '';
					name = (typeof name != 'string' && name && name.name) || name;
					if (name && typeof name === 'string') {
						if (name.indexOf('/') != -1) {
							resName = i18n.parseSkinName(name);
						} else {
							let tempName = name.replace(/(\$Skin[0-9]+)+/, '');
							resName =
								i18n.class2filePath[tempName] && i18n.parseSkinName(i18n.class2filePath[tempName]);
						}
						if (resName && i18n.content && i18n.content[i18n.language]) {
							this['$i18n'] = { ...i18n.content[i18n.language][resName] };
						} else {
							return;
						}
					}
					if (!i18n.i18nComponents[this.hashCode]) {
						let listener = (event: egret.Event) => {
							if (event.target != this) {
								return;
							}
							this.removeEventListener(egret.Event.REMOVED, listener);
							this.removeEventListener(egret.Event.REMOVED_FROM_STAGE, listener);
							!i18n.i18nComponents[this.hashCode] &&
								console.error(name, Object.keys(i18n.i18nComponents).length);
							delete i18n.i18nComponents[this.hashCode];
						};
						this.addEventListener(egret.Event.REMOVED, listener);
						this.addEventListener(egret.Event.REMOVED_FROM_STAGE, listener);

						i18n.i18nComponents[this.hashCode] = {
							component: this,
							resName
						};
					}
				} catch (e) {
					console.error('set error', name, e);
				}
			};

			this.patch(eui.Component, 'skinName', {
				set: skinSet
			});
		}

		private parseSkinName(name): string {
			/(\$Skin[0-9]+)+/.test(name) && console.log(name);
			return name.replace('resource/skins/', '').replace(/\//g, '_').replace('.exml', '');
		}

		public static getInstance() {
			return I18n.instance || (I18n.instance = new I18n());
		}
		patch(Cls, prop: string, patched: any) {
			if (!Cls || !Cls.prototype) {
				return;
			}
			let target = Cls;

			while (!(Cls.prototype['__$patch__'] && Cls.prototype['__$patch__'][prop])) {
				if (!target || !target.prototype) {
					break;
				}
				if (Object.getOwnPropertyDescriptor(target.prototype, prop)) {
					const originalGet = Object.getOwnPropertyDescriptor(target.prototype, prop).get;
					const originalSet = Object.getOwnPropertyDescriptor(target.prototype, prop).set;
					target.prototype['__$patch__'] = target.prototype['__$patch__'] || {};
					target.prototype['__$patch__'][prop] = true;
					Object.defineProperty(target.prototype, prop, {
						get: function() {
							patched.get && patched.get.call(this);
							return originalGet.call(this);
						},
						set: function(v) {
							originalSet.call(this, v);
							patched.set && patched.set.call(this, v);
						}
					});

					break;
				}
				target = target.prototype.__proto__ && target.prototype.__proto__.constructor;
			}
		}
	}
	export const i18n: I18n = I18n.getInstance();
```