import Vue, { VueConstructor, ComponentOptions } from 'vue';
import { Component } from 'vue/types/options';

interface ComponentOptionsComp<T extends Vue> extends ComponentOptions<T> {
    emits?: any[];
}
declare function Comp<V extends Vue>(comps?: Record<string, Component>, options?: ComponentOptionsComp<V>): (target: VueConstructor<V>) => any;

declare function Inject(provideName?: string): (this: any, target: Vue, key: string) => void;

declare function Model(): (target: Vue, key: string) => void;

declare function Prop(): (target: Vue, key: string) => void;

declare function Provide(): (this: any, target: Vue, key: string) => void;

interface WathOption {
    name?: string;
    deep?: boolean;
    immediate?: boolean;
    flush?: "pre" | "post" | "sync";
}
declare const DEEP = 1;
declare const IMMEDIATE = 2;
declare const SYNC = 4;
declare function Watch(option?: WathOption | number): (target: Vue, key: string, descriptor: any) => void;

declare function State(attrName?: string): (target: Vue, key: string) => void;

export { Comp, DEEP, IMMEDIATE, Inject, Model, Prop, Provide, SYNC, State, Watch };
