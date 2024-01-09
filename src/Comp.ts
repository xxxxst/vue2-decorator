
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

//class decorator
export default function Comp<V extends Vue>(comps?: Record<string, VueComponent>, options?: ComponentOptionsComp<V>) {
	const defaultValueKey = "_vd_vmDefaultData";

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
		
		// decorate options
		var oldDecorators = UserComponent.__decorators__;
		oldDecorators && (UserComponent.__decorators__ = [function() {
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

			// provide/inject实现双向通信
			// 原始属性名添加前缀"_vd_"作为实际的provide/inject
			// provide原始属性名改为data属性
			// inject原始属性名改为computed属性

			// provide
			var provide = options.provide;
			if (provide && typeof (provide) == "object") {
				options.provide = function (this: any) {
					var local = this;
					var rst = {};
					for (var key in provide) {
						(function (keyTmp) {
							var orgKey = ComUtil.getOriginProvideKey(keyTmp);
							rst[keyTmp] = {
								get data() { return local[orgKey] },
								set data(val) { ComUtil.vset(local, orgKey, val); },
								type: "provide"
							};
						})(key);
					}
					return rst;
				};
				options.provide["originProvide"] = provide;
			}

			// inject
			var inject = options.inject || {};
			for (var key in inject) {
				(function (keyTmp) {
					var orgKey = ComUtil.getOriginProvideKey(keyTmp);
					// 将初始化值传入vm，防止@Component() 将属性绑定为data
					Object.defineProperty(UserComponent.prototype, orgKey, {
						get(this: any) {
							var md = this[keyTmp];
							return md && md.data;
						},
						set(this: any, val) {
							var md = this[keyTmp];
							// 已经绑定provide，忽略初始化数据
							if (this._self && !this._self._data && md && md.type != "inject") {
								return;
							}
							md && (md.data = val);
						},
						configurable: true,
						enumerable: true,
					});
					// 将原始属性设置为computed
					(options.computed || (options.computed = {}))[orgKey] = {
						get(this: any) {
							var md = this[keyTmp];
							if (md && md.type != "inject") {
								return md.data;
							}
							var obj = this[defaultValueKey] || (this[defaultValueKey] = ComUtil.reactive({}));
							if (!(orgKey in obj)) {
								ComUtil.vset(obj, orgKey, md && md.data);
							}
							return obj[orgKey];
						},
						set(this: any, val) {
							var md = this[keyTmp];
							if (md && md.type != "inject") {
								md.data = val;
								return;
							}
							var obj = this[defaultValueKey] || (this[defaultValueKey] = ComUtil.reactive({}));
							ComUtil.vset(obj, orgKey, val);
						}
					};
				})(key);
			}
		}]);

		// VueComponent
		//   |- UserComponent
		//     |- Vue
		// 
		// VueComponent()							// Component
		//   |- _init<Vue.extend>					// vue
		//   |- mixins()							// vue
		//   |- new UserComponent()					// Comp
		//   |- Vue.constructor						// vue
		//   |- _init<Comp>							// Comp
		//   |- _init<Component>					// Component
		//   |- UserComponent.constructor			// <self projct>
		//  \|
		var OriginVueComp = Component(options)(UserComponent as any) as any;

		// prop
		var props = options.props || {};
		for (var key in props) {
			if (typeof (props[key]) != "object") {
				continue;
			}
			(function (keyTmp, valTmp) {
				var oldDefine = Object.getOwnPropertyDescriptor(OriginVueComp.prototype, keyTmp);
				oldDefine = oldDefine || { get() { return undefined; }, set(val) { } };
				Object.defineProperty(OriginVueComp.prototype, keyTmp, {
					get: function () {
						if (!this.$options || !this.$options.propsData || !(keyTmp in this.$options.propsData)) {
							var obj = this[defaultValueKey] || (this[defaultValueKey] = ComUtil.reactive({}));
							if (!(keyTmp in obj)) {
								ComUtil.vset(obj, keyTmp, valTmp && valTmp.default);
							}
							return obj[keyTmp];
						}
						return oldDefine.get.call(this);
					},
					set: function set(this: any, value) {
						if (!this.$options || !this.$options.propsData || !(keyTmp in this.$options.propsData)) {
							var obj = this[defaultValueKey] || (this[defaultValueKey] = ComUtil.reactive({}));
							obj && ComUtil.vset(obj, keyTmp, value);
							return;
						}
						// 已经绑定prop，忽略初始化数据
						if (!this._data) {
							return;
						}
						this.$emit("update:" + keyTmp, value);
						// console.info("set2", keyTmp, value);
					},
					configurable: true,
				});
			})(key, props[key]);
		}

		return OriginVueComp;
	};
}
