import React, { Component } from 'react';
import isEqual from 'react-fast-compare';
import createContext from 'create-react-context';
import get from 'lodash.get';
import set from 'lodash.set';
import unset from 'lodash.unset';
import debounce from 'lodash.debounce';
import {
  isFunction,
  isPromise,
  noop,
  concatenateErrors,
  flattenArray
} from './utils';

const { Provider, Consumer } = createContext();

class ReactForms extends Component {
  static defaultProps = {
    validateOnMount: false,
    validateOnChange: true,
    validateOnBlur: true,
    touchOnMount: false,
    touchOnChange: true,
    touchOnBlur: true,
    shouldUnregister: true,
    handleSubmit: noop
  };

  state = {
    fields: {},
    meta: null,
    submitCount: 0,
    isSubmitting: false,
    isValidating: false
  };

  blockSubmission = false;
  pendingStateUpdates = [];

  constructor (props) {
    super(props);

    this.registerField = this.registerField.bind(this);
    this.unregisterField = this.unregisterField.bind(this);
    this.setFormState = this.setFormState.bind(this);
    this.setValues = this.setValues.bind(this);
    this.setFieldValue = this.setFieldValue.bind(this);
    this.setErrors = this.setErrors.bind(this);
    this.setFieldError = this.setFieldError.bind(this);
    this.setTouched = this.setTouched.bind(this);
    this.setFieldTouched = this.setFieldTouched.bind(this);
    this.setMeta = this.setMeta.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.getValues = this.getValues.bind(this);
    this.getTouched = this.getTouched.bind(this);
    this.getErrors = this.getErrors.bind(this);
    this.runValidations = this.runValidations.bind(this);
    this.executeSubmit = this.executeSubmit.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.getComputedProps = this.getComputedProps.bind(this);
    this.getFormHelpers = this.getFormHelpers.bind(this);
    this.getFormState = this.getFormState.bind(this);
  }

  registerField (
    name,
    {
      id,
      initialValue,
      initialTouched,
      initialError,
      validate,
      setValue,
      setTouched,
      setError,
      reset
    }
  ) {
    this.setFormState(prevState => {
      return {
        ...prevState,
        fields: {
          ...prevState.fields,
          [name]: {
            id,
            initialValue,
            value: initialValue,
            touched: initialTouched,
            error: initialError,
            validate,
            setValue,
            setTouched,
            setError,
            reset
          }
        }
      };
    });
  }

  unregisterField (id) {
    this.setFormState(prevState => {
      const { fields } = prevState;

      const newFields = { ...fields };

      // Find and unregister by ID so that fields can swap names
      // without then unregistering the field that swapped with them
      const name = Object.keys(newFields).find(fieldName => {
        if (fields[fieldName].id === id) {
          return true;
        }
      });

      if (name) {
        unset(newFields, name);

        return {
          ...prevState,
          fields: newFields
        };
      } else {
        return null;
      }
    });
  }

  flushBatchedState = debounce(() => {
    const callbacks = [];
    const newState = this.pendingStateUpdates.reduce(
      (acc, [state, callback]) => {
        acc = { ...acc, ...state(acc) };
        callbacks.push(callback);
        return acc;
      },
      this.state
    );
    this.pendingStateUpdates = [];
    this.setState(newState, () => {
      callbacks.forEach(c => c());
    });
  }, 20);

  batchState (state, callback) {
    this.pendingStateUpdates.push([state, callback]);
    this.flushBatchedState();
  }

  setFormState (state) {
    return new Promise(resolve => {
      this.batchState(state, resolve);
    });
  }

  setValues (values, merge = true, shouldValidate) {
    const { fields } = this.state;
    const promises = [];
    Object.keys(fields).forEach(name => {
      const value = get(values, name);
      if (!merge || (merge && value !== undefined)) {
        promises.push(fields[name].setValue(value, shouldValidate));
      }
    });
    return Promise.all(promises);
  }

  setFieldValue (name, value, shouldValidate) {
    const { fields } = this.state;
    if (!fields[name]) {
      throw new Error(`Field ${name} does not exist`);
    } else {
      return fields[name].setValue(value, shouldValidate);
    }
  }

  setErrors (errors, merge = false, shouldTouch) {
    const { fields } = this.state;
    const promises = [];
    Object.keys(fields).forEach(name => {
      const error = get(errors, name, null);
      if (!merge || (merge && error === null)) {
        promises.push(fields[name].setError(error, shouldTouch));
      }
    });
    return Promise.all(promises);
  }

  setFieldError (name, error, shouldTouch) {
    const { fields } = this.state;
    if (!fields[name]) {
      throw new Error(`Field ${name} does not exist`);
    } else {
      return fields[name].setError(error, shouldTouch);
    }
  }

  setTouched (touched, shouldValidate) {
    const { fields } = this.state;
    const promises = [];
    Object.keys(fields).forEach(name => {
      promises.push(
        fields[name].setTouched(get(touched, name, false), shouldValidate)
      );
    });
    return Promise.all(promises);
  }

  setFieldTouched (name, touched, shouldValidate) {
    const { fields } = this.state;
    if (!fields[name]) {
      throw new Error(`Field ${name} does not exist`);
    } else {
      return fields[name].setTouched(touched, shouldValidate);
    }
  }

  setMeta (meta) {
    return this.setFormState(prevState => ({
      ...prevState,
      meta
    }));
  }

  resetForm (values, shouldValidate) {
    const { fields } = this.state;
    const promises = [];
    Object.keys(fields).forEach(name => {
      promises.push(fields[name].reset(get(values, name), shouldValidate));
    });
    return Promise.all(promises);
  }

  getInitialValues () {
    const { fields } = this.state;
    return Object.keys(fields).reduce((acc, name) => {
      set(acc, name, fields[name].initialValue);
      return acc;
    }, {});
  }

  getValues () {
    const { fields } = this.state;
    return Object.keys(fields).reduce((acc, name) => {
      set(acc, name, fields[name].value);
      return acc;
    }, {});
  }

  getTouched () {
    const { fields } = this.state;
    return Object.keys(fields).reduce((acc, name) => {
      set(acc, name, fields[name].touched);
      return acc;
    }, {});
  }

  getErrors () {
    const { fields } = this.state;
    return Object.keys(fields).reduce((acc, name) => {
      if (fields[name].error !== null) {
        set(acc, name, fields[name].error);
      }
      return acc;
    }, {});
  }

  startSubmit () {
    const { fields } = this.state;

    this.setTouched(
      Object.keys(fields).reduce((acc, name) => {
        set(acc, name, true);
        return acc;
      }, {}),
      false
    );

    return this.setFormState(prevState => ({
      ...prevState,
      submitCount: prevState.submitCount + 1
    }));
  }

  runValidations () {
    const { fields } = this.state;
    const { validate } = this.props;

    const values = this.getValues();

    this.setFormState(prevState => ({
      ...prevState,
      isValidating: true
    }));

    const asyncValidators = [];
    const syncErrors = [];

    // Validate all fields then the form
    // If both have validated the same field use
    // the field specific error

    // If there are async validators then overwrite
    // the sync errors with those
    Object.keys(fields).forEach(name => {
      const fieldValidator = fields[name].validate;

      if (isFunction(fieldValidator)) {
        const maybePromisedError = fieldValidator(
          fields[name].value,
          this.getFormHelpers(true)
        );

        if (isPromise(maybePromisedError)) {
          asyncValidators.push({ [name]: maybePromisedError });
        } else {
          syncErrors.push({ [name]: maybePromisedError });
        }
      } else {
        // Make sure every error has a null value if
        // no validation is performed
        syncErrors.push({ [name]: null });
      }
    });

    if (isFunction(validate)) {
      const maybePromisedErrors = validate(values, this.getFormHelpers(true));

      if (isPromise(maybePromisedErrors)) {
        asyncValidators.push(maybePromisedErrors);
      } else {
        syncErrors.push(maybePromisedErrors);
      }
    }

    if (asyncValidators.length === 0) {
      this.setFormState(prevState => ({
        ...prevState,
        isValidating: false
      }));
      return concatenateErrors(syncErrors);
    } else {
      // Wrap this in a promise to be able to control the
      // resolved value so we can preserve the field name
      // that the error is attached to
      return new Promise(async resolve => {
        const asyncErrors = await Promise.all(
          flattenArray(
            asyncValidators.map(validator => {
              if (!isPromise(validator)) {
                return Object.entries(validator).map(([key, value]) => {
                  return new Promise(async resolve => {
                    const error = await value;
                    resolve({ [key]: error });
                  });
                });
              } else {
                return validator;
              }
            })
          )
        );
        this.setFormState(prevState => ({
          ...prevState,
          isValidating: false
        }));
        resolve({
          ...concatenateErrors([...syncErrors, ...asyncErrors])
        });
      });
    }
  }

  async executeSubmit () {
    const { handleSubmit } = this.props;

    try {
      const values = this.getValues();
      const errors = this.getErrors();

      const isValid = Object.keys(errors).length <= 0;

      if (isValid) {
        this.setFormState(prevState => ({
          ...prevState,
          isSubmitting: true
        }));
        this.blockSubmission = true;
        const submit = handleSubmit(values, this.getFormHelpers(true));
        if (isPromise(submit)) {
          const submission = await submit;
          return submission;
        }
        return submit;
      }

      // False if form didn't submit
      return false;
    } finally {
      await this.setFormState(prevState => ({
        ...prevState,
        isSubmitting: false
      }));
      this.blockSubmission = false;
    }
  }

  async submitForm (e) {
    const { isSubmitting } = this.state;

    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (isSubmitting || this.blockSubmission) {
      // return false if form did not submit
      return false;
    }

    await this.startSubmit();

    const maybePromisedErrors = this.runValidations();

    if (isPromise(maybePromisedErrors)) {
      const errors = await maybePromisedErrors;
      await this.setErrors(errors, false, true);
    } else {
      await this.setErrors(maybePromisedErrors, false, true);
    }

    return this.executeSubmit();
  }

  getComputedProps () {
    const initialValues = this.getInitialValues();
    const values = this.getValues();
    const errors = this.getErrors();

    return {
      isDirty: !isEqual(initialValues, values),
      isValid: Object.keys(errors).length <= 0
    };
  }

  getFormHelpers (withProps) {
    const { meta, submitCount } = this.state;
    const { outerProps } = this.props;
    return {
      ...(outerProps && withProps ? { props: outerProps } : {}),
      meta,
      submitCount,
      setValues: this.setValues,
      setFieldValue: this.setFieldValue,
      setErrors: this.setErrors,
      setFieldError: this.setFieldError,
      setTouched: this.setTouched,
      setFieldTouched: this.setFieldTouched,
      setMeta: this.setMeta,
      resetForm: this.resetForm,
      submitForm: this.submitForm
    };
  }

  getFormState () {
    const { fields, meta, submitCount, ...restState } = this.state;

    return {
      ...this.getComputedProps(),
      ...this.getFormHelpers(false),
      ...restState,
      values: this.getValues(),
      touched: this.getTouched(),
      errors: this.getErrors()
    };
  }

  render () {
    const {
      render,
      children,
      validate,
      initialValues,
      validateOnMount,
      validateOnChange,
      validateOnBlur,
      touchOnMount,
      touchOnChange,
      touchOnBlur,
      shouldUnregister
    } = this.props;

    const formState = this.getFormState();

    return (
      <Provider
        value={{
          ...formState,
          initialValues,
          validateOnMount,
          validateOnChange,
          validateOnBlur,
          touchOnMount,
          touchOnChange,
          touchOnBlur,
          shouldUnregister,
          registerField: this.registerField,
          unregisterField: this.unregisterField,
          validateForm: validate,
          setFormState: this.setFormState,
          getFormHelpers: this.getFormHelpers
        }}
      >
        {isFunction(children)
          ? children(formState)
          : isFunction(render)
            ? render(formState)
            : null}
      </Provider>
    );
  }
}

class AsyncValuesWrapper extends Component {
  static defaultProps = {
    asyncValuesReady: true
  };

  initialized = this.getAsyncValuesReady();

  getAsyncValuesReady () {
    const { asyncValuesReady, outerProps } = this.props;
    if (isFunction(asyncValuesReady)) {
      return asyncValuesReady(outerProps);
    } else {
      return asyncValuesReady;
    }
  }

  getKey = () => {
    if (!this.initialized) {
      if (this.getAsyncValuesReady()) {
        this.initialized = true;
      } else {
        return false;
      }
    }
    return this.initialized;
  };

  render () {
    const { asyncValuesReady, ...rest } = this.props;

    return <ReactForms key={this.getKey()} {...rest} />;
  }
}

export const FormConsumer = Consumer;

export default AsyncValuesWrapper;
