
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) xxxxst. All rights reserved.
 *  Licensed under the MIT License
 *--------------------------------------------------------------------------------------------
*/

import Vue from 'vue';
import { createDecorator } from 'vue-class-component';
import ComUtil from 'src/ComUtil';

//attribute decorator
export default function Provide() {
	return function(this: any, target: Vue, key: string) {
		var nkey = ComUtil.formatProvideKey(key);
		return createDecorator(function (componentOptions, k) {
			var options = {
				type: [Object, Array, String, Number, Boolean, Function],
				default: Vue.observable({ data: undefined, type: "provide" })
			};
			(componentOptions.provide || (componentOptions.provide = {}))[nkey] = options;
		})(target, key);
	}
}
