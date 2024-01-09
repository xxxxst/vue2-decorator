
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
	static vset(obj, key, val) {
		return (Vue as any).set ? (Vue as any).set(obj, key, val) : (obj[key] = val);
	}
	static reactive(obj) {
		return (Vue as any).reactive ? (Vue as any).reactive(obj) : (Vue as any).observable(obj);
	}
}