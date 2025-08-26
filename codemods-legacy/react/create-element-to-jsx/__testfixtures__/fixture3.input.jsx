import React from 'react';

const Button = ({ onClick, children }) => React.createElement(
  'button',
  { onClick },
  children
);

function App() {
  return React.createElement(
    'div',
    { className: 'container', id: 'main' },
    React.createElement(
      'h1',
      { style: { color: 'blue' } },
      'Hello World'
    ),
    React.createElement(
      Button,
      { onClick: () => console.log('clicked') },
      'Click me'
    )
  );
}

export default App;