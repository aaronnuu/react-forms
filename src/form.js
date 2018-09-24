import React, { Component } from 'react';
import withContext from './containers/with-context';

@withContext
class Form extends Component {
  render () {
    const {
      reactForms: { submitForm },
      ...rest
    } = this.props;
    return <form onSubmit={submitForm} {...rest} />;
  }
}

export default Form;
