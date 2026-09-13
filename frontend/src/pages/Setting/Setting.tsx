import React from "react";
import { useAuth } from "../../auth/AuthContext";
import { FiSettings, FiInfo } from "react-icons/fi";
import "./Setting.scss";
import BannerName from "@/common/components/BannerName/BannerName";
import RenameDevice from "@/common/components/DevicesName/DevicesName";
import MessageSaveInterval from "@/common/components/TimeMessage/TimeMessage";
import AdminSettings from "@/common/components/AdminSettings/AdminSettings";

const Setting: React.FC = () => {
  const { user } = useAuth();
  const administrator = user?.role === "administrator";
  return (
    <div className="settings-page">
      <div className="settings-grid">
        {administrator && <BannerName />}
        {administrator && <RenameDevice />}
        {administrator && <MessageSaveInterval />}
        <AdminSettings />
      </div>

      {administrator && <div className="settings-note">
        <FiInfo />
        <span>Changes are applied immediately. Message retention cleanup runs automatically in the background.</span>
      </div>}
    </div>
  );
};

export default Setting;
