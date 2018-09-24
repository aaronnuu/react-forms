import React, { Component } from 'react';
import get from 'lodash.get';
import set from 'lodash.set';
import withContext from './containers/with-context';
import { noop, isPromise, isFunction, uuid } from './utils';

@withContext
class Field extends Component {
  static defaultProps = {
    sendImmediate: false,
    shouldUnregister: true,
    Component: 'input',
    onFocus: noop,
    onChange: noop,
    onBlur: noop
  };

  constructor (props) {
    const {
      name,
      initialValue,
      reactForms: { initialValues, validateOnMount }
    } = props;

    super(props);

    this.state = {
      value: initialValue || get(initialValues, name) || '',
      touched: validateOnMount,
      error: null,
      focused: false,
      isValidating: false
    };

    this.id = uuid();

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
      reactForms: { validateOnMount }
    } = this.props;

    return {
      validate,
      setValue: (value, shouldValidate) => {
        return new Promise(resolve => {
          this.setState(
            prevState => ({
              ...prevState,
              value
            }),
            async () => {
              const promises = [];
              if (shouldValidate) {
                await this.handleValidate();
                promises.push(this.sendError());
              }
              promises.push(this.sendValue());
              await Promise.all(promises);
              resolve(this.state.value);
            }
          );
        });
      },
      setError: (error, shouldTouch) => {
        return new Promise(resolve => {
          this.setState(
            prevState => ({
              ...prevState,
              error,
              touched: !!shouldTouch
            }),
            async () => {
              const promises = [];
              if (shouldTouch) {
                promises.push(this.sendTouched());
              }
              promises.push(this.sendError());
              await Promise.all(promises);
              resolve(this.state.error);
            }
          );
        });
      },
      setTouched: (touched, shouldValidate) => {
        return new Promise(resolve => {
          this.setState(
            prevState => ({
              ...prevState,
              touched
            }),
            async () => {
              const promises = [];
              if (shouldValidate) {
                await this.handleValidate();
                promises.push(this.sendError());
              }
              promises.push(this.sendTouched());
              await Promise.all(promises);
              resolve(this.state.touched);
            }
          );
        });
      },
      reset: (value, shouldValidate) => {
        return new Promise(resolve => {
          this.setState(
            prevState => ({
              ...prevState,
              value: value || initialValue,
              touched: validateOnMount,
              error: null
            }),
            async () => {
              if (shouldValidate) {
                await this.handleValidate();
              }
              await Promise.all([
                this.sendValue(),
                this.sendTouched(),
                this.sendError()
              ]);
              resolve({
                value: this.state.value,
                touched: this.state.touched,
                error: this.state.error
              });
            }
          );
        });
      }
    };
  }

  async componentDidMount () {
    const { value, touched, error } = this.state;
    const {
      name,
      reactForms: { validateOnMount, registerField }
    } = this.props;

    registerField(name, {
      id: this.id,
      initialValue: value,
      initialTouched: touched,
      initialError: error,
      ...this.getRegistrations(value)
    });

    if (validateOnMount) {
      await this.handleValidate();
      this.sendError();
    }
  }

  componentDidUpdate (prevProps) {
    const { value, touched, error } = this.state;
    const {
      name,
      shouldUnregister,
      reactForms: {
        shouldUnregister: parentShouldUnregister,
        registerField,
        unregisterField
      }
    } = this.props;
    const { name: prevName } = prevProps;

    if (name !== prevName) {
      if (shouldUnregister && parentShouldUnregister) {
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
      shouldUnregister,
      reactForms: { shouldUnregister: parentShouldUnregister, unregisterField }
    } = this.props;

    if (shouldUnregister && parentShouldUnregister) {
      unregisterField(this.id);
    }
  }

  sendState (state) {
    const {
      name,
      reactForms: { setFormState }
    } = this.props;

    return setFormState(prevState => ({
      ...prevState,
      fields: {
        ...prevState.fields,
        [name]: set({ ...prevState.fields[name] }, state, this.state[state])
      }
    }));
  }

  sendValue () {
    return this.sendState('value');
  }

  sendError () {
    return this.sendState('error');
  }

  sendTouched () {
    return this.sendState('touched');
  }

  handleValidate () {
    const { value } = this.state;
    const {
      name,
      validate,
      reactForms: { validateForm }
    } = this.props;

    return new Promise(resolve => {
      this.setState(
        prevState => ({
          ...prevState,
          isValidating: true
        }),
        async () => {
          if (isFunction(validate)) {
            const maybePromisedError = validate(value);

            if (isPromise(maybePromisedError)) {
              const error = await maybePromisedError;

              this.setState(
                prevState => ({
                  ...prevState,
                  error: error || null,
                  isValidating: false
                }),
                resolve
              );
            } else {
              this.setState(
                prevState => ({
                  ...prevState,
                  error: maybePromisedError || null,
                  isValidating: false
                }),
                resolve
              );
            }
          } else if (isFunction(validateForm)) {
            const values = set({}, name, value);
            const maybePromisedErrors = validateForm(values);

            if (isPromise(maybePromisedErrors)) {
              const errors = await maybePromisedErrors;

              this.setState(
                prevState => ({
                  ...prevState,
                  error: get(errors, name, null),
                  isValidating: false
                }),
                resolve
              );
            } else {
              this.setState(
                prevState => ({
                  ...prevState,
                  error: get(maybePromisedErrors, name, null),
                  isValidating: false
                }),
                resolve
              );
            }
          } else {
            this.setState(
              prevState => ({
                ...prevState,
                isValidating: false
              }),
              resolve
            );
          }
        }
      );
    });
  }

  handleFocus (e) {
    const { onFocus } = this.props;

    if (e && e.persist) {
      e.persist();
    }

    onFocus(e);

    this.setState(prevState => ({
      ...prevState,
      focused: true
    }));
  }

  handleChange (e) {
    const {
      onChange,
      sendImmediate,
      reactForms: { validateOnChange, touchOnChange }
    } = this.props;

    if (e && e.persist) {
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

    this.setState(
      prevState => ({
        ...prevState,
        value,
        touched: prevState.touched || !!touchOnChange
      }),
      async () => {
        if (sendImmediate || !this.state.focused) {
          this.sendValue();
          this.sendTouched();
        }

        if (validateOnChange) {
          await this.handleValidate();
          if (sendImmediate || !this.state.focused) {
            this.sendError();
          }
        }
      }
    );
  }

  handleBlur (e) {
    const {
      onBlur,
      reactForms: { validateOnBlur, touchOnBlur }
    } = this.props;

    if (e && e.persist) {
      e.persist();
    }

    onBlur(e);

    this.setState(
      prevState => ({
        ...prevState,
        touched: prevState.touched || !!touchOnBlur,
        focused: false
      }),
      async () => {
        this.sendValue();
        this.sendTouched();

        if (validateOnBlur) {
          await this.handleValidate();
        }

        this.sendError();
      }
    );
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
