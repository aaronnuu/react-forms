import React, { Component } from 'react';
import get from 'lodash.get';
import set from 'lodash.set';
import withContext from './containers/with-context';
import {
  noop,
  isPromise,
  isFunction,
  isObject,
  isNullOrUndefined,
  uuid
} from './utils';

@withContext
class Field extends Component {
  static defaultProps = {
    sendImmediate: false,
    Component: 'input',
    onFocus: noop,
    onChange: noop,
    onBlur: noop
  };

  constructor (props) {
    const {
      name,
      initialValue,
      shouldUnregister,
      reactForms: {
        initialValues,
        validateOnMount,
        shouldUnregister: formShouldUnregister
      }
    } = props;

    super(props);

    const formInitialValue = get(initialValues, name);

    this.state = {
      value: !isNullOrUndefined(initialValue)
        ? initialValue
        : !isNullOrUndefined(formInitialValue)
          ? formInitialValue
          : '',
      touched: validateOnMount,
      error: null,
      focused: false,
      isValidating: false
    };

    this.id = uuid();
    this.mounted = false;
    this.shouldUnregister = !isNullOrUndefined(shouldUnregister)
      ? shouldUnregister
      : formShouldUnregister;

    this.setFieldState = this.setFieldState.bind(this);
    this.getRegistrations = this.getRegistrations.bind(this);
    this.handleValidate = this.handleValidate.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.getFieldProps = this.getFieldProps.bind(this);
  }

  getRegistrations (initialValue) {
    const {
      validate,
      reactForms: { validateOnMount, validateOnChange, validateOnBlur }
    } = this.props;

    return {
      validate,
      setValue: (value, shouldValidate = validateOnChange) => {
        return new Promise(async resolve => {
          const promises = [
            this.setFieldState(prevState => ({
              ...prevState,
              value
            })),
            this.sendValue(value)
          ];
          if (shouldValidate) {
            const error = this.handleValidate();
            if (isPromise(error)) {
              promises.push(this.sendError(await error));
            } else {
              promises.push(this.sendError(error));
            }
          }

          await Promise.all(promises);

          resolve(value);
        });
      },
      setError: (error, shouldTouch = true) => {
        return new Promise(async resolve => {
          const promises = [
            this.setFieldState(prevState => ({
              ...prevState,
              error,
              touched: !!shouldTouch
            }))
          ];
          if (shouldTouch) {
            promises.push(this.sendTouched(shouldTouch));
          }
          promises.push(this.sendError(error));

          await Promise.all(promises);

          resolve(error);
        });
      },
      setTouched: (touched, shouldValidate = validateOnBlur) => {
        return new Promise(async resolve => {
          const promises = [
            this.setFieldState(prevState => ({
              ...prevState,
              touched
            })),
            this.sendTouched(touched)
          ];
          if (shouldValidate) {
            const error = this.handleValidate();
            if (isPromise(error)) {
              promises.push(this.sendError(await error));
            } else {
              promises.push(this.sendError(error));
            }
          }

          await Promise.all(promises);

          resolve(touched);
        });
      },
      reset: (val, shouldValidate = validateOnMount) => {
        return new Promise(async resolve => {
          let error = null;
          const value = !isNullOrUndefined(val) ? val : initialValue;
          const touched = shouldValidate && validateOnMount;

          const promises = [
            this.setFieldState(prevState => ({
              ...prevState,
              value,
              touched,
              error
            })),
            this.sendValue(value),
            this.sendTouched(touched),
            this.sendError(error)
          ];

          if (shouldValidate) {
            const validation = this.handleValidate();
            if (isPromise(validation)) {
              error = await validation;
            } else {
              error = validation;
            }
          }

          promises.push(this.sendError(error));
          promises.push(
            this.setFieldState(prevState => ({
              ...prevState,
              error
            }))
          );

          await Promise.all(promises);

          resolve({
            value,
            touched,
            error
          });
        });
      }
    };
  }

  setFieldState (state) {
    return new Promise(resolve => {
      if (this.mounted) {
        this.setState(state, resolve);
      } else {
        resolve();
      }
    });
  }

  async componentDidMount () {
    const { value, touched, error } = this.state;
    const {
      name,
      reactForms: { validateOnMount, registerField }
    } = this.props;

    this.mounted = true;

    registerField(name, {
      id: this.id,
      initialValue: value,
      initialTouched: touched,
      initialError: error,
      ...this.getRegistrations(value)
    });

    if (validateOnMount) {
      const error = this.handleValidate();
      if (isPromise(error)) {
        this.sendError(await error);
      } else {
        this.sendError(error);
      }
    }
  }

  componentDidUpdate (prevProps) {
    const { value, touched, error } = this.state;
    const {
      name,
      shouldUnregister,
      reactForms: {
        shouldUnregister: formShouldUnregister,
        registerField,
        unregisterField
      }
    } = this.props;
    const {
      name: prevName,
      shouldUnregister: prevShouldUnregister
    } = prevProps;

    if (shouldUnregister !== prevShouldUnregister) {
      this.shouldUnregister = !isNullOrUndefined(shouldUnregister)
        ? shouldUnregister
        : formShouldUnregister;
    }

    if (name !== prevName) {
      if (this.shouldUnregister) {
        unregisterField(this.id);
      }
      registerField(name, {
        id: this.id,
        initialValue: value,
        initialTouched: touched,
        initialError: error,
        ...this.getRegistrations(value)
      });
    }
  }

  componentWillUnmount () {
    const {
      reactForms: { unregisterField }
    } = this.props;

    this.mounted = false;

    if (this.shouldUnregister) {
      unregisterField(this.id);
    }
  }

  sendValue (value) {
    const {
      name,
      reactForms: { setFormState }
    } = this.props;

    return setFormState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: set(
          { ...prevState.fields[name] },
          'value',
          value || this.state.value
        )
      }
    }));
  }

  sendTouched (touched) {
    const {
      name,
      reactForms: { setFormState }
    } = this.props;

    return setFormState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: set(
          { ...prevState.fields[name] },
          'touched',
          touched || this.state.touched
        )
      }
    }));
  }

  sendError (error) {
    const {
      name,
      reactForms: { setFormState }
    } = this.props;

    return setFormState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: set(
          { ...prevState.fields[name] },
          'error',
          error || this.state.error
        )
      }
    }));
  }

  handleValidate () {
    const { value } = this.state;
    const {
      name,
      validate,
      reactForms: { validateForm }
    } = this.props;

    if (isFunction(validate)) {
      const maybePromisedError = validate(value) || null;

      // Either return a promise that resolves to the error
      // or just the error so we can make as few updates as possible
      if (isPromise(maybePromisedError)) {
        return new Promise(async resolve => {
          await this.setFieldState(prevState => ({
            ...prevState,
            isValidating: true
          }));

          const error = (await maybePromisedError) || null;

          await this.setFieldState(prevState => ({
            ...prevState,
            error: error,
            isValidating: false
          }));

          resolve(error);
        });
      } else {
        this.setFieldState(prevState => ({
          ...prevState,
          error: maybePromisedError
        }));
        return maybePromisedError;
      }
    } else if (isFunction(validateForm)) {
      const values = set({}, name, value);
      const maybePromisedErrors = validateForm(values);

      if (isPromise(maybePromisedErrors)) {
        return new Promise(async resolve => {
          await this.setFieldState(prevState => ({
            ...prevState,
            isValidating: true
          }));

          const errors = await maybePromisedErrors;

          await this.setFieldState(prevState => ({
            ...prevState,
            error: get(errors, name, null),
            isValidating: false
          }));

          resolve(get(errors, name, null));
        });
      } else {
        const error = get(maybePromisedErrors, name, null);
        this.setFieldState(prevState => ({
          ...prevState,
          error
        }));
        return error;
      }
    }
  }

  handleFocus (e) {
    const { onFocus } = this.props;

    if (isObject(e) && e.persist) {
      e.persist();
    }

    onFocus(e);

    this.setFieldState(prevState => ({
      ...prevState,
      focused: true
    }));
  }

  async handleChange (e) {
    const { focused, touched } = this.state;
    const {
      onChange,
      sendImmediate,
      reactForms: { validateOnChange, touchOnChange }
    } = this.props;

    if (isObject(e) && e.persist) {
      e.persist();
    }

    const type = e.target.type;

    const value =
      type === 'checkbox'
        ? e.target.checked
        : type === 'file'
          ? e.target.files
          : e.target.value;

    onChange(e);

    this.setFieldState(prevState => ({
      ...prevState,
      value,
      touched: touched || !!touchOnChange
    }));

    if (sendImmediate || !focused) {
      this.sendValue(value);
      this.sendTouched(touched || !touchOnChange);
    }

    if (validateOnChange) {
      const error = this.handleValidate();
      if (isPromise(error)) {
        if (sendImmediate || !focused) {
          this.sendError(await error);
        }
      } else {
        if (sendImmediate || !focused) {
          this.sendError(error);
        }
      }
    }
  }

  async handleBlur (e) {
    const { touched } = this.state;
    const {
      onBlur,
      reactForms: { validateOnBlur, touchOnBlur }
    } = this.props;

    if (isObject(e) && e.persist) {
      e.persist();
    }

    onBlur(e);

    this.setFieldState(prevState => ({
      ...prevState,
      touched: touched || !!touchOnBlur,
      focused: false
    }));

    this.sendValue();
    this.sendTouched(touched || !!touchOnBlur);

    if (validateOnBlur) {
      const error = this.handleValidate();
      if (isPromise(error)) {
        this.sendError(await error);
      } else {
        this.sendError(error);
      }
      return;
    }

    this.sendError();
  }

  getFieldProps () {
    const { value, error, touched, focused, isValidating } = this.state;
    const { name } = this.props;

    return {
      name,
      value,
      meta: {
        error,
        touched,
        focused,
        isValidating
      },
      onFocus: this.handleFocus,
      onChange: this.handleChange,
      onBlur: this.handleBlur
    };
  }

  render () {
    const { meta, ...restField } = this.getFieldProps();
    const {
      initialValue,
      reactForms,
      sendImmediate,
      shouldUnregister,
      Component: InputComponent,
      children,
      render,
      validate,
      onFocus,
      onChange,
      onBlur,
      ...restProps
    } = this.props;

    const props = {
      ...restProps,
      field: {
        ...restField
      },
      meta
    };

    return isFunction(children)
      ? children(props)
      : isFunction(render)
        ? render(props)
        : isFunction(InputComponent)
          ? React.createElement(InputComponent, props)
          : InputComponent
            ? React.createElement(InputComponent, restField)
            : null;
  }
}

export default Field;
