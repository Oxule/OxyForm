import { useState } from "react";
import { flattenObject, unflattenObject } from "./flatten";
export function useForm(parameters) {
    const [values, setValues] = useState((parameters.initialValues && flattenObject(parameters.initialValues)) || {});
    const [errors, setErrors] = useState({});
    function transformArrayPattern(key) {
        return key.replace(/\[\d+\]/, "[i]");
    }
    function getFieldArray(name) {
        const matchingKeys = Object.keys(values)
            .filter(key => transformArrayPattern(key) === name);
        return matchingKeys.length > 0 ? matchingKeys : [name];
    }
    const toPromise = (fn) => {
        return (value, other) => {
            const result = fn(value, other);
            if (result instanceof Promise) {
                return result;
            }
            return Promise.resolve(result);
        };
    };
    function toPromiseValidations() {
        if (!parameters.validation) {
            return [];
        }
        return Object.entries(parameters.validation)
            .flatMap(([key, rules]) => rules.map((rule, i) => {
            if (rule instanceof RegExp) {
                return [key, toPromise((z) => rule.test(z) || (findErrorTranslation("regex", key, i.toString()) || `Doesn't match regex: ${rule.toString()}`))];
            }
            if (rule === "required") {
                return [key, toPromise((z) => (z && z.trim() !== "") || (findErrorTranslation("required", key, i.toString()) || `Field is required`))];
            }
            return [key, toPromise(rule)];
        }));
    }
    function findErrorTranslation(name, subName, index) {
        if (!parameters.errors)
            return null;
        if (index && subName) {
            const v = parameters.errors[name + "-" + subName + "[" + index + "]"];
            if (v)
                return v;
        }
        if (subName) {
            const v = parameters.errors[name + "-" + subName];
            if (v)
                return v;
        }
        if (index) {
            const v = parameters.errors[name + "[" + index + "]"];
            if (v)
                return v;
        }
        return parameters.errors[name];
    }
    function setError(key, value) {
        setErrors(x => ({ ...x, [key]: value }));
    }
    function removeIndex(name) {
        return name.replace(/\[\d+]/g, '');
    }
    async function validate(callback, fieldName, _values) {
        //TODO: rewrite callback to promise style
        const validations = toPromiseValidations();
        if (!validations || validations.length === 0) {
            if (callback)
                callback(true);
            return;
        }
        const valuesScope = _values ? _values : values;
        const obj = unflattenObject(valuesScope);
        if (fieldName)
            setError(fieldName, null);
        else
            setErrors({});
        for (const [name, validationFn] of validations) {
            if (fieldName && transformArrayPattern(fieldName) !== name)
                continue;
            const candidates = getFieldArray(name);
            for (const c of candidates) {
                const result = await validationFn(values[c], obj);
                if (typeof result === "boolean") {
                    if (result)
                        continue;
                    const message = (findErrorTranslation("unknown") || "Unknown error");
                    if (callback)
                        callback(false, message, c);
                    setError(c, message);
                    return;
                }
                if (typeof result === "string") {
                    if (callback)
                        callback(false, result, c);
                    setError(c, result);
                    return;
                }
            }
        }
        if (callback)
            callback(true);
    }
    async function submit(onSuccess) {
        return new Promise((resolve, reject) => {
            validate((isValid, message, field) => {
                if (isValid) {
                    resolve({ success: true });
                }
                else {
                    reject({ success: false, error: message, field });
                }
            });
        }).then(result => {
            const o = unflattenObject(values);
            if (onSuccess)
                onSuccess(o);
            return { success: true, values: o };
        }).catch(error => {
            const e = `"${error.error}" at [${error.field}]`;
            console.error("Validation failed:", e);
            return error;
        });
    }
    function updateState(key, value) {
        setValues(x => ({ ...x, [key]: value }));
        if (parameters.onChange) {
            parameters.onChange(unflattenObject({ ...values, [key]: value }), key);
        }
    }
    const onChange = (e, key) => {
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
    };
    const register = (name) => {
        return {
            name: name,
            onChange: (e) => onChange(e, name),
            onBlur: (e) => validate(undefined, name),
            value: values[name],
            error: typeof errors[name] === "string" ? errors[name] : null
        };
    };
    return {
        register: register,
        validate: validate,
        setValues: (v) => setValues(() => flattenObject(v)),
        setValue: (key, value) => setValues(x => ({ ...x, [key]: value })),
        removeValue: (key) => setValues(x => {
            const { [key]: _, ...rest } = x;
            return rest;
        }),
        getValues: () => unflattenObject(values),
        getValue: (key) => values[key],
        values: unflattenObject(values),
        errors: errors,
        submit: submit
    };
}
