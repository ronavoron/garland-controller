import * as http from "node:http";

// Текущее состояние тестовой гирлянды
let state = {
  running: false,
  brightness: 100,

  mode: "rainbow",

  playlist_enabled: false,
  playlist: [],

  speed: 1,
  wait_ms: 20,
  iterations: 10,

  color: "#ff0000",
};

// Режимы, которые поддерживает тестовый сервер
const modes = [
  {
    id: "colorWipe",
    label: "Color Wipe",
    usesColor: true,
    usesWait: true,
  },

  {
    id: "theaterChase",
    label: "Theater Chase",
    usesColor: true,
    usesWait: true,
    usesIterations: true,
  },

  {
    id: "rainbow",
    label: "Rainbow",
    usesWait: true,
  },

  {
    id: "rainbowCycle",
    label: "Rainbow Cycle",
    usesWait: true,
  },

  {
    id: "theaterChaseRainbow",
    label: "Theater Chase Rainbow",
    usesWait: true,
    usesIterations: true,
  },
];


// Читает JSON из POST-запроса
function readJson(req) {
  return new Promise((resolve) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      if (data) {
        resolve(JSON.parse(data));
      } else {
        resolve({});
      }
    });
  });
}


// Создаём тестовый HTTP-сервер
const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  // Вернуть текущее состояние
  if (req.url === "/api/state" && req.method === "GET") {
    res.end(JSON.stringify(state));
    return;
  }
  // Вернуть список режимов
  if (req.url === "/api/modes" && req.method === "GET") {
    res.end(JSON.stringify(modes));
    return;
  }
  // Изменить состояние
  if (req.url === "/api/set" && req.method === "POST") {
    const body = await readJson(req);
    if (typeof body.running === "boolean") {
      state.running = body.running;
    }
    if (typeof body.mode === "string") {
      state.mode = body.mode;
    }
    if (typeof body.playlist_enabled === "boolean") {
      state.playlist_enabled = body.playlist_enabled;
    }
    if (Array.isArray(body.playlist)) {
      state.playlist = body.playlist;
    }
    if (typeof body.brightness === "number") {
      state.brightness = body.brightness;
    }
    if (typeof body.speed === "number") {
      state.speed = body.speed;
    }
    if (typeof body.wait_ms === "number") {
      state.wait_ms = body.wait_ms;
    }
    if (typeof body.iterations === "number") {
      state.iterations = body.iterations;
    }
    if (typeof body.color === "string") {
      state.color = body.color;
    }
    res.end(JSON.stringify({ ok: true }));
    return;
  }


  // Если такого адреса нет
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "not found" }));
});
server.listen(8000, () => {
  console.log("Mock API запущен: http://localhost:8000");
});