export default function Rules(props) {
  // vars
  const gameInfo = props.game_info_by_type;
  const landInfo = props.land_info;
  const pawnInfo = props.pawn_info;
  const position = pawnInfo.position;
  const type = landInfo.type;
  const isInJail = pawnInfo.isInJail;

  const retrieveRule = (_type) => {
    switch (_type) {
      case "go":
      case "property":
      case "community-chest":
      case "tax":
      case "railroad":
      case "chance":
      case "utility":
      case "free-parking":
      case "go-to-jail":
        return gameInfo[_type];
      case "jail":
        if (position !== 10) {
          return gameInfo[_type];
        }
        if (isInJail) {
          return gameInfo["jail_in_jail"];
        }

        return gameInfo["jail-visit-only"];
      default:
    }
  };

  return (
    <>
      <div
        className="rules m-3"
        dangerouslySetInnerHTML={{ __html: retrieveRule(type) }}
      />
    </>
  );
}
