import React, { Component } from 'react';
import isEqual from 'react-fast-compare';
import { isFunction, uuid, isObject } from './utils';
import withContext from './containers/with-context';
import get from 'lodash.get';

const push = (array = [], field = {}) => {
  const copy = [...array];
  copy.push({ id: uuid(), ...field });
  return copy;
};

const pop = (array = []) => {
  const copy = [...array];
  copy.pop();
  return copy;
};

const unshift = (array = [], field = {}) => {
  const copy = [...array];
  copy.unshift({ id: uuid(), ...field });
  return copy;
};

const swap = (array = [], indexA, indexB) => {
  const copy = [...array];
  const a = copy[indexA];
  copy[indexA] = copy[indexB];
  copy[indexB] = a;
  return copy;
};

const move = (array = [], from, to) => {
  const copy = [...array];
  const value = copy[from];
  copy.splice(from, 1);
  copy.splice(to, 0, value);
  return copy;
};

const insert = (array = [], index, field = {}) => {
  const copy = [...array];
  copy.splice(index, 0, { id: uuid(), ...field });
  return copy;
};

const replace = (array = [], index, field = {}) => {
  const copy = [...array];
  copy[index] = { id: uuid(), ...field };
  return copy;
};

const remove = (array = [], index) => {
  return [...array.slice(0, index), ...array.slice(index + 1, array.length)];
};

@withContext
class FieldArray extends Component {
  static defaultProps = {
    initialFields: []
  };

  constructor (props) {
    super(props);
    const {
      name,
      initialFields,
      reactForms: { values }
    } = props;

    const fields = [
      ...Array(Math.max(initialFields.length, (get(values, name) || []).length))
    ].map((_, index) => ({
      id: uuid(),
      ...initialFields[index],
      initialValue: (get(values, name) || [])[index]
    }));

    this.state = {
      initialFields: fields,
      fields
    };

    this.fieldArrayHelpers = {
      push: this.push.bind(this),
      pop: this.pop.bind(this),
      unshift: this.unshift.bind(this),
      swap: this.swap.bind(this),
      move: this.move.bind(this),
      insert: this.insert.bind(this),
      replace: this.replace.bind(this),
      remove: this.remove.bind(this),
      reset: this.reset.bind(this),
      getFieldProps: this.getFieldProps.bind(this)
    };
  }

  push (field) {
    this.setState(prevState => ({
      ...prevState,
      fields: push(prevState.fields, field)
    }));
  }

  pop () {
    this.setState(prevState => {
      const {
        reactForms: { unregisterField }
      } = this.props;
      const fieldId = prevState.fields[prevState.fields.length - 1].id;
      unregisterField(fieldId);
      return {
        ...prevState,
        fields: pop(prevState.fields)
      };
    });
  }

  unshift (field) {
    this.setState(prevState => ({
      ...prevState,
      fields: unshift(prevState.fields, field)
    }));
  }

  swap (indexA, indexB) {
    this.setState(prevState => ({
      ...prevState,
      fields: swap(prevState.fields, indexA, indexB)
    }));
  }

  move (from, to) {
    this.setState(prevState => ({
      ...prevState,
      fields: move(prevState.fields, from, to)
    }));
  }

  insert (index, field) {
    this.setState(prevState => ({
      ...prevState,
      fields: insert(prevState.fields, index, field)
    }));
  }

  replace (index, field) {
    this.setState(prevState => ({
      ...prevState,
      fields: replace(prevState.fields, index, field)
    }));
  }

  remove (index) {
    this.setState(prevState => {
      const {
        reactForms: { unregisterField }
      } = this.props;
      const fieldId = prevState.fields[prevState.fields.length - 1].id;
      unregisterField(fieldId);
      return {
        ...prevState,
        fields: remove(prevState.fields, index)
      };
    });
  }

  reset (newFields) {
    this.setState(prevState => {
      const fields =
        newFields.map(field => ({ id: uuid(), ...field })) ||
        prevState.initialFields.map(field => ({ id: uuid(), ...field }));
      return {
        ...prevState,
        initialFields: fields,
        fields
      };
    });
  }

  getFieldProps (field, index) {
    const {
      name,
      initialFields,
      render,
      children,
      reactForms,
      ...rest
    } = this.props;

    return {
      key: field.id,
      name: `${name}.${index}`,
      ...rest,
      ...field
    };
  }

  getFieldArrayProps () {
    const { fields, initialFields } = this.state;

    return {
      fields,
      isDirty: !isEqual(fields, initialFields),
      ...this.fieldArrayHelpers
    };
  }

  render () {
    const { render, children } = this.props;

    const fieldArrayProps = this.getFieldArrayProps();

    return isFunction(children)
      ? children(fieldArrayProps)
      : isFunction(render)
        ? render(fieldArrayProps)
        : null;
  }
}

export default FieldArray;
