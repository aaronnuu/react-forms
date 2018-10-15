import React, { Component } from 'react';
import isEqual from 'react-fast-compare';
import get from 'lodash.get';
import set from 'lodash.set';
import withContext from './containers/with-context';
import {
  noop,
  isPromise,
  isFunction,
  isObject,
  isNullOrUndefined,
  uuid,
  reduceError
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
        shouldUnregister: formShouldUnregister,
        registerField
      }
    } = props;

    super(props);

    const formInitialValue = get(initialValues, name);

    const value = !isNullOrUndefined(initialValue)
      ? initialValue
      : !isNullOrUndefined(formInitialValue)
        ? formInitialValue
        : '';
    const touched = validateOnMount;
    const error = null;

    this.state = {
      value,
      touched,
      error,
      focused: false,
      isValidating: false
    };

    this.id = uuid();
    this.mounted = false;
    this.shouldUnregister = !isNullOrUndefined(shouldUnregister)
      ? shouldUnregister
      : formShouldUnregister;

    registerField(name, {
      id: this.id,
      initialValue: value,
      initialTouched: touched,
      initialError: error,
      ...this.getRegistrations(value)
    });

    this.setFieldState = this.setFieldState.bind(this);
    this.getRegistrations = this.getRegistrations.bind(this);
    this.handleValidate = this.handleValidate.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.getFieldProps = this.getFieldProps.bind(this);
  }

  shouldComponentUpdate (nextProps, nextState) {
    const {
      name,
      children,
      render,
      Component: InputComponent,
      initialValue,
      reactForms,
      sendImmediate,
      shouldUnregister,
      validate,
      onFocus,
      onChange,
      onBlur,
      ...rest
    } = this.props;
    const {
      name: newName,
      children: newChildren,
      render: newRender,
      Component: NewInputComponent,
      initialValue: newInitialValue,
      reactForms: newReactForms,
      sendImmediate: newSendImmediate,
      shouldUnregister: newShouldUnregister,
      validate: newValidate,
      onFocus: newOnFocus,
      onChange: newOnChange,
      onBlur: newOnBlur,
      ...newRest
    } = nextProps;

    if (this.state !== nextState) {
      return true;
    }
    if (
      name !== newName ||
      children !== newChildren ||
      render !== newRender ||
      InputComponent !== NewInputComponent
    ) {
      return true;
    }
    if (!isEqual(rest, newRest)) {
      return true;
    }

    return false;
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
            const error = this.handleValidate(value);
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
          const { value } = this.state;
          const promises = [
            this.setFieldState(prevState => ({
              ...prevState,
              touched
            })),
            this.sendTouched(touched)
          ];
          if (shouldValidate) {
            const error = this.handleValidate(value);
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
          const value = !isNullOrUndefined(val) ? val : initialValue;
          const touched = shouldValidate && validateOnMount;
          const maybePromisedError =
            (shouldValidate && this.handleValidate(value)) || null;

          const promises = [
            this.setFieldState(prevState => ({
              ...prevState,
              value,
              touched
            })),
            this.sendValue(value),
            this.sendTouched(touched)
          ];

          if (isPromise(maybePromisedError)) {
            const error = await maybePromisedError;

            promises.push(this.sendError(error));

            await Promise.all(promises);

            resolve({
              value,
              touched,
              error
            });
          } else {
            promises.push(this.sendError(maybePromisedError));

            await Promise.all(promises);

            resolve({
              value,
              touched,
              error: maybePromisedError
            });
          }
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
    const { value } = this.state;
    const {
      reactForms: { validateOnMount }
    } = this.props;

    this.mounted = true;

    if (validateOnMount) {
      const maybePromisedError = this.handleValidate(value);
      if (isPromise(maybePromisedError)) {
        this.sendError(await maybePromisedError);
      } else {
        this.sendError(maybePromisedError);
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
        [name]: set({ ...prevState.fields[name] }, 'value', value)
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
        [name]: set({ ...prevState.fields[name] }, 'touched', touched)
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
        [name]: set({ ...prevState.fields[name] }, 'error', error)
      }
    }));
  }

  handleValidate (value) {
    const {
      name,
      validate,
      reactForms: { validateForm }
    } = this.props;

    // Run both field level and form level validations
    // to make sure that all possible errors are accounted for
    // Always use the first error found
    const asyncValidators = [];
    const syncErrors = [];

    if (isFunction(validate)) {
      const maybePromisedError = validate(value) || null;
      if (isPromise(maybePromisedError)) {
        asyncValidators.push(maybePromisedError);
      } else {
        syncErrors.push(maybePromisedError);
      }
    }

    if (isFunction(validateForm)) {
      const values = set({}, name, value);
      const maybePromisedErrors = validateForm(values);

      if (isPromise(maybePromisedErrors)) {
        asyncValidators.push(maybePromisedErrors);
      } else {
        const error = get(maybePromisedErrors, name, null);
        syncErrors.push(error);
      }
    }

    const reducedSyncError = reduceError(syncErrors, name);

    // Either return a promise that resolves to the error
    // or just the error so we can make as few updates as possible
    if (reducedSyncError) {
      this.setFieldState(prevState => ({
        ...prevState,
        error: reducedSyncError
      }));
      return reducedSyncError;
    } else if (asyncValidators.length !== 0) {
      return new Promise(async resolve => {
        await this.setFieldState(prevState => ({
          ...prevState,
          isValidating: true
        }));

        const error = reduceError(await Promise.all(asyncValidators), name);
        await this.setFieldState(prevState => ({
          ...prevState,
          error,
          isValidating: false
        }));

        resolve(error);
      });
    }

    return null;
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
      this.sendTouched(touched || !!touchOnChange);
    }

    if (validateOnChange) {
      const maybePromisedError = this.handleValidate(value);
      if (isPromise(maybePromisedError)) {
        if (sendImmediate || !focused) {
          this.sendError(await maybePromisedError);
        }
      } else {
        if (sendImmediate || !focused) {
          this.sendError(maybePromisedError);
        }
      }
    }
  }

  async handleBlur (e) {
    const { value, touched, error } = this.state;
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

    this.sendValue(value);
    this.sendTouched(touched || !!touchOnBlur);

    if (validateOnBlur) {
      const maybePromisedError = this.handleValidate(value);
      if (isPromise(maybePromisedError)) {
        this.sendError(await maybePromisedError);
      } else {
        this.sendError(maybePromisedError);
      }
    } else {
      this.sendError(error);
    }
  }

  getFieldProps () {
    const { value, touched, error, focused, isValidating } = this.state;
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
