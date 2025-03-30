# OxyForm
## Sample
```jsx
const form = useForm({
        onChange: (values, key) => {
            // Auto-fill full name (simulating autofill)
            if (key === "firstName" || key === "lastName") {
                form.setValue("fullName", `${values.firstName || ""} ${values.lastName || ""}`.trim());
            }
        },
        initialValues: {
            firstName: "",
            lastName: "",
            fullName: "",
            age: "",
            password: "",
            confirmPassword: "",
            address: { city: "", street: "" },
            hobbies: [""],
        },
        validation: {
            firstName: ["required"],
            lastName: ["required"],
            age: [
                "required",
                /\d+/, // Check that the input is a number
                (x) => parseInt(x) >= 18 || "You must be 18 or older",
            ],
            email: [
                "required",
                /\S+@\S+\.\S+/, // Basic email validation
                (x) =>
                    new Promise(resolve =>
                        setTimeout(() => resolve(x.includes("test") ? "Email with 'test' is not allowed" : true), 200)
                    ),
            ],
            password: [
                "required",
                (x) => x.length >= 6 || "Password must be at least 6 characters long",
            ],
            confirmPassword: [
                "required",
                (x, values) => x === values.password || "Passwords do not match",
            ],
            "address.city": ["required"],
            "hobbies[i]": [
                "required",
                (arr) => arr.length >= 4 || "At least 4 hobbies are required"
            ],
            hobbies: [
                (_, other) => other.hobbies.length >= 2 || "Please specify at least two hobbies",
            ]
        },
        errors: {
            "regex-age": "Age must be a number",
            "required": "This field is required",
        },
    });

    return (
        <form>
            <label>
                First Name:
                <input {...form.register("firstName")} />
                {form.errors.firstName && <span>{form.errors.firstName}</span>}
            </label>
            <br/>

            <label>
                Last Name:
                <input {...form.register("lastName")} />
                {form.errors.lastName && <span>{form.errors.lastName}</span>}
            </label>
            <br/>

            <label>
                Full Name (auto-fill):
                <input {...form.register("fullName")} readOnly/>
            </label>
            <br/>

            <label>
                Age:
                <input {...form.register("age")} />
                {form.errors.age && <span>{form.errors.age}</span>}
            </label>
            <br/>

            <label>
                Email:
                <input {...form.register("email")} />
                {form.errors.email && <span>{form.errors.email}</span>}
            </label>
            <br/>

            <label>
                Password:
                <input type="password" {...form.register("password")} />
                {form.errors.password && <span>{form.errors.password}</span>}
            </label>
            <br/>

            <label>
                Confirm Password:
                <input type="password" {...form.register("confirmPassword")} />
                {form.errors.confirmPassword && <span>{form.errors.confirmPassword}</span>}
            </label>
            <br/>

            <fieldset>
                <legend>Address</legend>
                <label>
                    City:
                    <input {...form.register("address.city")} />
                    {form.errors["address.city"] && <span>{form.errors["address.city"]}</span>}
                </label>
                <label>
                    Street:
                    <input {...form.register("address.street")} />
                    {form.errors["address.street"] && <span>{form.errors["address.street"]}</span>}
                </label>
            </fieldset>

            <fieldset>
                <legend>Hobbies</legend>
                {form.values.hobbies && form.values.hobbies.map((_, index) => (
                    <div key={index}>
                        <input {...form.register(`hobbies[${index}]`)} />
                        <button type="button" onClick={() => form.removeValue(`hobbies[${index}]`)}>
                            ❌
                        </button>
                        {form.errors[`hobbies[${index}]`] && <span>{form.errors[`hobbies[${index}]`]}</span>}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => form.setValue(`hobbies[${form.values.hobbies?.length || 0}]`, "")}
                >
                    ➕ Add Hobby
                </button>
                {form.errors[`hobbies`] && <span>{form.errors[`hobbies`]}</span>}
            </fieldset>

            <button
                type="button"
                onClick={() => {
                    form.submit(x => alert("Data submitted!!!\n\n" + JSON.stringify(x)))
                }}
            >
                ✅ Submit
            </button>
        </form>
    );
```