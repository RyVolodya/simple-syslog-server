import React, { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiLoader,
  FiServer,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  useDeleteDeviceMutation,
  useGetDevicesQuery,
  useUpdateDeviceNameMutation,
} from "../../services/DevicesName/DevicesName";
import type { Device } from "../../types/form.type";

type DeleteStatus = "confirm" | "deleting" | "success" | "error";

type DeleteResult = {
  deletedMessages: number;
  name: string;
  ip: string;
};

const RenameDevice: React.FC = () => {
  const { data: devices = [], isLoading } = useGetDevicesQuery();
  const [updateDeviceName, { isLoading: isSaving }] = useUpdateDeviceNameMutation();
  const [deleteDevice] = useDeleteDeviceMutation();
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [newName, setNewName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>("confirm");
  const [deleteError, setDeleteError] = useState("");
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);

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

  const openDeleteDialog = (device: Device) => {
    setDeleteTarget(device);
    setDeleteStatus("confirm");
    setDeleteError("");
    setDeleteResult(null);
  };

  const closeDeleteDialog = () => {
    if (deleteStatus === "deleting") return;
    setDeleteTarget(null);
    setDeleteStatus("confirm");
    setDeleteError("");
    setDeleteResult(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleteStatus("deleting");
    setDeleteError("");
    setDeleteResult(null);

    try {
      const result = await deleteDevice(deleteTarget.id).unwrap();

      if (selectedId === deleteTarget.id) {
        setSelectedId(undefined);
        setNewName("");
      }

      setDeleteResult({
        deletedMessages: Number(result.deletedMessages ?? 0),
        name: result.name || deleteTarget.name,
        ip: result.ip || deleteTarget.ip,
      });
      setDeleteStatus("success");
      setFeedback(null);
    } catch (error: any) {
      setDeleteError(error?.data?.message || "Unable to delete the device and its messages.");
      setDeleteStatus("error");
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
                    <td>
                      <strong>{device.name}</strong>
                      {device.alias && <small className="settings-device-alias">Custom alias</small>}
                      <small className="settings-device-message-count">
                        {Number(device.messageCount ?? 0).toLocaleString()} stored message{Number(device.messageCount ?? 0) === 1 ? "" : "s"}
                      </small>
                    </td>
                    <td>
                      {device.reportedHostnameValid ? (
                        <span className="settings-device-status settings-device-status--valid"><FiCheckCircle /> Valid</span>
                      ) : (
                        <span className="settings-device-status settings-device-status--ignored"><FiAlertTriangle /> Ignored</span>
                      )}
                    </td>
                    <td className="settings-device-table__actions">
                      <button
                        type="button"
                        className="settings-device-delete settings-device-delete--text"
                        onClick={() => openDeleteDialog(device)}
                        title={`Delete ${device.name} and all stored messages`}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="settings-modal settings-device-delete-modal" role="dialog" aria-modal="true" aria-labelledby="deleteDeviceTitle">
          <div className="settings-modal__dialog settings-device-delete-dialog">
            <div className="settings-modal__header settings-device-delete-dialog__header">
              <div className="settings-device-delete-dialog__title">
                <div className={`settings-device-delete-dialog__icon settings-device-delete-dialog__icon--${deleteStatus}`}>
                  {deleteStatus === "deleting" ? <FiLoader className="settings-device-delete-spinner" /> : <FiTrash2 />}
                </div>
                <div>
                  <h3 id="deleteDeviceTitle">
                    {deleteStatus === "success" ? "Device deleted" : "Delete device"}
                  </h3>
                  <p>{deleteTarget.name} · {deleteTarget.ip}</p>
                </div>
              </div>
              {deleteStatus !== "deleting" && (
                <button className="settings-device-delete-dialog__close" type="button" onClick={closeDeleteDialog} aria-label="Close">
                  <FiX />
                </button>
              )}
            </div>

            <div className="settings-modal__body">
              {deleteStatus === "confirm" && (
                <>
                  <div className="settings-device-delete-warning">
                    <FiAlertTriangle />
                    <div>
                      <strong>This action permanently removes the device.</strong>
                      <span>All Syslog messages stored for this source will also be deleted from PostgreSQL.</span>
                    </div>
                  </div>
                  <div className="settings-device-delete-summary">
                    <div><span>Device</span><strong>{deleteTarget.name}</strong></div>
                    <div><span>Source IP</span><strong>{deleteTarget.ip}</strong></div>
                    <div><span>Messages to delete</span><strong>{Number(deleteTarget.messageCount ?? 0).toLocaleString()}</strong></div>
                  </div>
                </>
              )}

              {deleteStatus === "deleting" && (
                <div className="settings-device-delete-progress">
                  <div className="settings-device-delete-progress__bar"><span /></div>
                  <strong>Deleting device data...</strong>
                  <p>Removing all Syslog messages for {deleteTarget.ip} and then deleting the device record. Do not close this window.</p>
                  <div className="settings-device-delete-progress__steps">
                    <span className="is-active"><FiLoader className="settings-device-delete-spinner" /> Deleting stored messages</span>
                    <span><span className="settings-device-delete-step-dot" /> Removing device inventory record</span>
                  </div>
                </div>
              )}

              {deleteStatus === "success" && deleteResult && (
                <div className="settings-device-delete-success">
                  <FiCheckCircle />
                  <div>
                    <strong>Deletion completed successfully.</strong>
                    <p>
                      Removed <b>{deleteResult.deletedMessages.toLocaleString()}</b> Syslog message{deleteResult.deletedMessages === 1 ? "" : "s"} and the device <b>{deleteResult.name}</b> from the database.
                    </p>
                  </div>
                </div>
              )}

              {deleteStatus === "error" && (
                <div className="settings-device-delete-error">
                  <FiAlertTriangle />
                  <div>
                    <strong>Deletion failed.</strong>
                    <p>{deleteError}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="settings-modal__actions">
              {deleteStatus === "confirm" && (
                <>
                  <button type="button" className="settings-button settings-button--secondary" onClick={closeDeleteDialog}>Cancel</button>
                  <button type="button" className="settings-button settings-button--danger settings-delete-confirm" onClick={() => void handleDelete()}>
                    <FiTrash2 /> Delete device & data
                  </button>
                </>
              )}
              {deleteStatus === "success" && (
                <button type="button" className="settings-button" onClick={closeDeleteDialog}>Done</button>
              )}
              {deleteStatus === "error" && (
                <>
                  <button type="button" className="settings-button settings-button--secondary" onClick={closeDeleteDialog}>Close</button>
                  <button type="button" className="settings-button settings-button--danger" onClick={() => void handleDelete()}>Try again</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RenameDevice;
