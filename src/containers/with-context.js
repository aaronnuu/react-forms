import React from 'react';
import { FormConsumer } from '../react-forms';

export default function withContext (WrappedComponent) {
  return props => (
    <FormConsumer>
      {reactForms => <WrappedComponent {...props} reactForms={reactForms} />}
    </FormConsumer>
  );
}
