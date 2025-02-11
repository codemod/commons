class MyComponent extends React.Component {
    UNSAFE_componentWillMount() {
        console.log('component will mount');
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        console.log('component will receive props', nextProps);
    }

    UNSAFE_componentWillUpdate(nextProps, nextState) {
        console.log('component will update', nextProps, nextState);
    }

    render() {
        return <div>My Component</div>;
    }
}

export { MyComponent };
