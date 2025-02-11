class MyComponent extends React.Component {
    componentWillMount() {
        console.log('component will mount');
    }

    componentWillReceiveProps(nextProps) {
        console.log('component will receive props', nextProps);
    }

    componentWillUpdate(nextProps, nextState) {
        console.log('component will update', nextProps, nextState);
    }

    render() {
        return <div>My Component</div>;
    }
}

export { MyComponent };
