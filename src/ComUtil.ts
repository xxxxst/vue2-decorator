
import Vue from 'vue';

export default class ComUtil {
	static providePrefix = "_vd_";
	static formatProvideKey(key: string) {
		return this.providePrefix + key;
	}
	static getOriginProvideKey(key: string) {
		if (key.indexOf(this.providePrefix) != 0) {
			return "";
		}
		return key.substr(this.providePrefix.length);
	}

	static registProvideAttrToUserComp(local, vm, orgKey) {
		// var orgKey = ComUtil.getOriginProvideKey(key);
		// if (!orgKey) {
		// 	return;
		// }

		Object.defineProperty(local, orgKey, {
			get: function get() {
				return vm[orgKey];
			},
			set: function set(value) {
				vm[orgKey] = value;
			},
			configurable: true
		});
	}

	static registProvideAttrToVueComp(proto, key, option) {
		if (!option || !option.default || typeof (option.default) != "object") {
			return;
		}
		var orgKey = ComUtil.getOriginProvideKey(key);
		if (!orgKey) {
			return;
		}
		Object.defineProperty(proto, orgKey, {
			get: function get() {
				var md = (key in this) ? this[key] : option.default;
				return md.data;
			},
			set: function set(val) {
				var md = (key in this) ? this[key] : option.default;
				md.data = val;
			},
			configurable: true,
			enumerable: true,
		});
	}
}