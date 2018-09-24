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
    }
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
        validateOnChange
        touchOnChange
        asyncValuesReady={!this.state.loading}
        validate={() => ({ 'testing.nested.something': 'error boiii' })}
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
                  validate={value =>
                    value === 'Something' ? 'First error' : 'Second error'
                  }
                />
                <Field
                  name="testing.nested.object"
                  initialValue={this.state.initialValues.testing.nested.object}
                />
                <Field
                  sendImmediate
                  name="testing.another"
                  initialValue={true}
                  Component={props => {
                    return (
                      <input
                        {...props.field}
                        checked={!!props.field.value}
                        type="checkbox"
                      />
                    );
                  }}
                />
                <Field name="testing.nested.something" />
                <Field name="testing.nested.one_more" />
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
  validate: () =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve({ test: 'Error', 'testing.nested.object': 'Error two' });
      }, 2000)
    )
})
class WithFormTest extends Component {
  render() {
    return (
      <div>
        <Form>
          <Field
            name="test"
            sendImmediate
            validate={() =>
              new Promise(resolve => {
                setTimeout(() => resolve('Hello'), 1000);
              })
            }
          />
          <Field name="testing.nested.object" initialValue="Hello" />
          <Field name="name" initialValue="boris" />
          <button type="button" onClick={this.props.test.submitForm}>
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
      <ReactForms validateOnChange touchOnChange handleSubmit={console.log}>
        {props => {
          return (
            <Fragment>
              <Form>
                <FieldArray
                  name="something"
                  initialFields={[
                    { initialValue: 'one', validate: () => 'Error' },
                    { initialValue: 'two' }
                  ]}
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
