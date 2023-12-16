import React, { useState, useEffect, useRef } from 'react';
import user from './assets/user.png';
import chatbot from './assets/chatbot.png';
import './App.css'; // Import the CSS file with defined styles

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [eventSource, setEventSource] = useState(null);
  const [currentLine, setCurrentLine] = useState('');
  const [completedMessageReceived, setCompletedMessageReceived] = useState(false);

  const latestCurrentLineRef = useRef('');

  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const handleInputChange = (e) => {
    setPrompt(e.target.value);
  };

  const addQuestionToChat = (question) => {
    setChatHistory((prevChat) => [
      ...prevChat,
      { type: 'question', content: question },
    ]);
  };

  const addAnswerToChat = (answer) => {
    console.log('answr after stop=========', answer);
    setChatHistory((prevChat) => [
      ...prevChat,
      { type: 'answer', content: answer },
    ]);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Return early if the prompt is empty
    if (!prompt.trim()) {
      return;
    }

    setLoading(true);

    if (eventSource) {
      eventSource.close();
    }

    setCurrentLine(''); // Clear current line
    setPrompt(''); // Clear input field

    addQuestionToChat(prompt);
    // if (newEventSource.readyState === EventSource.CLOSED) {
    //   return; // Return early if the event source is closed
    // }
    const newEventSource = new EventSource(
      `http://localhost:7861/?prompt=${encodeURIComponent(prompt)}`
    );

    newEventSource.onmessage = (event) => {
      console.log('currentline===onmessage==', currentLine);
      const message = JSON.parse(event.data);
      const { token, completed } = message;
      console.log('message=====', message);
      if (completed) {
        setCompletedMessageReceived(true);
        handleStopStream();
      } else {
        setCurrentLine((prevLine) => prevLine + token);
        latestCurrentLineRef.current += token; // Update the latestCurrentLineRef directly
      }
    };

    newEventSource.onerror = (error) => {
      // Ignore the error event if the connection is closed intentionally
      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        return;
      }

      console.error('Error fetching data:', error);
      newEventSource.close();
      setLoading(false);
    };

    setEventSource(newEventSource);
  };

  const handleStopStream = () => {
    setLoading(false);

    // // If there is any remaining content in the current line, add it to the chat history
    // if (currentLine.trim() !== '') {
    //   addAnswerToChat(currentLine);
    // }

    // Add the latestCurrentLine to the chat history
    if (latestCurrentLineRef.current.trim() !== '') {
      addAnswerToChat(latestCurrentLineRef.current);
    }

    // Check the readyState before closing the eventSource
    if (eventSource) {
      setTimeout(() => {
        setCurrentLine('');
        latestCurrentLineRef.current = ''; // Reset latestCurrentLineRef after using it
        eventSource.close();
      }, 1000);
    }
  };

  const formatResponseText = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };


  return (
    <div style={{ background: '#f0f0f0', minHeight: '100vh', position: 'relative' }}>
      <div className="container py-4" style={{ marginLeft: '10%', marginRight: '10%', paddingBottom: '160px' }}>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)', marginBottom: '60px' }}>
          {/* Chat history container */}
          {chatHistory.map((chatItem, index) => (
            <div
              key={index}
              className={
                chatItem.type === 'question'
                  ? 'card user-question my-2'
                  : 'card bg-light assistant-answer my-2'
              }
              style={{ marginBottom: '10px' }}
            >
              <div className="card-body">
                <div className="media" style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ marginRight: '15px' }}>
                    <img
                      style={{ maxWidth: "20px", maxHeight: "20px" }}
                      src={chatItem.type === 'question' ? user : chatbot}
                      alt={chatItem.type === 'question' ? 'User' : 'Chatbot'}
                      className="avatar"
                    />
                  </div>
                  <div className="media-body" style={{ maxWidth: 'calc(75% - 20px)' }}>
                    <div>
                      {formatResponseText(chatItem.content)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
  
          {/* Loading animation */}
          {loading && (
            <div className="card bg-light assistant-answer my-2">
              <div className="card-body">
                <div className="media" style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ marginRight: '15px' }}>
                    <img
                      style={{ maxWidth: "20px", maxHeight: "20px" }}
                      src={chatbot}
                      alt="Chatbot"
                      className="avatar"
                    />
                  </div>
                  <div className="media-body" style={{ maxWidth: 'calc(75% - 20px)' }}>
                    {formatResponseText(currentLine)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
  
        {/* Input form container */}
        <div style={{ position: 'fixed', bottom: 0, left: '10%', right: '10%', background: '#fff', padding: '10px' }}>
          <form onSubmit={handleFormSubmit} className="mb-4">
            <input
              type="text"
              value={prompt}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Type your message..."
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Send
              </button>
              <button type="button" onClick={handleStopStream} className="btn btn-danger">
                Stop
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
};

export default App;
