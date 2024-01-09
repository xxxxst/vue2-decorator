import Component, { createDecorator } from 'vue-class-component';
import Vue from 'vue';

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
    ComUtil.vset = function (obj, key, val) {
        return Vue.set ? Vue.set(obj, key, val) : (obj[key] = val);
    };
    ComUtil.reactive = function (obj) {
        return Vue.reactive ? Vue.reactive(obj) : Vue.observable(obj);
    };
    ComUtil.providePrefix = "_vd_";
    return ComUtil;
}());

function Comp(comps, options) {
    var defaultValueKey = "_vd_vmDefaultData";
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
        var oldDecorators = UserComponent.__decorators__;
        oldDecorators && (UserComponent.__decorators__ = [function () {
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
                var provide = options.provide;
                if (provide && typeof (provide) == "object") {
                    options.provide = function () {
                        var local = this;
                        var rst = {};
                        for (var key in provide) {
                            (function (keyTmp) {
                                var orgKey = ComUtil.getOriginProvideKey(keyTmp);
                                rst[keyTmp] = {
                                    get data() { return local[orgKey]; },
                                    set data(val) { ComUtil.vset(local, orgKey, val); },
                                    type: "provide"
                                };
                            })(key);
                        }
                        return rst;
                    };
                    options.provide["originProvide"] = provide;
                }
                var inject = options.inject || {};
                for (var key in inject) {
                    (function (keyTmp) {
                        var orgKey = ComUtil.getOriginProvideKey(keyTmp);
                        Object.defineProperty(UserComponent.prototype, orgKey, {
                            get: function () {
                                var md = this[keyTmp];
                                return md && md.data;
                            },
                            set: function (val) {
                                var md = this[keyTmp];
                                if (this._self && !this._self._data && md && md.type != "inject") {
                                    return;
                                }
                                md && (md.data = val);
                            },
                            configurable: true,
                            enumerable: true,
                        });
                        (options.computed || (options.computed = {}))[orgKey] = {
                            get: function () {
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
                            set: function (val) {
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
        var OriginVueComp = Component(options)(UserComponent);
        var props = options.props || {};
        for (var key in props) {
            if (typeof (props[key]) != "object") {
                continue;
            }
            (function (keyTmp, valTmp) {
                var oldDefine = Object.getOwnPropertyDescriptor(OriginVueComp.prototype, keyTmp);
                oldDefine = oldDefine || { get: function () { return undefined; }, set: function (val) { } };
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
                    set: function set(value) {
                        if (!this.$options || !this.$options.propsData || !(keyTmp in this.$options.propsData)) {
                            var obj = this[defaultValueKey] || (this[defaultValueKey] = ComUtil.reactive({}));
                            obj && ComUtil.vset(obj, keyTmp, value);
                            return;
                        }
                        if (!this._data) {
                            return;
                        }
                        this.$emit("update:" + keyTmp, value);
                    },
                    configurable: true,
                });
            })(key, props[key]);
        }
        return OriginVueComp;
    };
}

function Inject(provideName) {
    return function (target, key) {
        var nkeyProvide = ComUtil.formatProvideKey(provideName || key);
        var nkeyInject = ComUtil.formatProvideKey(key);
        return createDecorator(function (componentOptions, k) {
            var options = {
                from: nkeyProvide,
                default: ComUtil.reactive({ data: undefined, type: "inject" }),
            };
            (componentOptions.inject || (componentOptions.inject = {}))[nkeyInject] = options;
        })(target, key);
    };
}

function Model() {
    return function (target, key) {
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
    };
}

function Prop() {
    return function (target, key) {
        return createDecorator(function (componentOptions, k) {
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
        return createDecorator(function (componentOptions, k) {
            var options = {
                type: [Object, Array, String, Number, Boolean, Function],
                default: ComUtil.reactive({ data: undefined, type: "provide" })
            };
            (componentOptions.provide || (componentOptions.provide = {}))[nkey] = options;
        })(target, key);
    };
}

var DEEP = 0x1;
var IMMEDIATE = 0x2;
var SYNC = 0x4;
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
            if (option & SYNC) {
                tmp.sync = true;
            }
        }
        tmp.handler = descriptor.value;
        return createDecorator(function (componentOptions, k) {
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
        var ch = ".";
        if (name.charAt(0) == "[") {
            ch = "";
        }
        var getVal = eval("(function() { return this.$store.state" + ch + name + "; })");
        var setVal = eval("(function(val) { this.$store.state" + ch + name + "=val; })");
        createDecorator(function (componentOptions, handler) {
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

export { Comp, DEEP, IMMEDIATE, Inject, Model, Prop, Provide, SYNC, State, Watch };
//# sourceMappingURL=vue2-decorator.esm.js.map
