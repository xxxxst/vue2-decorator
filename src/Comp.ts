
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

		function vset(obj, key, val) {
			Vue["set"] ? Vue["set"](obj, key, val) : (obj[key] = val);
		}

		// inject
		if (options.inject) {
			var objInject = options.inject;
			for (var key in objInject) {
				var orgKey = ComUtil.getOriginProvideKey(key);
				if (!orgKey) {
					continue;
				}
				// vset(objPropDefValueObj, key, objInject[key].default);
				
				((keyTmp, orgKeyTmp) => {
					Object.defineProperty(local, orgKeyTmp, {
						get: function get() {
							try {
								var md = vm[keyTmp];
								return md && md.data;
							} catch (ex) { }
						},
						set: function set(val) {
							try {
								var md = vm[keyTmp];
								if (md && md.type == "inject") {
									md.data = val;
								}
							} catch (ex) { }
						},
						configurable: true,
						enumerable: true,
					});
				})(key, orgKey);
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
			vset(objPropDefValueObj, key, props[key].default);

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
						vset(objPropDefValueObj, keyTmp, value);
						// cancel set default value if data bound
						if (vm.$options && vm.$options.propsData && (keyTmp in vm.$options.propsData)) {
							return;
						}
						oldDefineTmp.set.call(this, value);
					}
				});
			})(key, oldDefine);
		}
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

		function vset(obj, key, val) {
			Vue["set"] ? Vue["set"](obj, key, val) : (obj[key] = val);
		}

		createDecorator(function (componentOptions, k) {
			// provide
			function makeProvide(vm, key) {
				var orgKey = ComUtil.getOriginProvideKey(key);
				return {
					get data() { return vm[orgKey] },
					set data(val) { vset(vm, orgKey, val); },
					type: "provide"
				};
			}
			if (options.provide && typeof (options.provide) == "object") {
				var objProvide = options.provide;
				var map = {};
				options.provide = function (this: any) {
					for (var key in objProvide) {
						map[key] = makeProvide(this, key);
					}
					return map;
				};
				options.provide["originProvide"] = objProvide;
			}
		})(UserComponentProxy as any);
		
		// decorate options
		var oldDecorators = UserComponentProxy.__decorators__;
		oldDecorators && (UserComponentProxy.__decorators__ = [function() {
			oldDecorators.forEach(fn => fn(options));
			
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
		}]);

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
								obj && vset(obj, keyTmp, value);
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

		// inject
		if (options.inject) {
			var objInject = options.inject;
			for (var key in objInject) {
				((keyTmp) => {
					var orgKey = ComUtil.getOriginProvideKey(key);
					Object.defineProperty(OriginVueComp.prototype, orgKey, {
						get: function get() {
							var md = this[keyTmp];
							return md && md.data;
						},
						set: function set(val) {
							var md = this[keyTmp];
							if (md) {
								md.data = val;
							}
						},
						configurable: true,
						enumerable: true,
					});
				})(key);
			}
		}

		return OriginVueComp;
	};
}
