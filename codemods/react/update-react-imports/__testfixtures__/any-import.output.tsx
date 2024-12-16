import type { MouseEvent } from 'react';
import { useState, createElement, Fragment } from 'react';

function MyComponent() {
    const [count, setCount] = useState(0);

    const increment = (event: MouseEvent<HTMLButtonElement>) => {
        console.log(event);
        setCount(count + 1);
    };

    return createElement(
        'div',
        null,
        createElement(Fragment, null, 'Hello'),
    );
}