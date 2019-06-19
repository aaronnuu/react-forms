import React, { Component, Fragment } from 'react';
import { storiesOf } from '@storybook/react';
import { ReactForms, Form, Field, FieldArray, withForm } from '../';

storiesOf('React Forms', module)
  .add('Simple', () => (
    <ReactForms>
      {() => {
        return (
          <Form>
            <Field name="test" />
            <Field name="testing.nested.object" initialValue="Hello" />
          </Form>
        );
      }}
    </ReactForms>
  ))
  .add('Async initial values', () => <AsyncInitialValues />)
  .add('With form test', () => <WithFormTest />)
  .add('RepeaterField test', () => <FieldArrayTest />)
  .add('State batching test', () => <UnmountedStateUpdateTest />)
  .add('Block submission test', () => <BlockSubmissionTest />);

const CustomInput = props => {
  return (
    <Fragment>
      <input {...props.field} checked={!!props.field.value} type="checkbox" />
      {props.showJson && <p>{JSON.stringify(props, null, 2)}</p>}
    </Fragment>
  );
};

class AsyncInitialValues extends Component {
  state = {
    loading: true,
    initialValues: {
      test: 'Something',
      testing: {
        nested: {
          object: ''
        }
      }
    },
    isDisabled: false
  };

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        loading: false,
        initialValues: {
          test: 'Something else',
          testing: { nested: { object: 'More words' } }
        }
      });
    }, 2000);
  }

  render() {
    return (
      <ReactForms
        validateOnMount
        touchOnMount
        validateOnChange
        touchOnChange
        asyncValuesReady={!this.state.loading}
        validate={(values, helpers) => {
          console.log('validate', values, helpers);
          return {
            test: 'goodbye',
            'testing.nested.one_more': 'one more error',
            testing: {
              another: { something: 'another' },
              nested: {
                object: 'hello',
                something:
                  "Some really long error that just doesn't seem to end."
              }
            }
          };
        }}
        handleSubmit={console.log}
      >
        {props => {
          return (
            <div>
              <Form>
                <Field
                  sendImmediate
                  name="test"
                  initialValue={this.state.initialValues.test}
                  validate={(values, helpers) => {
                    console.log('field validate', values, helpers);
                    return null;
                  }}
                />
                <Field
                  name="testing.nested.object"
                  initialValue={this.state.initialValues.testing.nested.object}
                />
                <Field
                  sendImmediate
                  name="testing.another.something"
                  initialValue={true}
                  isDisabled={this.state.isDisabled}
                  Component={CustomInput}
                />
                <Field name="testing.nested.something" />
                <Field name="testing.nested.one_more" />
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ isDisabled: !this.state.isDisabled });
                  }}
                >
                  Toggle disable
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.resetForm({
                      test: 'test value',
                      testing: { nested: { object: 'new reset value' } }
                    });
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.resetForm();
                  }}
                >
                  Reset no values
                </button>
                <button type="button" onClick={() => props.submitForm()}>
                  Submit
                </button>
              </Form>
              <pre>{JSON.stringify(props, null, 2)}</pre>
            </div>
          );
        }}
      </ReactForms>
    );
  }
}

@withForm({
  name: 'test',
  validateOnChange: true,
  validateOnBlur: false,
  handleSubmit: () => 'hello'
})
class WithFormTest extends Component {
  render() {
    return (
      <div>
        <Form>
          <Field name="test" sendImmediate />
          <Field name="testing.nested.object" initialValue="Hello" />
          <Field
            name="name"
            initialValue="boris"
            render={props => {
              return (
                <div>
                  <input {...props.field} />
                  {props.meta.isValidating ? 'Validating!' : null}
                  {props.meta.error ? `Field error ${props.meta.error}!` : null}
                </div>
              );
            }}
          />
          <button
            type="button"
            onClick={() => {
              this.props.test.submitForm().then(res => {
                console.log(res, 'finished submit');
              });
            }}
          >
            Submit
          </button>
        </Form>
        <button
          onClick={() =>
            this.props.test.setValues(
              {
                test: 'Something',
                testing: { nested: { object: 'Some other value' } },
                name: ''
              },
              false,
              true
            )
          }
        >
          setValues
        </button>
        <button
          onClick={() =>
            this.props.test.setFieldValue('test', 'Some value', true)
          }
        >
          setFieldValue
        </button>
        <pre>{JSON.stringify(this.props, null, 2)}</pre>
      </div>
    );
  }
}

class FieldArrayTest extends Component {
  render() {
    return (
      <ReactForms
        validateOnChange
        touchOnChange
        shouldUnregister
        validate={(values, helpers) => {
          console.log('helpers', helpers);
          return { something: ['Error one', 'Error two', 'Error three'] };
        }}
        handleSubmit={console.log}
      >
        {props => {
          return (
            <Fragment>
              <Form>
                <FieldArray name="something-something">
                  {({
                    fields,
                    getFieldProps,
                    push,
                    pop,
                    unshift,
                    swap,
                    move,
                    insert,
                    replace,
                    remove
                  }) => {
                    return (
                      <Fragment>
                        {fields.map((field, index) => (
                          <Field {...getFieldProps(field, index)} />
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            push();
                          }}
                        >
                          Push
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            pop();
                          }}
                        >
                          Pop
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            unshift();
                          }}
                        >
                          Unshift
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            swap(0, 1);
                          }}
                        >
                          Swap
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            move(0, 5);
                          }}
                        >
                          Move
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            insert(3, { initialValue: 'new field' });
                          }}
                        >
                          Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            replace(0, { initialValue: 'gasdas' });
                          }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            remove(0);
                          }}
                        >
                          Remove
                        </button>
                        <button type="submit">Submit</button>
                      </Fragment>
                    );
                  }}
                </FieldArray>
              </Form>
              <pre>{JSON.stringify(props, null, 2)}</pre>
            </Fragment>
          );
        }}
      </ReactForms>
    );
  }
}

class UnmountedStateUpdateTest extends Component {
  state = {
    visible: true
  };

  render() {
    const { visible } = this.state;

    return (
      <ReactForms
        validateOnChange
        touchOnChange
        validate={values => {
          const errors = {};
          if (values.testing.nested.object !== 'Hello') {
            errors['testing.nested.object'] = 'Must be the string "Hello"';
          }
          return errors;
        }}
        shouldUnregister={false}
        handleSubmit={console.log}
      >
        {props => {
          console.count('rendering');
          return (
            <div>
              <Form>
                <Field sendImmediate name="test" />
                {visible && (
                  <Field
                    name="testing.nested.object"
                    Component={({ field, meta }) => {
                      return (
                        <Fragment>
                          <input {...field} />
                          <pre>{JSON.stringify(meta, null, 2)}</pre>
                        </Fragment>
                      );
                    }}
                  />
                )}
                {visible && (
                  <Field
                    sendImmediate
                    name="testing.another.something"
                    initialValue={true}
                    Component={CustomInput}
                    showJson={false}
                  />
                )}
                <Field name="testing.nested.something" />
                <Field name="testing.nested.one_more" />
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ visible: !visible });
                  }}
                >
                  Toggle visible
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.setFieldValue(
                      'testing.nested.object',
                      'Some new fancy value'
                    );
                  }}
                >
                  Change field value
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.setFieldTouched('testing.nested.object', true, false);
                  }}
                >
                  Change field touched
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.setFieldError(
                      'testing.nested.object',
                      'Some new fancy error'
                    );
                  }}
                >
                  Change field error
                </button>
                <button type="button" onClick={() => props.submitForm()}>
                  Submit
                </button>
              </Form>
              <pre>{JSON.stringify(props, null, 2)}</pre>
            </div>
          );
        }}
      </ReactForms>
    );
  }
}

class BlockSubmissionTest extends Component {
  state = {
    visible: true
  };

  render() {
    const { visible } = this.state;

    return (
      <ReactForms
        handleSubmit={() => {
          throw new Error('hello');
        }}
      >
        {props => {
          console.log(props.submitCount);
          return (
            <Form>
              <Field name="test" />
              <button onClick={props.submitForm}>Submit</button>
            </Form>
          );
        }}
      </ReactForms>
    );
  }
}
