const Card = ({ user: { name, age } }) => (
  <div>
    <p>{name}</p>
    <p>{age}</p>
  </div>
);

Card.defaultProps = {
  user: {
    name: "Unknown",
    age: 0,
  },
};
