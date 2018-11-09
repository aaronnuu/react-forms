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
  .add('RepeaterField test', () => <FieldArrayTest />);

const CustomInput = props => {
  return (
    <Fragment>
      <input {...props.field} checked={!!props.field.value} type="checkbox" />
      <p>{JSON.stringify(props, null, 2)}</p>
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
        shouldUnregister={false}
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
                <FieldArray
                  name="something-something"
                  Component={({ field }) => {
                    return (
                      <Fragment>
                        <input
                          {...field}
                          value={field.value.one}
                          onChange={e =>
                            field.onChange({
                              target: {
                                type: 'text',
                                value: { ...field.value, one: e.target.value }
                              }
                            })
                          }
                        />
                        <input
                          {...field}
                          value={field.value.two}
                          onChange={e =>
                            field.onChange({
                              target: {
                                type: 'text',
                                value: { ...field.value, two: e.target.value }
                              }
                            })
                          }
                        />
                      </Fragment>
                    );
                  }}
                >
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
