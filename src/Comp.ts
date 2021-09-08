
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) xxxxst. All rights reserved.
 *  Licensed under the MIT License
 *--------------------------------------------------------------------------------------------
*/

import Vue, { ComponentOptions, VueConstructor } from 'vue';
import type { Component as VueComponent, AsyncComponent } from 'vue/types/options';
import Component, { createDecorator } from 'vue-class-component';
import ComUtil from 'src/ComUtil';

interface ComponentOptionsComp<T extends Vue> extends ComponentOptions<T> {
	/** unused in vue2 */
	emits?: any[];
}

class UserComponentProxyInitParam {
	local: any = null;
	oldInit: Function = null;
	options: ComponentOptionsComp<Vue> = null;
	arrOldDefine: { key: string, obj: any }[] = [];
}

const propDefaultValueKey = "_vd_vmDefaultData";

function createInitUserComponentProxy(data: UserComponentProxyInitParam) {
	return function _init(this: any) {
		data.local = this;
		var local = this;
		var options = data.options;
		var arrOldDefine = data.arrOldDefine;
		var oldInit = data.oldInit;

		// add prop "_self"
		var props = options.props || (options.props = {});
		var propsSelfExist = ("_self" in props);
		if (!propsSelfExist) {
			props["_self"] = {
				type: [Object, Array, String, Number, Boolean, Function],
				default: undefined,
			};
		}

		// call oldInit
		oldInit.apply(this, arguments);

		var vm = this._self;
		if (!propsSelfExist) {
			delete props["_self"];
		}
		// var arrProxyKeys = [];

		function getCheckDefine(obj, key) {
			var def = Object.getOwnPropertyDescriptor(obj, key);
			if (!def || !def.get || !def.set || !def.configurable) {
				return null;
			}
			return def;
		}

		// provide
		if (options.provide && typeof (options.provide) == "function" && options.provide["originProvide"]) {
			var objProvide = options.provide["originProvide"];
			// proxy orgKey get/set
			for (var key in objProvide) {
				if (typeof (objProvide[key]) != "object" || !objProvide[key].default) {
					continue;
				}
				var orgKey = ComUtil.getOriginProvideKey(key);
				if (!orgKey) {
					continue;
				}
				// arrProxyKeys.push({ key: orgKey, type: "provide" });
				ComUtil.registProvideAttrToUserComp(local, vm, orgKey);
			}
		}

		// inject
		if (options.inject) {
			var objInject = options.inject;
			for (var key in objInject) {
				var orgKey = ComUtil.getOriginProvideKey(key);
				if (!orgKey) {
					continue;
				}
				// arrProxyKeys.push({ key: orgKey, type: "inject" });
				ComUtil.registProvideAttrToUserComp(local, vm, orgKey);

				var oldDefine = getCheckDefine(local, orgKey);
				if (!oldDefine) {
					continue;
				}
				arrOldDefine.push({ key: orgKey, obj: oldDefine, });
				(function (nkeyTmp, keyTmp, oldDefineTmp) {
					Object.defineProperty(local, keyTmp, {
						get: oldDefineTmp.get,
						set: function (value) {
							if (!vm[nkeyTmp] || typeof (vm[nkeyTmp]) != "object" || vm[nkeyTmp].type != "inject") {
								return;
							}
							oldDefineTmp.set.call(this, value);
						}
					});
				})(key, orgKey, oldDefine);
			}
		}

		// props
		var props = options.props || {};
		// var vmProto = Object.getPrototypeOf(vm);
		var objPropDefValueObj = vm[propDefaultValueKey] || (vm[propDefaultValueKey] = Vue.observable({}));
		for (var key in props) {
			if (typeof (props[key]) != "object" || !("default" in props[key])) {
				continue;
			}
			Vue.set(objPropDefValueObj, key, props[key].default);

			// arrProxyKeys.push({
			// 	key: key,
			// 	type: "prop",
			// 	handler: function (obj, defVal) {
			// 		props[obj.key].default = defVal;
			// 	}
			// });

			// 在set选择器中判断该属性是否存在默认值
			// 如果存在，说明该属性已经跟其他值绑定，拒绝初始化赋值
			// 如果不存在，则赋予初始值，作为默认值
			var oldDefine = getCheckDefine(local, key);
			if (!oldDefine) {
				continue;
			}
			arrOldDefine.push({ key: key, obj: oldDefine, });
			(function (keyTmp, oldDefineTmp) {
				Object.defineProperty(local, keyTmp, {
					get: oldDefineTmp.get,
					set: function (value) {
						if (typeof (value) == "function") {
							props[keyTmp].type = [Function, Object, Array, String, Number, Boolean];
							props[keyTmp].default = value;
						} else {
							props[keyTmp].type = [Object, Array, String, Number, Boolean, Function];
							props[keyTmp].default = () => value;
						}
						// props[keyTmp].default = value;
						Vue.set(objPropDefValueObj, keyTmp, value);
						// console.info("set1", vm.$options && vm.$options.propsData && (obj.key in vm.$options.propsData));
						// cancel set default value if data bound
						if (vm.$options && vm.$options.propsData && (keyTmp in vm.$options.propsData)) {
							return;
						}
						oldDefineTmp.set.call(this, value);
					}
				});
			})(key, oldDefine);
		}

		// proxy props/provide/inject
		// for (var i = 0; i < arrProxyKeys.length; ++i) {
		// 	var attrName = arrProxyKeys[i].key;
		// 	var oldDefine = Object.getOwnPropertyDescriptor(local, attrName);
		// 	if (!oldDefine || !oldDefine.get || !oldDefine.set || !oldDefine.configurable) {
		// 		continue;
		// 	}
		// 	arrOldDefine.push({
		// 		key: attrName,
		// 		obj: oldDefine,
		// 	});
		// 	// console.info("aaa", attrName, oldDefine);
		// 	(function (obj, oldDefineTmp) {
		// 		Object.defineProperty(local, obj.key, {
		// 			get: oldDefineTmp.get,
		// 			set: function (value) {
		// 				switch (obj.type) {
		// 					case "prop": {
		// 						props[obj.key].default = value;
		// 						Vue.set(objPropDefValueObj, obj.key, value);
		// 						// console.info("set1", vm.$options && vm.$options.propsData && (obj.key in vm.$options.propsData));
		// 						// cancel set default value if data bound
		// 						if (vm.$options && vm.$options.propsData && (obj.key in vm.$options.propsData)) {
		// 							return;
		// 						}
		// 						break;
		// 					}
		// 					// case "provide": {
		// 					// 	break;
		// 					// }
		// 					case "inject": {
		// 						var nkey = ComUtil.formatProvideKey(obj.key);
		// 						// console.info("set2", nkey, vm[obj.key], vm[nkey], vm);
		// 						if (!vm[nkey] || typeof (vm[nkey]) != "object" || vm[nkey].type != obj.type) {
		// 							return;
		// 						}
		// 						break;
		// 					}
		// 					default: {
		// 						break;
		// 					}
		// 				}
		// 				oldDefineTmp.set.call(this, value);
		// 			},
		// 			configurable: true,
		// 		});
		// 	})(arrProxyKeys[i], oldDefine);
		// }
	}
}


//class decorator
export default function Comp<V extends Vue>(comps?: Record<string, VueComponent>, options?: ComponentOptionsComp<V>) {
	if (!options) {
		options = {};
	}
	options.components = comps;

	return function (target: VueConstructor<V>) {
		var UserComponent = target as any;

		options.name = options.name || UserComponent.name;

		var proto = UserComponent.prototype;
		proto.unmounted && (proto.destroyed = proto.unmounted);
		proto.beforeUnmount && (proto.beforeDestroy = proto.beforeUnmount);

		class UserComponentProxy extends UserComponent {
			// @ts-ignore
			constructor() {
				var param = new UserComponentProxyInitParam();
				param.options = options;
				param.oldInit = UserComponentProxy.prototype._init;
				UserComponentProxy.prototype._init = createInitUserComponentProxy(param);

				// proxy console.error
				var defErr = console.error;
				console.error = function () { };

				super();

				console.error = defErr;
				UserComponentProxy.prototype._init = param.oldInit;

				// reset proxy
				if (param.local) {
					var arrOldDefine = param.arrOldDefine;
					for (var i = 0; i < arrOldDefine.length; ++i) {
						Object.defineProperty(param.local, arrOldDefine[i].key, arrOldDefine[i].obj);
					}
				}
			}
		}
		UserComponentProxy.prototype = UserComponent.prototype;
		UserComponentProxy._componentTag = UserComponent.name;

		createDecorator(function (componentOptions, k) {
			// provide
			if (options.provide && typeof (options.provide) == "object") {
				var objProvide = options.provide;
				options.provide = function (this: any) {
					var map = {};
					for (var key in objProvide) {
						map[key] = objProvide[key].default;
					}
					return map;
				}
				options.provide["originProvide"] = objProvide;
			}
		})(UserComponentProxy as any);

		var OriginVueComp = Component(options)(UserComponentProxy as any) as any;

		// prop
		var props = options.props;
		if (props) {
			for (var key in props) {
				if (typeof (props[key]) != "object") {
					continue;
				}
				(function (keyTmp, propTmp) {
					var oldDefine = Object.getOwnPropertyDescriptor(OriginVueComp.prototype, keyTmp);
					if (!oldDefine) {
						return;
					}
					Object.defineProperty(OriginVueComp.prototype, keyTmp, {
						get: function () {
							var rst = oldDefine.get.call(this);
							var obj = this[propDefaultValueKey];
							if (!this.$options || !this.$options.propsData || !(keyTmp in this.$options.propsData)) {
								return obj ? obj[keyTmp] : undefined;
							}
							return rst;
						},
						set: function set(this: any, value) {
							if (!this.$options || !this.$options.propsData || !(keyTmp in this.$options.propsData)) {
								var obj = this[propDefaultValueKey] || (this[propDefaultValueKey] = Vue.observable({}));
								obj && Vue.set(obj, keyTmp, value);
								return;
							}
							this.$emit("update:" + keyTmp, value);
							// console.info("set2", keyTmp, value);
						},
						configurable: true,
					});
				})(key, props[key]);
			}
		}

		// provide
		if (options.provide && typeof (options.provide) == "function" && options.provide["originProvide"]) {
			var objProvide = options.provide["originProvide"];
			// proxy orgKey get/set
			for (var key in objProvide) {
				ComUtil.registProvideAttrToVueComp(OriginVueComp.prototype, key, objProvide[key]);
			}
		}

		// inject
		if (options.inject) {
			var objInject = options.inject;
			for (var key in objInject) {
				ComUtil.registProvideAttrToVueComp(OriginVueComp.prototype, key, objInject[key]);
			}
		}

		// unmounted / beforeUnmount
		var optTmp = options as any;
		if (optTmp.unmounted) {
			md.destroyed = md.unmounted;
			delete optTmp.unmounted;
		}
		if (optTmp.beforeUnmount) {
			md.beforeDestroy = md.beforeUnmount;
			delete optTmp.beforeUnmount;
		}

		// mixins
		var mixins = options.mixins;
		if (mixins) {
			for (var i = 0; i < mixins.length; ++i) {
				if (typeof (mixins[i]) != "object") {
					continue;
				}
				var md = mixins[i] as ComponentOptions<Vue> as any;
				if (md.unmounted) {
					md.destroyed = md.unmounted;
					delete md.unmounted;
				}
				if (md.beforeUnmount) {
					md.beforeDestroy = md.beforeUnmount;
					delete md.beforeUnmount;
				}
			}
		}

		return OriginVueComp;
	};
}
