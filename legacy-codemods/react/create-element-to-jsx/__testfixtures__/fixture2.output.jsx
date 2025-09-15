import React from 'react';

function Button({ disabled }) {
  return (
    <button
      className="btn"
      onClick={() => console.log('clicked')}
      disabled={disabled}>
      Click me
    </button>
  );
}

export default Button; 