import React from 'react';
import ReactForms from '../react-forms';

export default function withForm ({
  name = 'form',
  mapPropsToValues = () => ({}),
  ...rest
}) {
  return WrappedComponent => props => {
    const reactFormsProps = {
      ...rest,
      initialValues: mapPropsToValues(props),
      innerProps: props
    };
    return (
      <ReactForms {...reactFormsProps}>
        {reactForms => {
          const formProps = { [name]: reactForms };
          return <WrappedComponent {...props} {...formProps} />;
        }}
      </ReactForms>
    );
  };
}
