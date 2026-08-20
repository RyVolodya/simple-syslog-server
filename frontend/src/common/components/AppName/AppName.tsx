import React, { useState, useContext } from "react";
import {
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import { AppNameContext } from "../AppNameContext/AppNameContext";

const AppName: React.FC = () => {
  const { appName, setAppName } = useContext(AppNameContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempName, setTempName] = useState("");

  const handleOpen = () => {
    setTempName(appName);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setAppName(tempName);
    setIsModalOpen(false);
  };

  return (
    <>
      <Tooltip
        title="Змінити назву"
        placement="right"
        arrow
        slotProps={{
          tooltip: {
            sx: {
              backgroundColor: "#8ed5f1",
              color: "#0e2841",
              fontSize: "12px",
              borderRadius: "8px",
              padding: "8px 12px",
            },
          },
          arrow: { sx: { color: "#8ed5f1" } },
        }}
      >
        <Typography
          variant="h5"
          sx={{ cursor: "pointer", display: "inline-block" }}
          onClick={handleOpen}
        >
          {appName}
        </Typography>
      </Tooltip>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        BackdropProps={{
          style: { backgroundColor: "rgba(128, 128, 128, 0.8)" },
        }}
      >
        <DialogTitle>Змінити назву додатка</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} className="form__button setting__btn">
            Скасувати
          </Button>
          <Button onClick={handleSave} variant="contained" className="form__button setting__btn">
            Змінити
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AppName;
