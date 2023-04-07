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
const path = require("path");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
const io = new Server(server, {
  cors: {
    origin: "*",
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

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./index.html"));
});

server.listen(PORT, () => {
  console.log("Đã kết nối");
});

app.post("/addRoom", (req, res) => {
  const socketId = req.body.socketId;
  const rooms = req.body.rooms;
  if (socketId === "" || rooms.length === 0) {
    return res
      .status(404)
      .json({ message: "Không được để trống", success: false });
  }
  if (!socketId || !rooms.length)
    return res
      .status(404)
      .json({ message: "Không tìm thấy đối tượng", success: false });
  try {
    const my_socket = io.sockets.sockets.get(socketId);
    if (my_socket === undefined)
      return res
        .status(404)
        .json({ message: "Đối tượng không tồn tại hoặc đã off" });
    my_socket.join(rooms);
    return res.status(200).json({ success: true, code: 0 });
  } catch (err) {
    return res.status(500).json({ success: false, code: 0, error: err });
  }
});

app.delete("/removeClientInRoom", (req, res) => {
  const socketId = req.body.socketId;
  const rooms = req.body.rooms;
  if (!socketId || !rooms.length)
    return res.status(404).json({ message: "Không để trống" });

  try {
    const my_socket = io.sockets.sockets.get(socketId);
    if (my_socket === undefined)
      return res
        .status(404)
        .json({ message: "Đối tượng không tồn tại hoặc đã off" });

    for (let i in rooms) {
      my_socket.leave(rooms[i]);
    }
    // const clients = io.sockets.adapter.rooms.get(room); lấy clients trong phòng
    // console.log(clients);

    return res.status(200).json({ success: true, code: 0 });
  } catch (err) {
    return res.status(500).json({ success: false, code: 0, error: err });
  }
});

app.post("/sendRoom", (req, res) => {
  const rooms = req.body.rooms;
  const data = req.body.data;
  const cmd = req.body.cmd;
  if (!data || !rooms.length)
    return res.status(404).json({ message: "Không để trống" });
  try {
    io.to(rooms).emit("check", { data: data, cmd: cmd });
    return res.status(200).json({ success: true, code: 0 });
  } catch (err) {
    return res.status(500).json({ success: false, code: 0, error: err });
  }
});
