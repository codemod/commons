import React, { useState } from 'react';

type State = {
  count: number;
};

const initialState = {
  count: 0,
} satisfies State;

const Component = () => {
  const [state, setState] = useState(initialState);
  return <div>{state.count}</div>;
};

export default Component;
