import React from 'react';

type ButtonProps = {
  label: string;
  onClick: () => void;
};

const MyButton = {
  label: 'Click me',
  onClick: () => alert('Button clicked!'),
} satisfies ButtonProps;

const App = () => (
  <div>
    <MyButton />
  </div>
);

export default App;
