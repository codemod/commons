import React from 'react';

class MyComponent extends React.Component {
    UNSAFE_componentWillMount() {
        // Migration: renamed from componentWillMount
        console.log('Component will mount');
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        // Migration: renamed from componentWillReceiveProps
            console.log('Props will update');

    }

    UNSAFE_componentWillUpdate(nextProps, nextState) {
        // Migration: renamed from componentWillUpdate
        console.log('Component will update');
    }

    render() {
        return <div>Test Component</div>;
    }
}

export default MyComponent;
