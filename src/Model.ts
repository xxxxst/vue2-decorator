
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) xxxxst. All rights reserved.
 *  Licensed under the MIT License
 *--------------------------------------------------------------------------------------------
*/

import Vue from 'vue';
import { createDecorator } from 'vue-class-component';

//attribute decorator
export default function Model() {
	return (target: Vue, key: string) => {
		var keyFun = "update:" + key;

		return createDecorator(function (componentOptions, k) {
			var options = {
				type: [Object, Array, String, Number, Boolean, Function],
				event: keyFun,
				default: undefined
			};

			(componentOptions.props || (componentOptions.props = {}))[k] = options;
			if (k == "modelValue" || !componentOptions.model) {
				componentOptions.model = { prop: k, event: keyFun };
			}
		})(target, key);
	}
}
