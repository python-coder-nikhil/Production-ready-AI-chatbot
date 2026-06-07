function ErrorModal({ errorMessages = [], onClose }) {
  return (
    <div className="ErrorMainContainer">
      <div className="frame">
        <div className="ErrorModal">
          <img
            src="https://100dayscss.com/codepen/alert.png"
            width="44"
            height="38"
            alt="Error Icon"
          />
          <span className="errorTitle">Oh snap!</span>

          <ul className="error-list">
            {errorMessages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
          <div className="errorbutton" onClick={onClose}>
            Dismiss
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorModal;
