// перечень названий режимов, которые допустимы в коде
export type ModeId =
  | "colorWipe"
  | "theaterChase"
  | "rainbow"
  | "rainbowCycle"
  | "theaterChaseRainbow";

// крч это оказывается для интерфейса. типо что в каждом режиме можно будет
// поменять с помощью ui
export type ModeMeta = {
  id: ModeId;
  label: string;
  usesColor?: boolean;
  usesWait?: boolean;
  usesIterations?: boolean;
};

// один набор текущих настроек и состояния устройства
export type State = {
  running: boolean;
  brightness: number;

  mode: ModeId;

  playlist_enabled: boolean;
  playlist: ModeId[];

  speed: number;
  wait_ms: number;
  iterations: number;
  color: string;
};

export type StatePatch = Partial<State>;

// ==================================================
// получает текущий выбор и значения
// задаем серверу вопрос: какой режим выбран сейчас и что с ним? 
export async function getState(): Promise<State> {
  // http://localhost:5173/api/state -> http://192.168.1.199:8000/api/state
  const response = await fetch("/api/state");

  
  if (!response.ok) {
    throw new Error("Failed to load state");
  }

  return response.json();
}

//получает список возможностей
// задаем серверу вопрос: какие режимы ты поддерживаешь и какие настройки есть?
export async function getModes(): Promise<ModeMeta[]> {
  const response = await fetch("/api/modes");
  
  // логическое свойство ответа. true от 200 до 299. Например 404 - false
  // запись ниже читается как "ответ неуспешный"
  if (!response.ok) {
    // оказывается ошибка сама не выводится а идет в реакт состояние в app.tsx
    throw new Error("Failed to load modes");
    
  }
  // это по сути и есть промис. формат ответа в json. потом его прочтут и разберут
  return response.json();
}

// отправляет серверу просьбу изменить настройки
export async function setState(patch: StatePatch): Promise<void> {
  const response = await fetch("/api/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error("Не удалось изменить настройки");
  }
}

