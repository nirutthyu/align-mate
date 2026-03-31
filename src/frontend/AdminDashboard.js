import React, { useEffect, useState } from "react";
import "./admin.css";

export default function AdminDashboard() {

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/rooms")
      .then(res => res.json())
      .then(data => setRooms(data));
  }, []);

  function getName(email) {
    return email.split("@")[0];
  }

  return (
    <div className="dashboard-container">

      <h1 className="dashboard-title">All Room Assignments</h1>

      {/* Room Cards */}
      <div className="room-cards">
        {rooms.map((room, i) => (
          <div
            key={i}
            className="room-card"
            onClick={() => setSelectedRoom(room)}
          >
            <h3>{room.roomId}</h3>
            <p>Members: {room.members.length}</p>
            <p>Compatibility: {room.compatibility}</p>
          </div>
        ))}
      </div>

      {/* Members List */}
      {selectedRoom && (
        <div className="members-card">
          <h2>{selectedRoom.roomId} Members</h2>

          {selectedRoom.members.map((m, i) => (
            <div key={i} className="member-item">
              {getName(m.email)}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}