
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) xxxxst. All rights reserved.
 *  Licensed under the MIT License
 *--------------------------------------------------------------------------------------------
*/

import Vue from 'vue';
import { createDecorator } from 'vue-class-component';
import ComUtil from 'src/ComUtil';

//attribute decorator
export default function Inject(provideName?: string) {
	return function(this: any, target: Vue, key: string) {
		var nkeyProvide = ComUtil.formatProvideKey(provideName || key);
		var nkeyInject = ComUtil.formatProvideKey(key);

		return createDecorator(function (componentOptions, k) {
			var options = {
				from: nkeyProvide,
				default: ComUtil.reactive({ data: undefined, type: "inject" }),
			};
			(componentOptions.inject || (componentOptions.inject = {}))[nkeyInject] = options;
		})(target, key);
	}
}
