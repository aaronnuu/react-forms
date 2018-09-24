# @aaronuu/react-forms

**WIP README** - Some features are not documented yet

## Features

Field first form state management - minimal double handling of state updates within fields and the outer container.

Deals with state management and tricky react form quirks only, leaves the view and layout up to you.

## Getting Started

### Installing

Install using yarn

```
yarn add @aaronuu/react-forms
```

Install using npm

```
npm i @aaronuu/react-forms
```

## Usage

There are two different ways to use `@aaronuu/react-forms`

- `withForm({ name: 'form', ...config })` - a higher order component that will inject the forms state
- `<ReactForms />` - a react component with a render prop (recommended)

`withForm()` is just a light wrapper around `<ReactForms />` that will namespace your form based on the name you give within the configuration object (default is `form`)

There are four different components within `@aaronuu/react-forms`

- `<ReactForms />`
- `<Form />`
- `<Field />`
- `<FieldArray />`

In addition to these there are two different HOC's

- `withForm({ ...config })`
- `withContext`

### ReactForms

This is the state container for the form, it is the place where all `<Field />` state is aggregated to be easily accessed. It doesn't do anything by itself besides give you the state of the form and access to the form helpers to manipulate that state.

#### Props

##### `initialValues: { [fieldName]: value }`

### Form

This is a convenience component that attaches the form's `submitForm` method onto a `<form />`'s `onSubmit` handler.

### Field

This is where most of the work happens, all `<Field />` components are self contained state managers in their own right and will only pass their state up to the parent `onBlur` (or `onChange` if the `sendImmediate` prop is set to true). These `<Field />`'s should be considered to be the source of truth for their own slice of the form state.

Each `<Field />` is registered with it's closest form container on mount and by default is unregistered when unmounting (changed by the `shouldUnregister` prop). This registration sends the form container the initial state of the `<Field />` as well as it's individual state manipulation and validation methods, while the unregistration deletes the field entry in the parent container's state.

In most cases you will want be unregistering `<Field />`'s as they are unmounted to not pollute the state with entries that are superfluous, however in certain situations it can be advantageous to keep the value around. For example, login forms with multiple stages, you will get a nominal performance improvement by actually unmounting the `<Field />` instead of just hiding it with `display: none`

These entries will also have their validation methods run which could stop the form from submitting without showing anything to the user as the field the error should be attached to is now gone.

####

## Example

```js
import React, { Component } from 'react';
import { ReactForms } from '@aaronuu/react-forms';

class FormContainer extends Component {
  render() {
    return (
      <ReactForms
        validate={values => {
          if (!values.password) {
            return { password: 'Password is required' };
          }
          return {};
        }}
      >
        {({
          values,
          touched,
          errors,
          isDirty,
          isValid,
          setValues,
          setFieldValue,
          setErrors,
          setFieldError,
          setTouched,
          setFieldTouched,
          setStatus,
          resetForm,
          submitForm
        }) => {
          return (
            <Fragment>
              <Form>
                <Field
                  name="email"
                  initialValue="new@email.com"
                  validate={value => {
                    if (value !== /email_regex/) {
                      return 'Invalid email';
                    }
                    return null;
                  }}
                />
                <Field name="password" />
                <button>Submit</button>
              </Form>
            </Fragment>
          );
        }}
      </ReactForms>
    );
  }
}
```

## Props

## Caveats

## Authors

- **Aaron Williams** - [aaronnuu](https://github.com/aaronnuu)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
