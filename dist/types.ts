type RegisterInput = (name: string) => object;

type SetValue = (name: string, value: any) => void;
type SetValues = (value: object) => void;

type GetValue = (name: string) => any;
type RemoveValue = (name: string) => void;
type GetValues = () => object;

type Validate = (callback?: ValidationCallback, fieldName?: string,_values?: object) => void;

type Submit = (onSuccess?: (value: object)=>void)=>Promise<object>

interface IForm{
    register: RegisterInput;
    setValue: SetValue,
    setValues: SetValues,
    getValue: GetValue,
    removeValue: RemoveValue,
    getValues: GetValues,
    validate: Validate,
    errors: {[key: string]:string|null}
    values: {[key: string]:any},
    submit: Submit
}

type InputHandler = (value: any, key: string) => void;

type ValidationResult = string | boolean
type ValidationFunction = (value: any, other: object) => ValidationResult|Promise<ValidationResult>;
type Validation = ValidationFunction|"required"|RegExp;

type ValidationCallback = (valid: boolean, reason?: string, name?: string) => void

interface IFormParameters {
    initialValues?: object;
    onChange?: InputHandler;
    validation?: {[key: string]:Validation[]};
    errors?: {[key: string]:string}
}