import * as React from 'react';

function MyComponent() {
    const [count, setCount] = React.useState(0);

    const increment = (event: React.MouseEvent<HTMLButtonElement>) => {
        console.log(event);
        setCount(count + 1);
    };

    return React.createElement(
        'div',
        null,
        React.createElement(React.Fragment, null, 'Hello'),
    );
}
