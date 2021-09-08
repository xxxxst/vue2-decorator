# vue2-decorator

more simple typescript decorator for vue2

[https://github.com/xxxxst/vue2-decorator](https://github.com/xxxxst/vue2-decorator)

# install
Using npm:

```
npm install @xxxxst/vue2-decorator
```

or using yarn:

```
yarn add @xxxxst/vue2-decorator
```

# Useage

```ts
var store = new Vuex.Store({
    state: {
        stateVal: "state attribute"
        rootAttr: {
            childAttr: "state child atribute",
        }
    },
})

// @Comp(mapChildComp?: Record<string, Component>, options?: ComponentOptions)
@Comp({}, { template: '<div>{{propVal}}</div>' })
class ChildComponent extends Vue {
	@State() stateVal: string;
    @State("rootAttr.childAttr") childAttr: string;
    @State(`["rootAttr"].childAttr`) childAttr2: string;

    // Prop type is any : [Object, Array, String, Number, Boolean, Function]
    @Prop() propVal = "prop attribute, I'm default value";
    // attr name of 'modelValue' is default model
    // orther model will be prop, use 'sync' to bind
	@Model() modelValue = "default model attribute";
    @Model() modelAaa = "model attribute named with 'modelAaa'";
    
    @Inject() provideVal;

    // use simple options
    // default wathch attr name is attrName + 'Changed'
    // DEEP mean '{deep:true}', IMMEDIATE mean '{immediate:true}'
    @Watch(DEEP|IMMEDIATE)
    stateValChanged() {
        console.info("stateValChanged", this.stateVal);
    }

    @Watch({name:'childAttr', deep:true, immediate: true, flush: "sync"})
    childAttrChanged() {
        console.info("childAttrChanged", this.childAttr);
    }
    
    mounted() {
        this.stateVal = "update state value";
        this.modelValue = "update model value";
    }
}

@Comp({ ChildComponent, { template: '<ChildComponent :propVal="aaa" v-model="bbb" :modelAaa.sync="ccc"/>'} })
class ParentComponent {
    aaa = "";
    bbb = "";
    ccc = "";
    
	@Provide() provideVal = "provide attribute";
}
```

# Build

```
npm run build
```

# License

MIT

[LICENSE](./LICENSE)
