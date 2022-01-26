import Image from "react-bootstrap/Image";

import "../css/Home.css";

function Home() {
  return (
    <>
      <div className="home">
        <Image src="/images/logo.png" className="centered" fluid />
      </div>
    </>
  );
}

export default Home;
