import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Note from "./Note";
import CreateArea from "./CreateArea";
import Signup from "./signup";
import Login from "./Login";
import VerifyCode from "./VerifyCode";

function App() {
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);        // User object
  const [view, setView] = useState("signup");    // Can be: signup, verify, login, app

  function addNote(newNote) {
    setNotes(prev => [...prev, newNote]);
  }

  function deleteNote(id) {
    setNotes(prev => prev.filter((_, index) => index !== id));
  }

  const handleLogin = (username) => {
    setUser(username);
    setView("app");
  };

  const handleLogout = () => {
    setUser(null);
    setView("login");
  };

  return (
    <div>
      {view === "signup" && (
        <>
          <Signup />
          <p>
            Already have an account? <button onClick={() => setView("login")}>Login</button>
          </p>
          <p>
            Got the code? <button onClick={() => setView("verify")}>Verify Email</button>
          </p>
        </>
      )}

      {view === "verify" && (
        <>
          <VerifyCode />
          <p>
            Done verifying? <button onClick={() => setView("login")}>Go to Login</button>
          </p>
        </>
      )}

      {view === "login" && (
        <>
          <Login onLogin={handleLogin} />
          <p>
            Don't have an account? <button onClick={() => setView("signup")}>Sign up</button>
          </p>
        </>
      )}

      {view === "app" && user && (
        <>
          <Header />
          <p>Welcome! <button onClick={handleLogout}>Logout</button></p>

          <CreateArea onAdd={addNote} />
          {notes.map((noteItem, index) => (
            <Note
              key={index}
              id={index}
              title={noteItem.title}
              content={noteItem.content}
              onDelete={deleteNote}
            />
          ))}
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
