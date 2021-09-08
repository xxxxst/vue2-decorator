
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) xxxxst. All rights reserved.
 *  Licensed under the MIT License
 *--------------------------------------------------------------------------------------------
*/

import Vue from 'vue';
import { createDecorator } from 'vue-class-component';

interface WathOption {
	name?: string;
	deep?: boolean;
	immediate?: boolean;
	/** unused in vue2 */
	flush?: "pre" | "post" | "sync";
}

export const DEEP = 0x1;
export const IMMEDIATE = 0x2;

// Function decorator
export default function Watch(option?: WathOption | number) {
	return (target: Vue, key: string, descriptor: any) => {
		// Wath attribute name
		var name = "";
		if (typeof (option) == "object") {
			name = option.name || "";
		}
		if (name == "") {
			const suffix = "Changed";
			if (key.substr(key.length - suffix.length) != "Changed") {
				console.error("function name should be : attr + 'Changed'");
			}
			name = key.substr(0, key.length - suffix.length);
		}

		// parse option
		var tmp: any = {};
		if (typeof (option) == "object") {
			// option is WathOption
			for (var key in option) {
				if (key == "name") {
					continue;
				}
				if (key == "flush") {
					if (option.flush == "sync") {
						tmp.sync = true;
					}
					continue;
				}
				tmp[key] = option[key];
			}
		} else if (typeof (option) == "number") {
			// option is number
			if (option & DEEP) {
				tmp.deep = true;
			}

			if (option & IMMEDIATE) {
				tmp.immediate = true;
			}
		}

		tmp.handler = descriptor.value;

		return createDecorator(function (componentOptions, k) {
			var objWatch: any = componentOptions.watch || (componentOptions.watch = {});
			var arr = [];
			if (name in objWatch) {
				if (objWatch[name] instanceof Array) {
					arr = objWatch[name];
				} else {
					arr.push(objWatch[name]);
					objWatch[name] = arr;
				}
			} else {
				objWatch[name] = arr;
			}
			arr.push(tmp);
			// (objWatch[name] || objWatch[name] = []).push(tmp);
			// objWatch[name] = tmp;
		})(target, key);
	}
}
