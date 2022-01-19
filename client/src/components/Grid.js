import React from "react";
import "../css/Grid.css";

export default function Grid(props) {
  const board = props.board;
  let elements = [];

  function handleClick(e) {
    console.log(e.target.id.substring(5));
    props.retrieve_land_info(parseInt(e.target.id.substring(5)), null);
  }

  board.lands.forEach((element, index) => {
    const id = "cell-" + index;
    const position = board.lands[index].position;
    const corner = board.lands[index].corner;

    elements.push(
      <div
        id={id}
        key={id}
        className={`cell ${position}-line text-center`}
        data-position={position}
        data-corner={corner}
        onClick={handleClick}
      ></div>
    );
  });

  return <div className="board">{elements}</div>;
}
