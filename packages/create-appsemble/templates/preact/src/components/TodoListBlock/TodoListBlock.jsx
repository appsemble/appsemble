import React from 'preact';

export default class TodoListBlock extends React.Component {
  state = { todos: [], text: '' };

  setText = e => {
    this.setState({ text: e.target.value });
  };

  addTodo = () => {
    const { todos, text } = this.state;
    this.setState({ todos: [...todos, text], text: '' });
  };

  render() {
    const { text, todos } = this.state;

    return (
      <form onSubmit={this.addTodo}>
        <input onInput={this.setText} value={text} />
        <button type="submit">Add</button>
        <ul>
          {todos.map(todo => (
            <li>{todo.text}</li>
          ))}
        </ul>
      </form>
    );
  }
}
