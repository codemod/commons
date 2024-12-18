import React from 'react';

function Button({ disabled }) {
  return React.createElement(
    'button',
    {
      className: 'btn',
      onClick: () => console.log('clicked'),
      disabled
    },
    'Click me'
  );
}

export default Button;