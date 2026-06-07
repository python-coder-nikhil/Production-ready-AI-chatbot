function WebLoader() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div className="loading-text">
        Loading<span className="dots"></span>
      </div>
    </div>
  );
}

export default WebLoader;
