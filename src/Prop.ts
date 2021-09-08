
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) xxxxst. All rights reserved.
 *  Licensed under the MIT License
 *--------------------------------------------------------------------------------------------
*/

import Vue from 'vue';
import { createDecorator } from 'vue-class-component';

//attribute decorator
export default function Prop() {
	return (target: Vue, key: string) => {

		return createDecorator(function (componentOptions, k) {
			var options = {
				type: [Object, Array, String, Number, Boolean, Function],
				default: undefined
			};

			(componentOptions.props || (componentOptions.props = {}))[k] = options;
		})(target, key);
	}
}