'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Vue = require('vue');
var Component = require('vue-class-component');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Vue__default = /*#__PURE__*/_interopDefaultLegacy(Vue);
var Component__default = /*#__PURE__*/_interopDefaultLegacy(Component);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var ComUtil = (function () {
    function ComUtil() {
    }
    ComUtil.formatProvideKey = function (key) {
        return this.providePrefix + key;
    };
    ComUtil.getOriginProvideKey = function (key) {
        if (key.indexOf(this.providePrefix) != 0) {
            return "";
        }
        return key.substr(this.providePrefix.length);
    };
    ComUtil.providePrefix = "_vd_";
    return ComUtil;
}());

var UserComponentProxyInitParam = (function () {
    function UserComponentProxyInitParam() {
        this.local = null;
        this.oldInit = null;
        this.options = null;
        this.arrOldDefine = [];
    }
    return UserComponentProxyInitParam;
}());
var propDefaultValueKey = "_vd_vmDefaultData";
function createInitUserComponentProxy(data) {
    return function _init() {
        data.local = this;
        var local = this;
        var options = data.options;
        var arrOldDefine = data.arrOldDefine;
        var oldInit = data.oldInit;
        var props = options.props || (options.props = {});
        var propsSelfExist = ("_self" in props);
        if (!propsSelfExist) {
            props["_self"] = {
                type: [Object, Array, String, Number, Boolean, Function],
                default: undefined,
            };
        }
        oldInit.apply(this, arguments);
        var vm = this._self;
        if (!propsSelfExist) {
            delete props["_self"];
        }
        function getCheckDefine(obj, key) {
            var def = Object.getOwnPropertyDescriptor(obj, key);
            if (!def || !def.get || !def.set || !def.configurable) {
                return null;
            }
            return def;
        }
        function vset(obj, key, val) {
            Vue__default['default']["set"] ? Vue__default['default']["set"](obj, key, val) : (obj[key] = val);
        }
        if (options.inject) {
            var objInject = options.inject;
            for (var key in objInject) {
                var orgKey = ComUtil.getOriginProvideKey(key);
                if (!orgKey) {
                    continue;
                }
                (function (keyTmp, orgKeyTmp) {
                    Object.defineProperty(local, orgKeyTmp, {
                        get: function get() {
                            try {
                                var md = vm[keyTmp];
                                return md && md.data;
                            }
                            catch (ex) { }
                        },
                        set: function set(val) {
                            try {
                                var md = vm[keyTmp];
                                if (md && md.type == "inject") {
                                    md.data = val;
                                }
                            }
                            catch (ex) { }
                        },
                        configurable: true,
                        enumerable: true,
                    });
                })(key, orgKey);
            }
        }
        var props = options.props || {};
        var objPropDefValueObj = vm[propDefaultValueKey] || (vm[propDefaultValueKey] = Vue__default['default'].observable({}));
        for (var key in props) {
            if (typeof (props[key]) != "object" || !("default" in props[key])) {
                continue;
            }
            vset(objPropDefValueObj, key, props[key].default);
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
                        }
                        else {
                            props[keyTmp].type = [Object, Array, String, Number, Boolean, Function];
                            props[keyTmp].default = function () { return value; };
                        }
                        vset(objPropDefValueObj, keyTmp, value);
                        if (vm.$options && vm.$options.propsData && (keyTmp in vm.$options.propsData)) {
                            return;
                        }
                        oldDefineTmp.set.call(this, value);
                    }
                });
            })(key, oldDefine);
        }
    };
}
function Comp(comps, options) {
    if (!options) {
        options = {};
    }
    options.components = comps;
    return function (target) {
        var UserComponent = target;
        options.name = options.name || UserComponent.name;
        var proto = UserComponent.prototype;
        proto.unmounted && (proto.destroyed = proto.unmounted);
        proto.beforeUnmount && (proto.beforeDestroy = proto.beforeUnmount);
        var UserComponentProxy = (function (_super) {
            __extends(UserComponentProxy, _super);
            function UserComponentProxy() {
                var _this = this;
                var param = new UserComponentProxyInitParam();
                param.options = options;
                param.oldInit = UserComponentProxy.prototype._init;
                UserComponentProxy.prototype._init = createInitUserComponentProxy(param);
                var defErr = console.error;
                console.error = function () { };
                _this = _super.call(this) || this;
                console.error = defErr;
                UserComponentProxy.prototype._init = param.oldInit;
                if (param.local) {
                    var arrOldDefine = param.arrOldDefine;
                    for (var i = 0; i < arrOldDefine.length; ++i) {
                        Object.defineProperty(param.local, arrOldDefine[i].key, arrOldDefine[i].obj);
                    }
                }
                return _this;
            }
            return UserComponentProxy;
        }(UserComponent));
        UserComponentProxy.prototype = UserComponent.prototype;
        UserComponentProxy._componentTag = UserComponent.name;
        function vset(obj, key, val) {
            Vue__default['default']["set"] ? Vue__default['default']["set"](obj, key, val) : (obj[key] = val);
        }
        Component.createDecorator(function (componentOptions, k) {
            function makeProvide(vm, key) {
                var orgKey = ComUtil.getOriginProvideKey(key);
                return {
                    get data() { return vm[orgKey]; },
                    set data(val) { vset(vm, orgKey, val); },
                    type: "provide"
                };
            }
            if (options.provide && typeof (options.provide) == "object") {
                var objProvide = options.provide;
                var map = {};
                options.provide = function () {
                    for (var key in objProvide) {
                        map[key] = makeProvide(this, key);
                    }
                    return map;
                };
                options.provide["originProvide"] = objProvide;
            }
        })(UserComponentProxy);
        var oldDecorators = UserComponentProxy.__decorators__;
        oldDecorators && (UserComponentProxy.__decorators__ = [function () {
                oldDecorators.forEach(function (fn) { return fn(options); });
                var optTmp = options;
                if (optTmp.unmounted) {
                    md.destroyed = md.unmounted;
                    delete optTmp.unmounted;
                }
                if (optTmp.beforeUnmount) {
                    md.beforeDestroy = md.beforeUnmount;
                    delete optTmp.beforeUnmount;
                }
                var mixins = options.mixins;
                if (mixins) {
                    for (var i = 0; i < mixins.length; ++i) {
                        if (typeof (mixins[i]) != "object") {
                            continue;
                        }
                        var md = mixins[i];
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
        var OriginVueComp = Component__default['default'](options)(UserComponentProxy);
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
                        set: function set(value) {
                            if (!this.$options || !this.$options.propsData || !(keyTmp in this.$options.propsData)) {
                                var obj = this[propDefaultValueKey] || (this[propDefaultValueKey] = Vue__default['default'].observable({}));
                                obj && vset(obj, keyTmp, value);
                                return;
                            }
                            this.$emit("update:" + keyTmp, value);
                        },
                        configurable: true,
                    });
                })(key, props[key]);
            }
        }
        if (options.inject) {
            var objInject = options.inject;
            for (var key in objInject) {
                (function (keyTmp) {
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

function Inject(provideName) {
    return function (target, key) {
        var nkeyProvide = ComUtil.formatProvideKey(provideName || key);
        var nkeyInject = ComUtil.formatProvideKey(key);
        return Component.createDecorator(function (componentOptions, k) {
            var options = {
                from: nkeyProvide,
                default: Vue__default['default'].observable({ data: undefined, type: "inject" }),
            };
            (componentOptions.inject || (componentOptions.inject = {}))[nkeyInject] = options;
        })(target, key);
    };
}

function Model() {
    return function (target, key) {
        var keyFun = "update:" + key;
        return Component.createDecorator(function (componentOptions, k) {
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
    };
}

function Prop() {
    return function (target, key) {
        return Component.createDecorator(function (componentOptions, k) {
            var options = {
                type: [Object, Array, String, Number, Boolean, Function],
                default: undefined
            };
            (componentOptions.props || (componentOptions.props = {}))[k] = options;
        })(target, key);
    };
}

function Provide() {
    return function (target, key) {
        var nkey = ComUtil.formatProvideKey(key);
        return Component.createDecorator(function (componentOptions, k) {
            var options = {
                type: [Object, Array, String, Number, Boolean, Function],
                default: Vue__default['default'].observable({ data: undefined, type: "provide" })
            };
            (componentOptions.provide || (componentOptions.provide = {}))[nkey] = options;
        })(target, key);
    };
}

var DEEP = 0x1;
var IMMEDIATE = 0x2;
function Watch(option) {
    return function (target, key, descriptor) {
        var name = "";
        if (typeof (option) == "object") {
            name = option.name || "";
        }
        if (name == "") {
            var suffix = "Changed";
            if (key.substr(key.length - suffix.length) != "Changed") {
                console.error("function name should be : attr + 'Changed'");
            }
            name = key.substr(0, key.length - suffix.length);
        }
        var tmp = {};
        if (typeof (option) == "object") {
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
        }
        else if (typeof (option) == "number") {
            if (option & DEEP) {
                tmp.deep = true;
            }
            if (option & IMMEDIATE) {
                tmp.immediate = true;
            }
        }
        tmp.handler = descriptor.value;
        return Component.createDecorator(function (componentOptions, k) {
            var objWatch = componentOptions.watch || (componentOptions.watch = {});
            var arr = [];
            if (name in objWatch) {
                if (objWatch[name] instanceof Array) {
                    arr = objWatch[name];
                }
                else {
                    arr.push(objWatch[name]);
                    objWatch[name] = arr;
                }
            }
            else {
                objWatch[name] = arr;
            }
            arr.push(tmp);
        })(target, key);
    };
}

function State(attrName) {
    function create(target, key) {
        var name = attrName || key;
        name = name.trim();
        var getVal = null;
        var setVal = null;
        var ch = ".";
        if (name.charAt(0) == "[") {
            ch = "";
        }
        getVal = eval("(function() { return this.$store.state" + ch + name + "; })");
        setVal = eval("(function(val) { this.$store.state" + ch + name + "=val; })");
        function initAttr(obj) {
            Object.defineProperty(obj, key, {
                enumerable: true,
                configurable: true,
                get: function () { return getVal.call(obj); },
                set: function (value) { setVal.call(obj, value); },
            });
        }
        Component.createDecorator(function (componentOptions, handler) {
            var mixins = componentOptions.mixins || (componentOptions.mixins = []);
            mixins.push({
                data: function () {
                    initAttr(this);
                    return {};
                }
            });
        })(target, key);
    }
    return create;
}

exports.Comp = Comp;
exports.DEEP = DEEP;
exports.IMMEDIATE = IMMEDIATE;
exports.Inject = Inject;
exports.Model = Model;
exports.Prop = Prop;
exports.Provide = Provide;
exports.State = State;
exports.Watch = Watch;
