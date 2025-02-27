import {useState} from "react";
import {flattenObject, unflattenObject} from "./flatten";

export function useForm(parameters : IFormParameters) : IForm
{
    const [values, setValues] = useState<{[key: string]:any}>((parameters.initialValues&&flattenObject(parameters.initialValues)) || {});

    const [errors, setErrors] = useState<{[key: string]:string|null}>({});

    function transformArrayPattern(key: string):string {
        return key.replace(/\[\d+\]/, "[i]");
    }
    function getFieldArray(name: string): string[] {
        const matchingKeys = Object.keys(values)
            .filter(key => transformArrayPattern(key) === name);

        return matchingKeys.length > 0 ? matchingKeys : [name];
    }

    const toPromise = (fn: ValidationFunction): ValidationFunction => {
        return (value: any, other: object) => {
            const result = fn(value, other);
            if (result instanceof Promise) {
                return result;
            }
            return Promise.resolve(result);
        };
    };
    function toPromiseValidations(): [string, ValidationFunction][] {
        if (!parameters.validation) {
            return [];
        }

        return Object.entries(parameters.validation)
            .flatMap(([key, rules]) =>
                rules.map((rule, i) => {
                    if (rule instanceof RegExp) {
                        return [key, toPromise((z: string) => rule.test(z) || (findErrorTranslation("regex", key, i.toString()) || `Doesn't match regex: ${rule.toString()}`))] as [string, ValidationFunction];
                    }
                    if (rule === "required") {
                        return [key, toPromise((z: string) => (z && z.trim() !== "") || (findErrorTranslation("required", key, i.toString()) || `Field is required`))] as [string, ValidationFunction];
                    }
                    return [key, toPromise(rule as ValidationFunction)] as [string, ValidationFunction];
                })
            );
    }
    function findErrorTranslation(name: string, subName?: string, index?: string):string|null{
        if(!parameters.errors)
            return null;

        if(index && subName) {
            const v = parameters.errors[name + "-" + subName + "[" + index + "]"];
            if(v)
                return v;
        }
        if(subName){
            const v = parameters.errors[name + "-" + subName];
            if(v)
                return v;
        }
        if(index) {
            const v = parameters.errors[name + "[" + index + "]"];
            if(v)
                return v;
        }
        return parameters.errors[name];
    }

    function setError(key: string, value: string|null){
        setErrors(x=>({...x, [key]: value}));
    }

    function removeIndex(name: string): string {
        return name.replace(/\[\d+]/g, '');
    }

    async function validate(callback?: ValidationCallback, fieldName? :string, _values? :object) {
        //TODO: rewrite callback to promise style
        const validations = toPromiseValidations();
        if (!validations || validations.length === 0) {
            if (callback) callback(true);
            return;
        }

        const valuesScope = _values?_values:values;
        const obj = unflattenObject(valuesScope);

        if(fieldName)
            setError(fieldName, null);
        else
            setErrors({});

        for (const [name, validationFn] of validations) {
            if(fieldName && transformArrayPattern(fieldName) !== name)
                continue;

                const candidates = getFieldArray(name);

                for(const c of candidates) {
                    const result = await validationFn(values[c], obj);

                    if (typeof result === "boolean") {
                        if (result)
                            continue;
                        const message = (findErrorTranslation("unknown") || "Unknown error");
                        if (callback) callback(false, message, c);
                        setError(c, message);
                        return;
                    }
                    if (typeof result === "string") {
                        if (callback) callback(false, result, c);
                        setError(c, result);
                        return;
                    }
                }
        }

        if (callback) callback(true);
    }

    async function submit(onSuccess?: (value: object)=>void): Promise<object> {
        return new Promise<{ success: boolean; error?: string; field?: string, value?: object}>((resolve, reject) => {
            validate((isValid, message, field) => {
                if (isValid) {
                    resolve({ success: true });
                } else {
                    reject({ success: false, error: message, field });
                }
            });
        }).then(result => {
            const o = unflattenObject(values);
            if(onSuccess)
                onSuccess(o);
            return {success: true, values: o};
        }).catch(error => {
            const e = `"${error.error}" at [${error.field}]`;
            console.error("Validation failed:", e);
            return error;
        });
    }

    function updateState(key: string, value: any){
        setValues(x=>({...x, [key]: value}));
        if(parameters.onChange){
            parameters.onChange(unflattenObject({...values, [key]: value}), key);
        }
    }

    const onChange = (e: any, key: string)=>{
        let value;

        if (e && (typeof e === 'object') && 'value' in e) {
            value = e.value;
        }
        else if (e?.target) {
            value = e.target.value;
        }
        else {
            value = e;
        }

        updateState(key, value);
    }

    const register = (name: string) => {
        return {
            name: name,
            onChange: (e: any)=>onChange(e, name),
            onBlur: (e: any)=>validate(undefined, name),
            value: values[name],
            error: typeof errors[name] === "string"?errors[name]:null
        };
    }

    return {
        register: register,
        validate: validate,
        setValues: (v)=>setValues(()=>flattenObject(v)),
        setValue: (key, value)=>setValues(x=>({...x, [key]: value})),
        removeValue: (key)=>setValues(x=>{
            const {[key]: _, ...rest} = x;
            return rest;
        }),
        getValues: ()=>unflattenObject(values),
        getValue: (key)=>values[key],
        values: unflattenObject(values),
        errors: errors,
        submit: submit
    };
}