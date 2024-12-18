import React from 'react';

const Button = ({ onClick, children }) => <button onClick={onClick}>
  {children}
</button>;

function App() {
  return (
    <div className="container" id="main">
      <h1 style={{ color: 'blue' }}>
        Hello World
      </h1>
      <Button onClick={() => console.log('clicked')}>
        Click me
      </Button>
    </div>
  );
}

export default App;