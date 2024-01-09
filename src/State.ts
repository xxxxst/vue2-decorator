
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) xxxxst. All rights reserved.
 *  Licensed under the MIT License
 *--------------------------------------------------------------------------------------------
*/

import Vue from 'vue';
import { createDecorator } from 'vue-class-component';

//attribute decorator
export default function State(attrName?: string) {
	function create(target: Vue, key: string) {
		var name: string = attrName || key;
		name = name.trim();

		var ch = ".";
		if (name.charAt(0) == "[") {
			ch = "";
		}
		
		/* eslint-disable */
		var getVal = eval(`(function() { return this.$store.state${ch}${name}; })`);
		var setVal = eval(`(function(val) { this.$store.state${ch}${name}=val; })`);
		/* eslint-disable */

		createDecorator((componentOptions, handler) => {
			var mixins = componentOptions.mixins || (componentOptions.mixins = []);

			mixins.push({
				data: function () {
					Object.defineProperty(this, key, {
						enumerable: true,
						configurable: true,
						get: getVal,
						set: setVal,
					});
					return {};
				}
			});
		})(target, key);
	}

	return create;
}
