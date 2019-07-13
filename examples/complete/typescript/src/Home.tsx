import React from "react";
import { ExtendedFirebaseInstance, useFirebase} from "react-redux-firebase";
import "./App.css";
import logo from "./logo.svg";

function Home() {
  const firebase: ExtendedFirebaseInstance = useFirebase();
  firebase.push;
  return (
    <div className="Home">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
          </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
          </a>
      </header>
    </div>
  );
}

export default Home;
