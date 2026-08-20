import React, { useContext, useEffect, useState } from "react";
import { FiEdit3 } from "react-icons/fi";
import { AppNameContext } from "../AppNameContext/AppNameContext";

const BannerName: React.FC = () => {
  const { appName, setAppName } = useContext(AppNameContext);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(appName);
  const [feedback, setFeedback] = useState("");

  useEffect(() => setTempValue(appName), [appName]);

  const handleAction = () => {
    if (!isEditing) {
      setIsEditing(true);
      setFeedback("");
      return;
    }

    const nextName = tempValue.trim();
    if (!nextName) {
      setFeedback("Application name cannot be empty.");
      return;
    }

    setAppName(nextName);
    setIsEditing(false);
    setFeedback("Application name updated.");
  };

  return (
    <section className="settings-card settings-card--wide">
      <div className="settings-card__header">
        <div className="settings-card__icon"><FiEdit3 /></div>
        <div>
          <h2>Application name</h2>
          <p>Change the product name shown in the browser tab.</p>
        </div>
      </div>
      <div className="settings-card__body">
        <div className="settings-row">
          <div className="settings-field">
            <label htmlFor="applicationName">Application name</label>
            <input
              id="applicationName"
              className="settings-input"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              disabled={!isEditing}
              maxLength={80}
            />
          </div>
          <button className={`settings-button ${!isEditing ? "settings-button--secondary" : ""}`} onClick={handleAction}>
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>
        {feedback && <div className={`settings-feedback ${feedback.includes("cannot") ? "settings-feedback--error" : "settings-feedback--success"}`}>{feedback}</div>}
      </div>
    </section>
  );
};

export default BannerName;
