import { useEffect, useRef, useState } from "react";
import { getModes, getState, setState } from "./api";
import type { ModeId, ModeMeta, State, StatePatch } from "./api";
import "./App.css";
import { Icon } from "./Icon.tsx";


// определяет нужен ли в конкретном режиме выбор цвета
// modes - содержит информацию обо всех режимах
// selected - ID выбранных режимов
function hasColorSupport(modes: ModeMeta[], selected: ModeId[]) {
  for (const id of selected) {
    const foundMode = modes.find((mode) => mode.id === id);

    if (foundMode?.usesColor) {
      return true;
    }
  }
  return false;
}

// описывает интерфейс для текущих данных
// React вызывает эту функцию и понимает по возвращенному 
// JSX что показывать на странице
export default function App() {
  const [modes, setModes] = useState<ModeMeta[]>([]);
  // serverState - последнее состояние устройства полученное от сервера
  const [serverState, setServerState] = useState<State | null>(null);
  // отметка первого заполнения формы

  const didInit = useRef(false);
  // редактируемые настройки формы: переменные и функции выполняющие обновление
  const [mode, setMode] = useState<ModeId>("rainbow"); 
  const [playlistEnabled, setPlaylistEnabled] = useState(false);
  const [playlist, setPlaylist] = useState<ModeId[]>([]);
  const [brightness, setBrightness] = useState(100);
  const brightnessPercent = Math.round(brightness * (100 / 255));
  const [speed, setSpeed] = useState(1.0);
  const [waitMs, setWaitMs] = useState(20);
  const [iterations, setIterations] = useState(10);
  const [colorHex, setColorHex] = useState("#ff0000");
  // состояние работы самого интерфейса
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  let colorEnabled = true;
// определяем поддержку цветов, кто может менять, кто нет
  if (modes.length > 0) {
    if (playlistEnabled) {
      colorEnabled = hasColorSupport(modes, playlist);
    } else {
      colorEnabled = hasColorSupport(modes, [mode]);
    }
  }
  

  // получает свежие данные и заполняет форму
  async function refresh(updateForm = false) {
    setErr(null);
    try {
      //m - режимы с сервера, s - состояния с сервера
      const [m, s] = await Promise.all([getModes(), getState()]);
      // сохраняем результат, теперь React знает новыйе данные
      setModes(m);
      setServerState(s);

      //форму синхронизируем только: в первый раз
      //или когда явно попросили (после Apply/Start/Stop)
      if (updateForm || !didInit.current) {
        didInit.current = true;

        // заполняем форму значениями с сервера
        setMode(s.mode);
        setPlaylistEnabled(s.playlist_enabled);
        setPlaylist(s.playlist ?? []);
        setBrightness(s.brightness);
        setSpeed(s.speed);
        setWaitMs(s.wait_ms);
        setIterations(s.iterations);
        setColorHex(s.color);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Неизвестная ошибка";
      setErr(message);
    }
  }

  // первоначальная загрузка и обновление по таймеру
  // React компонент тоже
  useEffect(() => {
    refresh(true); // первый раз — синхронизируем форму
    const t = setInterval(() => refresh(false), 1000); // дальше — только serverState
    return () => clearInterval(t);
  }, []);

// добавление/удаление режима из плейлиста
  function togglePlaylist(id: ModeId) {
    setPlaylist((previousPlaylist) => {
      if (previousPlaylist.includes(id)) {
        return previousPlaylist.filter((item) => item !== id);
      }

      return [...previousPlaylist, id];
    });
  }

  function selectAll() {
    setPlaylist(modes.map((m) => m.id));
  }

  function clearSelection() {
    setPlaylist([]);
  }

  // вызывается когда пользователь нажимает Apply
  async function apply() {
    setBusy(true); // идет запрос
    setErr(null); //старую ошибку убрать

    try {
      //patch - изменения которые мы хотим отправить серверу
      const patch: StatePatch = {
        brightness,
        speed,
        wait_ms: waitMs,
        iterations,
        color: colorHex,
        playlist_enabled: playlistEnabled,
      };

      if (playlistEnabled) {
        patch.playlist = playlist;
      } else {
        patch.mode = mode;
      }

      await setState(patch);
      await refresh(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErr(error.message);
      } else {
        setErr("Ошибка");
      }
    } finally {
      setBusy(false);
    }
  }


  async function startStop(running: boolean) {
    setBusy(true);
    try {
      await setState({ running });
      await refresh(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Ошибка";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

    return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="tree" />
          </span>
          <h1>Гирлянда</h1>
        </div>

        <div
          className={`status ${serverState?.running ? "is-running" : ""}`}
          role="status"
        >
          <span className="status-dot" aria-hidden="true" />

          <span>
            {!serverState
              ? "Нет данных"
              : serverState.running
                ? "Работает"
                : "Остановлена"}
          </span>
        </div>
      </header>

      <main className="dashboard">
        <section
          className="tile tile--modes"
          aria-labelledby="modes-title"
        >
          <div className="tile-heading">
            <h2 id="modes-title">Режимы</h2>
            <span className="tile-meta">{modes.length} эффектов</span>
          </div>

          <label className="playlist-toggle">
            <span>Плейлист</span>

            <input
              type="checkbox"
              checked={playlistEnabled}
              onChange={(e) => setPlaylistEnabled(e.target.checked)}
            />
          </label>

          {!playlistEnabled ? (
            <div className="mode-select">
              <label htmlFor="mode">Выбранный эффект</label>

              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as ModeId)}
              >
                {modes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <p className="hint">
                Включи плейлист, чтобы выбрать несколько эффектов.
              </p>
            </div>
          ) : (
            <>
              <div className="selection-actions">
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={selectAll}
                >
                  Выбрать все
                </button>

                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={clearSelection}
                >
                  Очистить
                </button>
              </div>

              <div className="mode-list">
                {modes.map((m) => (
                  <label
                    key={m.id}
                    className={`mode-option ${
                      playlist.includes(m.id) ? "is-selected" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={playlist.includes(m.id)}
                      onChange={() => togglePlaylist(m.id)}
                    />

                    <span>{m.label}</span>
                  </label>
                ))}
              </div>

              {playlist.length === 0 && (
                <p className="field-error">
                  Выбери хотя бы один режим.
                </p>
              )}
            </>
          )}
        </section>

        <section
          className="tile tile--brightness"
          aria-labelledby="brightness-label"
        >
          <label
            id="brightness-label"
            className="tile-label"
            htmlFor="brightness"
          >
            Яркость
          </label>

          <div className="metric-value">
            {brightnessPercent}
            <span className="metric-unit">%</span>
          </div>

          <div className="slider-group">
            <input
              id="brightness"
              type="range"
              min={0}
              max={255}
              value={brightness}
              aria-valuetext={`${brightnessPercent}% (${brightness} из 255)`}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />

            <div className="range-labels">
              <span>0</span>
              <span>{brightness} / 255</span>
            </div>
          </div>
        </section>

        <section
          className={`tile tile--color ${
            !colorEnabled ? "is-disabled" : ""
          }`}
          aria-labelledby="color-label"
        >
          <label
            id="color-label"
            className="tile-label"
            htmlFor="color"
          >
            Цвет
          </label>

          <div className="color-value">
            {colorHex.toUpperCase()}
          </div>

          <input
            id="color"
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            disabled={!colorEnabled}
            aria-describedby="color-note"
          />

          <p id="color-note" className="hint">
            {colorEnabled
              ? "Выбери оттенок свечения"
              : "Выбранные эффекты не используют этот цвет"}
          </p>
        </section>

        <section
          className="tile tile--speed"
          aria-labelledby="speed-label"
        >
          <label
            id="speed-label"
            className="tile-label"
            htmlFor="speed"
          >
            Скорость
          </label>

          <div className="metric-value">
            {speed.toFixed(1)}
            <span className="metric-unit">×</span>
          </div>

          <div className="slider-group">
            <input
              id="speed"
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />

            <div className="range-labels">
              <span>Медленно</span>
              <span>Быстро</span>
            </div>
          </div>
        </section>

        <section
          className="tile tile--delay"
          aria-labelledby="delay-label"
        >
          <label
            id="delay-label"
            className="tile-label"
            htmlFor="delay"
          >
            Задержка
          </label>

          <div className="metric-value">
            {waitMs}
            <span className="metric-unit">мс</span>
          </div>

          <div className="slider-group">
            <input
              id="delay"
              type="range"
              min={0}
              max={200}
              value={waitMs}
              onChange={(e) => setWaitMs(Number(e.target.value))}
            />

            <div className="range-labels">
              <span>0 мс</span>
              <span>200 мс</span>
            </div>
          </div>
        </section>

        <section
          className="tile tile--state"
          aria-labelledby="state-title"
        >
          <div className="tile-heading">
            <h2 id="state-title">Состояние устройства</h2>

            <button
              type="button"
              className="button button--quiet"
              disabled={busy}
              onClick={() => refresh(true)}
            >
              <Icon name="refresh" />
              <span>Обновить</span>
            </button>
          </div>

          <pre className="state-code">
            {serverState
              ? JSON.stringify(serverState, null, 2)
              : "Данные устройства пока не получены."}
          </pre>
        </section>

        <section
          className="tile tile--iterations"
          aria-labelledby="iterations-label"
        >
          <label
            id="iterations-label"
            className="tile-label"
            htmlFor="iterations"
          >
            Повторения
          </label>

          <div className="metric-value">
            {iterations}
            <span className="metric-unit">раз</span>
          </div>

          <p className="hint">Для эффекта Theater Chase</p>

          <div className="slider-group">
            <input
              id="iterations"
              type="range"
              min={1}
              max={50}
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
            />

            <div className="range-labels">
              <span>1</span>
              <span>50</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="action-bar">
        <div className="playback-actions">
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={() => startStop(true)}
          >
            <Icon name="play" />
            <span>Старт</span>
          </button>

          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={() => startStop(false)}
          >
            <Icon name="stop" />
            <span>Стоп</span>
          </button>
        </div>

        <button
          type="button"
          className="button button--primary"
          disabled={busy || (playlistEnabled && playlist.length === 0)}
          onClick={apply}
        >
          <Icon name="check" />
          <span>Применить</span>
        </button>
      </footer>

      {err && (
        <div className="error" role="alert">
          {err}
        </div>
      )}
    </div>
  );
}