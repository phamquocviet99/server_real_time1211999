const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const PORT = 5000;
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const delay = require("delay");
const { restart } = require("nodemon");
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
let onlineVendor = [];
const addNewVendor = (vendorId, socketId) => {
  onlineVendor.push({ vendorId, socketId });
};
const removeVendor = (socketId) => {
  onlineVendor = onlineVendor.filter((vendor) => vendor.socketId !== socketId);
};
const getSocketIdByListVendor = (listVendor) => {
  // return onlineVendor.find((vendor) => vendor.vendorId === vendorId);
  let listSocketIds = [];
  for (var j in listVendor) {
    for (var i in onlineVendor) {
      if (onlineVendor[i].vendorId === listVendor[j].vendorId) {
        listSocketIds.push(onlineVendor[i].socketId);
      }
    }
  }

  return listSocketIds;
};

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("hủy kết nối");
  });
});

server.listen(PORT, () => {
  console.log("Đã kết nối");
});

app.post("/addRoom", (req, res) => {
  const socketId = req.body.socketId;
  const room = req.body.room;
  if (!socketId || !room.length)
    return res.status(404).json({ message: "Không để trống" });
  try {
    const my_socket = io.sockets.sockets.get(socketId);
    if (my_socket === undefined)
      return res
        .status(404)
        .json({ message: "Đối tượng không tồn tại hoặc đã off" });
    my_socket.join(room);
    return res.status(200).json({ success: true, code: 0 });
  } catch (err) {
    return res.status(500).json({ success: false, code: 0, error: err });
  }
});

app.delete("/removeClientInRoom", (req, res) => {
  const socketId = req.body.socketId;
  const room = req.body.room;
  if (!socketId || !room.length)
    return res.status(404).json({ message: "Không để trống" });

  try {
    const my_socket = io.sockets.sockets.get(socketId);
    if (my_socket === undefined)
      return res
        .status(404)
        .json({ message: "Đối tượng không tồn tại hoặc đã off" });

    for (let i in room) {
      my_socket.leave(room[i]);
    }
    // const clients = io.sockets.adapter.rooms.get(room); lấy clients trong phòng
    // console.log(clients);

    return res.status(200).json({ success: true, code: 0 });
  } catch (err) {
    return res.status(500).json({ success: false, code: 0, error: err });
  }
});

app.post("/sendRoom", (req, res) => {
  const room = req.body.room;
  const data = req.body.data;
  if (!data || !room.length)
    return res.status(404).json({ message: "Không để trống" });
  try {
    io.to(room).emit("check", { data: data });
    return res.status(200).json({ success: true, code: 0 });
  } catch (err) {
    return res.status(500).json({ success: false, code: 0, error: err });
  }
});