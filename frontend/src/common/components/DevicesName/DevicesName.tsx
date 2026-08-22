import React, { useMemo, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiServer, FiTrash2 } from "react-icons/fi";
import { useDeleteDeviceMutation, useGetDevicesQuery, useUpdateDeviceNameMutation } from "../../services/DevicesName/DevicesName";

const RenameDevice: React.FC = () => {
  const { data: devices = [], isLoading } = useGetDevicesQuery();
  const [updateDeviceName, { isLoading: isSaving }] = useUpdateDeviceNameMutation();
  const [deleteDevice, { isLoading: isDeleting }] = useDeleteDeviceMutation();
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [newName, setNewName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedId),
    [devices, selectedId],
  );

  const handleSelection = (value: string) => {
    const id = value ? Number(value) : undefined;
    setSelectedId(id);
    const device = devices.find((item) => item.id === id);
    setNewName(device?.alias ?? "");
    setFeedback(null);
  };

  const handleRename = async () => {
    if (!selectedId) {
      setFeedback({ type: "error", text: "Select a device first." });
      return;
    }
    try {
      await updateDeviceName({ id: selectedId, name: newName.trim() }).unwrap();
      setFeedback({
        type: "success",
        text: newName.trim() ? "Device display name updated." : "Custom display name cleared.",
      });
    } catch (error) {
      console.error("Device rename failed:", error);
      setFeedback({ type: "error", text: "Unable to update the device display name." });
    }
  };


  const handleDelete = async (id: number, displayName: string) => {
    const confirmed = window.confirm(
      `Delete "${displayName}" from Device inventory?\n\nThis is only allowed when the device has no syslog messages in the database.`,
    );
    if (!confirmed) return;

    try {
      await deleteDevice(id).unwrap();
      if (selectedId === id) {
        setSelectedId(undefined);
        setNewName("");
      }
      setFeedback({ type: "success", text: "Unused device removed from inventory." });
    } catch (error: any) {
      setFeedback({
        type: "error",
        text: error?.data?.message || "Unable to delete the device.",
      });
    }
  };

  return (
    <section className="settings-card settings-card--wide">
      <div className="settings-card__header">
        <div className="settings-card__icon"><FiServer /></div>
        <div>
          <h2>Devices</h2>
          <p>Manage discovered syslog sources. Display name priority: custom alias, valid reported hostname, then source IP.</p>
        </div>
      </div>
      <div className="settings-card__body">
        <div className="settings-row--three settings-row settings-device-editor">
          <div className="settings-field">
            <label htmlFor="deviceSelect">Device</label>
            <select
              id="deviceSelect"
              className="settings-select"
              value={selectedId ?? ""}
              disabled={isLoading}
              onChange={(e) => handleSelection(e.target.value)}
            >
              <option value="">{isLoading ? "Loading devices..." : "Select device"}</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>{device.name} — {device.ip}</option>
              ))}
            </select>
          </div>
          <div className="settings-field">
            <label htmlFor="newDeviceName">Custom display name</label>
            <input
              id="newDeviceName"
              className="settings-input"
              type="text"
              placeholder={selectedDevice?.name || "e.g. Core Switch"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={!selectedId}
            />
            <small>Leave empty and save to use the automatic hostname/IP fallback.</small>
          </div>
          <button className="settings-button" onClick={handleRename} disabled={isSaving || isLoading || !selectedId}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
        {feedback && <div className={`settings-feedback settings-feedback--${feedback.type}`}>{feedback.text}</div>}

        <div className="settings-device-inventory">
          <div className="settings-device-inventory__heading">
            <div>
              <h3>Device inventory</h3>
              <p>{devices.length.toLocaleString()} discovered source{devices.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <div className="settings-device-table-wrap">
            <table className="settings-device-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Reported hostname</th>
                  <th>Display name</th>
                  <th>Hostname status</th>
                  <th className="settings-device-table__actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="settings-device-table__empty">Loading devices...</td></tr>
                ) : devices.length === 0 ? (
                  <tr><td colSpan={5} className="settings-device-table__empty">No syslog devices have been discovered yet.</td></tr>
                ) : devices.map((device) => (
                  <tr key={device.id}>
                    <td><code>{device.ip}</code></td>
                    <td>{device.reportedHostname || <span className="settings-device-muted">Not reported</span>}</td>
                    <td><strong>{device.name}</strong>{device.alias && <small className="settings-device-alias">Custom alias</small>}</td>
                    <td>
                      {device.reportedHostnameValid ? (
                        <span className="settings-device-status settings-device-status--valid"><FiCheckCircle /> Valid</span>
                      ) : (
                        <span className="settings-device-status settings-device-status--ignored"><FiAlertTriangle /> Ignored</span>
                      )}
                    </td>
                    <td className="settings-device-table__actions">
                      {Number(device.messageCount ?? 0) === 0 ? (
                        <button
                          type="button"
                          className="settings-device-delete"
                          title="Delete unused device"
                          aria-label={`Delete ${device.name}`}
                          onClick={() => void handleDelete(device.id, device.name)}
                          disabled={isDeleting}
                        >
                          <FiTrash2 />
                        </button>
                      ) : (
                        <span
                          className="settings-device-in-use"
                          title={`${Number(device.messageCount ?? 0).toLocaleString()} message(s) still stored`}
                        >
                          In use
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RenameDevice;
