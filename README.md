# Vue Form Component

A minimal component to simplify working with forms in Vue. You still create the form UI yourself, but with access to form data and any validation errors that are returned upon submission. Assumes responses from the server follow a given format.

[![Build Status](https://travis-ci.org/Dymantic/vue-forms.svg?branch=master)](https://travis-ci.org/Dymantic/vue-forms)

### Installation

`npm install @dymantic/vue-forms`

### Component Props

| Prop        | Type                            | Required | Default | Note                                                            |
| ----------- | ------------------------------- | -------- | ------- | --------------------------------------------------------------- |
| url         | string                          | yes      | none    | form is submitted by POST to this url                           |
| form-model  | Form (from @dymantic/vue-forms) | yes      | none    | keeps track of data and error messages                          |
| redirect-to | string                          | no       | none    | if present, page will navigate here after successful submission |

### The Form Object

The value passed to the form-model prop must be of the type Form, imported as such: `import {Form} from @dymantic/vueforms`. This gives you a constructor to create a form object, by passing an object containing the default values of your form object. For example:

```
const form = new Form({
    username: "Harry",
    school: "Hogwarts"
});

// form.data.username === "Harry"
// form.data.school === "Hogwarts"
```

Contunuing with the example above, the form object can be used as such:

```
form.data.username = "Victor"
form.data.school = "Durmstrang"

// form.data.username === "Victor"
// form.data.school === "Durmstrang"

form.resetFields();

// form.data.username === "Harry"
// form.data.school === "Hogwarts"

form.resetFields({username: "Victor"});

// form.data.username === "Victor"
// form.data.school === "Hogwarts"

form.setValidationErrors({school: ["not a recognised school"]});

// form.errors.school === "not a recognised school"
// form.errors.username === ""

form.clearErrors();

// form.errors.school === ""
// form.errors.username === ""
```

**Using the form data and errors in your template:** You can get access to the form object by destructing it out of the slot scope as such `slot-scope={formData, formErrors, waiting}` as seen in the example provided below. This allows you to bind form fields with v-model, and use validation errors in your template.

### Component Events

| Event            | Payload                       | Notes                                        |
| ---------------- | ----------------------------- | -------------------------------------------- |
| submission-okay  | response data                 | fired on successful submission               |
| submision-failed | `{status: [RESPONSE STATUS]}` | recieved a 4** or 5** response from server   |
| form-error       | none                          | a non-network error occured during submision |

### Note

**This component assumes that if the form submission fails validation, the server will respond with a 422 status code, and include the validation error messages that follow the following format(it is default Laravel behaviour).**

```
// in response body
{
    "errors": {
        "username": ["The username is not available", "The username contains invalid characters"]
    }
}
```

### Example usage

As a basic sample, lets assume we are making a simple component to save/update a username

```
// in your own component/page

<template>
    <div>
        // ... your template code
        <vue-form url="/usernames"
                  :form-model="formModel"
                  @submisison-okay="usernamePersisted"
                  @submission-failed="handleError"
        >
            <div slot-scope="{formData, formErrors, waiting}">
                <div :class="{'has-error': formErrors.username}">
                    <label for="username">Username</label>
                    <span class="text-danger" v-show="formErrors.title">{{ formErrors.title }}</span>
                    <input type="text" name="title" v-model="formData.username" id="username">
                </div>
                <button type="submit" :disabled="waiting">
                    Save
                </button>
            </div>
        </vue-form>
        // ... more template code
    </div>
</template>

<script>
    import {Form} from "@dymantic/vue-forms"

    export default {

        data() {
            function() {
                formModel: new Form({username: "default username"})
            };
        },

        methods: {
            usernamePersisted(response_data) {
                // reponse data is what was returned by server as response. You may use it to update the form data.
                // You may also just reset the form this.form.resetFields()
            },

            handleError({status}) {
                //status is the non 200 http status code returned by server
            }
        }
    }
</script>
```
