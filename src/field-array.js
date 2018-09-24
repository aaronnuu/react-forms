import React, { Component } from 'react';
import { isFunction, uuid } from './utils';

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

class FieldArray extends Component {
  static defaultProps = {
    initialFields: []
  };

  constructor (props) {
    super(props);
    this.state = {
      fields: this.props.initialFields.map(field => ({ id: uuid(), ...field }))
    };

    this.fieldArrayState = {
      push: this.push.bind(this),
      pop: this.pop.bind(this),
      unshift: this.unshift.bind(this),
      swap: this.swap.bind(this),
      move: this.move.bind(this),
      insert: this.insert.bind(this),
      replace: this.replace.bind(this),
      remove: this.remove.bind(this),
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
    this.setState(prevState => ({
      ...prevState,
      fields: pop(prevState.fields)
    }));
  }

  unshift () {
    this.setState(prevState => ({
      ...prevState,
      fields: unshift(prevState.fields)
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
    this.setState(prevState => ({
      ...prevState,
      fields: remove(prevState.fields, index)
    }));
  }

  getFieldProps (field, index) {
    const { name, initialFields, render, children, ...rest } = this.props;

    return {
      key: field.id,
      name: `${name}.${index}`,
      ...rest,
      ...field
    };
  }

  getFieldArrayProps () {
    const { fields } = this.state;

    return {
      fields,
      ...this.fieldArrayState
    };
  }

  render () {
    const { render, children } = this.props;

    const fieldArrayState = this.getFieldArrayProps();

    return isFunction(children)
      ? children(fieldArrayState)
      : isFunction(render)
        ? render(fieldArrayState)
        : null;
  }
}

export default FieldArray;
